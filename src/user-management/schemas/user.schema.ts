import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as Joi from 'joi';
import { Document, Types } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export type UserDocument = User & Document;

@Schema({ timestamps: true })  // Enables automatic handling of createdAt and updatedAt fields
export class User extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop()
  password?: string;

  @Prop({ default: false })
  verified: boolean;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Role' })
  role: Types.ObjectId;

  @Prop()
  verificationKey?: string;

  @Prop()
  designation?: string;

  @Prop()
  phone?: string;

  @Prop()
  additionalInformation?: string;

  @Prop({ required: true, type: [Types.ObjectId], ref: 'Company' })
  companiesAccess: Types.ObjectId[];

  @Prop()
  image?: string; // Assuming the logo is a URL
  
  @Prop({ default: false })
  deleted: boolean;  // Soft delete flag
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.pre<User>('save', function (next) {
  if (!this.verificationKey) {
    this.verificationKey = generateVerificationKey(); // implement your own function to generate a unique key
  }
  next();
});

// Generate a unique verification key
function generateVerificationKey(): string {
    return uuidv4();
  }

// Define a helper function to validate MongoDB ObjectId
const objectId = Joi.string().custom((value, helpers) => {
  if (!Types.ObjectId.isValid(value)) {
    return helpers.error('any.invalid');
  }
  return value;  // Return the value if validation passes
}, 'Object ID Validation');

export const UserValidationSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().optional(),
  verified: Joi.boolean().default(false).optional(),
  role: objectId.required(),
  verificationKey: Joi.string().optional(),
  designation: Joi.string().optional(),
  phone: Joi.string().optional(),
  additionalInformation: Joi.string().optional(),
  companiesAccess: Joi.array().items(objectId).min(1).required(),
  image: Joi.string().allow('').allow(null).optional()
});