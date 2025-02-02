import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CompanyModule } from './company-management/company.module';
import { DatabaseModule } from './config/database.module';
import { FileManagementModule } from './file-management/file-management.module';
import { TodoModule } from './todo/todo.module';
import { UserManagementModule } from './user-management/user-management.module';
import { CorsMiddleware } from './middlewares/cors.middleware';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { CustomersModule } from './customer-management/customer.module';
import { InventoryModule } from './inventory-management/inventory.module';
import { ExpenseModule } from './expense-management/expense.module';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    DatabaseModule.register(),
    TodoModule,
    FileManagementModule,
    UserManagementModule,
    CompanyModule,
    CustomersModule,
    InventoryModule,
    ExpenseModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/files/',
    }),
  ],
  controllers: [
    AppController
  ],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    ConfigService
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorsMiddleware).forRoutes('*'); // Apply the middleware to all routes
  }
}
