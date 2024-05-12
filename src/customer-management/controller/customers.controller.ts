import { Body, Controller, Delete, Get, Param, Post, Put, Query, SetMetadata, UseGuards, UsePipes } from '@nestjs/common';
import { CreateCustomerDto } from '../dto/create-customer.dto';
import { JoiValidationPipe } from '../../common/pipes/joi-validation.pipe';
import { PermissionAuthGuard } from '../../auth/permission-auth-guard';
import { Customer, customerValidationSchema } from '../schemas/customers.schema';
import { CustomerService } from '../services/customers.service';

@Controller('customers')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Post()
  @UseGuards(PermissionAuthGuard)
  @SetMetadata('permissions', ['customers-management'])
  @UsePipes(new JoiValidationPipe(customerValidationSchema)) // Update or replace companyValidationSchema with customerValidationSchema if needed
  async create(@Body() createCustomerDto: CreateCustomerDto): Promise<Customer> {
    return this.customerService.create(createCustomerDto);
  }

  @Get()
  @UseGuards(PermissionAuthGuard)
  @SetMetadata('permissions', ['customers-management']) // Set required permissions for this route
  async findAll(
    @Query('limit') limit: string,
    @Query('skip') skip: string,
    @Query('sortBy') sortBy: string = 'name', // Default sortBy to 'name'
    @Query('sortOrder') sortOrder: string = 'asc', // Default sortOrder to 'asc'
    @Query('search') search: string
  ): Promise<{ limit: number, skip: number, total: number, customers: any[] }> {
    const options = {
      limit: limit ? parseInt(limit) : null, // Return all records if no limit is provided
      skip: parseInt(skip) || 0,
      sortBy,
      sortOrder,
      search
    };

    const result = await this.customerService.findAll(options);
    return {
      limit: options.limit,
      skip: options.skip,
      total: result.total,
      customers: result.data
    };
  }

  @Get(':id')
  @SetMetadata('permissions', ['customers-management'])
  @UsePipes(new JoiValidationPipe(customerValidationSchema)) // Uncomment and adjust the schema as necessary
  async findOne(@Param('id') id: string): Promise<Customer> {
    return this.customerService.findOne(id);
  }

  @Put(':id')
  @UseGuards(PermissionAuthGuard)
  @SetMetadata('permissions', ['customers-management'])
  @UsePipes(new JoiValidationPipe(customerValidationSchema)) // Uncomment and adjust the schema as necessary
  async update(@Param('id') id: string, @Body() updateCustomerDto: CreateCustomerDto): Promise<Customer> {
    return this.customerService.update(id, updateCustomerDto);
  }

  @Delete(':id')
  @SetMetadata('permissions', ['customers-management'])
  @UsePipes(new JoiValidationPipe(customerValidationSchema)) // Uncomment and adjust the schema as necessary
  async remove(@Param('id') id: string): Promise<Customer> {
    return this.customerService.delete(id);
  }
}
