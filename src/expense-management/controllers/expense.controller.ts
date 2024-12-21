import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Post,
    Put,
    Query,
    SetMetadata,
    UseGuards,
    UsePipes,
  } from '@nestjs/common';
  import { ExpenseService } from '../services/expense.service';
  import { CreateExpenseDto, UpdateExpenseDto } from '../dto/expense.dto';
  import { ExpenseValidationSchema } from '../schemas/expense.schema';
  import { JoiValidationPipe } from '@common/pipes/joi-validation.pipe';
  import { PermissionAuthGuard } from '../../auth/permission-auth-guard';
  import { Expense } from '../schemas/expense.schema';
  
  @Controller('expenses')
  export class ExpenseController {
    constructor(private readonly expenseService: ExpenseService) {}
  
    @Post()
    @UseGuards(PermissionAuthGuard)
    @SetMetadata('permissions', ['expenses-management'])
    @UsePipes(new JoiValidationPipe(ExpenseValidationSchema.create))
    async create(@Body() createExpenseDto: CreateExpenseDto): Promise<Expense> {
      return this.expenseService.create(createExpenseDto);
    }
  
    @Get()
    @UseGuards(PermissionAuthGuard)
    @SetMetadata('permissions', ['expenses-management'])
    async findAll(
      @Query('limit') limit: string,
      @Query('skip') skip: string,
      @Query('sortBy') sortBy: string = 'date',
      @Query('sortOrder') sortOrder: string = 'asc',
      @Query('search') search: string,
    ): Promise<{ limit: number; skip: number; total: number; expenses: Expense[] }> {
      const options = {
        limit: limit ? parseInt(limit) : null,
        skip: parseInt(skip) || 0,
        sortBy,
        sortOrder,
        search,
      };
  
      const result = await this.expenseService.findAll(options);
      return {
        limit: options.limit,
        skip: options.skip,
        total: result.total,
        expenses: result.data,
      };
    }
  
    @Get(':id')
    @UseGuards(PermissionAuthGuard)
    @SetMetadata('permissions', ['expenses-management'])
    async findOne(@Param('id') id: string): Promise<Expense> {
      return this.expenseService.findOne(id);
    }
  
    @Put(':id')
    @UseGuards(PermissionAuthGuard)
    @SetMetadata('permissions', ['expenses-management'])
    @UsePipes(new JoiValidationPipe(ExpenseValidationSchema.update))
    async update(
      @Param('id') id: string,
      @Body() updateExpenseDto: UpdateExpenseDto,
    ): Promise<Expense> {
      return this.expenseService.update(id, updateExpenseDto);
    }
  
    @Delete(':id')
    @UseGuards(PermissionAuthGuard)
    @SetMetadata('permissions', ['expenses-management'])
    async remove(@Param('id') id: string): Promise<Expense> {
      return this.expenseService.delete(id);
    }
  }
  