import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Inventory, InventorySchema } from './schemas/inventory.schema';
import { Item, ItemSchema } from './schemas/item.schema';
import { ItemController } from './controllers/item.controller';
import { ItemService } from './services/item.service';
import { ConfigService } from '@nestjs/config';
import { InventoryController } from './controllers/inventory.controller';
import { InventoryService } from './services/inventory.service';
import { UserServiceModule } from '../user-management/services/user-service.module';
// import { InventoryService } from './inventory.service';
// import { InventoryController } from './inventory.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Inventory.name, schema: InventorySchema },
      { name: Item.name, schema: ItemSchema }
    ]),
    UserServiceModule
  ],
  controllers: [
    ItemController,
    InventoryController
  ],
  providers: [
    ItemService,
    InventoryService,
    ConfigService
  ],
  exports: [ItemService]
})
export class InventoryModule {}
