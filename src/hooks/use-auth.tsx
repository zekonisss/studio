
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
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userProfile = await storage.getUserById(firebaseUser.uid);
          // If user exists in Auth, but not in Firestore, they need to create a profile.
          if (userProfile) {
            setUser(userProfile);
          } else {
             // This case is handled by the login page redirecting to /auth/create-profile
             setUser({ id: firebaseUser.uid, email: firebaseUser.email } as UserProfile); // Temporary user object
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
        // This case will now be handled by the effect on the login page
        router.push('/auth/create-profile');
        toast({ title: t('toast.login.success.title'), description: t('toast.login.error.noProfile') });
        return;
      }
      
      setUser(userProfile);

      if (userProfile.isAdmin) {
        router.replace('/admin');
        toast({ title: t('toast.login.success.title') });
        return;
      }

      if (userProfile.paymentStatus === 'active') {
        router.replace('/dashboard');
        toast({ title: t('toast.login.success.title') });
      } else {
        await signOut(auth); // Sign out if they can't access the dashboard
        let errorMsg;
        switch (userProfile.paymentStatus) {
            case 'pending_verification':
                errorMsg = t('toast.login.error.pendingVerification');
                break;
            case 'pending_payment':
                errorMsg = t('toast.login.error.pendingPayment');
                break;
            case 'inactive':
            default:
                errorMsg = t('toast.login.error.inactive');
                break;
        }
        throw new Error(errorMsg);
      }
    } catch (error: any) {
      let description = error.message;
       if (error.code === 'auth/invalid-credential' || error.message.includes('Failed to find user profile')) {
        description = t('toast.login.error.invalidCredentials');
      }
      toast({
        variant: 'destructive',
        title: t('toast.login.error.title'),
        description: description,
      });
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

 const signup = async (values: SignUpFormValues): Promise<void> => {
    setLoading(true);
    try {
      const existingUser = await storage.findUserByEmail(values.email);
      if (existingUser) {
        throw new Error(t('toast.signup.error.emailExists'));
      }
      
      // Step 1: Create user in Firebase Authentication ONLY.
      await createUserWithEmailAndPassword(auth, values.email, values.password);

      // Step 2: Redirect to the create-profile page. The onAuthStateChanged will handle the user state.
      // The profile will be created there by the authenticated user.
      toast({
          title: t('toast.signup.success.title'),
          description: t('toast.signup.success.description_create_profile'),
      });

      router.push('/auth/create-profile');

    } catch(error: any) {
        let errorMessage = error.message;
        if (error.code === 'auth/email-already-in-use') {
            errorMessage = t('toast.signup.error.emailExists');
        } else if (error.code === 'auth/weak-password') {
            errorMessage = t('signup.form.password.label') + ' must be at least 8 characters long.';
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
