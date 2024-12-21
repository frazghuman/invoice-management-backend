import {
    IsString,
    IsNumber,
    IsDate,
    IsOptional,
    IsBoolean,
    IsUUID,
    IsArray,
    IsPositive,
    MinLength,
  } from 'class-validator';
  import { Type } from 'class-transformer';
  
  export class CreateExpenseDto {
    @IsString()
    expense_id: string; // Unique identifier for the expense
  
    @IsDate()
    @Type(() => Date) // Ensures the date is parsed correctly
    date: Date; // Date of the expense
  
    @IsNumber()
    @IsPositive()
    amount: number; // Monetary value of the expense
  
    @IsString()
    @MinLength(1)
    category: string; // Category of the expense (e.g., Food, Transport)
  
    @IsString()
    @MinLength(1)
    payment_method: string; // Payment method used (e.g., Cash, Credit Card)
  
    @IsString()
    @IsOptional()
    description?: string; // Optional description or note for the expense
  
    @IsString()
    @IsOptional()
    vendor?: string; // Vendor associated with the expense
  
    @IsUUID()
    user_id: string; // Identifier for the user who recorded the expense
  
    @IsBoolean()
    @IsOptional()
    is_recurring?: boolean; // Indicates if the expense is recurring
  
    @IsString()
    @MinLength(1)
    currency: string; // Currency in which the expense was made
  
    @IsString()
    @IsOptional()
    receipt?: string; // Optional file path or URL for the receipt
  
    @IsString()
    @IsOptional()
    project_id?: string; // Optional link to a project or cost center
  
    @IsNumber()
    @IsPositive()
    @IsOptional()
    tax_amount?: number; // Portion of the expense that is tax-related
  
    @IsString()
    @IsOptional()
    status?: string; // Status of the expense (e.g., Pending, Approved, Reimbursed)
  
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    tags?: string[]; // Tags for additional categorization
  }
  
  export class UpdateExpenseDto {
    @IsString()
    @IsOptional()
    expense_id?: string; // Unique identifier for the expense
  
    @IsDate()
    @Type(() => Date)
    @IsOptional()
    date?: Date; // Date of the expense
  
    @IsNumber()
    @IsPositive()
    @IsOptional()
    amount?: number; // Monetary value of the expense
  
    @IsString()
    @MinLength(1)
    @IsOptional()
    category?: string; // Category of the expense
  
    @IsString()
    @MinLength(1)
    @IsOptional()
    payment_method?: string; // Payment method used
  
    @IsString()
    @IsOptional()
    description?: string; // Optional description
  
    @IsString()
    @IsOptional()
    vendor?: string; // Vendor associated with the expense
  
    @IsUUID()
    @IsOptional()
    user_id?: string; // Identifier for the user
  
    @IsBoolean()
    @IsOptional()
    is_recurring?: boolean; // Indicates if the expense is recurring
  
    @IsString()
    @MinLength(1)
    @IsOptional()
    currency?: string; // Currency of the expense
  
    @IsString()
    @IsOptional()
    receipt?: string; // File path or URL for the receipt
  
    @IsString()
    @IsOptional()
    project_id?: string; // Link to a project or cost center
  
    @IsNumber()
    @IsPositive()
    @IsOptional()
    tax_amount?: number; // Tax-related portion
  
    @IsString()
    @IsOptional()
    status?: string; // Status of the expense
  
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    tags?: string[]; // Tags for additional categorization
  }
  