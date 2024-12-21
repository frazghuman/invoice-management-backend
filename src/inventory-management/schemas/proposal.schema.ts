import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import * as Joi from 'joi';

export type ProposalItemDocument = ProposalItem & Document;

@Schema()
export class ProposalItem {
  @Prop({ type: Types.ObjectId, ref: 'ProposalItem', required: true })
  item: Types.ObjectId;

  @Prop({ required: true })
  price: number;

  @Prop({ required: true })
  quantity: number;
}

export const ProposalItemSchema = SchemaFactory.createForClass(ProposalItem);

export type ProposalDocument = Proposal & Document;

@Schema({ timestamps: true })
export class Proposal {
  @Prop({ type: Types.ObjectId, ref: 'Customer', required: true })
  customer: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Company', required: true })
  company: Types.ObjectId; // Reference to Company schema

  @Prop({ required: true })
  date: Date;

  @Prop({ required: true })
  dueDate: Date;

  @Prop({ type: [ProposalItemSchema], required: true })
  items: ProposalItem[];

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

  @Prop({ default: false })
  deleted: boolean;
}

export const ProposalSchema = SchemaFactory.createForClass(Proposal);

export const ProposalItemValidationSchema = {
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

export const ProposalValidationSchema = {
  create: Joi.object({
    customer: Joi.string().required().label('Customer ID'),
    date: Joi.date().iso().required().label('Date'),
    dueDate: Joi.date().iso().required().label('Due Date'),
    items: Joi.array().items(ProposalItemValidationSchema.create).required().label('Items'),
    discount: Joi.number().min(0).optional().allow('').allow(null).label('Discount'),
    shippingCharges: Joi.number().min(0).optional().allow('').allow(null).label('Shipping Charges'),
    amountDue: Joi.number().positive().required().label('Amount Due'),
    note: Joi.string().optional().allow('').allow(null).label('Note')
  }),
  update: Joi.object({
    customer: Joi.string().required().label('Customer ID'),
    date: Joi.date().iso().required().label('Date'),
    dueDate: Joi.date().iso().required().label('Due Date'),
    items: Joi.array().items(ProposalItemValidationSchema.update).required().label('Items'),
    discount: Joi.number().min(0).optional().allow('').allow(null).label('Discount'),
    shippingCharges: Joi.number().min(0).optional().allow('').allow(null).label('Shipping Charges'),
    amountDue: Joi.number().positive().required().label('Amount Due'),
    note: Joi.string().optional().allow('').allow(null).label('Note')
  })
}