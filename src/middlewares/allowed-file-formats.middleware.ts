// excel.middleware.ts
import { NestMiddleware, Injectable } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { FileRequest, FileResponse } from '../file-management/interfaces/file-request.interface';

@Injectable()
export class ExcelMiddleware implements NestMiddleware {
    use(req: FileRequest, res: FileResponse, next: NextFunction) {
      // Set allowed Excel formats
      const allowedFormats = req?.['allowedFormats'] ?? [];
      req['allowedFormats'] = [...allowedFormats, 'xls', 'xlsx', 'xlsm', 'xlsb', 'xltx', 'xltm'];
      
      next();
    };
}

@Injectable()
export class DocsMiddleware implements NestMiddleware {
    use(req: FileRequest, res: FileResponse, next: NextFunction) {
      // Set allowed Excel formats
      const allowedFormats = req?.['allowedFormats'] ?? [];
      req['allowedFormats'] = [...allowedFormats, 'pdf', 'doc', 'docx', 'txt', 'rtf'];
      
      next();
    };
}

@Injectable()
export class ImageMiddleware implements NestMiddleware {
    use(req: FileRequest, res: FileResponse, next: NextFunction) {
      // Indicate that all image MIME types are allowed
      req['allowAllImageFormats'] = true;
      // Set allowed Excel formats
      const allowedFormats = req?.['allowedFormats'] ?? [];
      req['allowedFormats'] = [...allowedFormats, 'png', 'jpg', 'jpeg', 'gif', 'bmp', 'tiff', 'ico', 'svg', 'webp', 'jfif'];
      
      next();
    };
}

// @Injectable()
// export class ImageMiddleware implements NestMiddleware {
//     use(req: Request, res: Response, next: NextFunction) {
//         // Indicate that all image MIME types are allowed
//         req['allowAllImageFormats'] = true;
        
//         next();
//     }
// }