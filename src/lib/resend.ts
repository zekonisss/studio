import 'server-only';
import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
  console.warn("⚠️ Resend API key is not set. Email sending will not work. Please set RESEND_API_KEY in your .env file.");
}

export const resend = new Resend(process.env.RESEND_API_KEY);
