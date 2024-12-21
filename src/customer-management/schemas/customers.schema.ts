// company.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import * as Joi from 'joi';

export type CustomerDocument = Customer & Document;

@Schema({ timestamps: true })  // Enables automatic handling of createdAt and updatedAt fields
export class Customer {
  @Prop({ required: true })
  name: string;

  @Prop()
  email: string;

  @Prop()
  phone: string;

  @Prop()
  businessName: string;

  @Prop()
  cif: string;  // Corporate Identification (or Fiscal) Number

  @Prop({ default: null })
  nif: string;  // Tax Identification Number

  @Prop()
  address: string;

  @Prop()
  additionalInformation?: string;

  @Prop()
  image?: string; // Assuming this is a URL to an image

  @Prop({ type: Types.ObjectId, ref: 'Company', required: true })
  company: Types.ObjectId; // Reference to Company schema

  @Prop({ default: false })
  deleted: boolean;  // Soft delete flag
}

export const CustomerSchema = SchemaFactory.createForClass(Customer);

// Compound index for name and deleted
CustomerSchema.index(
  { name: 1, nif: 1, company: 1, deleted: 1 },
  { unique: true, partialFilterExpression: { deleted: false, nif: null } }
);

// Optionally add more indexes as required for business logic, such as on cif or phone numbers


export const customerValidationSchema = Joi.object({
    name: Joi.string().required(),
    phone: Joi.string().allow('').allow(null).optional(),
    email: Joi.string().email().allow('').allow(null).optional(),
    businessName: Joi.string().allow('').allow(null).optional(),
    cif: Joi.string().allow('').allow(null).optional(),
    nif: Joi.string().allow('').allow(null).optional(),
    address: Joi.string().allow('').allow(null).optional(),
    additionalInformation: Joi.string().allow('').allow(null).optional(),
    image: Joi.string().allow('').allow(null).optional(),
  });
