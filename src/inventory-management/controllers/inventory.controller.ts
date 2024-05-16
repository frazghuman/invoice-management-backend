// inventory.controller.ts
import { Controller, Post, Put, Body, Param, NotFoundException, UseGuards, SetMetadata, UsePipes } from '@nestjs/common';
import { Inventory, InventoryValidationSchema } from '../schemas/inventory.schema';
import { InventoryService } from '../services/inventory.service';
import { PermissionAuthGuard } from '../../auth/permission-auth-guard';
import { JoiValidationPipe } from '@common/pipes/joi-validation.pipe';

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
}
