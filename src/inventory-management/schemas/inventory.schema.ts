import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as Joi from 'joi';
import { Document, Types } from 'mongoose';

export type InventoryDocument = Inventory & Document;

@Schema({ timestamps: true })
export class Inventory {
  @Prop({ type: Types.ObjectId, ref: 'Item', required: true })
  item: Types.ObjectId;

  @Prop({ required: true })
  lotNo: number;

  @Prop({ required: true })
  purchasePrice: number;

  @Prop({ required: true })
  totalStock: number;

  @Prop({ required: true })
  stockReceivedDate: Date;

  @Prop({ required: true })
  soldOutStock: number;

  @Prop()
  description: string;

  @Prop({ default: false })
  inUse: boolean;

  @Prop({ default: false })
  deleted: boolean;
}

export const InventorySchema = SchemaFactory.createForClass(Inventory);

export const InventoryValidationSchema = {
    create: Joi.object({
        itemId: Joi.string().hex().length(24).required(),  // Assuming MongoDB ObjectId
        lotNo: Joi.number().required(),
        purchasePrice: Joi.number().positive().required(),
        totalStock: Joi.number().positive().required(),
        stockReceivedDate: Joi.date().iso().required().label('Stock Received Date'),
        description: Joi.string().allow('').optional()
      }),
    update: Joi.object({
        itemId: Joi.string().hex().length(24),  // Assuming MongoDB ObjectId
        lotNo: Joi.number(),
        purchasePrice: Joi.number().positive(),
        totalStock: Joi.number().positive(),
        stockReceivedDate: Joi.date().iso().required().label('Stock Received Date'),
        description: Joi.string().allow('')
      })
}