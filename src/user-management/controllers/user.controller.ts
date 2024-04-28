import { Controller, Get, Post, Body, Param, Put, Delete, UsePipes, NotFoundException, UseGuards, SetMetadata, Query } from '@nestjs/common';
import { UserService } from '../services/user.service';
import { User, UserValidationSchema } from '../schemas/user.schema';
import { Types } from 'mongoose';
import { JoiValidationPipe } from '../../common/pipes/joi-validation.pipe';
import * as Joi from 'joi';
import { RoleService } from '../services/role.service';
import { PermissionAuthGuard } from '../../auth/permission-auth-guard';
import { CreateUserDto } from '../dto/create-user.dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService, private readonly roleService: RoleService) {}
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

  @Get()
  @UseGuards(PermissionAuthGuard)
  @SetMetadata('permissions', ['manage_users'])
  async findAll(
    @Query('limit') limit: string,
    @Query('skip') skip: string
  ): Promise<{ limit: number; skip: number; total: number; users: User[] }> {
    const { users, total } = await this.userService.getAllUsers(parseInt(limit), parseInt(skip));
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
    return this.userService.remove(id);
  }
}
