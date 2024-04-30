import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from '../dto/create-user.dto';

@Injectable()
export class UserService {
  
  existsQuery: any = { deleted: false };
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async createUser(user: CreateUserDto): Promise<Types.ObjectId> {
    // Create the user using the validated data
    const createdUser = new this.userModel(user);
    const {_id} = await createdUser.save();
    return Promise.resolve(_id);
  }

  async getAllUsers(
    limit = 16,
    skip = 0,
    sortBy = 'name',
    sortOrder = 'asc',
    role?: string,
    search?: string
  ): Promise<{ users: User[]; total: number }> {
    const query = this.userModel.find(this.existsQuery);

    // Filtering by role
    if (role) {
      query.where('role').equals(role);
    }

    // Search functionality across multiple fields
    if (search) {
      query.or([
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { designation: { $regex: search, $options: 'i' } }
      ]);
    }

    // Sorting
    const sortOrderFinal = sortOrder === 'desc' ? '-' : '';
    query.sort(`${sortOrderFinal}${sortBy}`);

    // Pagination
    query.limit(limit).skip(skip);

    const users = await query.exec();
    const total = await this.userModel.countDocuments().exec();

    return { users, total };
  }

  async findOne(id: string): Promise<User> {
    // First check if the record exists and is not deleted
    const existingRecord = await this.userModel.findOne({ _id: id, ...this.existsQuery }).exec();
    if (!existingRecord) {
      throw new NotFoundException('User not found or has been deleted.');
    }

    // Perform the update if the record is not marked as deleted
    return this.userModel.findById(id).exec();
  }

  async findOneByEmail(email: string): Promise<User | undefined> {
    // First check if the record exists and is not deleted
    const existingRecord = await this.userModel.findOne({ email, ...this.existsQuery }).exec();
    if (!existingRecord) {
      throw new NotFoundException('User not found or has been deleted.');
    }

    // Perform the update if the record is not marked as deleted
    return this.userModel.findOne({ email }).exec();
  }  

  async update(id: string, user: User): Promise<User> {
    
    // First check if the record exists and is not deleted
    const existingRecord = await this.userModel.findOne({ _id: id, ...this.existsQuery }).exec();
    if (!existingRecord) {
      throw new NotFoundException('User not found or has been deleted.');
    }

    // Perform the update if the record is not marked as deleted
    return this.userModel.findByIdAndUpdate(id, user, { new: true }).exec();
  }

  async remove(id: string): Promise<User> {
    // First check if the record exists and is not deleted
    const existingRecord = await this.userModel.findOne({ _id: id, ...this.existsQuery }).exec();
    if (!existingRecord) {
      throw new NotFoundException('User not found or has been deleted.');
    }

    // Perform the update if the record is not marked as deleted
    return this.userModel.findByIdAndRemove(id).exec();
  }

  async updatePasswordByVerificationKey(
    verificationKey: string,
    newPassword: string,
  ): Promise<Types.ObjectId> {
    const user = await this.userModel.findOne({ verificationKey, ...this.existsQuery });

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
