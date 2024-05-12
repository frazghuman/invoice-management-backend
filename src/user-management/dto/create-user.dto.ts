import { IsEmail, IsNotEmpty, IsOptional, IsString, Length, IsPhoneNumber, IsArray, ValidateNested, ArrayNotEmpty, IsMongoId } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsEmail()
  role: string;

  @IsOptional()
  @Length(6, 128)
  password: string;

  @IsOptional()
  @IsPhoneNumber(null)
  phone?: string;

  @IsOptional()
  @IsString()
  designation?: string;

  @IsOptional()
  @IsString()
  additionalInformation?: string;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => String)
  @IsMongoId({ each: true })
  companiesAccess: string[];

  @IsOptional()
  @IsString()
  logo?: string; // Assuming the logo is a URL
}
