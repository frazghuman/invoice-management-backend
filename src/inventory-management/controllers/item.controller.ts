import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, SetMetadata, UseGuards, UsePipes } from '@nestjs/common';
import { CreateItemDto, UpdateItemDto } from '../dto/item.dto';
import { ItemService } from '../services/item.service';
import { Item, itemPriceValidationSchema } from '../schemas/item.schema';
import { JoiValidationPipe } from '@common/pipes/joi-validation.pipe';
import { PermissionAuthGuard } from '../../auth/permission-auth-guard';
import { ItemValidationSchema } from '../schemas/item.schema';
import { Request } from 'express';

@Controller('items')
export class ItemController {
  constructor(private readonly itemService: ItemService) {}

  @Post()
  @UseGuards(PermissionAuthGuard)
  @SetMetadata('permissions', ['items-management'])
  @UsePipes(new JoiValidationPipe(ItemValidationSchema.create))
  async create(@Body() createItemDto: CreateItemDto, @Req() req: Request): Promise<Item> {
    return this.itemService.create(req, createItemDto);
  }

  @Get()
  @UseGuards(PermissionAuthGuard)
  @SetMetadata('permissions', ['items-management'])
  async findAll(
    @Query('limit') limit: string,
    @Query('skip') skip: string,
    @Query('sortBy') sortBy: string = 'name',
    @Query('sortOrder') sortOrder: string = 'asc',
    @Query('search') search: string,
    @Req() req: Request
  ): Promise<{ limit: number, skip: number, total: number, items: any[] }> {
    const options = {
      limit: limit ? parseInt(limit) : null,
      skip: parseInt(skip) || 0,
      sortBy,
      sortOrder,
      search
    };

    const result = await this.itemService.findAll(req, options);
    return {
      limit: options.limit,
      skip: options.skip,
      total: result.total,
      items: result.data
    };
  }

  @Get('list')
  @UseGuards(PermissionAuthGuard)
  @SetMetadata('permissions', ['items-management'])
  async findAllItems(@Req() req: Request): Promise<Item> {
    return this.itemService.findAllItems(req);
  }

  @Get(':id')
  @UseGuards(PermissionAuthGuard)
  @SetMetadata('permissions', ['items-management'])
  async findOne(@Req() req: Request, @Param('id') id: string): Promise<Item> {
    return this.itemService.findOne(req, id);
  }

  @Put(':id')
  @UseGuards(PermissionAuthGuard)
  @SetMetadata('permissions', ['items-management'])
  @UsePipes(new JoiValidationPipe(ItemValidationSchema.update))
  async update(@Param('id') id: string, @Body() updateItemDto: UpdateItemDto, @Req() req: Request): Promise<Item> {
    return this.itemService.update(req, id, updateItemDto);
  }

  @Delete(':id')
  @UseGuards(PermissionAuthGuard)
  @SetMetadata('permissions', ['items-management'])
  async remove(@Param('id') id: string, @Req() req: Request): Promise<Item> {
    return this.itemService.delete(req, id);
  }

  @Post(':id/prices')
  @UseGuards(PermissionAuthGuard)
  @SetMetadata('permissions', ['items-management'])
  @UsePipes(new JoiValidationPipe(itemPriceValidationSchema))
  async addPrice(@Param('id') itemId: string, @Body() priceData: any, @Req() req: Request): Promise<Item> {
    return this.itemService.addPriceToItem(req, itemId, priceData);
  }
}
