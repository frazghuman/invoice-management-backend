import { Module } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { JoiValidationPipe } from './joi-validation.pipe';
import { ParseObjectIdPipe } from './parse-object-id.pipe';

@Module({
  imports: [
  ],
  controllers: [
  ],
  providers: [
    {
      provide: APP_PIPE,
      useClass: JoiValidationPipe,
    },
    {
      provide: APP_PIPE,
      useClass: ParseObjectIdPipe
    }
  ],
})
export class PipeModule {}
