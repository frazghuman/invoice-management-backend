import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Company, CompanyDocument } from '../schemas/company.schema';
import { CreateCompanyDto } from '../dto/create-company.dto';

@Injectable()
export class CompanyService {
  existsQuery: any = { deleted: false };
  constructor(@InjectModel(Company.name) private companyModel: Model<CompanyDocument>) {}

  async create(createCompanyDto: CreateCompanyDto): Promise<Company> {
    const createdCompany = new this.companyModel(createCompanyDto);
    return createdCompany.save();
  }

  async findAll(options: any): Promise<{ total: number, data: any[] }> {
    const query = this.companyModel.find({...this.existsQuery});

    // Apply search if provided
    if (options.search) {
      query.or([
        { name: { $regex: options.search, $options: 'i' } },
        { email: { $regex: options.search, $options: 'i' } }
      ]);
    }

    // Apply sorting
    const sortOrder = options.sortOrder === 'desc' ? '-' : '';
    query.sort(`${sortOrder}${options.sortBy}`);

    // Apply pagination if limit is not null
    if (options.limit !== null) {
      query.limit(options.limit).skip(options.skip);
    }

    const data = await query.exec();
    const total = await this.companyModel.countDocuments(query.getFilter()).exec();

    return {
      total,
      data
    };
  }

  async findOne(id: string): Promise<Company> {
    // First check if the company exists and is not deleted
    const existingCompany = await this.companyModel.findOne({ _id: id, deleted: false }).exec();
    if (!existingCompany) {
      throw new NotFoundException('Company not found or has been deleted.');
    }

    // Perform the update if the company is not marked as deleted
    return this.companyModel.findById(id).exec();
  }

  async update(id: string, updateCompanyDto: CreateCompanyDto): Promise<Company> {
    // First check if the company exists and is not deleted
    const existingCompany = await this.companyModel.findOne({ _id: id, deleted: false }).exec();
    if (!existingCompany) {
      throw new NotFoundException('Company not found or has been deleted.');
    }

    // Perform the update if the company is not marked as deleted
    return this.companyModel.findByIdAndUpdate(id, updateCompanyDto, { new: true }).exec();
  }

  async remove(id: string): Promise<Company> {
    // First check if the company exists and is not deleted
    const existingCompany = await this.companyModel.findOne({ _id: id, deleted: false }).exec();
    if (!existingCompany) {
      throw new NotFoundException('Company not found or has been deleted.');
    }

    // Perform the update if the company is not marked as deleted
    return this.companyModel.findByIdAndRemove(id).exec();
  }

  async delete(companyId: string): Promise<any> {
    // First check if the company exists and is not deleted
    const existingCompany = await this.companyModel.findOne({ _id: companyId, deleted: false }).exec();
    if (!existingCompany) {
      throw new NotFoundException('Company not found or has been deleted.');
    }

    // Perform the update if the company is not marked as deleted
    return this.companyModel.findByIdAndUpdate(companyId, { deleted: true }).exec();
  }
}
