// inventory.service.ts
import { Injectable, NotFoundException, BadRequestException, ConflictException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types } from 'mongoose';
import { Inventory, InventoryDocument } from '../schemas/inventory.schema';
import { ReceiveStockInventoryDto } from '../dto/inventory.dto';
import { ItemService } from './item.service';
import { Invoice, InvoiceDocument } from '../schemas/invoice.schema';

@Injectable()
export class InventoryService {
  existsQuery: any = { deleted: false };

  private readonly logger = new Logger(InventoryService.name);
  constructor(
    @InjectModel(Invoice.name) private invoiceModel: Model<InvoiceDocument>,
    @InjectModel(Inventory.name) private inventoryModel: Model<InventoryDocument>,
    // private itemService: ItemService
  ) {}

  async getInventoriesByItem(itemId: string): Promise<Inventory[]> {
    try {
      // Convert itemId to ObjectId
      // const objectId = new Types.ObjectId(itemId);

      // Query to find inventories by itemId where deleted is false and totalStock is greater than soldOutStock
      // const inventories = await this.inventoryModel.find({
      //   item: itemId,
      //   ...this.existsQuery,
      //   // $expr: { $gt: ['$totalStock', { $ifNull: ['$soldOutStock', 0] }] }
      // }).exec();

      const inventories = await this.inventoryModel.aggregate([
        {
          $match: {
            item: itemId,
            ...this.existsQuery,
          },
        },
        {
          $addFields: {
            sortPriority: { $cond: [{ $eq: ['$lotNo', -1] }, 0, 1] },
          },
        },
        {
          $sort: {
            sortPriority: 1, // `lotNo: -1` first
            stockReceivedDate: 1, // Then by stockReceivedDate (FIFO)
          },
        },
        {
          $project: {
            sortPriority: 0, // Remove `sortPriority` from the final output
          },
        },
      ]).exec();
      

      return inventories;
    } catch (error) {
      this.logger.error('Error in getInventoriesByItem:', error);
      throw new NotFoundException('Error retrieving inventories');
    }
  }

  // async receiveStock(receiveStockInventoryDto: ReceiveStockInventoryDto): Promise<Inventory> {
  //   // TODO
  //   // throw new ConflictException('An item with the same name and unit measure already exists and is active.');

  //   const lastInventoryItem = await this.inventoryModel.findOne({
  //     item: receiveStockInventoryDto.item,
  //     lotNo: -1,
  //     deleted: false,
  //   })
  //   // .session(session)
  //   .exec();


  //   if (lastInventoryItem) {
  //     const excessSoldOutStock = Math.min(lastInventoryItem.soldOutStock, receiveStockInventoryDto.totalStock);
  //     lastInventoryItem.soldOutStock -= excessSoldOutStock;
  //     lastInventoryItem.inUse = false;
  //     await lastInventoryItem.save();

  //     receiveStockInventoryDto.soldOutStock = excessSoldOutStock;
  //   }

  //   const newInventory = new this.inventoryModel(receiveStockInventoryDto);
  //   return newInventory.save();
  // }

  async receiveStock(receiveStockInventoryDto: ReceiveStockInventoryDto): Promise<Inventory> {
    const lastInventoryItem = await this.inventoryModel.findOne({
      item: receiveStockInventoryDto.item,
      lotNo: -1,
      deleted: false,
    }).exec();
  
    if (lastInventoryItem) {
      // Calculate excess sold-out stock to transfer to the new inventory
      const excessSoldOutStock = Math.min(lastInventoryItem.soldOutStock, receiveStockInventoryDto.totalStock);
      lastInventoryItem.soldOutStock -= excessSoldOutStock;
      lastInventoryItem.inUse = false;
      await lastInventoryItem.save();
  
      // Update soldOutStock in the DTO
      receiveStockInventoryDto.soldOutStock = excessSoldOutStock;
    }
  
    // Save the new inventory and get its ID
    const newInventory = new this.inventoryModel(receiveStockInventoryDto);
    const savedInventory = await newInventory.save();
  
    // Update invoices with the new inventory ID
    if (lastInventoryItem) {
      await this.updateInvoicesWithNewInventory(
        receiveStockInventoryDto.item,
        lastInventoryItem._id.toString(), // Pass the last inventory lot ID
        savedInventory._id.toString(), // Pass the new inventory lot ID
        Number(receiveStockInventoryDto.totalStock) // Pass the total stock received
      );
    }
  
    return savedInventory;
  }
  
  private async updateInvoicesWithNewInventory(
    itemId: string,
    oldLotId: string,
    newLotId: string,
    transferQuantity: number
  ): Promise<void> {
    // Fetch invoices where 'deleted' is false and contains the specified itemId and oldLotId
    const invoices = await this.invoiceModel.find({
      items: {
        $elemMatch: {
          item: itemId,
          lots: {
            $elemMatch: {
              lotId: oldLotId
            }
          }
        }
      }
    });
  
    for (const invoice of invoices) {
      let invoiceModified = false;
  
      // Traverse through the items to locate matching items and lots
      for (const item of invoice.items) {
        if (item.item.toString() === itemId.toString()) {
          for (const lot of item.lots) {
            if (lot.lotId.toString() === oldLotId.toString() && transferQuantity > 0) {
              const quantityToTransfer = Math.min(transferQuantity, lot.quantity);
  
              // Deduct quantity from the old lot
              lot.quantity -= quantityToTransfer;
              transferQuantity -= quantityToTransfer;
  
              // Add the new lot reference if quantity was transferred
              if (quantityToTransfer > 0) {
                item.lots.push({
                  lotId: new Types.ObjectId(newLotId),
                  quantity: quantityToTransfer,
                });
              }
  
              // Remove the old lot if its quantity becomes zero
              if (lot.quantity <= 0) {
                item.lots = item.lots.filter(
                  (l) => l.lotId.toString() !== oldLotId.toString()
                );
              }
  
              invoiceModified = true;
            }
          }
        }
      }
  
      // Save the modified invoice
      if (invoiceModified) {
        await this.invoiceModel.findByIdAndUpdate(invoice._id, { items: invoice.items });
      }
    }
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

  async updateSoldOutStock(itemId: Types.ObjectId, orderSize: number, session: ClientSession): Promise<{lotsUsed: { lotId: Types.ObjectId; quantity: number }[], lowStock: boolean}> {
    // Fetch inventory items for the given item, ordered by stockReceivedDate (FIFO) and having stock greater than sold out stock
    const inventoryItems = await this.inventoryModel.find({
      item: itemId,
      deleted: false,
      $expr: { $gt: ["$totalStock", "$soldOutStock"] } // Only fetch items with available stock
    }).sort({ stockReceivedDate: 1 }).session(session).exec();
  
    let remainingQuantity = orderSize;
    const lotsUsed = [];
    let lastInventoryItem: InventoryDocument;
  
    for (const inventoryItem of inventoryItems) {
      lastInventoryItem = inventoryItem;

      if (remainingQuantity <= 0) break;
  
      const availableStock = inventoryItem.totalStock - inventoryItem.soldOutStock;
      const lotUsed = { lotId: new Types.ObjectId(inventoryItem._id), quantity: 0 };
  
      if (availableStock > 0) {
        if (availableStock >= remainingQuantity) {
          inventoryItem.soldOutStock += remainingQuantity;
          lotUsed.quantity = remainingQuantity;
          remainingQuantity = 0;
          inventoryItem.inUse = true;
        } else {
          inventoryItem.soldOutStock += availableStock;
          lotUsed.quantity = availableStock;
          remainingQuantity -= availableStock;
          inventoryItem.inUse = false;
        }
        
        lotsUsed.push(lotUsed);
        await inventoryItem.save({ session });
      }
    }
  
    let lowStock = false;
    if (remainingQuantity > 0) {
      lastInventoryItem = await this.inventoryModel.findOne({
        item: itemId,
        lotNo: -1,
        deleted: false,
      }).session(session).exec();
      
      if (!lastInventoryItem) {
        const v = new ReceiveStockInventoryDto();
        v.item = itemId.toString();
        v.lotNo = -1;
        v.purchasePrice = 0;
        v.totalStock = 0;
        v.description = "No stock added.";
        v.stockReceivedDate = new Date();
        
        lastInventoryItem = new this.inventoryModel(v);
        await lastInventoryItem.save({ session });

      }
      
      lastInventoryItem.soldOutStock += remainingQuantity;
      lastInventoryItem.inUse = true;
      await lastInventoryItem.save({ session });

      const lotUsed = { lotId: new Types.ObjectId(lastInventoryItem._id), quantity: remainingQuantity };
      lotsUsed.push(lotUsed);

      // const itemName = this.itemService.getItemNameById(itemId);
      // throw new NotFoundException(`Not enough stock of ${itemName} available to fulfill the order.`);
      // throw new NotFoundException(`Stock Alert: One or more items in your order do not have enough stock to be fulfilled completely.`);
      // lowStock = true;
    }
  
    return {lotsUsed: lotsUsed, lowStock: lowStock};
  }

  async returnSoldOutStock(inventoryId: Types.ObjectId, returnQuantity: number, session: ClientSession): Promise<any> {
    try {
        const inventoryItem = await this.inventoryModel.findById(inventoryId).session(session).exec();
    
        if (!inventoryItem) {
            // throw new Error(`Inventory item with ID ${inventoryId} not found.`);
        } else {

          inventoryItem.soldOutStock -= returnQuantity;

          if(inventoryItem.soldOutStock < 0) {
            inventoryItem.soldOutStock = 0;
          }
      
          const inventoryItemUpdated = await inventoryItem.save({ session });
  
          return inventoryItemUpdated; // Optionally return the updated inventory item
        }
        return true;
    } catch (error) {
        // Handle errors appropriately
        throw new Error(`Failed to update soldOutStock for inventory item with ID ${inventoryId}: ${error.message}`);
    }
  }
  
  
  
}
