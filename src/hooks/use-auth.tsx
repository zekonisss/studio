
"use client";

import type { UserProfile } from '@/types';
import type { LoginFormValues, SignUpFormValues } from '@/lib/schemas';
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/language-context';
import * as storage from '@/lib/storage';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User as FirebaseUser,
} from 'firebase/auth';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (values: LoginFormValues) => Promise<boolean>;
  signup: (values: SignUpFormValues) => Promise<void>;
  logout: () => Promise<void>;
  updateUserInContext: (updatedUser: UserProfile) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);


export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { t } = useLanguage();
  const router = useRouter();

  useEffect(() => {
     const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
        if (firebaseUser) {
          try {
              const userProfile = await storage.getUserById(firebaseUser.uid);
              if (userProfile) {
                  setUser(userProfile);
              } else {
                   console.warn(`User ${firebaseUser.uid} exists in Auth, but not in Firestore. Logging out.`);
                   await signOut(auth);
                   setUser(null);
              }
          } catch (error) {
              console.error("Error fetching user profile on auth state change:", error);
              toast({
                variant: 'destructive',
                title: 'Klaida gaunant profilį',
                description: 'Nepavyko gauti vartotojo profilio. Bandykite prisijungti iš naujo.',
              });
              await signOut(auth);
              setUser(null);
          }
        } else {
          setUser(null);
        }
        setLoading(false);
    });

    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const updateUserInContext = async (updatedUser: UserProfile) => {
    setUser(updatedUser);
    await storage.updateUserProfile(updatedUser.id, updatedUser);
  };

  const login = async (values: LoginFormValues): Promise<boolean> => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
      const firebaseUser = userCredential.user;
      
      const userProfile = await storage.getUserById(firebaseUser.uid);

      if (!userProfile) {
        throw new Error("Vartotojo profilis nerastas duomenų bazėje.");
      }
      
      // Admin can always log in. Regular users must have an active status.
      if (!userProfile.isAdmin && userProfile.paymentStatus !== 'active') {
          if (userProfile.paymentStatus === 'pending_verification') {
              throw new Error(t('toast.login.error.pendingVerification'));
          }
          if (userProfile.paymentStatus === 'pending_payment') {
              throw new Error(t('toast.login.error.pendingPayment'));
          }
          if (userProfile.paymentStatus === 'inactive') {
              throw new Error(t('toast.login.error.inactive'));
          }
      }
      
      setUser(userProfile); 

      toast({
        title: t('toast.login.success.title'),
        description: t('toast.login.success.description'),
      });
      
      router.push(userProfile.isAdmin ? '/admin' : '/dashboard');

      return true;
    } catch (error: any) {
      console.error("Login failed:", error);
      let description = t('toast.login.error.descriptionGeneric');
      
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
          description = t('toast.login.error.invalidCredentials');
      } else if (error.message) {
          description = error.message;
      }

      toast({
        variant: 'destructive',
        title: t('toast.login.error.title'),
        description: description,
      });
      return false;
    } finally {
        setLoading(false);
    }
  };

 const signup = async (values: SignUpFormValues): Promise<void> => {
    setIsSubmitting(true);
    try {
      // 1. Check if user already exists in Firestore by email
      const existingUser = await storage.findUserByEmail(values.email);
      if (existingUser) {
          throw { code: 'auth/email-already-in-use' };
      }
        
      // 2. Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const newFirebaseUser = userCredential.user;

      // 3. Prepare user profile data for Firestore
      const isAdminRegistration = newFirebaseUser.email?.toLowerCase() === 'sarunas.zekonis@gmail.com';
      const finalUser: UserProfile = {
          id: newFirebaseUser.uid,
          companyName: values.companyName,
          companyCode: values.companyCode,
          address: values.address,
          contactPerson: values.contactPerson,
          email: values.email.toLowerCase(),
          phone: values.phone,
          paymentStatus: isAdminRegistration ? 'active' : 'pending_verification',
          isAdmin: isAdminRegistration,
          registeredAt: new Date().toISOString(),
          agreeToTerms: values.agreeToTerms,
          subUsers: [],
          vatCode: values.vatCode || '',
          accountActivatedAt: isAdminRegistration ? new Date().toISOString() : undefined,
      };
      
      // 4. Save the complete profile to Firestore
      await storage.addUserProfile(finalUser);
      
      // 5. IMPORTANT: Manually set user state and redirect
      // This avoids the race condition with onAuthStateChanged
      setUser(finalUser);
      
      toast({
          title: t('toast.signup.success.title'),
          description: t('toast.signup.success.description'),
      });
      
      router.push(finalUser.isAdmin ? '/admin' : '/auth/pending-approval');

    } catch (error: any) {
      console.error('Signup error in useAuth:', error);
      let errorMessage = error.message;

      if (error.code === 'auth/email-already-in-use') {
        errorMessage = t('toast.signup.error.emailExists');
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Slaptažodis yra per silpnas. Jis turi būti bent 8 simbolių ilgio.';
      } else if (error.code?.includes('permission-denied')) {
        errorMessage = 'Prieigos klaida. Patikrinkite Firestore saugumo taisykles.';
      } else {
        errorMessage = t('toast.signup.error.descriptionGeneric');
      }

      toast({
        variant: 'destructive',
        title: t('toast.signup.error.title'),
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      router.push('/auth/login');
      toast({ title: t('toast.logout.success.title') });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: t('toast.logout.error.title'),
        description: error.message,
      });
    }
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const value = { user, loading, login, signup, logout, updateUserInContext };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
