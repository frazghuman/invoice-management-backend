import { Body, Controller, Delete, Get, Param, Post, Put, Query, SetMetadata, UseGuards, UsePipes } from '@nestjs/common';
import { CreateItemDto, UpdateItemDto } from '../dto/item.dto';
import { ItemService } from '../services/item.service';
import { Item, itemPriceValidationSchema } from '../schemas/item.schema';
import { JoiValidationPipe } from '@common/pipes/joi-validation.pipe';
import { PermissionAuthGuard } from '../../auth/permission-auth-guard';
import { ItemValidationSchema } from '../schemas/item.schema';

@Controller('items')
export class ItemController {
  constructor(private readonly itemService: ItemService) {}

  @Post()
  @UseGuards(PermissionAuthGuard)
  @SetMetadata('permissions', ['items-management'])
  @UsePipes(new JoiValidationPipe(ItemValidationSchema.create))
  async create(@Body() createItemDto: CreateItemDto): Promise<Item> {
    return this.itemService.create(createItemDto);
  }

  @Get()
  @UseGuards(PermissionAuthGuard)
  @SetMetadata('permissions', ['items-management'])
  async findAll(
    @Query('limit') limit: string,
    @Query('skip') skip: string,
    @Query('sortBy') sortBy: string = 'name',
    @Query('sortOrder') sortOrder: string = 'asc',
    @Query('search') search: string
  ): Promise<{ limit: number, skip: number, total: number, items: any[] }> {
    const options = {
      limit: limit ? parseInt(limit) : null,
      skip: parseInt(skip) || 0,
      sortBy,
      sortOrder,
      search
    };

    const result = await this.itemService.findAll(options);
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
  async findAllItems(): Promise<Item> {
    return this.itemService.findAllItems();
  }

  @Get(':id')
  @UseGuards(PermissionAuthGuard)
  @SetMetadata('permissions', ['items-management'])
  async findOne(@Param('id') id: string): Promise<Item> {
    return this.itemService.findOne(id);
  }

  @Put(':id')
  @UseGuards(PermissionAuthGuard)
  @SetMetadata('permissions', ['items-management'])
  @UsePipes(new JoiValidationPipe(ItemValidationSchema.update))
  async update(@Param('id') id: string, @Body() updateItemDto: UpdateItemDto): Promise<Item> {
    return this.itemService.update(id, updateItemDto);
  }

  @Delete(':id')
  @UseGuards(PermissionAuthGuard)
  @SetMetadata('permissions', ['items-management'])
  async remove(@Param('id') id: string): Promise<Item> {
    return this.itemService.delete(id);
  }

  @Post(':id/prices')
  @UseGuards(PermissionAuthGuard)
  @SetMetadata('permissions', ['items-management'])
  @UsePipes(new JoiValidationPipe(itemPriceValidationSchema))
  async addPrice(@Param('id') itemId: string, @Body() priceData: any): Promise<Item> {
    return this.itemService.addPriceToItem(itemId, priceData);
  }
}
