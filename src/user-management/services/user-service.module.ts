import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../schemas/user.schema';
import { UserService } from './user.service';
import { UserSettingsService } from './user-settings.service';
import { UserSettings, UserSettingsSchema } from '../schemas/user-settings.schema';
import { ConfigService } from '@nestjs/config';
import { MailService } from '../../mail/mail.service';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: User.name, schema: UserSchema },
            { name: UserSettings.name, schema: UserSettingsSchema },
          ]),
    ],
    controllers: [],
    providers: [UserService, UserSettingsService, ConfigService, MailService],
    exports: [UserService, UserSettingsService, ConfigService, MailService],
  })
export class UserServiceModule {}
