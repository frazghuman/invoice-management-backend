import { Controller, Post, Body, UseGuards, SetMetadata, UsePipes, Req, Get, Query, Param, Put } from '@nestjs/common';
import { ProposalService } from '../services/proposal.service';
import { CreateProposalDto } from '../dto/proposal.dto';
import { PermissionAuthGuard } from '../../auth/permission-auth-guard';
import { JoiValidationPipe } from '@common/pipes/joi-validation.pipe';
import { Proposal, ProposalValidationSchema } from '../schemas/proposal.schema';
import { Request } from 'express';

@Controller('proposals')
export class ProposalController {
  constructor(private readonly proposalService: ProposalService) {}

  @Post()
  @UseGuards(PermissionAuthGuard)
  @SetMetadata('permissions', ['proposals-management'])
  @UsePipes(new JoiValidationPipe(ProposalValidationSchema.create))
  async create(@Req() req: Request, @Body() createProposalDto: CreateProposalDto) {
    return this.proposalService.create(req, createProposalDto);
  }
  
  @Put(':id')
  @UseGuards(PermissionAuthGuard)
  @SetMetadata('permissions', ['proposals-management'])
  @UsePipes(new JoiValidationPipe(ProposalValidationSchema.update))
  async update(@Req() req: Request, @Param('id') id: string, @Body() updateProposalDto: CreateProposalDto): Promise<Proposal> {
    return this.proposalService.update(req, id, updateProposalDto);
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
  ): Promise<{ limit: number, skip: number, total: number, proposals: any[] }> {
    const options = {
      limit: limit ? parseInt(limit) : null,
      skip: parseInt(skip) || 0,
      sortBy,
      sortOrder,
      search,
      searchField
    };

    const result = await this.proposalService.findAll(req, options);
    return {
      limit: options.limit,
      skip: options.skip,
      total: result.total,
      proposals: result.data
    };
  }

  @Get(':id')
  @UseGuards(PermissionAuthGuard)
  @SetMetadata('permissions', ['proposals-management'])
  async findOne(@Req() req: Request, @Param('id') id: string): Promise<Proposal> {
    return this.proposalService.findOneById(req, id);
  }

  // Other controller methods...
}