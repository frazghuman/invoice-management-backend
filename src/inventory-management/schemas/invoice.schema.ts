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

  @Prop([{ lotId: { type: Types.ObjectId, ref: 'InventoryItem' }, quantity: Number, lotNo: Number }])
  lots: { lotId: Types.ObjectId; quantity: number; lotNo?: number }[];
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
  
  @Prop()
  pendingPayment: number;
}

export const InvoiceSchema = SchemaFactory.createForClass(Invoice);

// Define LotDto validation schema
const lotSchema = Joi.object({
  lotId: Joi.string().required().label('Lot ID'),
  quantity: Joi.number().integer().min(1).required().label('Lot Quantity')
});

// Define ItemDto validation schema
const itemSchema = Joi.object({
  item: Joi.string().required().label('Item ID'),
  price: Joi.number().positive().required().label('Price'),
  quantity: Joi.number().integer().min(1).required().label('Quantity'),
  lots: Joi.array().items(lotSchema).required().label('Lots')
});

export const InvoiceItemValidationSchema = {
  create: Joi.object({
    item: Joi.string().required().label('Item ID'),
    price: Joi.number().positive().required().label('Price'),
    quantity: Joi.number().integer().positive().required().label('Quantity')
  }),
  update: Joi.object({
    _id: Joi.string().optional().label('ID'),
    customer: Joi.string().optional().label('Customer ID'),
    company: Joi.string().optional().label('Company ID'),
    date: Joi.date().iso().optional().label('Date'),
    dueDate: Joi.date().iso().optional().label('Due Date'),
    items: Joi.array().items(itemSchema).required().label('Items'),
    discount: Joi.number().optional().allow(null).label('Discount'),
    shippingCharges: Joi.number().optional().allow(null).label('Shipping Charges'),
    pendingPayment: Joi.number().optional().allow(null).label('Pending Payment'),
    amountDue: Joi.number().positive().required().label('Amount Due'),
    note: Joi.string().optional().allow('').label('Note'),
    isBill: Joi.boolean().optional().label('Is Bill'),
    isPaid: Joi.boolean().optional().label('Is Paid'),
    isSent: Joi.boolean().optional().label('Is Sent'),
    invoiceNumber: Joi.number().optional().label('Invoice Number'),
    deleted: Joi.boolean().optional().label('Deleted'),
    updatedAt: Joi.date().iso().optional().label('Updated At')
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
    pendingPayment: Joi.number().min(0).optional().allow('').allow(null).label('Pending Payment'),
    amountDue: Joi.number().positive().required().label('Amount Due'),
    note: Joi.string().optional().allow('').allow(null).label('Note')
  }),
  update: Joi.object({
    company: Joi.string().required().label('Company ID'),
    customer: Joi.string().required().label('Customer ID'),
    _id: Joi.string().required().label('Invoice ID'),
    date: Joi.date().iso().required().label('Date'),
    dueDate: Joi.date().iso().required().label('Due Date'),
    items: Joi.array().items(InvoiceItemValidationSchema).required().label('Items'),
    discount: Joi.number().allow(null).optional().label('Discount'),
    shippingCharges: Joi.number().allow(null).optional().label('Shipping Charges'),
    pendingPayment: Joi.number().min(0).optional().allow('').allow(null).label('Pending Payment'),
    amountDue: Joi.number().positive().required().label('Amount Due'),
    note: Joi.string().allow('').optional().label('Note'),
    isBill: Joi.boolean().optional().label('Is Bill'),
    isPaid: Joi.boolean().optional().label('Is Paid'),
    isSent: Joi.boolean().optional().label('Is Sent'),
    invoiceNumber: Joi.number().required().label('Invoice Number'),
    deleted: Joi.boolean().optional().label('Deleted'),
    createdAt: Joi.date().iso().required().label('Created At'),
    updatedAt: Joi.date().iso().required().label('Updated At')
  })
}

