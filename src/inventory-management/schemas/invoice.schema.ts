import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import * as Joi from 'joi';

export type InvoiceItemDocument = InvoiceItem & Document;

@Schema()
export class InvoiceItem {
  @Prop({ type: Types.ObjectId, ref: 'InvoiceItem', required: true })
  item: Types.ObjectId;

  @Prop({ required: true })
  price: number;

  @Prop({ required: true })
  quantity: number;

  @Prop([{ lotId: { type: Types.ObjectId, ref: 'InventoryItem' }, quantity: Number }])
  lots: { lotId: Types.ObjectId; quantity: number }[];
}

export const InvoiceItemSchema = SchemaFactory.createForClass(InvoiceItem);

export type InvoiceDocument = Invoice & Document;

@Schema({ timestamps: true })
export class Invoice {
  @Prop({ type: Types.ObjectId, ref: 'Customer', required: true })
  customer: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Company', required: true })
  company: Types.ObjectId; // Reference to Company schema

  @Prop({ required: true })
  date: Date;

  @Prop({ required: true })
  dueDate: Date;

  @Prop({ type: [InvoiceItemSchema], required: true })
  items: InvoiceItem[];

  @Prop()
  discount: number;

  @Prop()
  shippingCharges: number;

  @Prop({ required: true })
  amountDue: number;

  @Prop({ required: false })
  note: string;

  @Prop({ default: false })
  isBill: boolean;

  @Prop({ default: false })
  isPaid: boolean;

  @Prop({ default: false })
  isSent: boolean;

  @Prop({ unique: true, sparse: true, default: 1 })
  invoiceNumber: number; // New field for auto-incremented invoice number

  @Prop({ default: false })
  deleted: boolean;
}

export const InvoiceSchema = SchemaFactory.createForClass(Invoice);

export const InvoiceItemValidationSchema = {
  create: Joi.object({
    item: Joi.string().required().label('Item ID'),
    price: Joi.number().positive().required().label('Price'),
    quantity: Joi.number().integer().positive().required().label('Quantity')
  }),
  update: Joi.object({
    item: Joi.string().required().label('Item ID'),
    price: Joi.number().positive().required().label('Price'),
    quantity: Joi.number().integer().positive().required().label('Quantity')
  })
}

export const InvoiceValidationSchema = {
  create: Joi.object({
    customer: Joi.string().required().label('Customer ID'),
    date: Joi.date().iso().required().label('Date'),
    dueDate: Joi.date().iso().required().label('Due Date'),
    items: Joi.array().items(InvoiceItemValidationSchema.create).required().label('Items'),
    discount: Joi.number().min(0).optional().allow('').allow(null).label('Discount'),
    shippingCharges: Joi.number().min(0).optional().allow('').allow(null).label('Shipping Charges'),
    amountDue: Joi.number().positive().required().label('Amount Due'),
    note: Joi.string().optional().allow('').allow(null).label('Note')
  }),
  update: Joi.object({
    customer: Joi.string().required().label('Customer ID'),
    date: Joi.date().iso().required().label('Date'),
    dueDate: Joi.date().iso().required().label('Due Date'),
    items: Joi.array().items(InvoiceItemValidationSchema.update).required().label('Items'),
    discount: Joi.number().min(0).optional().allow('').allow(null).label('Discount'),
    shippingCharges: Joi.number().min(0).optional().allow('').allow(null).label('Shipping Charges'),
    amountDue: Joi.number().positive().required().label('Amount Due'),
    note: Joi.string().optional().allow('').allow(null).label('Note')
  })
}