"use client";

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, CreditCard, Banknote } from 'lucide-react';

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    email: string;
}

type PaymentMethod = 'card' | 'bank_transfer';

export function PaymentModal({ isOpen, onClose, userId, email }: PaymentModalProps) {
    const { toast } = useToast();
    const [loadingMethod, setLoadingMethod] = useState<PaymentMethod | null>(null);

    const handleSubscribe = async (method: PaymentMethod) => {
        setLoadingMethod(method);
        try {
            const response = await fetch('/api/stripe/create-checkout-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, paymentMethod: method }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Nepavyko sukurti mokėjimo sesijos.');
            }

            const { url } = await response.json();
            window.location.href = url;
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Mokėjimo Klaida",
                description: error.message,
            });
        } finally {
            setLoadingMethod(null);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Aktyvuoti narystę</DialogTitle>
                    <DialogDescription>Pasirinkite patogiausią mokėjimo būdą metinei prenumeratai.</DialogDescription>
                </DialogHeader>
                <div className="py-6 space-y-4">
                     <p className="text-sm text-muted-foreground">
                        Metinės prenumeratos kaina: <span className="font-bold text-foreground">359.99 €</span>. Prieiga bus suteikta iškart po apmokėjimo.
                     </p>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <Button onClick={() => handleSubscribe('card')} disabled={!!loadingMethod} className="w-full">
                            {loadingMethod === 'card' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            <CreditCard className="mr-2 h-4 w-4" />
                            Mokėti kortele (prenumerata)
                        </Button>
                        <Button onClick={() => handleSubscribe('bank_transfer')} disabled={!!loadingMethod} variant="secondary" className="w-full">
                            {loadingMethod === 'bank_transfer' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            <Banknote className="mr-2 h-4 w-4" />
                            Gauti sąskaitą pavedimui
                        </Button>
                    </div>
                </div>
                 <DialogFooter>
                    <p className="text-xs text-muted-foreground text-center w-full">Mokėjimus saugiai apdoroja Stripe.</p>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
