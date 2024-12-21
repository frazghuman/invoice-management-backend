import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as Joi from 'joi';
import { Document } from 'mongoose';

// Define the Expense Document type
export type ExpenseDocument = Expense & Document;

@Schema({ timestamps: true }) // Automatically adds createdAt and updatedAt fields
export class Expense {
  @Prop({ required: true })
  expense_id: string; // Unique identifier for the expense

  @Prop({ required: true })
  date: Date; // Date of the expense

  @Prop({ required: true, type: Number })
  amount: number; // Monetary value of the expense

  @Prop({ required: true })
  category: string; // Category of the expense (e.g., Food, Transport)

  @Prop({ required: true, default: 'Cash' })
  payment_method: string; // Payment method used (e.g., Cash, Credit Card)

  @Prop()
  description: string; // Optional description or note for the expense

  @Prop()
  vendor: string; // Vendor associated with the expense

  @Prop({ required: true })
  user_id: string; // Identifier for the user who recorded the expense

  @Prop({ default: false })
  is_recurring: boolean; // Indicates if the expense is recurring

  @Prop({ required: true, default: 'USD' })
  currency: string; // Currency in which the expense was made

  @Prop()
  receipt?: string; // Optional file path or URL for the receipt

  @Prop()
  project_id?: string; // Optional link to a project or cost center

  @Prop({ type: Number })
  tax_amount?: number; // Portion of the expense that is tax-related

  @Prop({ default: 'Pending' })
  status: string; // Status of the expense (e.g., Pending, Approved, Reimbursed)

  @Prop({ type: [String], default: [] })
  tags: string[]; // Tags for additional categorization

  @Prop({ default: false })
  deleted: boolean;  // Soft delete flag
}

// Create the Mongoose schema
export const ExpenseSchema = SchemaFactory.createForClass(Expense);

// Adding a compound index to prevent duplicate records
// ExpenseSchema.index(
//   { expense_id: 1, user_id: 1 },
//   { unique: true, sparse: true }
// );

// Validation schema for expense fields using Joi
export const ExpenseValidationSchema = {
  create: Joi.object({
    expense_id: Joi.string().required().label('Expense ID'),
    date: Joi.date().iso().required().label('Date'),
    amount: Joi.number().positive().required().label('Amount'),
    category: Joi.string().min(1).required().label('Category'),
    payment_method: Joi.string().min(1).required().label('Payment Method'),
    description: Joi.string().allow('').optional().label('Description'),
    vendor: Joi.string().allow('').optional().label('Vendor'),
    user_id: Joi.string().uuid().required().label('User ID'),
    is_recurring: Joi.boolean().optional().label('Is Recurring'),
    currency: Joi.string().min(1).required().label('Currency'),
    receipt: Joi.string().allow('').optional().label('Receipt'),
    project_id: Joi.string().optional().label('Project ID'),
    tax_amount: Joi.number().positive().optional().label('Tax Amount'),
    status: Joi.string()
      .valid('Pending', 'Approved', 'Reimbursed')
      .default('Pending')
      .optional()
      .label('Status'),
    tags: Joi.array().items(Joi.string()).optional().label('Tags'),
  }),
  update: Joi.object({
    expense_id: Joi.string().optional().label('Expense ID'),
    date: Joi.date().iso().optional().label('Date'),
    amount: Joi.number().positive().optional().label('Amount'),
    category: Joi.string().min(1).optional().label('Category'),
    payment_method: Joi.string().min(1).optional().label('Payment Method'),
    description: Joi.string().allow('').optional().label('Description'),
    vendor: Joi.string().allow('').optional().label('Vendor'),
    user_id: Joi.string().uuid().optional().label('User ID'),
    is_recurring: Joi.boolean().optional().label('Is Recurring'),
    currency: Joi.string().min(1).optional().label('Currency'),
    receipt: Joi.string().allow('').optional().label('Receipt'),
    project_id: Joi.string().optional().label('Project ID'),
    tax_amount: Joi.number().positive().optional().label('Tax Amount'),
    status: Joi.string()
      .valid('Pending', 'Approved', 'Reimbursed')
      .optional()
      .label('Status'),
    tags: Joi.array().items(Joi.string()).optional().label('Tags'),
  }),
};
