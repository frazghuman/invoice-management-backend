import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../schemas/user.schema';
import { UserService } from './user.service';
import { UserSettingsService } from './user-settings.service';
import { UserSettings, UserSettingsSchema } from '../schemas/user-settings.schema';
import { ConfigService } from '@nestjs/config';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: User.name, schema: UserSchema },
            { name: UserSettings.name, schema: UserSettingsSchema },
          ]),
    ],
    controllers: [],
    providers: [UserService, UserSettingsService, ConfigService],
    exports: [UserService, UserSettingsService],
  })
export class UserServiceModule {}
