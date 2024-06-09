import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Proposal, ProposalDocument } from '../schemas/proposal.schema';
import { CreateProposalDto } from '../dto/proposal.dto';
import { UserSettingsService } from '../../user-management/services/user-settings.service';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { Request } from 'express';
import { CustomerService } from '../../customer-management/services/customers.service';

@Injectable()
export class ProposalService {
  private existsQuery = { deleted: false };
  constructor(
    @InjectModel(Proposal.name) private proposalModel: Model<ProposalDocument>,
    private userSettingsService: UserSettingsService,
    private customerService: CustomerService,
    private readonly configService: ConfigService
  ) {}

  async create(req: Request, createProposalDto: CreateProposalDto): Promise<Proposal> {
    const company = await this.getActiveCompanyOfCurrentUser(req);
    const createdProposal = new this.proposalModel({...createProposalDto, company});
    return createdProposal.save();
  }

  async update(req: Request, id: string, updateProposalDto: CreateProposalDto): Promise<Proposal> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Proposal with ID ${id} not found`);
    }

    const company = await this.getActiveCompanyOfCurrentUser(req);

    const proposal = await this.proposalModel.findOne({
      _id: id,
      ...this.existsQuery,
      company,
    });

    if (!proposal) {
      throw new NotFoundException(`Proposal with ID ${id} not found`);
    }

    Object.assign(proposal, updateProposalDto);
    return proposal.save();
  }

  async findAll(req: Request, options: any): Promise<{ total: number, data: any[] }> {
    const company = await this.getActiveCompanyOfCurrentUser(req);
    const query = this.proposalModel.find({ ...this.existsQuery, company });
  
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
    const total = await this.proposalModel.countDocuments(query.getFilter()).exec();
  
    return {
      total,
      data
    };
  }

  async findOneById(req: Request, id: string): Promise<Proposal> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Proposal with ID ${id} not found`);
    }

    const company = await this.getActiveCompanyOfCurrentUser(req);

    const proposal = await this.proposalModel.findOne({
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

    if (!proposal) {
      throw new NotFoundException(`Proposal with ID ${id} not found`);
    }
    return proposal;
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
}
