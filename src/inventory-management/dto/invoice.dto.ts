import { IsNotEmpty, IsString, IsDate, ValidateNested, IsArray, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { Types } from 'mongoose';

class CreateInvoiceItemDto {
  @IsNotEmpty()
  @IsString()
  item: Types.ObjectId;

  @IsNotEmpty()
  @IsNumber()
  price: number;

  @IsNotEmpty()
  @IsNumber()
  quantity: number;

  @IsOptional()
  @IsArray()
  lots?: { lotId: Types.ObjectId; quantity: number }[];
}

export class CreateInvoiceDto {
  @IsNotEmpty()
  @IsString()
  customer: Types.ObjectId;

  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  date: Date;

  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  dueDate: Date;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInvoiceItemDto)
  items: CreateInvoiceItemDto[];

  @IsOptional()
  @IsNumber()
  discount?: number;

  @IsOptional()
  @IsNumber()
  shippingCharges?: number;

  @IsNotEmpty()
  @IsNumber()
  amountDue: number;

  @IsOptional()
  @IsString()
  note?: string;
}
