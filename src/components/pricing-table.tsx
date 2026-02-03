'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { createCheckoutSession } from '@/app/actions/stripe';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Loader2, Check } from 'lucide-react';

type BillingCycle = 'monthly' | 'yearly';
type Plan = 'SOLO' | 'GROWTH' | 'SCALE';

const plans = [
    {
        name: 'SOLO',
        title: 'Solo',
        description: 'Individualiam naudojimui ir mažoms komandoms.',
        prices: { monthly: 29, yearly: 348 },
        features: ['1 Vartotojas', '50 paieškų/mėn.', '10 įrašų/mėn.', 'El. pašto palaikymas'],
    },
    {
        name: 'GROWTH',
        title: 'Growth',
        description: 'Augančioms komandoms, kurioms reikia daugiau galimybių.',
        prices: { monthly: 69, yearly: 828 },
        features: ['5 Vartotojai', '200 paieškų/mėn.', '50 įrašų/mėn.', 'Prioritetinis palaikymas'],
        isPopular: true,
    },
    {
        name: 'SCALE',
        title: 'Scale',
        description: 'Didelėms įmonėms ir intensyviam naudojimui.',
        prices: { monthly: 99, yearly: 1188 },
        features: ['Neriboti vartotojai', 'Neribotos paieškos', 'Neriboti įrašai', 'API prieiga', 'Asmeninis vadybininkas'],
    },
];

export function PricingTable() {
    const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
    const [isLoading, setIsLoading] = useState<Plan | null>(null);
    const { user } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    const handleCheckout = async (plan: Plan) => {
        if (!user) {
            router.push('/login');
            return;
        }

        setIsLoading(plan);

        try {
            const planKey = `${plan}_${billingCycle.toUpperCase()}` as const;
            
            // The user object from useAuth might not be instantly updated with stripeCustomerId
            // So we rely on the server action to handle customer creation.
            const result = await createCheckoutSession({
                planKey,
                userId: user.id,
                email: user.email,
                stripeCustomerId: user.stripeCustomerId,
            });

            if (result.url) {
                window.location.href = result.url;
            } else {
                throw new Error(result.error || 'Nepavyko pradėti mokėjimo.');
            }
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Mokėjimo klaida',
                description: error.message,
            });
            setIsLoading(null);
        }
    };

    return (
        <div className="w-full max-w-5xl mx-auto py-12">
            <div className="flex justify-center items-center gap-4 mb-8">
                <Label htmlFor="billing-cycle">Mėnesinis</Label>
                <Switch
                    id="billing-cycle"
                    checked={billingCycle === 'yearly'}
                    onCheckedChange={(checked) => setBillingCycle(checked ? 'yearly' : 'monthly')}
                />
                <Label htmlFor="billing-cycle" className="flex items-center gap-2">
                    Metinis <span className="hidden sm:inline text-xs font-semibold px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full">+Dovanos</span>
                </Label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {plans.map((plan) => (
                    <Card key={plan.name} className={cn('flex flex-col', plan.isPopular && 'border-primary ring-2 ring-primary shadow-xl')}>
                        {plan.isPopular && (
                            <div className="text-center py-1.5 px-4 bg-primary text-primary-foreground text-sm font-semibold rounded-t-lg">
                                Populiariausias
                            </div>
                        )}
                        <CardHeader>
                            <CardTitle>{plan.title}</CardTitle>
                            <CardDescription>{plan.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow">
                            <div className="mb-6">
                                <span className="text-4xl font-bold">€{billingCycle === 'monthly' ? plan.prices.monthly : Math.round(plan.prices.yearly / 12)}</span>
                                <span className="text-muted-foreground">/mėn</span>
                                {billingCycle === 'yearly' && (
                                     <p className="text-sm text-muted-foreground">Mokama €{plan.prices.yearly} per metus</p>
                                )}
                            </div>
                            <ul className="space-y-3 text-sm">
                                {plan.features.map((feature, i) => (
                                    <li key={i} className="flex items-start gap-3">
                                        <Check className="h-4 w-4 text-green-500 mt-1 shrink-0" />
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                        <CardFooter>
                            <Button
                                className="w-full"
                                variant={plan.isPopular ? 'default' : 'outline'}
                                onClick={() => handleCheckout(plan.name as Plan)}
                                disabled={!!isLoading}
                            >
                                {isLoading === plan.name ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Pasirinkti planą'}
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
}
