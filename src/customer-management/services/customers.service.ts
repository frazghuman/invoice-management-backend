import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Customer, CustomerDocument } from '../schemas/customers.schema';
import { CreateCustomerDto } from '../dto/create-customer.dto';

@Injectable()
export class CustomerService {
  existsQuery: any = { deleted: false };

  constructor(@InjectModel(Customer.name) private customerModel: Model<CustomerDocument>) {}

  async create(createCustomerDto: CreateCustomerDto): Promise<Customer> {
    const existingCustomer = await this.customerModel.findOne({
      $or: [
        { name: createCustomerDto.name },  // Assuming name should be unique
        { cif: createCustomerDto.cif }   // Assuming cif should be unique
      ],
      deleted: false  // Ensure we only consider active records
    });

    if (existingCustomer) {
      throw new ConflictException('A customer with the given email or phone already exists and is active.');
    }

    const createdCustomer = new this.customerModel(createCustomerDto);
    return createdCustomer.save();
  }

  async findAll(options: any): Promise<{ total: number, data: any[] }> {
    const query = this.customerModel.find({ ...this.existsQuery });

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

  async findOne(id: string): Promise<Customer> {
    const existingCustomer = await this.customerModel.findOne({ _id: id, deleted: false }).exec();
    if (!existingCustomer) {
      throw new NotFoundException('Customer not found or has been deleted.');
    }
    return existingCustomer;
  }

  async update(id: string, updateCustomerDto: CreateCustomerDto): Promise<Customer> {
    const existingAlreadyCustomer = await this.customerModel.findOne({
        _id: { $ne: id },
        $or: [
          { name: updateCustomerDto.name },  // Assuming name should be unique
          { cif: updateCustomerDto.cif }   // Assuming cif should be unique
        ],
        deleted: false  // Ensure we only consider active records
      });
  
      if (existingAlreadyCustomer) {
        throw new ConflictException('A customer with the given email or phone already exists and is active.');
    }

    const existingCustomer = await this.customerModel.findOne({ _id: id, deleted: false }).exec();
    if (!existingCustomer) {
      throw new NotFoundException('Customer not found or has been deleted.');
    }

    return this.customerModel.findByIdAndUpdate(id, updateCustomerDto, { new: true }).exec();
  }

  async remove(id: string): Promise<Customer> {
    const existingCustomer = await this.customerModel.findOne({ _id: id, deleted: false }).exec();
    if (!existingCustomer) {
      throw new NotFoundException('Customer not found or has been deleted.');
    }

    return this.customerModel.findByIdAndRemove(id).exec();
  }

  async delete(customerId: string): Promise<any> {
    const existingCustomer = await this.customerModel.findOne({ _id: customerId, deleted: false }).exec();
    if (!existingCustomer) {
      throw new NotFoundException('Customer not found or has been deleted.');
    }

    return this.customerModel.findByIdAndUpdate(customerId, { deleted: true }).exec();
  }

  async findAllCustomers(): Promise<{ _id: string, name: string }[]> {
    return this.customerModel.find({ ...this.existsQuery }).select('_id name image businessName cif nif').exec();
  }
}
