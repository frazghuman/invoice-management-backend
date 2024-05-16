import { IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class ReceiveStockInventoryDto {
  @IsMongoId()
  @IsNotEmpty()
  itemId: string;

  @IsNumber()
  @IsNotEmpty()
  lotNo: number;

  @IsNumber()
  @IsNotEmpty()
  purchasePrice: number;

  @IsNumber()
  @IsNotEmpty()
  totalStock: number;

  @IsString()
  @IsOptional()
  description?: string;
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
