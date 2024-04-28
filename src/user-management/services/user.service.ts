import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from '../dto/create-user.dto';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async createUser(user: CreateUserDto): Promise<Types.ObjectId> {
    // Create the user using the validated data
    const createdUser = new this.userModel(user);
    const {_id} = await createdUser.save();
    return Promise.resolve(_id);
  }

  async getAllUsers(limit = 16, skip = 0): Promise<{ users: User[]; total: number }> {
    const users = await this.userModel.find().limit(limit).skip(skip).exec();
    const total = await this.userModel.countDocuments();

    return { users, total };
  }

  async findOne(id: string): Promise<User> {
    return this.userModel.findById(id).exec();
  }

  async findOneByEmail(email: string): Promise<User | undefined> {
    return this.userModel.findOne({ email }).exec();
  }  

  async update(id: string, user: User): Promise<User> {
    return this.userModel.findByIdAndUpdate(id, user, { new: true }).exec();
  }

  async remove(id: string): Promise<User> {
    return this.userModel.findByIdAndRemove(id).exec();
  }

  async updatePasswordByVerificationKey(
    verificationKey: string,
    newPassword: string,
  ): Promise<Types.ObjectId> {
    const user = await this.userModel.findOne({ verificationKey });

    if (!user) {
      throw new Error('User not found');
    }

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    user.verificationKey = null;

    const {_id} = await user.save();
    return Promise.resolve(_id);
  }
}
