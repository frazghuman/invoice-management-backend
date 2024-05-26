import { Injectable, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class CorsMiddleware implements NestMiddleware {
  constructor(private readonly configService: ConfigService) {

  }
  use(req: Request, res: Response, next: NextFunction) {
    const ALLOW_ORIGINS = this.configService.get<string>('ALLOW_ORIGINS');
    const allowedOrigins = [
      // 'http://localhost:4200',
      // 'http://ec2-13-38-109-60.eu-west-3.compute.amazonaws.com:4000',
      ...ALLOW_ORIGINS.split(',')
    ]; // Replace with your Angular app's domain and port

    const origin = req.headers.origin;

    if (allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }

    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') {
      // Preflight request
      res.header('Access-Control-Allow-Headers', req.header('Access-Control-Request-Headers')); // Allow the requested headers
      res.header('Access-Control-Allow-Methods', req.header('Access-Control-Request-Method')); // Allow the requested methods
      res.sendStatus(200);
    } else {
      // Pass control to the next middleware
      next();
    }
  }
}
