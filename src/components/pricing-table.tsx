
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
import { Loader2, Check, Star, Mail } from 'lucide-react';
import { useLanguage } from '@/contexts/language-context';

type BillingCycle = 'monthly' | 'yearly';
type PlanName = 'SOLO' | 'GROWTH' | 'SCALE';

const plans = [
    {
        name: 'SOLO',
        title: 'START',
        description: 'Tinka pradedantiesiems ir individualiems specialistams.',
        prices: { monthly: 29, yearly: 290 },
        oldPrices: { monthly: 49, yearly: 490 },
        badge: 'EARLY ACCESS',
        features: ['1 Vartotojas', '50 paieškų/mėn.', 'AI Analizė', '10 metų archyvas'],
    },
    {
        name: 'GROWTH',
        title: 'PRO',
        description: 'Augančioms komandoms ir verslui.',
        prices: { monthly: 69, yearly: 690 },
        oldPrices: { monthly: 129, yearly: 1290 },
        badge: 'Populiariausias',
        isPopular: true,
        features: ['5 Vartotojai', '300 paieškų/mėn.', 'Excel Importas', 'Stebimų asmenų sąrašas (Watchlist)', 'Prioritetinė AI analizė'],
    },
    {
        name: 'SCALE',
        title: 'ENTERPRISE',
        description: 'Didelėms organizacijoms ir integracijoms.',
        prices: { monthly: 'Susisiekti', yearly: 'Susisiekti' },
        features: ['Neriboti vartotojai', 'Neribotos paieškos', 'API Integracija (Greitai)', 'Prioritetinis apdorojimas', 'Didelės apimties importas'],
    },
];


export function PricingTable() {
    const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
    const [isLoading, setIsLoading] = useState<PlanName | null>(null);
    const { user } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const { t } = useLanguage();

    const handleCheckout = async (plan: PlanName) => {
        if (!user) {
            router.push('/login');
            return;
        }

        setIsLoading(plan);

        try {
            const planKey = `${plan}_${billingCycle.toUpperCase()}` as const;
            
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
        <div className="w-full max-w-6xl mx-auto py-12">
            <div className="flex justify-center items-center gap-4 mb-12">
                <Label htmlFor="billing-cycle" className={cn(billingCycle === 'monthly' ? 'text-foreground' : 'text-muted-foreground')}>Mėnesinis</Label>
                <Switch
                    id="billing-cycle"
                    checked={billingCycle === 'yearly'}
                    onCheckedChange={(checked) => setBillingCycle(checked ? 'yearly' : 'monthly')}
                    aria-label="Perjungti atsiskaitymo ciklą"
                />
                <Label htmlFor="billing-cycle" className={cn('flex items-center gap-2', billingCycle === 'yearly' ? 'text-foreground' : 'text-muted-foreground')}>
                    Metinis 
                    <span className="hidden sm:inline text-xs font-semibold px-2 py-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-full">-20%</span>
                </Label>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
                {plans.map((plan) => {
                    const isCustomPrice = typeof plan.prices.monthly === 'string';
                    let price: string | number;
                    let oldPrice: number | undefined;

                    if (isCustomPrice) {
                        price = plan.prices.monthly;
                    } else {
                        price = billingCycle === 'monthly' ? plan.prices.monthly : Math.round(plan.prices.yearly / 12);
                        oldPrice = billingCycle === 'monthly' ? plan.oldPrices?.monthly : plan.oldPrices ? Math.round(plan.oldPrices.yearly / 12) : undefined;
                    }
                    
                    return (
                        <Card key={plan.name} className={cn(
                            'flex flex-col transition-all duration-300 hover:shadow-xl hover:border-primary/50 dark:hover:border-primary', 
                            plan.isPopular && 'border-primary dark:border-primary/80 ring-2 ring-primary/50 shadow-2xl'
                        )}>
                            
                            <CardHeader className="pb-4">
                                {plan.badge && (
                                    <div className={cn(
                                        "inline-flex items-center gap-1.5 w-fit px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3",
                                        plan.isPopular 
                                            ? "bg-primary text-primary-foreground" 
                                            : "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300"
                                    )}>
                                        {plan.isPopular && <Star className="w-3 h-3"/>}
                                        {plan.badge}
                                    </div>
                                )}
                                <CardTitle className="text-2xl">{plan.title}</CardTitle>
                                <CardDescription className="min-h-[40px]">{plan.description}</CardDescription>
                            </CardHeader>
                            
                            <CardContent className="flex-grow">
                                <div className="mb-8">
                                    {typeof price === 'number' ? (
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-5xl font-bold tracking-tight">€{price}</span>
                                            {oldPrice && <span className="text-2xl font-medium text-muted-foreground line-through">€{oldPrice}</span>}
                                            <span className="text-muted-foreground">/mėn</span>
                                        </div>
                                    ) : (
                                        <div className="text-3xl font-bold h-[48px] flex items-center">{price}</div>
                                    )}
                                    {billingCycle === 'yearly' && typeof plan.prices.yearly === 'number' && (
                                         <p className="text-sm text-muted-foreground mt-1">Mokama €{plan.prices.yearly} per metus</p>
                                    )}
                                </div>
                                <ul className="space-y-4 text-sm">
                                    {plan.features.map((feature, i) => (
                                        <li key={i} className="flex items-start gap-3">
                                            <Check className="h-4 w-4 text-emerald-500 mt-1 shrink-0" />
                                            <span className="text-muted-foreground">{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                            
                            <CardFooter className="mt-auto border-t pt-6">
                                {plan.name === 'SCALE' ? (
                                    <Button asChild className="w-full" size="lg">
                                        <a href="mailto:info@drivercheck.lt">
                                            <Mail className="mr-2 h-4 w-4" />
                                            Gauti pasiūlymą
                                        </a>
                                    </Button>
                                ) : (
                                    <Button
                                        className="w-full"
                                        size="lg"
                                        variant={plan.isPopular ? 'default' : 'secondary'}
                                        onClick={() => handleCheckout(plan.name as PlanName)}
                                        disabled={!!isLoading}
                                    >
                                        {isLoading === plan.name ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Pasirinkti planą'}
                                    </Button>
                                )}
                            </CardFooter>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
