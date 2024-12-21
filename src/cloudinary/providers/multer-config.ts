import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { Request } from 'express';
import multer, { FileFilterCallback } from 'multer';

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: 'uploads',
      format: 'jpg',
      public_id: file.originalname.split('.')[0],
    };
  },
});

const fileFilter = (req: Request, file: Express.Multer.File, callback: FileFilterCallback) => {
  if (file.mimetype.startsWith('image/')) {
    callback(null, true);
  } else {
    callback(null, false);
  }
};

export const multerOptions = {
  storage: storage,
  fileFilter: fileFilter,
};
