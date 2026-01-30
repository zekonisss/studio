import 'server-only';
import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  console.warn("⚠️ Stripe secret key is not set. Stripe functionality will not work. Please set STRIPE_SECRET_KEY in your .env file.");
}

export const stripe = new Stripe(stripeSecretKey || '', {
  apiVersion: '2024-06-20',
  typescript: true,
});
