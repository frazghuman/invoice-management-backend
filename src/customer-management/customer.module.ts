// src/customers/customers.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CustomerController } from './controller/customers.controller';
import { CustomerService } from './services/customers.service';
import { Customer, CustomerSchema } from './schemas/customers.schema';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Customer.name, schema: CustomerSchema }]),
  ],
  controllers: [CustomerController],
  providers: [CustomerService, ConfigService],
  exports: [CustomerService]
})
export class CustomersModule {}
