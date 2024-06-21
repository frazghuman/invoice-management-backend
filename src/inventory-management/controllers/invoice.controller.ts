import { Controller, Post, Body, UseGuards, SetMetadata, UsePipes, Req, Get, Query, Param, Put } from '@nestjs/common';
import { InvoiceService } from '../services/invoice.service';
import { CreateInvoiceDto } from '../dto/invoice.dto';
import { PermissionAuthGuard } from '../../auth/permission-auth-guard';
import { JoiValidationPipe } from '@common/pipes/joi-validation.pipe';
import { Invoice, InvoiceValidationSchema } from '../schemas/invoice.schema';
import { Request } from 'express';

@Controller('invoices')
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  @Post()
  @UseGuards(PermissionAuthGuard)
  @SetMetadata('permissions', ['invoices-management'])
  @UsePipes(new JoiValidationPipe(InvoiceValidationSchema.create))
  async create(@Req() req: Request, @Body() createInvoiceDto: CreateInvoiceDto) {
    return this.invoiceService.create(req, createInvoiceDto);
  }
  
  @Put(':id')
  @UseGuards(PermissionAuthGuard)
  @SetMetadata('permissions', ['invoices-management'])
  @UsePipes(new JoiValidationPipe(InvoiceValidationSchema.update))
  async update(@Req() req: Request, @Param('id') id: string, @Body() updateInvoiceDto: CreateInvoiceDto): Promise<Invoice> {
    return this.invoiceService.update(req, id, updateInvoiceDto);
  }

  @Get()
  @UseGuards(PermissionAuthGuard)
  @SetMetadata('permissions', ['items-management'])
  async findAll(
    @Query('limit') limit: string,
    @Query('skip') skip: string,
    @Query('sortBy') sortBy: string = 'createdAt',
    @Query('sortOrder') sortOrder: string = 'desc',
    @Query('search') search: string,
    @Query('searchField') searchField: string,
    @Req() req: Request
  ): Promise<{ limit: number, skip: number, total: number, invoices: any[] }> {
    const options = {
      limit: limit ? parseInt(limit) : null,
      skip: parseInt(skip) || 0,
      sortBy,
      sortOrder,
      search,
      searchField
    };

    const result = await this.invoiceService.findAll(req, options);
    return {
      limit: options.limit,
      skip: options.skip,
      total: result.total,
      invoices: result.data
    };
  }

  @Get(':id')
  @UseGuards(PermissionAuthGuard)
  @SetMetadata('permissions', ['invoices-management'])
  async findOne(@Req() req: Request, @Param('id') id: string): Promise<Invoice> {
    return this.invoiceService.findOneById(req, id);
  }

  // Other controller methods...

  @Post('update-invoice-numbers')
  @UseGuards(PermissionAuthGuard)
  @SetMetadata('permissions', ['manage-companies'])
  async updateInvoiceNumbers(): Promise<{ message: string }> {
    try {
      await this.invoiceService.updateInvoiceNumbers();
      return { message: 'Invoice numbers updated successfully' };
      
    } catch (error) {
      return { message: JSON.stringify(error) };
    }
  }
}