// src/customers/customers.module.ts
import { Module } from '@nestjs/common';
import { CustomerController } from './controller/customers.controller';
import { CustomerSearviceModule } from './customer-service.module';
import { UserServiceModule } from '../user-management/services/user-service.module';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    CustomerSearviceModule,
    UserServiceModule
  ],
  providers: [ConfigService],
  controllers: [CustomerController]
})
export class CustomersModule {}
