import { BadRequestException, MiddlewareConsumer, Module, NestModule, RequestMethod, UnsupportedMediaTypeException } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FileUploadController } from './file-upload.controller';
import { ProjectFile, ProjectFileSchema } from './schemas/project-file.schema';
import { ProjectFileService } from './services/project-file.service';
import { ConfigModule } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { multerOptions } from '../cloudinary/providers/multer-config';
import { CloudinaryProvider } from '../cloudinary/providers/cloudinary.provider';

@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forFeature([{ name: ProjectFile.name, schema: ProjectFileSchema }]),
    MulterModule.register(multerOptions),
  ],
  providers: [ProjectFileService, CloudinaryProvider],
  controllers: [FileUploadController],
  exports: [ProjectFileService]
})
export class FileManagementModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // consumer.apply(ExcelMiddleware).forRoutes({ path: 'file/upload/excel', method: RequestMethod.POST });
    // consumer.apply(DocsMiddleware).forRoutes({ path: 'file/upload/docs', method: RequestMethod.POST });
    // consumer.apply(ImageMiddleware).forRoutes({ path: 'file/upload/image', method: RequestMethod.POST });
    
  }
}

// Function to separate file name and extension
// function getFileNameAndExtension(filePath: string): [string, string] {
//   const fileName = path.basename(filePath, path.extname(filePath));
//   const extension = path.extname(filePath).slice(1);

//   return [fileName, extension];
// }
