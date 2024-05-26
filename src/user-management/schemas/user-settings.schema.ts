import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserSettingsDocument = UserSettings & Document;

@Schema({ timestamps: true })
export class UserSettings {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  user: Types.ObjectId;

  @Prop()
  userImage?: string;

  @Prop()
  userName?: string;

  @Prop({ type: Types.ObjectId, ref: 'Company' })
  company?: Types.ObjectId;

  @Prop()
  country?: string;

  @Prop()
  language?: string;

  @Prop()
  dateFormat?: string;

  @Prop()
  currency?: string;

  @Prop()
  currencyFormat?: string;
}

export const UserSettingsSchema = SchemaFactory.createForClass(UserSettings);

// Adding a compound index
UserSettingsSchema.index({ user: 1 }, { unique: true });
