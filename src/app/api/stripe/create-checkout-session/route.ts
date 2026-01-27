'use server';

import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { adminDb } from '@/lib/firebase-admin';
import { headers } from 'next/headers';

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();
    const origin = headers().get('origin') || 'http://localhost:3000';

    if (!userId || !adminDb) return new NextResponse("Unauthorized", { status: 401 });

    const userDocRef = adminDb.collection('users').doc(userId);
    const userDoc = await userDocRef.get();
    let { stripeCustomerId, email } = userDoc.data()!;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({ email, metadata: { userId } });
      stripeCustomerId = customer.id;
      await userDocRef.update({ stripeCustomerId });
    }

    const priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID;

    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      // Leidžiame korteles ir kliento balansą (pavedimams)
      payment_method_types: ['card', 'customer_balance'],
      payment_method_options: {
        customer_balance: {
          funding_type: 'bank_transfer',
          bank_transfer: { type: 'eu_bank_transfer' },
        },
      },
      // Priverčiame Stripe generuoti sąskaitą apmokėjimui
      payment_method_collection: 'always',
      success_url: `${origin}/authenticated/dashboard?payment=success`,
      cancel_url: `${origin}/authenticated/account?tab=payment&payment=cancelled`,
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error: any) {
    console.error('Stripe Error:', error);
    return new NextResponse(JSON.stringify({ error: error.message }), { status: 500 });
  }
}