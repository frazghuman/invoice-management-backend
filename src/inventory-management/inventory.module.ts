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
import { Invoice, InvoiceSchema } from './schemas/invoice.schema';
import { InvoiceController } from './controllers/invoice.controller';
import { InvoiceService } from './services/invoice.service';
import { CustomerSearviceModule } from '../customer-management/customer-service.module';
import { Proposal, ProposalSchema } from './schemas/proposal.schema';
import { ProposalService } from './services/proposal.service';
import { ProposalController } from './controllers/proposal.controller';
import { SalesSummaryService } from './services/sales-summary.service';
// import { InventoryService } from './inventory.service';
// import { InventoryController } from './inventory.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Inventory.name, schema: InventorySchema },
      { name: Item.name, schema: ItemSchema },
      { name: Invoice.name, schema: InvoiceSchema },
      { name: Proposal.name, schema: ProposalSchema },
    ]),
    CustomerSearviceModule,
    UserServiceModule
  ],
  controllers: [
    ItemController,
    InventoryController,
    InvoiceController,
    ProposalController
  ],
  providers: [
    ItemService,
    InventoryService,
    InvoiceService,
    ProposalService,
    SalesSummaryService,
    ConfigService
  ],
  exports: [ItemService]
})
export class InventoryModule {}
