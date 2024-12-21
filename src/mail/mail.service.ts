// src/mail/mail.service.ts

import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
          user: process.env.EMAIL_USER, // your Gmail email address
          pass: process.env.EMAIL_PASS, // your Gmail app password or normal password if less secure apps enabled
        },
        tls: {
          rejectUnauthorized: false,
        },
      });

  }

  async sendActivationEmail(to: string, token: string) {
    const url = `http://yourapp.com/activate?token=${token}`;

    await this.transporter.sendMail({
      from: `"Invoice Management" <${process.env.EMAIL_USER}>`,
      to,
      subject: 'Account Activation',
      html: `Click this link to activate your account: <a href="${url}">${url}</a>`,
    });
  }
}
