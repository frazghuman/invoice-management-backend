import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, SetMetadata, UseGuards, UsePipes } from '@nestjs/common';
import { CreateCustomerDto } from '../dto/create-customer.dto';
import { JoiValidationPipe } from '../../common/pipes/joi-validation.pipe';
import { PermissionAuthGuard } from '../../auth/permission-auth-guard';
import { Customer, customerValidationSchema } from '../schemas/customers.schema';
import { CustomerService } from '../services/customers.service';
import { Request } from 'express';

@Controller('customers')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Post()
  @UseGuards(PermissionAuthGuard)
  @SetMetadata('permissions', ['customers-management'])
  @UsePipes(new JoiValidationPipe(customerValidationSchema)) // Update or replace companyValidationSchema with customerValidationSchema if needed
  async create(@Req() req: Request, @Body() createCustomerDto: CreateCustomerDto): Promise<Customer> {
    return this.customerService.create(req, createCustomerDto);
  }

  @Get()
  @UseGuards(PermissionAuthGuard)
  @SetMetadata('permissions', ['customers-management']) // Set required permissions for this route
  async findAll(
    @Query('limit') limit: string,
    @Query('skip') skip: string,
    @Query('sortBy') sortBy: string = 'name', // Default sortBy to 'name'
    @Query('sortOrder') sortOrder: string = 'asc', // Default sortOrder to 'asc'
    @Query('search') search: string,
    @Req() req: Request
  ): Promise<{ limit: number, skip: number, total: number, customers: any[] }> {
    const options = {
      limit: limit ? parseInt(limit) : null, // Return all records if no limit is provided
      skip: parseInt(skip) || 0,
      sortBy,
      sortOrder,
      search
    };

    const result = await this.customerService.findAll(req, options);
    return {
      limit: options.limit,
      skip: options.skip,
      total: result.total,
      customers: result.data
    };
  }

  @Get('list')
  @UseGuards(PermissionAuthGuard)
  @SetMetadata('permissions', ['customers-management'])
  async findAllCustomers(@Req() req: Request) {
    const customers = await this.customerService.findAllCustomers(req);
    return customers;
  }

  @Get(':id')
  @UseGuards(PermissionAuthGuard)
  @SetMetadata('permissions', ['customers-management'])
  // @UsePipes(new JoiValidationPipe(customerValidationSchema)) // Uncomment and adjust the schema as necessary
  async findOne(@Req() req: Request, @Param('id') id: string): Promise<Customer> {
    return this.customerService.findOne(req, id);
  }

  @Put(':id')
  @UseGuards(PermissionAuthGuard)
  @SetMetadata('permissions', ['customers-management'])
  // @UsePipes(new JoiValidationPipe(customerValidationSchema)) // Uncomment and adjust the schema as necessary
  async update(@Req() req: Request, @Param('id') id: string, @Body() updateCustomerDto: CreateCustomerDto): Promise<Customer> {
    return this.customerService.update(req, id, updateCustomerDto);
  }

  @Delete(':id')
  @UseGuards(PermissionAuthGuard)
  @SetMetadata('permissions', ['customers-management'])
  @UsePipes(new JoiValidationPipe(customerValidationSchema)) // Uncomment and adjust the schema as necessary
  async remove(@Req() req: Request, @Param('id') id: string): Promise<Customer> {
    return this.customerService.delete(req, id);
  }
}
