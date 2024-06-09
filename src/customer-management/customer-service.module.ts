// src/customers/customers.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CustomerService } from './services/customers.service';
import { Customer, CustomerSchema } from './schemas/customers.schema';
import { UserServiceModule } from '../user-management/services/user-service.module';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Customer.name, schema: CustomerSchema }]),
    UserServiceModule
  ],
  controllers: [],
  providers: [CustomerService],
  exports: [CustomerService]
})
export class CustomerSearviceModule {}
