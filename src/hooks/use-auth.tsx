
"use client";

import type { UserProfile } from '@/types';
import type { LoginFormValues, SignupFormValues } from '@/lib/schemas';
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
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (values: LoginFormValues) => Promise<void>;
  signup: (values: SignupFormValues) => Promise<void>;
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
        // User is signed in, see docs for a list of available properties
        // https://firebase.google.com/docs/reference/js/firebase.User
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setUser({ id: firebaseUser.uid, ...userDoc.data() } as UserProfile);
        } else {
          // Handle case where user exists in Auth but not in Firestore
          // This might happen if Firestore profile creation fails after auth creation
           setUser({
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              companyName: '',
              companyCode: '',
              address: '',
              contactPerson: '',
              phone: '',
              paymentStatus: 'pending_verification',
              isAdmin: false,
              agreeToTerms: true,
              registeredAt: new Date(),
              subUsers: [],
            });
        }
      } else {
        // User is signed out
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

  const signup = async (values: SignupFormValues) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const newUser = userCredential.user;
      
      // NOTE: Temporarily disabling Firestore profile creation on signup
      // to fix registration getting stuck.
      // We will re-enable this later.
      /*
      const userProfile: Omit<UserProfile, 'id'> = {
        email: newUser.email || '',
        companyName: '',
        companyCode: '',
        address: '',
        contactPerson: '',
        phone: '',
        paymentStatus: 'pending_verification',
        isAdmin: false,
        agreeToTerms: true,
        registeredAt: new Date().toISOString(),
        subUsers: [],
      };

      await setDoc(doc(db, "users", newUser.uid), userProfile);
      */
      
      toast({ title: t('toast.signup.success.title'), description: t('toast.signup.success.description') });
       // signOut after registration to force login/wait for approval
      await signOut(auth);
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
    console.log("Updating user in context", updatedUserData);
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
