import { IsBoolean, IsDate, IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

// export class ReceiveStockInventoryDto {
//   @IsMongoId()
//   @IsNotEmpty()
//   itemId: string;

//   @IsNumber()
//   @IsNotEmpty()
//   lotNo: number; // No restriction on -1

//   @IsNumber()
//   @IsNotEmpty()
//   purchasePrice: number;

//   @IsNumber()
//   @IsNotEmpty()
//   totalStock: number;

//   @IsString()
//   @IsOptional()
//   description?: string;
// }

export class ReceiveStockInventoryDto {
  @IsMongoId()
  @IsNotEmpty()
  item: string; // MongoDB ObjectId as a string

  @IsNumber()
  @IsNotEmpty()
  lotNo: number;

  @IsNumber()
  @IsNotEmpty()
  purchasePrice: number;

  @IsNumber()
  @IsNotEmpty()
  totalStock: number;

  @IsDate()
  @IsNotEmpty()
  stockReceivedDate?: Date;

  @IsNumber()
  @IsOptional()
  soldOutStock?: number = 0;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  inUse?: boolean = false;

  @IsBoolean()
  @IsOptional()
  deleted?: boolean = false;
}

export class UpdateInventoryDto {
  @IsMongoId()
  @IsOptional()
  itemId?: string;

  @IsNumber()
  @IsNotEmpty()
  lotNo: number;

  @IsNumber()
  @IsOptional()
  purchasePrice?: number;

  @IsNumber()
  @IsOptional()
  totalStock?: number;

  @IsString()
  @IsOptional()
  description?: string;
}
