import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User , UserDocument} from './schema/users.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

   findAll() {
    return this.userModel.find().lean();
  }

  findById(id: string) {
    return this.userModel.findById(id).lean();
  }
  
  create(data: Partial<User>) {
    return this.userModel.create(data);
  }

   findByPhone(phone: string) {
    return this.userModel.findOne({ phone }).lean();
  }

  findByEmail(email: string) {
    return this.userModel.findOne({ email });
  }
}
