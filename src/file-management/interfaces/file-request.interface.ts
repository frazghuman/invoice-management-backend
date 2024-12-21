
import { Request, Response } from 'express';
export interface FileRequest extends Request {
    uploadType?: string;
    allowedFormats?: string[];
}
export interface FileResponse extends Response {
    uploadType?: string;
    allowedFormats?: string[];
}