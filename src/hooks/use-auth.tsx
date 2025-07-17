
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
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userProfile = await storage.getUserById(firebaseUser.uid);
          setUser(userProfile);
        } catch (error) {
          console.error("Error fetching user profile on auth state change:", error);
          setUser(null);
        }
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

  const login = async (values: LoginFormValues): Promise<void> => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
      const userProfile = await storage.getUserById(userCredential.user.uid);

      if (!userProfile) {
        await signOut(auth);
        throw new Error(t('toast.login.error.descriptionGeneric'));
      }

      // Main Logic Check: Admin or Active User
      if (userProfile.isAdmin || userProfile.paymentStatus === 'active') {
        setUser(userProfile);
        toast({
          title: t('toast.login.success.title'),
          description: t('toast.login.success.description'),
        });
        const targetPath = userProfile.isAdmin ? '/admin' : '/dashboard';
        router.replace(targetPath);
      } else {
        // Handle specific non-active statuses
        await signOut(auth); // Log out user as they don't have access
        let errorMsg;
        switch (userProfile.paymentStatus) {
            case 'pending_verification':
                errorMsg = t('toast.login.error.pendingVerification');
                break;
            case 'pending_payment':
                errorMsg = t('toast.login.error.pendingPayment');
                break;
            case 'inactive':
                errorMsg = t('toast.login.error.inactive');
                break;
            default:
                errorMsg = t('toast.login.error.accessDenied');
        }
        throw new Error(errorMsg);
      }
    } catch (error: any) {
      let description = error.message;
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        description = t('toast.login.error.invalidCredentials');
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
    setLoading(true);
    let newFirebaseUser: FirebaseUser | null = null;
    try {
      const existingUser = await storage.findUserByEmail(values.email);
      if (existingUser) {
        throw new Error(t('toast.signup.error.emailExists'));
      }
      
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      newFirebaseUser = userCredential.user;

      const isAdminRegistration = newFirebaseUser.email?.toLowerCase() === 'sarunas.zekonis@gmail.com';
      
      const newUserProfile: Omit<UserProfile, 'registeredAt'> = {
          id: newFirebaseUser.uid,
          companyName: values.companyName,
          companyCode: values.companyCode,
          address: values.address,
          contactPerson: values.contactPerson,
          email: values.email.toLowerCase(),
          phone: values.phone,
          paymentStatus: isAdminRegistration ? 'active' : 'pending_verification',
          isAdmin: isAdminRegistration,
          agreeToTerms: values.agreeToTerms,
          subUsers: [],
          vatCode: values.vatCode || '',
          accountActivatedAt: isAdminRegistration ? new Date().toISOString() : undefined,
      };

      await storage.addUserProfile(newUserProfile as UserProfile);
      
      toast({
          title: t('toast.signup.success.title'),
          description: t('toast.signup.success.description'),
      });
      
      // After successful registration and profile creation, log the user out
      // to force them to the correct pending/login page.
      await signOut(auth);
      router.replace(isAdminRegistration ? '/auth/login' : '/auth/pending-approval');

    } catch(error: any) {
        if (newFirebaseUser) {
            // Clean up orphaned Firebase Auth user if Firestore doc creation failed
            await newFirebaseUser.delete().catch(e => console.error("Failed to delete orphaned auth user:", e));
        }
        let errorMessage = error.message;
        if (error.code === 'auth/email-already-in-use') {
            errorMessage = t('toast.signup.error.emailExists');
        } else if (error.code === 'auth/weak-password') {
            errorMessage = 'Slaptažodis yra per silpnas. Jis turi būti bent 8 simbolių ilgio.';
        }
        toast({ variant: 'destructive', title: t('toast.signup.error.title'), description: errorMessage });
    } finally {
      setLoading(false);
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
