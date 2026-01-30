'use server';

import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { adminDb } from '@/lib/firebase-admin';
import { headers } from 'next/headers';

export async function POST(req: Request) {
  try {
    const { userId, paymentMethod } = await req.json(); // paymentMethod: 'card' | 'bank_transfer'
    const origin = headers().get('origin') || 'http://localhost:3000';

    if (!userId || !adminDb) return new NextResponse("Unauthorized", { status: 401 });

    const userDocRef = adminDb.collection('users').doc(userId);
    const userDoc = await userDocRef.get();
    if (!userDoc.exists) return new NextResponse("User not found", { status: 404 });

    let { stripeCustomerId, email } = userDoc.data()!;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({ email, metadata: { userId } });
      stripeCustomerId = customer.id;
      await userDocRef.update({ stripeCustomerId });
    }

    let session;
    const success_url = `${origin}/authenticated/dashboard?payment=success`;
    const cancel_url = `${origin}/authenticated/account?tab=payment&payment=cancelled`;

    if (paymentMethod === 'card') {
      const priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID;
      if (!priceId) throw new Error("Stripe price ID is not configured.");

      session = await stripe.checkout.sessions.create({
        customer: stripeCustomerId,
        line_items: [{ price: priceId, quantity: 1 }],
        mode: 'subscription',
        payment_method_types: ['card'],
        success_url,
        cancel_url,
      });

    } else if (paymentMethod === 'bank_transfer') {
      // Create a one-time payment for the annual fee
      session = await stripe.checkout.sessions.create({
        customer: stripeCustomerId,
        line_items: [
          {
            price_data: {
              currency: 'eur',
              product_data: {
                name: 'DriverCheck Metinė Prieiga',
                description: 'Vienkartinis metinis mokestis už pilną prieigą vieneriems metams.',
              },
              unit_amount: 35999, // 359.99 EUR in cents
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        payment_method_types: ['customer_balance'],
        payment_method_options: {
            customer_balance: {
                funding_type: 'bank_transfer',
                bank_transfer: {
                    type: 'eu_bank_transfer',
                    eu_bank_transfer: {
                        country: 'LT', // Required
                    },
                },
            },
        },
        success_url,
        cancel_url,
      });

    } else {
      return new NextResponse("Invalid payment method", { status: 400 });
    }

    return NextResponse.json({ sessionId: session.id, url: session.url });

  } catch (error: any) {
    console.error('Stripe Error:', error);
    return new NextResponse(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
