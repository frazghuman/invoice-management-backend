// company.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as Joi from 'joi';

export type CustomerDocument = Customer & Document;

@Schema({ timestamps: true })  // Enables automatic handling of createdAt and updatedAt fields
export class Customer {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  phone: string;

  @Prop({ required: true })
  businessName: string;

  @Prop({ required: true })
  cif: string;  // Corporate Identification (or Fiscal) Number

  @Prop({ required: true })
  nif: string;  // Tax Identification Number

  @Prop({ required: true })
  address: string;

  @Prop()
  additionalInformation?: string;

  @Prop()
  image?: string; // Assuming this is a URL to an image

  @Prop({ default: false })
  deleted: boolean;  // Soft delete flag
}

export const CustomerSchema = SchemaFactory.createForClass(Customer);

// Compound index for name and deleted
CustomerSchema.index({ name: 1, deleted: 1 }, { unique: true });

// Compound index for email and deleted, ensuring unique cif per non-deleted entries
CustomerSchema.index({ cif: 1, deleted: 1 }, { unique: true });

// Optionally add more indexes as required for business logic, such as on cif or phone numbers


export const customerValidationSchema = Joi.object({
    name: Joi.string().required(),
    phone: Joi.string().required(),
    email: Joi.string().email().required(),
    businessName: Joi.string().optional(),
    cif: Joi.string().optional(),
    nif: Joi.string().optional(),
    address: Joi.string().allow('').optional(),
    additionalInformation: Joi.string().allow('').optional(),
    image: Joi.string().allow('').allow(null).optional(),
  });
