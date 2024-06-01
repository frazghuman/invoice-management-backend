// inventory.service.ts
import { Injectable, NotFoundException, BadRequestException, ConflictException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Inventory, InventoryDocument } from '../schemas/inventory.schema';
import { ReceiveStockInventoryDto } from '../dto/inventory.dto';
import { UserSettingsService } from '../../user-management/services/user-settings.service';

@Injectable()
export class InventoryService {
  existsQuery: any = { deleted: false };

  private readonly logger = new Logger(InventoryService.name);
  constructor(
    @InjectModel(Inventory.name) private inventoryModel: Model<InventoryDocument>,
    private userSettingsService: UserSettingsService
  ) {}

  async getInventoriesByItem(itemId: string): Promise<Inventory[]> {
    try {
      // Convert itemId to ObjectId
      // const objectId = new Types.ObjectId(itemId);

      // Query to find inventories by itemId where deleted is false and totalStock is greater than soldOutStock
      const inventories = await this.inventoryModel.find({
        item: itemId,
        ...this.existsQuery,
        $expr: { $gt: ['$totalStock', { $ifNull: ['$soldOutStock', 0] }] }
      }).exec();

      return inventories;
    } catch (error) {
      this.logger.error('Error in getInventoriesByItem:', error);
      throw new NotFoundException('Error retrieving inventories');
    }
  }

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

  async softDelete(id: string): Promise<Inventory> {
    try {
      // Convert id to ObjectId
      const objectId = new Types.ObjectId(id);

      // Find the inventory item by id
      const inventory = await this.inventoryModel.findById(objectId).exec();

      if (!inventory) {
        throw new NotFoundException('Inventory item not found');
      }

      // Set the deleted field to true
      inventory.deleted = true;

      // Save the updated inventory item
      return inventory.save();
    } catch (error) {
      this.logger.error('Error in softDelete:', error);
      throw new NotFoundException('Error performing delete');
    }
  }

  async getLargestLotNoByItem(itemId: string): Promise<number> {
    try {
      // Convert itemId to ObjectId
      // const objectId = new Types.ObjectId(itemId);

      // Log the converted ObjectId
      // this.logger.debug(`Converted itemId to ObjectId: ${objectId}`);

      // Query to find the largest lotNo for the given item
      const result = await this.inventoryModel
        .findOne({ item: itemId })
        .sort({ lotNo: -1 })
        .select('lotNo')
        .exec();

      // Log the query result
      this.logger.debug(`Query result: ${result}`);

      // Return 0 if no result is found
      if (!result) {
        this.logger.debug('No result found, returning 0');
        return 0;
      }

      // Return the found lotNo
      return result.lotNo;
    } catch (error) {
      this.logger.error('Error in getLargestLotNoByItem:', error);
      throw error;
    }
  }

  async countInventoryByItem(itemId: string): Promise<number> {
    try {
      // Convert itemId to ObjectId
      // const objectId = new Types.ObjectId(itemId);

      // Log the converted ObjectId
      this.logger.debug(`Converted itemId to ObjectId: ${itemId}`);

      // Query to count the number of inventory records for the given item
      const count = await this.inventoryModel
        .countDocuments({ item: itemId, ...this.existsQuery })
        .exec();

      // Log the count result
      this.logger.debug(`Count result: ${count}`);

      return count;
    } catch (error) {
      this.logger.error('Error in countInventoryByItem:', error);
      throw error;
    }
  }

  async getTotalAvailableStockByItemId(itemId: string): Promise<number> {
    try {
      // Convert itemId to ObjectId
      const objectId = itemId; //new Types.ObjectId(itemId);

      // Query to find inventories by itemId where deleted is false
      const inventories = await this.inventoryModel.find({
        item: objectId,
        ...this.existsQuery
      }).exec();

      // Calculate the total available stock
      const totalAvailableStock = inventories.reduce((sum, inventory) => {
        const availableStock = inventory.totalStock - (inventory.soldOutStock ?? 0);
        return sum + availableStock;
      }, 0);

      return totalAvailableStock;
    } catch (error) {
      this.logger.error('Error in getTotalAvailableStockByItemId:', error);
      throw new NotFoundException('Error retrieving total available stock');
    }
  }
}
