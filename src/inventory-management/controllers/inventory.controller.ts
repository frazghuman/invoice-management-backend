// inventory.controller.ts
import { Controller, Post, Put, Body, Param, NotFoundException, UseGuards, SetMetadata, UsePipes, Get, Delete } from '@nestjs/common';
import { Inventory, InventoryValidationSchema } from '../schemas/inventory.schema';
import { InventoryService } from '../services/inventory.service';
import { PermissionAuthGuard } from '../../auth/permission-auth-guard';
import { JoiValidationPipe } from '@common/pipes/joi-validation.pipe';
import { Types } from 'mongoose';
import { ParseObjectIdPipe } from '@common/pipes/parse-object-id.pipe';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post('receive')
  @UseGuards(PermissionAuthGuard)
  @SetMetadata('permissions', ['invoices-management'])
  @UsePipes(new JoiValidationPipe(InventoryValidationSchema.create))
  async receiveStock(@Body() data: any): Promise<Inventory> {
    return this.inventoryService.receiveStock(data);
  }
  
  @Put(':id')
  @UseGuards(PermissionAuthGuard)
  @SetMetadata('permissions', ['invoices-management'])
  @UsePipes(new JoiValidationPipe(InventoryValidationSchema.update))
  async updateStock(@Param('id') id: string, @Body() data: any): Promise<Inventory> {
    const inventory = await this.inventoryService.updateStock(id, data);
    if (!inventory) {
      throw new NotFoundException(`Inventory with ID ${id} not found`);
    }
    return inventory;
  }

  @Delete(':id')
  @UseGuards(PermissionAuthGuard)
  @SetMetadata('permissions', ['invoices-management'])
  async softDelete(@Param('id') id: string): Promise<Inventory> {
    return this.inventoryService.softDelete(id);
  }

  @Get(':itemId/largest-lot-no')
  @UseGuards(PermissionAuthGuard)
  @SetMetadata('permissions', ['invoices-management'])
  async getLargestLotNoByItem(@Param('itemId') itemId: string): Promise<number> {
    return this.inventoryService.getLargestLotNoByItem(itemId);
  }

  @Get(':itemId/inventories')
  @UseGuards(PermissionAuthGuard)
  @SetMetadata('permissions', ['invoices-management'])
  async getInventoriesByItem(@Param('itemId') itemId: string): Promise<Inventory[]> {
    return this.inventoryService.getInventoriesByItem(itemId);
  }
}
