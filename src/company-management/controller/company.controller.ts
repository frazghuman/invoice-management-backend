import { Body, Controller, Delete, Get, Param, Post, Put, Query, SetMetadata, UseGuards, UsePipes } from '@nestjs/common';
import { Company, companyValidationSchema } from '../schemas/company.schema';
import { CreateCompanyDto } from '../dto/create-company.dto';
import { CompanyService } from '../services/company.service';
import { JoiValidationPipe } from '../../common/pipes/joi-validation.pipe';
import { PermissionAuthGuard } from '../../auth/permission-auth-guard';


@Controller('companies')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Post()
  @UseGuards(PermissionAuthGuard)
  @SetMetadata('permissions', ['manage-companies'])
  @UsePipes(new JoiValidationPipe(companyValidationSchema))
  async create(@Body() createCompanyDto: CreateCompanyDto): Promise<Company> {
    return this.companyService.create(createCompanyDto);
  }

  @Get()
  @UseGuards(PermissionAuthGuard)
  @SetMetadata('permissions', ['read-companies']) // Set required permissions for this route
  async findAll(
    @Query('limit') limit: string,
    @Query('skip') skip: string,
    @Query('sortBy') sortBy: string = 'name', // Default sortBy to 'name'
    @Query('sortOrder') sortOrder: string = 'asc', // Default sortOrder to 'asc'
    @Query('search') search: string
  ): Promise<{ limit: number, skip: number, total: number, companies: any[] }> {
    const options = {
      limit: limit ? parseInt(limit) : null, // Return all records if no limit is provided
      skip: parseInt(skip) || 0,
      sortBy,
      sortOrder,
      search
    };

    const result = await this.companyService.findAll(options);
    return {
      limit: options.limit,
      skip: options.skip,
      total: result.total,
      companies: result.data
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Company> {
    return this.companyService.findOne(id);
  }

  @Put(':id')
  @UseGuards(PermissionAuthGuard)
  @SetMetadata('permissions', ['manage-companies'])
  // @UsePipes(new JoiValidationPipe(companyValidationSchema))
  async update(@Param('id') id: string, @Body() updateCompanyDto: CreateCompanyDto): Promise<Company> {
    return this.companyService.update(id, updateCompanyDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<Company> {
    return this.companyService.delete(id);
  }
}
