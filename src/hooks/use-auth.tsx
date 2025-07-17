
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
  login: (values: LoginFormValues) => Promise<void>;
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

  const login = async (values: LoginFormValues): Promise<void> => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
      const firebaseUser = userCredential.user;
      
      const userProfile = await storage.getUserById(firebaseUser.uid);

      if (!userProfile) {
        throw new Error("Vartotojo profilis nerastas duomenų bazėje. Susisiekite su palaikymo komanda.");
      }
      
      // CRITICAL FIX: Admins should always be able to log in.
      // Other users must have an 'active' status.
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
          throw new Error(t('toast.login.error.accessDenied'));
      }
      
      setUser(userProfile); 

      toast({
        title: t('toast.login.success.title'),
        description: t('toast.login.success.description'),
      });
      
      router.push(userProfile.isAdmin ? '/admin' : '/dashboard');

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
    } finally {
        setLoading(false);
    }
  };

 const signup = async (values: SignUpFormValues): Promise<void> => {
    try {
      const existingUser = await storage.findUserByEmail(values.email);
      if (existingUser) {
        throw new Error(t('toast.signup.error.emailExists'));
      }
    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: t('toast.signup.error.title'),
            description: error.message || t('toast.signup.error.descriptionGeneric'),
        });
        return;
    }
      
    let newFirebaseUser: FirebaseUser;
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
        newFirebaseUser = userCredential.user;
    } catch(error: any) {
        let errorMessage = error.message;
        if (error.code === 'auth/email-already-in-use') {
            errorMessage = t('toast.signup.error.emailExists');
        } else if (error.code === 'auth/weak-password') {
            errorMessage = 'Slaptažodis yra per silpnas. Jis turi būti bent 8 simbolių ilgio.';
        } else {
            errorMessage = t('toast.signup.error.descriptionGeneric');
        }
        toast({ variant: 'destructive', title: t('toast.signup.error.title'), description: errorMessage });
        return;
    }

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
    
    try {
        await storage.addUserProfile(finalUser);
    } catch(error: any) {
        toast({
            variant: 'destructive',
            title: 'Duomenų bazės klaida',
            description: `Nepavyko išsaugoti vartotojo profilio: ${error.message}`
        });
        return;
    }
    
    setUser(finalUser);
    
    toast({
        title: t('toast.signup.success.title'),
        description: t('toast.signup.success.description'),
    });
    
    router.push(isAdminRegistration ? '/admin' : '/auth/pending-approval');
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
