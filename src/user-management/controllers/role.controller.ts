import { Controller, Get, Post, Body, Put, Param, Delete, UsePipes, UseGuards, SetMetadata } from '@nestjs/common';
import { RoleService } from '../services/role.service';
import { Role } from '../schemas/role.schema';
import * as Joi from 'joi';
import { JoiValidationPipe } from '../../common/pipes/joi-validation.pipe';
import { Types } from 'mongoose';
import { PermissionAuthGuard } from '../../auth/permission-auth-guard';

@Controller('roles')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Post()
  @UseGuards(PermissionAuthGuard)
  @SetMetadata('permissions', ['manage-roles'])
  @UsePipes(new JoiValidationPipe(Joi.object({
    name: Joi.string().required(),
    permissions: Joi.array().items(Joi.string()).required()
  })))
  async create(@Body() role: Role): Promise<Types.ObjectId> {
    return this.roleService.create(role);
  }

  @Get()
  @UseGuards(PermissionAuthGuard)
  @SetMetadata('permissions', ['read-roles'])
  async findAll(): Promise<Role[]> {
    return this.roleService.findAll();
  }

  @Get(':id')
  @UseGuards(PermissionAuthGuard)
  @SetMetadata('permissions', ['read-roles'])
  async findOne(@Param('id') id: string): Promise<Role> {
    return this.roleService.findOne(id);
  }

  @Put(':id')
  @UseGuards(PermissionAuthGuard)
  @SetMetadata('permissions', ['manage-roles'])
  async update(@Param('id') id: string, @Body() role: Role): Promise<Role> {
    return this.roleService.update(id, role);
  }

  @Delete(':id')
  @UseGuards(PermissionAuthGuard)
  @SetMetadata('permissions', ['manage-roles'])
  async remove(@Param('id') id: string): Promise<Role> {
    return this.roleService.remove(id);
  }
}

