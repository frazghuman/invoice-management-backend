import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Item, ItemDocument } from '../schemas/item.schema';
import { CreateItemDto, UpdateItemDto } from '../dto/item.dto';

@Injectable()
export class ItemService {
  existsQuery: any = { deleted: false };

  constructor(@InjectModel(Item.name) private itemModel: Model<ItemDocument>) {}

  async create(createItemDto: CreateItemDto): Promise<Item> {
    const existingItem = await this.itemModel.findOne({
      name: createItemDto.name,
      baseUnitOfMeasure: createItemDto.baseUnitOfMeasure,
      ...this.existsQuery  // Check active records only
    });

    if (existingItem) {
      throw new ConflictException('An item with the same name and unit measure already exists and is active.');
    }

    const createdItem = new this.itemModel(createItemDto);
    return createdItem.save();
  }

  async findAll(options: any): Promise<{ total: number, data: any[] }> {
    const query = this.itemModel.find({ ...this.existsQuery });

    // Apply search if provided
    if (options.search) {
      query.or([
        { name: { $regex: options.search, $options: 'i' } },
        { description: { $regex: options.search, $options: 'i' } }
      ]);
    }

    // Apply sorting
    const sortOrder = options.sortOrder === 'desc' ? '-' : '';
    query.sort(`${sortOrder}${options.sortBy}`);
    query.sort(`createdAt`);

    // Apply pagination if limit is not null
    if (options.limit !== null) {
      query.limit(options.limit).skip(options.skip);
    }

    const data = await query.exec();
    const total = await this.itemModel.countDocuments(query.getFilter()).exec();

    // Fetch latest price for each item
    const itemsWithLatestPrice = await Promise.all(data.map(async item => {
      const latestPrice = await this.getLatestPrice(item._id);
      return { ...item.toObject(), latestPrice };
    }));

    return {
      total,
      data: itemsWithLatestPrice
    };
  }

  async getLatestPrice(itemId: string): Promise<any> {
    const now = new Date();

    const result = await this.itemModel.aggregate([
      { $match: { _id: itemId } },
      { $unwind: '$prices' },
      { 
        $addFields: { 
          diff: { 
            $abs: { 
              $subtract: [ "$prices.effectiveDate", now ] 
            } 
          } 
        } 
      },
      { $sort: { diff: 1, 'prices.updatedAt': -1 } },
      { $limit: 1 },
      {
        $project: {
          'prices.salePrice': 1,
          'prices.effectiveDate': 1,
          'prices._id': 1,
          'prices.createdAt': 1,
          'prices.updatedAt': 1,
        }
      }
    ]);

    if (!result || result.length === 0) {
      return null;
    }

    return result[0].prices;
  }

  async findOne(id: string): Promise<Item> {
    const existingItem = await this.itemModel.findOne({ _id: id, ...this.existsQuery }).exec();
    if (!existingItem) {
      throw new NotFoundException('Item not found or has been deleted.');
    }

    const latestPrice = await this.getLatestPrice(existingItem._id);
    return { ...existingItem.toObject(), latestPrice };
  }

  async update(id: string, updateItemDto: UpdateItemDto): Promise<Item> {
    const existingAlreadyItem = await this.itemModel.findOne({
      _id: { $ne: id },
      name: updateItemDto.name,  // Assuming name should be unique
      baseUnitOfMeasure: updateItemDto.baseUnitOfMeasure,   // Assuming cif should be unique
      deleted: false  // Ensure we only consider active records
    });

    if (existingAlreadyItem) {
      throw new ConflictException('An item with the same name and unit measure already exists and is active.');
    }

    const existingItem = await this.itemModel.findOne({ _id: id, ...this.existsQuery }).exec();
    if (!existingItem) {
      throw new NotFoundException('Item not found or has been deleted.');
    }

    return this.itemModel.findByIdAndUpdate(id, updateItemDto, { new: true }).exec();
  }

  async remove(id: string): Promise<Item> {
    const existingItem = await this.itemModel.findOne({ _id: id, ...this.existsQuery }).exec();
    if (!existingItem) {
      throw new NotFoundException('Item not found or has been deleted.');
    }

    return this.itemModel.findByIdAndRemove(id).exec();
  }

  async delete(itemId: string): Promise<any> {
    const existingItem = await this.itemModel.findOne({ _id: itemId, ...this.existsQuery }).exec();
    if (!existingItem) {
      throw new NotFoundException('Item not found or has been deleted.');
    }

    return this.itemModel.findByIdAndUpdate(itemId, this.existsQuery).exec();
  }

  async addPriceToItem(itemId: string, priceData: any): Promise<Item> {
    // Find the item by ID
    const item = await this.itemModel.findById(itemId);
    if (!item) {
      throw new NotFoundException(`Item with ID ${itemId} not found`);
    }

    // Push the new price to the prices array
    item.prices.push(priceData);

    // Save the updated item back to the database
    return item.save();
  }
}
