import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export async function POST(req: Request) {
  try {
    // In a production app, you would get the user ID from a secure server-side session.
    // This is a simplification for now.
    const { userId } = await req.json();

    if (!userId) {
      return new NextResponse(JSON.stringify({ error: 'User not authenticated' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      return new NextResponse(JSON.stringify({ error: 'User not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    const stripeCustomerId = userDoc.data().stripeCustomerId;

    if (!stripeCustomerId) {
      return new NextResponse(JSON.stringify({ error: 'Stripe customer ID not found for this user.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${new URL(req.url).origin}/authenticated/account?tab=payment`,
    });

    return NextResponse.json({ url: portalSession.url });

  } catch (error: any) {
    console.error('Error creating Stripe portal session:', error);
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
