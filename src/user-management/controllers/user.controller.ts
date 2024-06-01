import { Controller, Get, Post, Body, Param, Put, Delete, UsePipes, NotFoundException, UseGuards, SetMetadata, Query, Req } from '@nestjs/common';
import { UserService } from '../services/user.service';
import { User, UserValidationSchema } from '../schemas/user.schema';
import { Types } from 'mongoose';
import { JoiValidationPipe } from '../../common/pipes/joi-validation.pipe';
import * as Joi from 'joi';
import { RoleService } from '../services/role.service';
import { PermissionAuthGuard } from '../../auth/permission-auth-guard';
import { CreateUserDto } from '../dto/create-user.dto';
import { Request } from 'express';
import { UserSettingsService } from '../services/user-settings.service';
import { UserSettings } from '../schemas/user-settings.schema';

@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly roleService: RoleService,
    private readonly userSettingsService: UserSettingsService
  ) {}
// changes in develop
  @Post()
  @UseGuards(PermissionAuthGuard)
  @SetMetadata('permissions', ['manage_users'])
  @UsePipes(new JoiValidationPipe(UserValidationSchema))
  async create(@Body() user: CreateUserDto): Promise<Types.ObjectId> {
    const { role } = user;
    const roleInfo = await this.roleService.findOne(role.toString());

    if (!roleInfo) {
      throw new NotFoundException(`Role with ID ${roleInfo._id} not found`);
    }
    return this.userService.createUser(user);
  }

  @Post('password/new')
  @UsePipes(new JoiValidationPipe(Joi.object({
    verificationKey: Joi.string().required(),
    password: Joi.string().required(),
  })))
  async updatePasswordByVerificationKey(@Body() user: User): Promise<Types.ObjectId> {
    const { verificationKey, password } = user;
    return this.userService.updatePasswordByVerificationKey(verificationKey, password);
  }

  @Put(':id/password/reset')
  @UsePipes(new JoiValidationPipe(Joi.object({
    userId: Joi.string().required(),
    password: Joi.string().required(),
    newPassword: Joi.string().required(),
    retypeNewPassword: Joi.string().required(),
  })))
  async resetPassword(@Param('id') id: string, @Body() resetPasswordDto: any): Promise<Types.ObjectId> {
    return this.userService.resetPassword(id, resetPasswordDto);
  }

  @Get()
  @UseGuards(PermissionAuthGuard)
  @SetMetadata('permissions', ['manage_users'])
  async findAll(
    @Query('limit') limit: string,
    @Query('skip') skip: string,
    @Query('sortBy') sortBy: string,
    @Query('sortOrder') sortOrder: string,
    @Query('role') role: string,
    @Query('search') search: string
  ): Promise<{ limit: number; skip: number; total: number; users: User[] }> {
    const { users, total } = await this.userService.getAllUsers(
      parseInt(limit),
      parseInt(skip),
      sortBy,
      sortOrder,
      role,
      search
    );
    return {
      limit: parseInt(limit),
      skip: parseInt(skip),
      total,
      users
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<User> {
    return this.userService.findOne(id);
  }

  @Put(':id')
  @UseGuards(PermissionAuthGuard)
  @SetMetadata('permissions', ['manage_users'])
  async update(@Param('id') id: string, @Body() user: User): Promise<User> {
    return this.userService.update(id, user);
  }

  @Delete(':id')
  @UseGuards(PermissionAuthGuard)
  @SetMetadata('permissions', ['manage_users'])
  async remove(@Param('id') id: string): Promise<User> {
    return this.userService.delete(id);
  }

  @Get('current/settings')
  @UseGuards(PermissionAuthGuard)
  @SetMetadata('permissions', ['manage-general-info'])
  async currentUserSettings(@Req() request: Request): Promise<User> {
    return this.userSettingsService.getCurrentUserSettings(request);
  }

  @Put('current/settings')
  @UseGuards(PermissionAuthGuard)
  @SetMetadata('permissions', ['manage-general-info'])
  async updateCurrentUserSettings(@Req() request: Request, @Body() userSettings: Partial<UserSettings>): Promise<User> {
    return this.userSettingsService.updateCurrentUserSettings(request, userSettings);
  }

  @Get('current/companies')
  @UseGuards(PermissionAuthGuard)
  @SetMetadata('permissions', ['manage-general-info'])
  async currentUserCompanies(@Req() request: Request): Promise<User> {
    return this.userService.getCurrentUserCompanies(request);
  }
}