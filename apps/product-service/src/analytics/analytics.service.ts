import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../users/schema/users.schema';
import { Order } from '../schema/order.schema';
import { Product } from '../products/schema/product.schema';

@Injectable()
export class AnalyticsService {
    constructor(
        @InjectModel(User.name) private userModel: Model<User>,
        @InjectModel(Order.name) private orderModel: Model<Order>,
        @InjectModel(Product.name) private productModel: Model<Product>,
    ) { }

    async getSummary() {
        const totalUsers = await this.userModel.countDocuments();
        const totalProducts = await this.productModel.countDocuments();
        const totalOrders = await this.orderModel.countDocuments({
            status: { $ne: "CANCELLED" }
        });


        const revenue = await this.orderModel.aggregate([
            {
                $match: {
                    status: { $ne: "CANCELLED" },
                    isPaid: true
                }
            },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: "$totalAmount" }
                }
            }
        ]);

        return {
            totalUsers,
            totalProducts,
            totalOrders,
            totalRevenue: revenue[0]?.totalRevenue || 0,
        };
    }

    async getProductAnalytics() {
        const topProducts = await this.orderModel.aggregate([
            { $match: { status: { $ne: "CANCELLED" } } },
            { $unwind: "$items" },
            {
                $group: {
                    _id: "$items.productId",
                    totalSold: { $sum: "$items.quantity" }
                }
            },
            { $sort: { totalSold: -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: "products",
                    localField: "_id",
                    foreignField: "_id",
                    as: "product"
                }
            },
            { $unwind: "$product" }
        ]);

        const lowStock = await this.productModel
            .find({ stock: { $lt: 10 } })
            .select('title stock price');

        return {
            topProducts,
            lowStock,
        };
    }

    async getUserAnalytics() {
        const usersPerMonth = await this.userModel.aggregate([
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        const topCustomers = await this.orderModel.aggregate([
            { $match: { status: { $ne: "CANCELLED" } } },
            {
                $group: {
                    _id: "$userId",
                    totalSpent: { $sum: "$totalAmount" }
                }
            },
            { $sort: { totalSpent: -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "user"
                }
            },
            { $unwind: "$user" }
        ]);

        return {
            usersPerMonth,
            topCustomers,
        };
    }

}
