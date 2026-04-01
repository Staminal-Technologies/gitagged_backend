import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {

  private transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  async sendSellerRequestEmail(seller: any) {
    const adminEmail = process.env.EMAIL_USER;

    const link = `http://localhost:3000/login?redirect=/dashboard/sellers?status=pending`;

    await this.transporter.sendMail({
      from: `"Gitagged App" <${process.env.EMAIL_USER}>`,
      to: adminEmail,
      subject: 'New Seller Request',
      html: `
       <div style="font-family: Arial, sans-serif; background:#f4f6f8; padding:20px;">
    
        <div style="max-width:600px; margin:auto; background:#ffffff; border-radius:10px; overflow:hidden; box-shadow:0 4px 10px rgba(0,0,0,0.1);">

          <!-- HEADER -->
          <div style="background:#000; color:#fff; padding:15px 20px; font-size:18px; font-weight:bold;">
            New Seller Request 🚀
          </div>

        <!-- BODY -->
        <div style="padding:20px; color:#333;">
  
          <h3 style="margin-top:0;">Seller Details</h3>
  
          <p><strong>Name:</strong> ${seller.sellerName || 'N/A'}</p>
          <p><strong>Email:</strong> ${seller.email}</p>
          <p><strong>Description:</strong> ${seller.productDescription || 'N/A'}</p>
  
          <br/>
  
          <!-- BUTTON -->
          <div style="text-align:center; margin-top:20px;">
            <a href="${link}" 
               style="background:#000; color:#fff; padding:12px 25px; text-decoration:none; border-radius:6px; font-weight:bold; display:inline-block;">
               View in Dashboard
            </a>
          </div>
  
        </div>

      <!-- FOOTER -->
      <div style="background:#f1f1f1; padding:12px; text-align:center; font-size:12px; color:#777;">
        Gitagged • Admin Notification
      </div>

    </div>
  </div>
`,
    });
  }

  async sendProductRequestEmail(product: any) {

    const adminEmail = process.env.EMAIL_USER;

    const link = `http://localhost:3000/login?redirect=/dashboard/products`;

    await this.transporter.sendMail({
      from: `"Gitagged App" <${process.env.EMAIL_USER}>`,
      to: adminEmail,
      subject: 'New Product Request',
      html: `
      <div style="font-family: Arial; background:#f4f6f8; padding:20px;">
        <div style="max-width:600px;margin:auto;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 4px 10px rgba(0,0,0,0.1);">

          <div style="background:#000;color:#fff;padding:15px;">
            New Product Request 🛍️
          </div>

          <div style="padding:20px;">
            <h3>Product Details</h3>

            <p><strong>Title:</strong> ${product.title}</p>
            <p><strong>Price:</strong> ₹${product.price}</p>
            <p><strong>Stock:</strong> ${product.stock}</p>

            <br/>

            <div style="text-align:center;">
              <a href="${link}" 
                 style="background:#000;color:#fff;padding:12px 20px;text-decoration:none;border-radius:6px;">
                 Review Product
              </a>
            </div>
          </div>

          <div style="background:#f1f1f1;padding:10px;text-align:center;font-size:12px;">
            Gitagged Admin Panel
          </div>

        </div>
      </div>
    `,
    });
  }
}