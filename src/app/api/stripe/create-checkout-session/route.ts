'use server';

import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { adminDb } from '@/lib/firebase-admin';
import { headers } from 'next/headers';

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();
    const origin = headers().get('origin') || 'http://localhost:3000';

    if (!userId) {
      return new NextResponse(JSON.stringify({ error: 'User not authenticated' }), { status: 401 });
    }

    if (!adminDb) {
      throw new Error('Firebase Admin not initialized.');
    }

    const userDocRef = adminDb.collection('users').doc(userId);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
      return new NextResponse(JSON.stringify({ error: 'User not found' }), { status: 404 });
    }
    
    let { stripeCustomerId, email } = userDoc.data()!;

    // Create a Stripe customer if one doesn't exist
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({ email });
      stripeCustomerId = customer.id;
      await userDocRef.update({ stripeCustomerId });
    }

    const priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID;
        if (!priceId) {
        throw new Error('Stripe Price ID is not configured in environment variables.');
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer: stripeCustomerId,
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      success_url: `${origin}/authenticated/dashboard?payment=success`,
      cancel_url: `${origin}/authenticated/account?tab=payment&payment=cancelled`,
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });

  } catch (error: any) {
    console.error('Error creating Stripe checkout session:', error);
    return new NextResponse(JSON.stringify({ error: error.message || 'Internal Server Error' }), { status: 500 });
  }
}
