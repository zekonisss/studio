import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { adminDb } from '@/lib/firebase-admin';

// Helper to update subscription status in Firestore
const manageSubscriptionStatusChange = async (subscriptionId: string, customerId: string) => {
    if (!adminDb) {
        console.error("Admin DB not initialized");
        return;
    }

    const usersRef = adminDb.collection('users');
    const q = usersRef.where('stripeCustomerId', '==', customerId).limit(1);
    const userSnapshot = await q.get();
    
    if (userSnapshot.docs.length === 0) {
        console.error(`Webhook Error: No user found for customer ID: ${customerId}`);
        return;
    }
    const userDocRef = userSnapshot.docs[0].ref;

    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
        expand: ["default_payment_method"],
    });

    // Map Stripe status to our app's status
    const paymentStatus = (subscription.status === 'active' || subscription.status === 'trialing') ? 'active' : 'inactive';

    await userDocRef.update({
        paymentStatus,
        stripeSubscriptionId: subscription.id,
        stripePriceId: subscription.items.data[0].price.id,
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
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        const subscription = event.data.object as Stripe.Subscription;
        await manageSubscriptionStatusChange(subscription.id, subscription.customer as string);
        break;
      case 'invoice.payment_succeeded':
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.subscription) {
            await manageSubscriptionStatusChange(invoice.subscription as string, invoice.customer as string);
        }
        break;
      default:
        // console.log(`Unhandled webhook event type: ${event.type}`);
    }
  } catch (error) {
      console.error("Error handling webhook event:", error);
      return new NextResponse('Webhook handler failed', { status: 500 });
  }

  return new NextResponse(null, { status: 200 });
}
