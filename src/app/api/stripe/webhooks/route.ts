import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

const findUserByCustomerId = async (customerId: string) => {
    if (!adminDb) {
        console.error("Admin DB not initialized for webhook.");
        return null;
    }
    const usersRef = adminDb.collection('users');
    const q = usersRef.where('stripeCustomerId', '==', customerId).limit(1);
    const userSnapshot = await q.get();
    
    if (userSnapshot.docs.length === 0) {
        console.error(`Webhook Error: No user found for customer ID: ${customerId}`);
        return null;
    }
    return userSnapshot.docs[0].ref;
}

// Handles recurring subscriptions
const manageSubscriptionStatusChange = async (subscriptionId: string, customerId: string) => {
    const userDocRef = await findUserByCustomerId(customerId);
    if (!userDocRef) return;

    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
        expand: ["default_payment_method"],
    });

    const paymentStatus = (subscription.status === 'active' || subscription.status === 'trialing') ? 'active' : 'inactive';
    const subscriptionEndDate = subscription.current_period_end 
        ? Timestamp.fromMillis(subscription.current_period_end * 1000) 
        : null;

    await userDocRef.update({
        paymentStatus,
        stripeSubscriptionId: subscription.id,
        stripePriceId: subscription.items.data[0].price.id,
        subscriptionEndDate,
    });
};

// Handles one-time payments (like bank transfers for a yearly pass)
const handleOneTimePayment = async (session: Stripe.Checkout.Session) => {
    const customerId = session.customer as string;
    if (!customerId) return;
    
    const userDocRef = await findUserByCustomerId(customerId);
    if (!userDocRef) return;
    
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

    await userDocRef.update({
        paymentStatus: 'active',
        subscriptionEndDate: Timestamp.fromDate(oneYearFromNow),
        stripeSubscriptionId: null, // It's not a recurring subscription
        stripePriceId: null,
    });
};


export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get('Stripe-Signature') as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
      console.error("Stripe webhook secret is not set.");
      return new NextResponse('Webhook secret not configured', { status: 500 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error: any) {
    console.log(`Webhook Error: ${error.message}`);
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === 'subscription' && session.subscription) {
            await manageSubscriptionStatusChange(session.subscription as string, session.customer as string);
        } else if (session.mode === 'payment' && session.payment_status === 'paid') {
            await handleOneTimePayment(session);
        }
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await manageSubscriptionStatusChange(subscription.id, subscription.customer as string);
        break;
      }
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.subscription) {
            await manageSubscriptionStatusChange(invoice.subscription as string, invoice.customer as string);
        }
        break;
      }
      default:
        // Unhandled event type
    }
  } catch (error) {
      console.error("Error handling webhook event:", error);
      return new NextResponse('Webhook handler failed', { status: 500 });
  }

  return new NextResponse(null, { status: 200 });
}
