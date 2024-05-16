// inventory.service.ts
import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Inventory, InventoryDocument } from '../schemas/inventory.schema';
import { ReceiveStockInventoryDto } from '../dto/inventory.dto';

@Injectable()
export class InventoryService {
  existsQuery: any = { deleted: false };
  constructor(@InjectModel(Inventory.name) private inventoryModel: Model<InventoryDocument>) {}

  async receiveStock(receiveStockInventoryDto: ReceiveStockInventoryDto): Promise<Inventory> {
    // TODO
    // throw new ConflictException('An item with the same name and unit measure already exists and is active.');

    const newInventory = new this.inventoryModel(receiveStockInventoryDto);
    return newInventory.save();
  }

  async updateStock(id: string, data: any): Promise<Inventory> {

    // Find and update the inventory document
    const updatedInventory = await this.inventoryModel.findByIdAndUpdate(id, data, { new: true });
    if (!updatedInventory) {
      throw new NotFoundException(`Inventory with ID ${id} not found`);
    }

    return updatedInventory;
  }
}
