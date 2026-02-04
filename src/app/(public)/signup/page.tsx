
"use client";

import { useState } from "react";
import { useForm, type FieldName } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, ArrowRight, Eye, EyeOff, ShieldCheck, Search, Globe, UserPlus } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/contexts/language-context";
import { useToast } from "@/hooks/use-toast";
import { SignupFormSchema } from "@/lib/schemas";
import type { SignupFormValuesExtended } from '@/types';
import { cn } from "@/lib/utils";

type FormValues = Omit<SignupFormValuesExtended, 'subscriptionType' | 'confirmPassword'>;

const STEPS = [
    { id: 1, name: 'Identitetas', fields: ['companyName', 'companyCode'] },
    { id: 2, name: 'Detalės', fields: ['vatCode', 'address', 'phone', 'position'] },
    { id: 3, name: 'Paskyra', fields: ['contactPerson', 'email', 'password', 'agreeToTerms'] }
];

export default function SignupPage() {
    const { signup, isLoading: isAuthLoading } = useAuth();
    const { toast } = useToast();
    const { t } = useLanguage();
    const [currentStep, setCurrentStep] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(SignupFormSchema),
        defaultValues: {
            email: "",
            password: "",
            companyName: "",
            companyCode: "",
            vatCode: "",
            address: "",
            contactPerson: "",
            position: "",
            phone: "",
            agreeToTerms: false,
        },
    });

    const goToNextStep = async () => {
        const fields = STEPS[currentStep].fields as FieldName<FormValues>[];
        const output = await form.trigger(fields, { shouldFocus: true });
        if (!output) return;
        
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(step => step + 1);
        }
    };
    
    const goToPrevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(step => step - 1);
        }
    };

    const onSubmit = async (data: FormValues) => {
        setIsSubmitting(true);
        try {
            await signup(data);
            toast({
                title: t('toast.signup.success.title'),
                description: t('toast.signup.success.description'),
            });
            // Redirect is handled by the signup function/auth hook
        } catch (error: any) {
            let description = t('toast.signup.error.descriptionGeneric');
            if (error.code === 'auth/email-already-in-use') {
                description = t('toast.signup.error.emailExists');
                setCurrentStep(2); // Go to the step with the email field
                form.setError("email", { type: "manual", message: description });
            }
            toast({ variant: "destructive", title: t('toast.signup.error.title'), description: description });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="w-full max-w-6xl mx-auto min-h-[70vh] flex flex-col justify-center">
            <div className="grid lg:grid-cols-2 rounded-xl border bg-card text-card-foreground shadow-2xl overflow-hidden">
                
                {/* Marketing Sidebar */}
                <div className="hidden lg:block p-12 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950/50 border-r">
                    <div className="space-y-6">
                         <h2 className="text-3xl font-bold text-slate-800 dark:text-white">Daugiau nei duomenų bazė.</h2>
                         <p className="text-slate-600 dark:text-slate-400">DriverCheck ne tik padeda rasti informaciją, bet ir veikia kaip prevencija.</p>
                         <ul className="space-y-6 pt-4">
                            <li className="flex gap-4 items-start">
                                <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm"><ShieldCheck className="h-5 w-5 text-primary" /></div>
                                <div>
                                    <h4 className="font-semibold text-slate-800 dark:text-slate-200">Atgrasymo efektas</h4>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Vien žinojimas, kad naudojate DriverCheck, skatina vairuotojus elgtis sąžiningai.</p>
                                </div>
                            </li>
                            <li className="flex gap-4 items-start">
                                <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm"><Search className="h-5 w-5 text-primary" /></div>
                                <div>
                                    <h4 className="font-semibold text-slate-800 dark:text-slate-200">Momentinė patikra</h4>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">10 metų istorija per 3 sekundes.</p>
                                </div>
                            </li>
                             <li className="flex gap-4 items-start">
                                <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm"><Globe className="h-5 w-5 text-primary" /></div>
                                <div>
                                    <h4 className="font-semibold text-slate-800 dark:text-slate-200">Tarptautinis standartas</h4>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Prisijunkite prie skaidraus verslo bendruomenės.</p>
                                </div>
                            </li>
                         </ul>
                    </div>
                </div>

                {/* Form Section */}
                <div className="p-8 md:p-12">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                             <p className="text-sm font-medium text-primary">Žingsnis {currentStep + 1} iš {STEPS.length}</p>
                             <h2 className="text-2xl font-bold mt-1">{STEPS[currentStep].name}</h2>
                        </div>
                        <UserPlus className="h-8 w-8 text-muted-foreground/50" />
                    </div>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            
                            {/* Step 1: Company Identity */}
                            <div className={cn("space-y-6", currentStep !== 0 && "hidden")}>
                                <FormField control={form.control} name="companyName" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('signup.form.companyName.label')}</FormLabel>
                                        <FormControl><Input placeholder={t('signup.form.companyName.placeholder')} {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="companyCode" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('signup.form.companyCode.label')}</FormLabel>
                                        <FormControl><Input placeholder={t('signup.form.companyCode.placeholder')} {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </div>

                            {/* Step 2: Company Details */}
                            <div className={cn("space-y-6", currentStep !== 1 && "hidden")}>
                                <FormField control={form.control} name="vatCode" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('signup.form.vatCode.label')}</FormLabel>
                                        <FormControl><Input placeholder={t('signup.form.vatCode.placeholder')} {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                 <FormField control={form.control} name="address" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('signup.form.address.label')}</FormLabel>
                                        <FormControl><Input placeholder={t('signup.form.address.placeholder')} {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                 <FormField control={form.control} name="phone" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('signup.form.phone.label')}</FormLabel>
                                        <FormControl><Input placeholder={t('signup.form.phone.placeholder')} {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="position" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('signup.form.position.label')}</FormLabel>
                                        <FormControl><Input placeholder={t('signup.form.position.placeholder')} {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </div>
                            
                            {/* Step 3: Account Credentials */}
                            <div className={cn("space-y-6", currentStep !== 2 && "hidden")}>
                                <FormField control={form.control} name="contactPerson" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('signup.form.contactPerson.label')}</FormLabel>
                                        <FormControl><Input placeholder={t('signup.form.contactPerson.placeholder')} {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="email" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('signup.form.email.label')}</FormLabel>
                                        <FormControl><Input type="email" placeholder={t('signup.form.email.placeholder')} {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="password" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('signup.form.password.label')}</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                 <Input type={showPassword ? "text" : "password"} placeholder={t('signup.form.password.placeholder')} {...field} />
                                                 <Button type="button" variant="ghost" size="icon" className="absolute top-0 right-0 h-full px-3" onClick={() => setShowPassword(!showPassword)}>
                                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                 </Button>
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="agreeToTerms" render={({ field }) => (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 pt-2">
                                        <FormControl>
                                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                        </FormControl>
                                        <div className="space-y-1 leading-none">
                                            <FormLabel className="font-normal text-muted-foreground">
                                                {t('signup.form.agreeToTerms.labelPart1')}
                                                <Link href="/terms" target="_blank" className="underline text-primary hover:text-primary/80">
                                                    {t('signup.form.agreeToTerms.linkText')}
                                                </Link>
                                            </FormLabel>
                                            <FormMessage />
                                        </div>
                                    </FormItem>
                                )} />
                            </div>

                            {/* Navigation Buttons */}
                            <div className="flex gap-4 pt-4">
                                {currentStep > 0 && (
                                    <Button type="button" variant="outline" onClick={goToPrevStep} className="w-full">
                                        Atgal
                                    </Button>
                                )}
                                {currentStep < STEPS.length - 1 ? (
                                    <Button type="button" onClick={goToNextStep} className="w-full">
                                        Toliau <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                ) : (
                                    <Button type="submit" className="w-full" disabled={isSubmitting || isAuthLoading}>
                                        {(isSubmitting || isAuthLoading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        {t('signup.form.submitButton')}
                                    </Button>
                                )}
                            </div>

                        </form>
                    </Form>
                    <div className="mt-6 text-center text-sm text-muted-foreground">
                        {t('signup.form.alreadyHaveAccount')}
                        <Link href="/login" className="underline text-primary hover:text-primary/80">
                            {t('signup.form.loginLink')}
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
