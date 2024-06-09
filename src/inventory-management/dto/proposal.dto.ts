import { IsNotEmpty, IsString, IsDate, ValidateNested, IsArray, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { Types } from 'mongoose';

class CreateProposalItemDto {
  @IsNotEmpty()
  @IsString()
  item: Types.ObjectId;

  @IsNotEmpty()
  @IsNumber()
  price: number;

  @IsNotEmpty()
  @IsNumber()
  quantity: number;
}

export class CreateProposalDto {
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
  @Type(() => CreateProposalItemDto)
  items: CreateProposalItemDto[];

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
