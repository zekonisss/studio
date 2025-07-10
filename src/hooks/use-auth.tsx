
"use client";

import type { UserProfile } from '@/types';
import type { LoginFormValues, SignUpFormValues } from '@/lib/schemas';
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/language-context';
import * as storage from '@/lib/storage';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from "firebase/firestore";

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (values: LoginFormValues) => Promise<boolean>;
  signup: (values: SignUpFormValues) => Promise<boolean>;
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
                 console.warn(`User with UID ${firebaseUser.uid} found in Auth, but not in Firestore. This might happen during registration.`);
                 const tempUser: UserProfile = {
                    id: firebaseUser.uid,
                    email: firebaseUser.email || 'no-email@example.com',
                    companyName: 'Vartotojas',
                    companyCode: '000000000',
                    address: 'Nenurodyta',
                    contactPerson: firebaseUser.displayName || 'Vartotojas',
                    phone: 'Nenurodytas',
                    paymentStatus: 'inactive', 
                    isAdmin: firebaseUser.email === 'admin@drivercheck.lt' 
                };
                setUser(tempUser);
            }
        } catch (error) {
            console.error("Error fetching user profile:", error);
            setUser(null);
             toast({
                variant: 'destructive',
                title: t('toast.login.error.title'),
                description: t('toast.login.error.descriptionGeneric'),
            });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [toast, t]);
  

  const updateUserInContext = async (updatedUser: UserProfile) => {
    setUser(updatedUser);
    await storage.updateUserProfile(updatedUser.id, updatedUser);
  };

  const login = async (values: LoginFormValues): Promise<boolean> => {
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      toast({
        title: t('toast.login.success.title'),
        description: t('toast.login.success.description'),
      });
      return true;
    } catch (error: any) {
      console.error("Login failed:", error.code, error.message);
      let description = t('toast.login.error.invalidCredentials');
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
          description = t('toast.login.error.invalidCredentials');
      } else {
          description = error.message || t('toast.login.error.descriptionGeneric');
      }
      toast({
        variant: 'destructive',
        title: t('toast.login.error.title'),
        description: description,
      });
      return false;
    }
  };

 const signup = async (values: SignUpFormValues): Promise<boolean> => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const newFirebaseUser = userCredential.user;

      const userToCreate: UserProfile = {
        id: newFirebaseUser.uid,
        companyName: values.companyName,
        companyCode: values.companyCode,
        address: values.address,
        contactPerson: values.contactPerson,
        email: values.email.toLowerCase(),
        phone: values.phone,
        paymentStatus: 'pending_verification',
        isAdmin: false,
        registeredAt: new Date().toISOString(),
        agreeToTerms: values.agreeToTerms,
        subUsers: [],
        vatCode: values.vatCode || '',
      };

      await storage.addUserProfile(userToCreate);
      
      await signOut(auth);

      toast({
        title: t('toast.signup.success.title'),
        description: t('toast.signup.success.description'),
      });
      
      router.push('/auth/pending-approval');
      
      return true;

    } catch (error: any) {
      console.error('Signup error in useAuth:', error);
      let errorMessage = error.message;

      if (error.code === 'auth/email-already-in-use') {
        errorMessage = t('toast.signup.error.emailExists');
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Slaptažodis yra per silpnas. Jis turi būti bent 8 simbolių ilgio.';
      } else if (error.code === 'permission-denied' || error.code?.includes('permission-denied')) {
        errorMessage = 'Prieigos klaida. Patikrinkite Firestore saugumo taisykles.';
      } else {
        errorMessage = t('toast.signup.error.descriptionGeneric');
      }

      toast({
        variant: 'destructive',
        title: t('toast.signup.error.title'),
        description: errorMessage,
      });
      return false;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
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
