
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface RequestDetails {
    driverName: string;
    driverBirthDate?: string | null;
    requesterCompany: string;
    startDate?: string | null;
    endDate?: string | null;
    isCurrentEmployer?: boolean;
}

// Helper component to use searchParams with Suspense
function VerificationPageContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [step, setStep] = useState<'loading' | 'form' | 'success' | 'invalid'>('loading');
  const [requestDetails, setRequestDetails] = useState<RequestDetails | null>(null);
  const [answers, setAnswers] = useState({
    workedHere: null as boolean | null,
    wouldRehire: null as boolean | null,
    comment: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('Patvirtinimo nuoroda yra neteisinga arba nebegalioja.');

  useEffect(() => {
    if (!token) {
        setStep('invalid');
        return;
    }

    const fetchRequestData = async () => {
        try {
            const response = await fetch(`/api/checks/get-request?token=${token}`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Nepavyko gauti užklausos duomenų.');
            }
            const data: RequestDetails = await response.json();
            setRequestDetails(data);
            setStep('form');
        } catch (error: any) {
            setErrorMessage(error.message);
            setStep('invalid');
        }
    };
    
    fetchRequestData();
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
  
  const renderQuestion1 = () => {
    if (!requestDetails) return 'Ar šis asmuo dirbo Jūsų įmonėje?';
    
    const { startDate, endDate, isCurrentEmployer, driverName } = requestDetails;
    
    let dateString = '';
    if (isCurrentEmployer) {
      dateString = ' šiuo metu';
    } else if (startDate) {
      dateString = ` laikotarpiu nuo ${startDate}${endDate ? ` iki ${endDate}` : ''}`;
    }

    return `Ar ${driverName || 'šis asmuo'} dirbo Jūsų įmonėje${dateString}?`;
  };

  const renderQuestion2 = () => {
    if (requestDetails?.isCurrentEmployer) {
      return 'Jei darbuotojas nuspręstų išeiti, ar priimtumėte jį atgal ateityje?';
    }
    return 'Ar priimtumėte šį asmenį dirbti atgal?';
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
                {errorMessage}
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
           <CardTitle className="text-2xl font-bold text-green-800 dark:text-green-300">Ačiū už Jūsų indėlį į skaidrumą.</CardTitle>
        </CardHeader>
        <CardContent className="p-8">
            <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200">Jūs ką tik padėjote kolegai. O kaip Jūs šiandien valdote savo vairuotojų rizikas?</h3>
            <p className="text-base text-slate-600 dark:text-slate-400 mt-2 mb-6">
            „Nuojauta“ transporto versle kainuoja per brangiai. Prisijunkite prie bendruomenės, kuri sprendimus priima remdamasi faktais.
           </p>
           <Button asChild className="w-full bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition h-auto text-base">
              <Link href="/signup">
                  Prisijungti prie Patikimų Vežėjų
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
            Įmonė <span className="font-semibold text-foreground">{requestDetails?.requesterCompany}</span> prašo informacijos apie vairuotoją:
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center border-b pb-4">
            <h3 className="text-xl font-bold">{requestDetails?.driverName}
                {requestDetails?.driverBirthDate && <span className="text-muted-foreground text-lg font-normal ml-2">(g. {requestDetails.driverBirthDate})</span>}
            </h3>
          </div>
          
          <div className="space-y-3">
              <label className="font-medium">1. {renderQuestion1()}</label>
              <div className="flex gap-3">
                  <Button type="button" variant={answers.workedHere === true ? 'default' : 'outline'} onClick={() => setAnswers(prev => ({...prev, workedHere: true}))} className="flex-1">Taip</Button>
                  <Button type="button" variant={answers.workedHere === false ? 'default' : 'outline'} onClick={() => setAnswers(prev => ({...prev, workedHere: false}))} className="flex-1">Ne</Button>
              </div>
          </div>

          <div className="space-y-3">
              <label className="font-medium">2. {renderQuestion2()}</label>
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

    