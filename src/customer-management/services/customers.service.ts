import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Customer, CustomerDocument } from '../schemas/customers.schema';
import { CreateCustomerDto } from '../dto/create-customer.dto';
import { UserSettingsService } from '../../user-management/services/user-settings.service';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { Request } from 'express';

@Injectable()
export class CustomerService {
  existsQuery: any = { deleted: false };

  constructor(
    @InjectModel(Customer.name) private customerModel: Model<CustomerDocument>,
    private userSettingsService: UserSettingsService,
    private readonly configService: ConfigService
  ) {}

  async create(req: Request, createCustomerDto: CreateCustomerDto): Promise<Customer> {
    const company = await this.getActiveCompanyOfCurrentUser(req);

    let customerExistConditions = null;
    if (createCustomerDto.name && createCustomerDto.nif) {
      customerExistConditions = { 
        name: createCustomerDto.name,
        nif: createCustomerDto.nif
      };
    }

    if (customerExistConditions && Object.keys(customerExistConditions).length) {
      const existingCustomer = await this.customerModel.findOne({
        ...customerExistConditions,
        ...this.existsQuery,  // Check active records only
        company
      });
  
      if (existingCustomer) {
        throw new ConflictException('A customer with the given name and nif already exists and is active.');
      }
    }

    const createdCustomer = new this.customerModel({...createCustomerDto, company});
    return createdCustomer.save();
  }

  async findAll(req: Request, options: any): Promise<{ total: number, data: any[] }> {
    const company = await this.getActiveCompanyOfCurrentUser(req);
    const query = this.customerModel.find({ ...this.existsQuery, company });

    // Apply search if provided
    if (options.search) {
      query.or([
        { name: { $regex: options.search, $options: 'i' } },
        { email: { $regex: options.search, $options: 'i' } },
        { phone: { $regex: options.search, $options: 'i' } },
        { cif: { $regex: options.search, $options: 'i' } },
        { nif: { $regex: options.search, $options: 'i' } },
        { address: { $regex: options.search, $options: 'i' } },
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
    const total = await this.customerModel.countDocuments(query.getFilter()).exec();

    return {
      total,
      data
    };
  }

  async findOne(req: Request, id: string): Promise<Customer> {
    const company = await this.getActiveCompanyOfCurrentUser(req);
    const existingCustomer = await this.customerModel.findOne({ _id: id, ...this.existsQuery, company }).exec();
    if (!existingCustomer) {
      throw new NotFoundException('Customer not found or has been deleted.');
    }
    return existingCustomer;
  }

  async update(req: Request, id: string, updateCustomerDto: CreateCustomerDto): Promise<Customer> {
    const company = await this.getActiveCompanyOfCurrentUser(req);

    let customerExistConditions = null;
    if (updateCustomerDto.name && updateCustomerDto.nif) {
      customerExistConditions = { 
        name: updateCustomerDto.name,
        nif: updateCustomerDto.nif
      };
    }

    if (customerExistConditions && Object.keys(customerExistConditions).length) {
      const existingCustomer = await this.customerModel.findOne({
        _id: { $ne: id },
        ...customerExistConditions,
        ...this.existsQuery,  // Check active records only
        company
      });
  
      if (existingCustomer) {
        throw new ConflictException('A customer with the given name and nif already exists and is active.');
      }
    }

    const existingCustomer = await this.customerModel.findOne({ _id: id, ...this.existsQuery, company }).exec();
    if (!existingCustomer) {
      throw new NotFoundException('Customer not found or has been deleted.');
    }

    return this.customerModel.findByIdAndUpdate(id, updateCustomerDto, { new: true }).exec();
  }

  async remove(req: Request, id: string): Promise<Customer> {
    const company = await this.getActiveCompanyOfCurrentUser(req);
    const existingCustomer = await this.customerModel.findOne({ _id: id, ...this.existsQuery, company }).exec();
    if (!existingCustomer) {
      throw new NotFoundException('Customer not found or has been deleted.');
    }

    return this.customerModel.findByIdAndRemove(id).exec();
  }

  async delete(req: Request, customerId: string): Promise<any> {
    const company = await this.getActiveCompanyOfCurrentUser(req);
    const existingCustomer = await this.customerModel.findOne({ _id: customerId, ...this.existsQuery, company }).exec();
    if (!existingCustomer) {
      throw new NotFoundException('Customer not found or has been deleted.');
    }

    return this.customerModel.findByIdAndUpdate(customerId, { deleted: true }).exec();
  }

  async findAllCustomers(req: Request): Promise<{ _id: string, name: string }[]> {
    const company = await this.getActiveCompanyOfCurrentUser(req);
    return this.customerModel.find({ ...this.existsQuery, company }).select('_id name image businessName cif nif').exec();
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
