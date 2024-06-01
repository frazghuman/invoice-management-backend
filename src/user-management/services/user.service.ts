import { Injectable, BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from '../dto/create-user.dto';
import { UserSettingsService } from './user-settings.service';
import * as jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class UserService {
  
  existsQuery: any = { deleted: false };
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private userSettingsService: UserSettingsService,
    private readonly configService: ConfigService
  ) {}

  async createUser(user: CreateUserDto): Promise<Types.ObjectId> {
    // Create the user using the validated data
    const createdUser = new this.userModel(user);
    const {_id} = await createdUser.save();

    try {
      await this.userSettingsService.create(_id, {});
    } catch (error) {
      // If creating user settings fails, delete the created user
      await this.userModel.findByIdAndDelete(_id);
      throw new Error('Failed to create user settings. User creation rolled back.');
    }

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

    const users = await query
    .populate('role', 'name')
    .populate('companiesAccess', 'name')
    .exec();
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
    return this.userModel.findById(id)
    .populate('role', 'name')
    .populate('companiesAccess', 'name')
    .exec();
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

  async delete(id: string): Promise<any> {
    const existingRecord = await this.userModel.findOne({ _id: id, ...this.existsQuery }).exec();
    if (!existingRecord) {
      throw new NotFoundException('Item not found or has been deleted.');
    }

    return this.userModel.findByIdAndUpdate(id, this.existsQuery).exec();
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

  

  async resetPassword(
    userId: string,
    resetPasswordDto: any,
  ): Promise<Types.ObjectId> {
    const userIdObject = new Types.ObjectId(userId);
    const user = await this.userModel.findOne({ _id: userIdObject, ...this.existsQuery });

    if (!user) {
      throw new Error('User not found');
    }

    const {password, newPassword} = resetPasswordDto;

    if (this.validateUser(user, password)) {
      const salt = await bcrypt.genSalt();
      const hashedPassword = await bcrypt.hash(newPassword, salt);
  
      user.password = hashedPassword;
      user.verificationKey = null;
  
      const {_id} = await user.save();
      return Promise.resolve(_id);
    } else {
      throw new UnauthorizedException('Invalid old password!');
    }
    

  }

  async validateUser(user: User, password: string): Promise<any> {

    if (user && (await bcrypt.compare(password, user.password))) {
      const { password, ...result } = user.toObject(); // remove password from user object
      return result;
    }

    return null;
  }

  async getCurrentUserCompanies(req: Request): Promise<any> {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      throw new NotFoundException(`Unauthoriazed!`);
    }
    try {
      
      const [, token] = authHeader.split(' ');
      const JWT_SECRET = this.configService.get<string>('JWT_SECRET');
      const decoded = jwt.verify(token, JWT_SECRET);
      const userId = decoded.sub.toString();
      const userIdObject = new Types.ObjectId(userId);

    const userSettings = await this.userModel.aggregate([
      { $match: { _id: userIdObject } },
      { $lookup: {
          from: 'companies', // The collection name of the companies
          localField: 'companiesAccess',
          foreignField: '_id',
          as: 'companiesAccess'
        }
      },
      { $unwind: '$companiesAccess' },
      { $match: { 'companiesAccess.deleted': false } },
      { $project: {
          'companiesAccess._id': 1,
          'companiesAccess.name': 1
        }
      }
    ]).exec();

    if (!userSettings.length) {
      throw new NotFoundException('User not found');
    }

    return userSettings.map(setting => setting.companiesAccess);
      
    } catch (error) {
      throw new NotFoundException(`User settings not found`);
    }
  }
}
