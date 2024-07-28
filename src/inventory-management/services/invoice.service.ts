import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types } from 'mongoose';
import { Invoice, InvoiceDocument } from '../schemas/invoice.schema';
import { CreateInvoiceDto, UpdateInvoiceDto } from '../dto/invoice.dto';
import { UserSettingsService } from '../../user-management/services/user-settings.service';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { Request } from 'express';
import { CustomerService } from '../../customer-management/services/customers.service';
import { InventoryService } from './inventory.service';
import { Inventory, InventoryDocument } from '../schemas/inventory.schema';

@Injectable()
export class InvoiceService {
  private existsQuery = { deleted: false };
  constructor(
    @InjectModel(Invoice.name) private invoiceModel: Model<InvoiceDocument>,
    @InjectModel(Inventory.name) private readonly inventoryModel: Model<InventoryDocument>,
    private userSettingsService: UserSettingsService,
    private customerService: CustomerService,
    private inventoryService: InventoryService,
    private readonly configService: ConfigService
  ) {}

  /*async create(req: Request, createInvoiceDto: CreateInvoiceDto): Promise<Invoice> {
    const company = await this.getActiveCompanyOfCurrentUser(req);
    const createdInvoice = new this.invoiceModel({...createInvoiceDto, company});
    return createdInvoice.save();
  }*/

  // async create(req: Request, createInvoiceDto: CreateInvoiceDto): Promise<Invoice> {
  //   const company = await this.getActiveCompanyOfCurrentUser(req);
  //   const lastInvoiceNumber = await this.invoiceModel.findOne({...this.existsQuery}, { sort: { invoiceNumber: -1 } }).select('invoiceNumber');
  //   const nextInvoiceNumber = lastInvoiceNumber ? lastInvoiceNumber.invoiceNumber + 1 : 1;

  //   const createdInvoice = new this.invoiceModel({ ...createInvoiceDto, company, invoiceNumber: nextInvoiceNumber });

  //   // Update sold out stock for each item in the invoice
  //   for (const invoiceItem of createInvoiceDto.items) {
  //     const lotDetails = await this.inventoryService.updateSoldOutStock(invoiceItem.item, invoiceItem.quantity);
  //     invoiceItem.lots = lotDetails;
  //   }

  //   return createdInvoice.save();
  // }

  async create(req: Request, createInvoiceDto: CreateInvoiceDto): Promise<Invoice> {
    const company = await this.getActiveCompanyOfCurrentUser(req);
    const lastInvoiceNumber = await this.invoiceModel.findOne({ company: company._id })
      .sort({ invoiceNumber: -1 })
      .select('invoiceNumber')
      .exec();

    const nextInvoiceNumber = lastInvoiceNumber ? lastInvoiceNumber.invoiceNumber + 1 : 1;
    
    const session: ClientSession = await this.invoiceModel.db.startSession();
    session.startTransaction();
    
    try {
      const lowStockItems = [];
      for (const invoiceItem of createInvoiceDto.items) {
        const {lotsUsed, lowStock} = await this.inventoryService.updateSoldOutStock(invoiceItem.item, Number(invoiceItem.quantity), session);
        invoiceItem.lots = lotsUsed;
        if (lowStock) {
          lowStockItems.push(invoiceItem.item);
        }
      }

      if(lowStockItems.length) {
        throw new NotFoundException({
          message: `Stock Alert: One or more items in your order do not have enough stock to be fulfilled completely.`,
          itemsList: lowStockItems
        });
      }

      const createdInvoice = new this.invoiceModel({ ...createInvoiceDto, company, invoiceNumber: nextInvoiceNumber });
  
      await createdInvoice.save({ session });
  
      await session.commitTransaction();
      session.endSession();
  
      return createdInvoice;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      if (error?.response) {
        throw new NotFoundException(error.response);
      } else if (error?.message) {
        throw new NotFoundException(error.message);
      } else {
        throw new BadRequestException('Failed to create invoice due to insufficient stock or other error.');
      }
    }
  }
  

  async returnInvoice(req: Request, id: string, updateInvoiceDto: any): Promise<Invoice> {

    const session: ClientSession = await this.invoiceModel.db.startSession();
    session.startTransaction();
    
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new NotFoundException(`Invoice with ID ${id} not found`);
      }
  
      const company = await this.getActiveCompanyOfCurrentUser(req);
  
      const invoice = await this.invoiceModel.findOne({
        _id: id,
        ...this.existsQuery,
        company,
      });
  
      if (!invoice) {
        throw new NotFoundException(`Invoice with ID ${id} not found`);
      }

      for (const invoiceItem of updateInvoiceDto.items) {
        for (const lot of invoiceItem.lots) {
          const updatedInventoryItem = await this.inventoryService.returnSoldOutStock(new Types.ObjectId(lot.lotId), Number(lot.quantity), session);
        }
        
      }

      invoice.deleted = true;

      const updatedInvoice = await invoice.save({session});
  
      await session.commitTransaction();
      session.endSession();
  
      return updatedInvoice;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      if (error?.message) {
        throw new NotFoundException(error.message);
      } else {
        throw new BadRequestException('Failed to return invoice stock due to an error.');
      }
    }
  }

  async update(req: Request, id: string, updateInvoiceDto: any): Promise<Invoice> {

    const session: ClientSession = await this.invoiceModel.db.startSession();
    session.startTransaction();
    
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new NotFoundException(`Invoice with ID ${id} not found`);
      }
  
      const company = await this.getActiveCompanyOfCurrentUser(req);
  
      const invoice = await this.invoiceModel.findOne({
        _id: id,
        ...this.existsQuery,
        company,
      });
  
      if (!invoice) {
        throw new NotFoundException(`Invoice with ID ${id} not found`);
      }

      for (const invoiceItem of invoice.items) {
        for (const lot of invoiceItem.lots) {
          const updatedInventoryItem = await this.inventoryService.returnSoldOutStock(new Types.ObjectId(lot.lotId), Number(lot.quantity), session);
        }
        
      }

      invoice.items = [];

      const lowStockItems = [];
      for (const invoiceItem of updateInvoiceDto.items) {
        const {lotsUsed, lowStock} = await this.inventoryService.updateSoldOutStock(invoiceItem.item, Number(invoiceItem.quantity), session);
        invoiceItem.lots = lotsUsed;
        if (lowStock) {
          lowStockItems.push(invoiceItem.item);
        }
      }

      if(lowStockItems.length) {
        throw new NotFoundException({
          message: `Stock Alert: One or more items in your order do not have enough stock to be fulfilled completely.`,
          itemsList: lowStockItems
        });
      }

      invoice.items = updateInvoiceDto.items;

      invoice.customer = updateInvoiceDto.customer;
      invoice.date = updateInvoiceDto.date;
      invoice.dueDate = updateInvoiceDto.dueDate;
      invoice.discount = updateInvoiceDto.discount;
      invoice.shippingCharges = updateInvoiceDto.shippingCharges;
      invoice.pendingPayment = updateInvoiceDto.pendingPayment;
      invoice.amountDue = updateInvoiceDto.amountDue;
      invoice.note = updateInvoiceDto.note;


      const updatedInvoice = await invoice.save({session});
  
      await session.commitTransaction();
      session.endSession();
  
      return updatedInvoice;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      if (error?.response) {
        throw new NotFoundException(error.response);
      } else if (error?.message) {
        throw new NotFoundException(error.message);
      } else {
        throw new BadRequestException('Failed to return invoice stock due to an error.');
      }
    }
  }

  async findAll(req: Request, options: any): Promise<{ total: number, data: any[] }> {
    const company = await this.getActiveCompanyOfCurrentUser(req);
    const query = this.invoiceModel.find({ ...this.existsQuery, company });
  
    // Apply search if provided
    if (options.search && options.searchField) {
      switch (options.searchField) {
        case 'amountDue':
          query.where('amountDue').equals(options.search);
          break;
        case 'customer':
          query.where('customer').in(
            await this.customerService.findCustomerIdsByName(options.search)
          );
          break;
        case 'customer':
          query.where('customer').in(
            await this.customerService.findCustomerIdsByName(options.search)
          );
          break;
        case 'date':
          const searchDate = new Date(options.search);
          const startOfDay = new Date(searchDate).setUTCHours(0, 0, 0, 0);
          const endOfDay = new Date(searchDate).setUTCHours(23, 59, 59, 999);
          query.where('date').gte(startOfDay).lt(endOfDay);
          break;
        case 'dueDate':
          const searchDueDate = new Date(options.search);
          const startOfDueDay = new Date(searchDueDate).setUTCHours(0, 0, 0, 0);
          const endOfDueDay = new Date(searchDueDate).setUTCHours(23, 59, 59, 999);
          query.where('dueDate').gte(startOfDueDay).lt(endOfDueDay);
          break;
        default:
          break;
      }
    }
  
    // Apply sorting
    const sortOrder = options.sortOrder === 'desc' ? '-' : '';
    query.sort(`${sortOrder}${options.sortBy}`);
    query.sort(`createdAt`);
  
    // Apply pagination if limit is not null
    if (options.limit !== null) {
      query.limit(options.limit).skip(options.skip);
    }
  
    // Populate customer and company fields
    query.populate('customer').populate('company');
  
    const data = await query.exec();
    const total = await this.invoiceModel.countDocuments(query.getFilter()).exec();
  
    return {
      total,
      data
    };
  }

  async findOneById(req: Request, id: string): Promise<Invoice> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }

    const company = await this.getActiveCompanyOfCurrentUser(req);

    const invoice = await this.invoiceModel.findOne({
      _id: id,
      ...this.existsQuery,
      company,
    })
      .populate('customer')
      .populate('company')
      .populate({
        path: 'items.item', // Path to populate inside the items array
        model: 'Item' // Model name to populate
      })
      .exec();

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }

    // Populate lotNo for each lot
    for (const item of invoice.items) {
      for (const lot of item.lots) {
        const inventory = await this.inventoryModel.findById(new Types.ObjectId(lot.lotId)).exec();
        if (inventory) {
          lot.lotNo = inventory.lotNo; // Add lotNo to the lot
        }
      }
    }

    return invoice;
  }
  

  // Other service methods...

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
        throw new NotFoundException(`Select a company from settings.`);
      }
      return company;
    } catch (error) {
      throw new NotFoundException(`Select a company from settings.`);
    }
  }

  async updateInvoiceNumbers(): Promise<void> {
    const invoices = await this.invoiceModel.find().sort({ _id: 1 }).exec();
    let counter = 1;

    for (const invoice of invoices) {
      invoice.invoiceNumber = counter;
      await invoice.save();
      counter++;
    }
  }
}
