// company.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as Joi from 'joi';

export type CompanyDocument = Company & Document;

@Schema({ timestamps: true })  // Enables automatic handling of createdAt and updatedAt fields
export class Company {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  phone: string;

  @Prop()
  businessNo?: string;

  @Prop()
  address?: string;

  @Prop()
  cif?: string;

  @Prop()
  logo?: string; // Assuming the logo is a URL
  
  @Prop({ default: false })
  deleted: boolean;  // Soft delete flag
}

export const CompanySchema = SchemaFactory.createForClass(Company);

// Compound index for name and deleted
CompanySchema.index({ name: 1, deleted: 1 }, { unique: true });

// Compound index for cif and deleted
CompanySchema.index({ cif: 1, deleted: 1 }, { unique: true });

export const companyValidationSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  phone: Joi.string().required(),
  businessNo: Joi.string().optional(),
  address: Joi.string().optional(),
  cif: Joi.string().optional(),
  logo: Joi.string().allow('').allow(null).optional()  // Assuming the logo is a URL and optional
});
