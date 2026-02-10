'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

// Helper component to use searchParams with Suspense
function VerificationPageContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [step, setStep] = useState<'loading' | 'form' | 'success' | 'invalid'>('loading');
  const [driverName, setDriverName] = useState('Jonas Jonaitis'); // Mock
  const [requestingCompany, setRequestingCompany] = useState('UAB Greitkelis'); // Mock
  const [answers, setAnswers] = useState({
    workedHere: null as boolean | null,
    wouldRehire: null as boolean | null,
    comment: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Simulate API call to verify token
    setTimeout(() => {
      if (token) {
        // In a real app, you would fetch data based on the token
        setStep('form');
      } else {
        setStep('invalid');
      }
    }, 1500);
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (answers.workedHere === null) {
      alert('Prašome atsakyti į pirmą klausimą.');
      return;
    }
    setIsSubmitting(true);
    
    // Simulate API submission
    console.log("Submitting answers:", { token, ...answers });
    setTimeout(() => {
      setStep('success');
      setIsSubmitting(false);
    }, 1000);
  };
  
  if (step === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center text-center gap-4 p-8">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground">Tikrinama nuoroda...</p>
      </div>
    );
  }
  
  if (step === 'invalid') {
     return (
      <Card className="w-full max-w-md border-destructive">
        <CardHeader className="text-center items-center">
            <AlertTriangle className="h-10 w-10 text-destructive mb-2" />
            <CardTitle>Neteisinga Nuoroda</CardTitle>
            <CardDescription>
                Ši patvirtinimo nuoroda yra neteisinga arba nebegalioja.
            </CardDescription>
        </CardHeader>
      </Card>
     )
  }

  if (step === 'success') {
    return (
      <Card className="w-full max-w-lg text-center overflow-hidden">
        <CardHeader className="bg-green-50 dark:bg-green-900/20 p-8">
           <div className="mx-auto bg-white p-3 rounded-full w-fit shadow-md mb-4">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
           </div>
           <CardTitle className="text-2xl text-green-800 dark:text-green-300">Ačiū!</CardTitle>
           <CardDescription className="text-base text-green-700 dark:text-green-400">
             Jūsų atsakymas užfiksuotas saugioje DriverCheck bazėje.
           </CardDescription>
        </CardHeader>
        <CardContent className="p-8">
           <h3 className="font-bold text-lg text-foreground">Norite sužinoti, ar jūsų dabartiniai vairuotojai turi paslėptų pažeidimų?</h3>
           <p className="text-muted-foreground mt-2 mb-6">Prisijunkite prie vežėjų tinklo ir priimkite saugesnius sprendimus.</p>
           <Button asChild size="lg" className="w-full">
              <Link href="/signup">
                  Tikrinti Savo Vairuotojus (Nemokamai)
                  <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
           </Button>
        </CardContent>
      </Card>
    )
  }
  
  return (
    <Card className="w-full max-w-lg">
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle className="text-2xl">Prašymas Patvirtinti Reputaciją</CardTitle>
          <CardDescription>
            Įmonė <span className="font-semibold text-foreground">{requestingCompany}</span> prašo informacijos apie vairuotoją <span className="font-semibold text-foreground">{driverName}</span>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          <div className="space-y-3">
              <label className="font-medium">1. Ar šis asmuo dirbo Jūsų įmonėje?</label>
              <div className="flex gap-3">
                  <Button type="button" variant={answers.workedHere === true ? 'default' : 'outline'} onClick={() => setAnswers(prev => ({...prev, workedHere: true}))} className="flex-1">Taip</Button>
                  <Button type="button" variant={answers.workedHere === false ? 'default' : 'outline'} onClick={() => setAnswers(prev => ({...prev, workedHere: false}))} className="flex-1">Ne</Button>
              </div>
          </div>

          <div className="space-y-3">
              <label className="font-medium">2. Ar priimtumėte šį asmenį dirbti atgal?</label>
              <div className="flex gap-3">
                  <Button type="button" variant={answers.wouldRehire === true ? 'default' : 'outline'} onClick={() => setAnswers(prev => ({...prev, wouldRehire: true}))} className="flex-1">
                      <CheckCircle2 className="mr-2 h-4 w-4"/> Taip
                  </Button>
                  <Button type="button" variant={answers.wouldRehire === false ? 'destructive' : 'outline'} onClick={() => setAnswers(prev => ({...prev, wouldRehire: false}))} className="flex-1">
                      <AlertTriangle className="mr-2 h-4 w-4"/> Ne
                  </Button>
              </div>
          </div>
          
          <div className="space-y-3">
              <label htmlFor="comment" className="font-medium">3. Komentaras (neprivaloma, bet rekomenduojama)</label>
              <Textarea 
                id="comment"
                placeholder="Pateikite trumpą, dalykišką komentarą apie vairuotojo veiklą, pvz., 'kuro normos viršijimas', 'dažni vėlavimai', 'atsakingas darbuotojas'..."
                value={answers.comment}
                onChange={(e) => setAnswers(prev => ({...prev, comment: e.target.value}))}
                rows={5}
              />
          </div>
          
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isSubmitting || answers.workedHere === null}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Patvirtinti ir Išsiųsti
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

// Main component that wraps content in Suspense
export default function VerificationPage() {
    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-muted/40 p-4">
            <Suspense fallback={<div className="flex flex-col items-center justify-center text-center gap-4 p-8"><Loader2 className="h-10 w-10 animate-spin text-primary" /><p className="text-muted-foreground">Kraunasi...</p></div>}>
                <VerificationPageContent />
            </Suspense>
        </div>
    );
}
