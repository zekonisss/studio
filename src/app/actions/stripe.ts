'use server';

import { stripe } from '@/lib/stripe';
import { adminDb } from '@/lib/firebase-admin';
import { headers } from 'next/headers';

type PlanKey = 
    | 'SOLO_MONTHLY' | 'GROWTH_MONTHLY' | 'SCALE_MONTHLY'
    | 'SOLO_YEARLY' | 'GROWTH_YEARLY' | 'SCALE_YEARLY';

// This map securely translates client-side plan keys to server-side Stripe Price IDs
const priceIdMap: Record<PlanKey, string | undefined> = {
    SOLO_MONTHLY: process.env.STRIPE_PRICE_SOLO_MONTHLY,
    GROWTH_MONTHLY: process.env.STRIPE_PRICE_GROWTH_MONTHLY,
    SCALE_MONTHLY: process.env.STRIPE_PRICE_SCALE_MONTHLY,
    SOLO_YEARLY: process.env.STRIPE_PRICE_SOLO_YEARLY,
    GROWTH_YEARLY: process.env.STRIPE_PRICE_GROWTH_YEARLY,
    SCALE_YEARLY: process.env.STRIPE_PRICE_SCALE_YEARLY,
};

interface CreateCheckoutSessionData {
    planKey: PlanKey;
    userId: string;
    email: string;
    stripeCustomerId?: string;
}

export async function createCheckoutSession(data: CreateCheckoutSessionData): Promise<{ url: string | null; error?: string }> {
    const { planKey, userId, email } = data;
    let { stripeCustomerId } = data;

    const origin = headers().get('origin') || 'http://localhost:3000';

    try {
        if (!userId || !adminDb) {
            return { url: null, error: 'Vartotojas neautentifikuotas arba serverio klaida.' };
        }

        const priceId = priceIdMap[planKey];
        if (!priceId) {
            console.error(`Stripe Price ID not found for planKey: ${planKey}. Check your .env.local file.`);
            return { url: null, error: 'Pasirinktas mokėjimo planas nerastas.' };
        }

        const userDocRef = adminDb.collection('users').doc(userId);

        // Jei neturime stripeCustomerId, bandome gauti iš DB arba sukurti naują
        if (!stripeCustomerId) {
            const userDoc = await userDocRef.get();
            stripeCustomerId = userDoc.data()?.stripeCustomerId;

            if (!stripeCustomerId) {
                const customer = await stripe.customers.create({
                    email,
                    metadata: { userId },
                });
                stripeCustomerId = customer.id;
                await userDocRef.update({ stripeCustomerId });
            }
        }

        const session = await stripe.checkout.sessions.create({
            customer: stripeCustomerId,
            mode: 'subscription',
            payment_method_types: ['card', 'sepa_debit'],
            line_items: [{
                price: priceId,
                quantity: 1,
            }],
            success_url: `${origin}/dashboard?payment=success`,
            cancel_url: `${origin}/account?tab=payment`,
            
            // --- ŠTAI PATAISYMAS (BŪTINAS B2B MOKESČIAMS) ---
            tax_id_collection: {
                enabled: true,
            },
            customer_update: {
                name: 'auto',
                address: 'auto',
            },
            // ------------------------------------------------
        });
        
        if (!session.url) {
            return { url: null, error: 'Nepavyko sukurti mokėjimo sesijos URL.' };
        }

        return { url: session.url };

    } catch (error: any) {
        console.error('Stripe Checkout Error:', error);
        return { url: null, error: error.message || 'Įvyko netikėta klaida.' };
    }
}
