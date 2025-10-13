
"use client";

import type { UserProfile } from '@/types';
import type { LoginFormValues, SignupFormValuesExtended } from '@/lib/schemas';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/language-context';
import { auth, db } from '@/lib/firebase';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (values: LoginFormValues) => Promise<void>;
  signup: (values: SignupFormValuesExtended) => Promise<void>;
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
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      if (firebaseUser) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setUser({ id: firebaseUser.uid, ...userDoc.data() } as UserProfile);
        } else {
           // This case might happen if a user is created in Auth but Firestore doc creation fails
           // Or if it's a new registration that hasn't completed profile creation
           console.log("User document doesn't exist, signing out.");
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

  const login = async (values: LoginFormValues) => {
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      toast({ title: t('toast.login.success.title'), description: t('toast.login.success.description') });
      router.push('/dashboard');
    } catch (error: any) {
      console.error("Login error:", error);
      toast({ variant: 'destructive', title: t('toast.login.error.title'), description: error.message });
    }
  };

  const signup = async (values: SignupFormValuesExtended) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const newUser = userCredential.user;
      
      const userProfile: Omit<UserProfile, 'id'> = {
        email: newUser.email || '',
        companyName: values.companyName,
        companyCode: values.companyCode,
        vatCode: values.vatCode || '',
        address: values.address,
        contactPerson: values.contactPerson,
        phone: values.phone,
        paymentStatus: 'pending_verification',
        isAdmin: false,
        agreeToTerms: values.agreeToTerms,
        registeredAt: serverTimestamp() as any, // Use serverTimestamp
        subUsers: [],
      };

      await setDoc(doc(db, "users", newUser.uid), userProfile);
      
      toast({ 
        title: t('toast.signup.success.title'), 
        description: t('toast.signup.success.description'),
        duration: 7000 
      });
      await signOut(auth); // Force user to log in after registration
      router.push('/login');
    } catch (error: any) {
       console.error("Signup error:", error);
      toast({ variant: 'destructive', title: t('toast.signup.error.title'), description: error.message });
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      router.push('/login');
      toast({ title: t('toast.logout.success.title') });
    } catch (error: any) {
       console.error("Logout error:", error);
       toast({ variant: 'destructive', title: t('toast.logout.error.title'), description: error.message });
    }
  };
  
  const updateUserInContext = async (updatedUserData: UserProfile) => {
    setUser(updatedUserData);
    await setDoc(doc(db, "users", updatedUserData.id), updatedUserData, { merge: true });
    console.log("Updating user in context and Firestore", updatedUserData);
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
