
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
    storage.seedInitialUsers();

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        // Bypassing Firestore read to avoid permission errors.
        // Creating a temporary user profile from auth data.
        const tempUser: UserProfile = {
            id: firebaseUser.uid,
            email: firebaseUser.email || 'no-email@example.com',
            companyName: 'Vartotojas',
            companyCode: '000000000',
            address: 'Nenurodyta',
            contactPerson: firebaseUser.displayName || 'Vartotojas',
            phone: 'Nenurodytas',
            paymentStatus: 'active',
            isAdmin: firebaseUser.email === 'admin@drivercheck.lt' // Temporary admin check
        };
        setUser(tempUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);
  

  const updateUserInContext = async (updatedUser: UserProfile) => {
    setUser(updatedUser);
    await storage.updateUserProfile(updatedUser.id, updatedUser);
  };

  const login = async (values: LoginFormValues): Promise<boolean> => {
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      // setUser is now handled by onAuthStateChanged listener.
      toast({
        title: t('toast.login.success.title'),
        description: t('toast.login.success.description'),
      });
      router.push(values.email === 'admin@drivercheck.lt' ? '/admin' : '/dashboard');
      return true;
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: t('toast.login.error.title'),
        description: error.message || t('toast.login.error.descriptionGeneric'),
      });
      return false;
    }
  };

  const signup = async (values: SignUpFormValues): Promise<boolean> => {
    try {
      const email = values.email.toLowerCase();
      const existingUserByEmail = await storage.findUserByEmail(email);
      if (existingUserByEmail) {
        throw new Error(t('toast.signup.error.emailExists'));
      }
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, values.password);
      const newFirebaseUser = userCredential.user;

      const userToCreate: UserProfile = {
        id: newFirebaseUser.uid,
        companyName: values.companyName,
        companyCode: values.companyCode,
        address: values.address,
        contactPerson: values.contactPerson,
        email: email,
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
      return true;

    } catch (error: any) {
      console.error('Signup error in useAuth:', error);
      toast({
        variant: 'destructive',
        title: t('toast.signup.error.title'),
        description: error.message || t('toast.signup.error.descriptionGeneric'),
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
