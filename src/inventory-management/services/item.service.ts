import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Item, ItemDocument } from '../schemas/item.schema';
import { CreateItemDto, UpdateItemDto } from '../dto/item.dto';
import { InventoryService } from './inventory.service';
import * as jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { UserSettingsService } from '../../user-management/services/user-settings.service';

@Injectable()
export class ItemService {
  existsQuery: any = { deleted: false };

  constructor(
    @InjectModel(Item.name) private itemModel: Model<ItemDocument>,
    private inventoryService: InventoryService, // Inject InventoryService
    private userSettingsService: UserSettingsService,
    private readonly configService: ConfigService
  ) {}

  async create(req: Request, createItemDto: CreateItemDto): Promise<Item> {
    const company = await this.getActiveCompanyOfCurrentUser(req);
    const existingItem = await this.itemModel.findOne({
      name: createItemDto.name,
      baseUnitOfMeasure: createItemDto.baseUnitOfMeasure,
      ...this.existsQuery,  // Check active records only
      company
    });

    if (existingItem) {
      throw new ConflictException('An item with the same name and unit measure already exists and is active.');
    }

    const createdItem = new this.itemModel({...createItemDto, company});
    return createdItem.save();
  }

  async findAll(req: Request, options: any): Promise<{ total: number, data: any[] }> {
    const company = await this.getActiveCompanyOfCurrentUser(req);
    const query = this.itemModel.find({ ...this.existsQuery, company });

    // Apply search if provided
    if (options.search) {
      query.or([
        { name: { $regex: options.search, $options: 'i' } },
        { description: { $regex: options.search, $options: 'i' } },
        { baseUnitOfMeasure: { $regex: options.search, $options: 'i' } }
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
      const inventoryCount = await this.inventoryService.countInventoryByItem(item._id.toString());
      const totalAvailableStock = await this.inventoryService.getTotalAvailableStockByItemId(item._id.toString());
      return { ...item.toObject(), latestPrice, inventoryCount, totalAvailableStock };
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

  async findOne(req: Request, id: string): Promise<Item> {
    const company = await this.getActiveCompanyOfCurrentUser(req);
    const existingItem = await this.itemModel.findOne({ _id: id, ...this.existsQuery, company }).exec();
    if (!existingItem) {
      throw new NotFoundException('Item not found or has been deleted.');
    }

    const latestPrice = await this.getLatestPrice(existingItem._id);
    const inventoryCount = await this.inventoryService.countInventoryByItem(existingItem._id.toString());
    const totalAvailableStock = await this.inventoryService.getTotalAvailableStockByItemId(existingItem._id.toString());
    
    return { ...existingItem.toObject(), latestPrice, inventoryCount, totalAvailableStock };
  }

  async update(req: Request, id: string, updateItemDto: UpdateItemDto): Promise<Item> {
    const company = await this.getActiveCompanyOfCurrentUser(req);
    const existingAlreadyItem = await this.itemModel.findOne({
      _id: { $ne: id },
      name: updateItemDto.name,  // Assuming name should be unique
      baseUnitOfMeasure: updateItemDto.baseUnitOfMeasure,   // Assuming cif should be unique
      deleted: false,  // Ensure we only consider active records
      company
    });

    if (existingAlreadyItem) {
      throw new ConflictException('An item with the same name and unit measure already exists and is active.');
    }

    const existingItem = await this.itemModel.findOne({ _id: id, ...this.existsQuery, company }).exec();
    if (!existingItem) {
      throw new NotFoundException('Item not found or has been deleted.');
    }

    return this.itemModel.findByIdAndUpdate(id, {...updateItemDto, company}, { new: true }).exec();
  }

  async remove(req: Request, id: string): Promise<Item> {
    const company = await this.getActiveCompanyOfCurrentUser(req);
    const existingItem = await this.itemModel.findOne({ _id: id, ...this.existsQuery, company }).exec();
    if (!existingItem) {
      throw new NotFoundException('Item not found or has been deleted.');
    }

    return this.itemModel.findByIdAndRemove(id).exec();
  }

  async delete(req: Request, itemId: string): Promise<any> {
    const company = await this.getActiveCompanyOfCurrentUser(req);
    const existingItem = await this.itemModel.findOne({ _id: itemId, ...this.existsQuery, company }).exec();
    if (!existingItem) {
      throw new NotFoundException('Item not found or has been deleted.');
    }

    return this.itemModel.findByIdAndUpdate(itemId, {deleted: true}).exec();
  }

  async addPriceToItem(req: Request, itemId: string, priceData: any): Promise<Item> {
    const company = await this.getActiveCompanyOfCurrentUser(req);
    // Find the item by ID
    const item = await this.itemModel.findById(itemId);
    if (!item || item?.company?.toString() !== company?.toString()) {
      throw new NotFoundException(`Item not found`);
    }

    // Push the new price to the prices array
    item.prices.push(priceData);

    // Save the updated item back to the database
    return item.save();
  }

  async findAllItems(req: Request): Promise<any> {
    const company = await this.getActiveCompanyOfCurrentUser(req);
    const query = this.itemModel.find({ ...this.existsQuery, company }).select('_id name baseUnitOfMeasure image');

    const options = {
      sortOrder: 'asc',
      sortBy: 'name',
    }
    // Apply sorting
    const sortOrder = options.sortOrder === 'desc' ? '-' : '';
    query.sort(`${sortOrder}${options.sortBy}`);
    query.sort(`createdAt`);

    const data = await query.exec();
    const total = await this.itemModel.countDocuments(query.getFilter()).exec();

    // Fetch latest price for each item
    const itemsWithLatestPrice = await Promise.all(data.map(async item => {
      const latestPrice = await this.getLatestPrice(item._id);
      const inventoryCount = await this.inventoryService.countInventoryByItem(item._id.toString());
      const totalAvailableStock = await this.inventoryService.getTotalAvailableStockByItemId(item._id.toString());
      return { ...item.toObject(), latestPrice, inventoryCount, totalAvailableStock };
    }));

    return {
      total,
      data: itemsWithLatestPrice
    };
  }

  async getActiveCompanyOfCurrentUser(req: Request): Promise<any> {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      throw new NotFoundException(`Unauthoriazed!`);
    }
    try {
      
      const [, token] = authHeader.split(' ');
      const JWT_SECRET = this.configService.get<string>('JWT_SECRET');
      const decoded = jwt.verify(token, JWT_SECRET);
      const userId = decoded.sub.toString();
      const { company } = await this.userSettingsService.getByUserId(userId);
      if (!company) {
        throw new NotFoundException(`Current User have no company.`);
      }
      return company;
    } catch (error) {
      throw new NotFoundException(`Current User have no company.`);
    }
  }
}
