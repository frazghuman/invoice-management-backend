import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UserSettings, UserSettingsDocument } from '../schemas/user-settings.schema';
import * as jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class UserSettingsService {
  private defaultUserSettings!:any;
  constructor(
    @InjectModel(UserSettings.name) private userSettingsModel: Model<UserSettingsDocument>,
    private readonly configService: ConfigService
  ) {
    this.defaultUserSettings = {
      userImage: '',
      userName: '',
      companyId: '',
      country: 'Spain',
      language: 'Spanish',
      dateFormat: 'dd MMM yyyy', //mediumDate -> Feb 25, 2024, dd/MM/yyyy -> 25/02/2024, MM/dd/yyyy -> 02/25/2024
      currency: 'EUR',
      currencyFormat: 'Default',
    };
  }

  // Create a record with default values
  async create(userId: string, createUserSettingsDto: Partial<UserSettings>): Promise<UserSettings> {
    const existingUserSettings = await this.userSettingsModel.findOne({ user: new Types.ObjectId(userId) }).exec();
    if (existingUserSettings) {
      throw new ConflictException(`User settings for userId ${userId} already exist`);
    }

    const newUserSettings = new this.userSettingsModel({
      user: new Types.ObjectId(userId),
      ...this.defaultUserSettings,
      ...createUserSettingsDto,
    });

    return newUserSettings.save();
  }

  // Update by any number of properties
  async update(userId: string, updateUserSettingsDto: Partial<UserSettings>): Promise<UserSettings> {
    const existingUserSettings = await this.userSettingsModel.findOneAndUpdate(
      { user: new Types.ObjectId(userId) },
      { $set: updateUserSettingsDto },
      { new: true, runValidators: true }
    ).exec();

    if (!existingUserSettings) {
      throw new NotFoundException(`User settings with userId ${userId} not found`);
    }

    return existingUserSettings;
  }

  // Get one by userId
  async getByUserId(userId: string): Promise<UserSettings> {
    const userSettings = await this.userSettingsModel.findOne({ user: new Types.ObjectId(userId) }).exec();
    if (!userSettings) {
      throw new NotFoundException(`User settings with userId ${userId} not found`);
    }
    return userSettings;
  }

  async getCurrentUserSettings(req: Request): Promise<any> {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      throw new NotFoundException(`Unauthoriazed!`);
    }
    try {
      
      const [, token] = authHeader.split(' ');
      const JWT_SECRET = this.configService.get<string>('JWT_SECRET');
      const decoded = jwt.verify(token, JWT_SECRET);
      const userId = decoded.sub.toString();
      let userSettings = await this.userSettingsModel.findOne({ user: new Types.ObjectId(userId) }).exec();
      if (!userSettings) {
        const newUserSettings = new this.userSettingsModel({
          user: new Types.ObjectId(userId),
          ...this.defaultUserSettings
        });
        await newUserSettings.save();
      }

      userSettings = await this.userSettingsModel.findOne({ user: new Types.ObjectId(userId) })
      .populate('user', '-password -verificationKey -__v -deleted')
      .populate('company', '-__v -deleted')
      .exec();

      return userSettings;
      
    } catch (error) {
      throw new NotFoundException(`User settings not found`);
    }
  }

  async updateCurrentUserSettings(req: Request, updateUserSettingsDto: Partial<UserSettings>): Promise<any> {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      throw new NotFoundException(`Unauthoriazed!`);
    }
    try {
      
      const [, token] = authHeader.split(' ');
      const JWT_SECRET = this.configService.get<string>('JWT_SECRET');
      const decoded = jwt.verify(token, JWT_SECRET);
      const userId = decoded.sub.toString();

      updateUserSettingsDto.user = new Types.ObjectId(updateUserSettingsDto.user);
      updateUserSettingsDto.company = new Types.ObjectId(updateUserSettingsDto.company);

      const existingUserSettings = await this.userSettingsModel.findOneAndUpdate(
        { user: new Types.ObjectId(userId) },
        { $set: updateUserSettingsDto },
        { new: true, runValidators: true }
      ).exec();
  
      if (!existingUserSettings) {
        throw new NotFoundException(`User settings not updated`);
      }
  
      return existingUserSettings;
      
    } catch (error) {
      throw new NotFoundException(`User settings not found`);
    }
  }
}
