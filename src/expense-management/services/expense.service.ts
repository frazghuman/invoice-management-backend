import {
    ConflictException,
    Injectable,
    NotFoundException,
  } from '@nestjs/common';
  import { InjectModel } from '@nestjs/mongoose';
  import { Model } from 'mongoose';
  import { Expense, ExpenseDocument } from '../schemas/expense.schema';
  import { CreateExpenseDto, UpdateExpenseDto } from '../dto/expense.dto';
  
  @Injectable()
  export class ExpenseService {
    existsQuery: any = { deleted: false };
  
    constructor(
      @InjectModel(Expense.name) private expenseModel: Model<ExpenseDocument>,
    ) {}
  
    async create(createExpenseDto: CreateExpenseDto): Promise<Expense> {
      const createdExpense = new this.expenseModel(createExpenseDto);
      return createdExpense.save();
    }
  
    async findAll(options: any): Promise<{ total: number; data: Expense[] }> {
      const query = this.expenseModel.find({ ...this.existsQuery });
  
      // Apply search if provided
      if (options.search) {
        query.or([
          { category: { $regex: options.search, $options: 'i' } },
          { description: { $regex: options.search, $options: 'i' } },
          { vendor: { $regex: options.search, $options: 'i' } },
        ]);
      }
  
      // Apply sorting
      const sortOrder = options.sortOrder === 'desc' ? '-' : '';
      query.sort(`${sortOrder}${options.sortBy || 'date'}`);
  
      // Apply pagination
      if (options.limit !== null) {
        query.limit(options.limit).skip(options.skip);
      }
  
      const data = await query.exec();
      const total = await this.expenseModel.countDocuments(query.getFilter()).exec();
  
      return { total, data };
    }
  
    async findOne(id: string): Promise<Expense> {
      const existingExpense = await this.expenseModel
        .findOne({ _id: id, ...this.existsQuery })
        .exec();
      if (!existingExpense) {
        throw new NotFoundException('Expense not found or has been deleted.');
      }
      return existingExpense;
    }
  
    async update(
      id: string,
      updateExpenseDto: UpdateExpenseDto,
    ): Promise<Expense> {
      const existingExpense = await this.expenseModel
        .findOne({ _id: id, ...this.existsQuery })
        .exec();
  
      if (!existingExpense) {
        throw new NotFoundException('Expense not found or has been deleted.');
      }
  
      return this.expenseModel.findByIdAndUpdate(id, updateExpenseDto, {
        new: true,
      }).exec();
    }
  
    async delete(id: string): Promise<Expense> {
      const existingExpense = await this.expenseModel
        .findOne({ _id: id, ...this.existsQuery })
        .exec();
  
      if (!existingExpense) {
        throw new NotFoundException('Expense not found or has been deleted.');
      }
  
      return this.expenseModel.findByIdAndUpdate(
        id,
        { deleted: true },
        { new: true },
      ).exec();
    }
  }
  