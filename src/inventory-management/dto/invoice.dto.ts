import { IsNotEmpty, IsString, IsDate, ValidateNested, IsArray, IsNumber, IsOptional, IsBoolean, IsDateString } from 'class-validator';
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

  @IsOptional()
  @IsNumber()
  pendingPayment?: number;
}

class LotDto {
  @IsString()
  lotId: string;

  @IsNumber()
  quantity: number;
}

class ItemDto {
  @IsString()
  item: string;

  @IsNumber()
  price: number;

  @IsNumber()
  quantity: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LotDto)
  lots: LotDto[];
}

class CustomerDto {
  @IsString()
  _id: string;

  @IsString()
  name: string;

  @IsString()
  email: string;

  @IsString()
  phone: string;

  @IsString()
  businessName: string;

  @IsString()
  cif: string;

  @IsString()
  nif: string;

  @IsString()
  address: string;

  @IsString()
  additionalInformation: string;

  @IsString()
  image: string;

  @IsString()
  company: string;

  @IsBoolean()
  deleted: boolean;

  @IsDateString()
  createdAt: Date;

  @IsDateString()
  updatedAt: Date;
}

class CompanyDto {
  @IsString()
  _id: string;

  @IsString()
  name: string;

  @IsString()
  email: string;

  @IsString()
  phone: string;

  @IsString()
  businessNo: string;

  @IsString()
  address: string;

  @IsString()
  cif: string;

  @IsString()
  logo: string;

  @IsBoolean()
  deleted: boolean;

  @IsDateString()
  createdAt: Date;

  @IsDateString()
  updatedAt: Date;
}

export class UpdateInvoiceDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => CustomerDto)
  customer?: CustomerDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => CompanyDto)
  company?: CompanyDto;

  @IsOptional()
  @IsDateString()
  date?: Date;

  @IsOptional()
  @IsDateString()
  dueDate?: Date;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemDto)
  items: ItemDto[];

  @IsOptional()
  @IsNumber()
  discount?: number;

  @IsOptional()
  @IsNumber()
  shippingCharges?: number;

  @IsOptional()
  @IsNumber()
  amountDue?: number;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsBoolean()
  isBill?: boolean;

  @IsOptional()
  @IsBoolean()
  isPaid?: boolean;

  @IsOptional()
  @IsBoolean()
  isSent?: boolean;

  @IsOptional()
  @IsNumber()
  invoiceNumber?: number;

  @IsOptional()
  @IsBoolean()
  deleted?: boolean;

  @IsDateString()
  @IsOptional()
  updatedAt?: Date;

  @IsOptional()
  @IsNumber()
  pendingPayment?: number;
}