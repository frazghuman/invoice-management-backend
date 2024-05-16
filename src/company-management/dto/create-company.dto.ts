import { IsNotEmpty, IsString, IsOptional, IsEmail } from 'class-validator';

export class ContactPersonDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  designation: string;

  @IsNotEmpty()
  @IsString()
  email: string;

  @IsNotEmpty()
  @IsString()
  phoneNo: string;
}

export class CreateCompanyDto {
  @IsString()
  @IsOptional() // Make optional if not required for creation
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  phone: string;

  @IsString()
  @IsOptional()
  businessNo?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  cif?: string;

  @IsString()
  @IsOptional()
  logo?: string; // Assuming the logo is a URL and optional
}

