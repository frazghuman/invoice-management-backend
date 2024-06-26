import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as Joi from 'joi';
import { Document, Types } from 'mongoose';

export type ItemDocument = Item & Document;

@Schema({ timestamps: true })
export class Price {
  @Prop({ required: true })
  salePrice: number;

  @Prop({ required: true })
  effectiveDate: Date;
}

const PriceSchema = SchemaFactory.createForClass(Price);

@Schema({ timestamps: true })
export class Item {
  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop()
  baseUnitOfMeasure: string;

  @Prop({ type: [PriceSchema], default: [] })
  prices: Price[];

  @Prop({ type: PriceSchema })
  latestPrice?: Price[];

  @Prop({ type: Types.ObjectId, ref: 'Company', required: true })
  company: Types.ObjectId; // Reference to Company schema

  @Prop()
  inventoryCount?: number;

  @Prop()
  totalAvailableStock?: number;

  @Prop()
  image?: string; // Assuming this is a URL to an image

  @Prop({ default: false })
  deleted: boolean;  // Soft delete flag
}

export const ItemSchema = SchemaFactory.createForClass(Item);

// Adding a partial index for unique constraint on non-deleted items
ItemSchema.index(
  { name: 1, baseUnitOfMeasure: 1, company: 1, deleted: 1 },
  { unique: true, partialFilterExpression: { deleted: false } }
);

// Price validation schema
export const itemPriceValidationSchema = Joi.object({
  salePrice: Joi.number().positive().required().label('Sale Price'),
  effectiveDate: Joi.date().iso().required().label('Effective Date')
});

export const ItemValidationSchema = {
  create: Joi.object({
      name: Joi.string().min(1).required(),
      description: Joi.string().allow('').allow(null).optional(),
      baseUnitOfMeasure: Joi.string().required(),
      prices: Joi.array().items(itemPriceValidationSchema).optional(),
      image: Joi.string().allow('').allow(null).optional(),
  }),
  update: Joi.object({
      name: Joi.string().min(1).optional(),
      description: Joi.string().allow('').allow(null).optional(), // Correct usage of allow for an empty string
      baseUnitOfMeasure: Joi.string().optional(),
      prices: Joi.array().items(itemPriceValidationSchema).optional(), // Ensure optional for the whole array
      image: Joi.string().allow('').allow(null).optional(),
  })
};
