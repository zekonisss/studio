
"use client";

import type { UserProfile } from '@/types';
import type { LoginFormValues, SignUpFormValues } from '@/lib/schemas';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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
import { doc, setDoc, Timestamp } from 'firebase/firestore';


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
          // Await the async function to get the profile
          const userProfile = await storage.getUserById(firebaseUser.uid);
          if (userProfile) {
            setUser(userProfile);
          } else {
             // This case can happen if the user exists in Auth but not in Firestore.
             // For example, if Firestore document creation fails after signup.
             console.error("Auth user exists, but Firestore profile document not found. Logging out.");
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
        toast({ variant: 'destructive', title: t('toast.login.error.title'), description: t('toast.login.error.noProfile') });
        return;
      }
      
      setUser(userProfile);

      if (userProfile.paymentStatus === 'active') {
        const targetPath = userProfile.isAdmin ? '/admin' : '/dashboard';
        router.replace(targetPath);
        toast({ title: t('toast.login.success.title') });
      } else {
         router.replace('/auth/pending-approval');
      }
    } catch (error: any) {
      let description = error.message;
       if (error.code === 'auth/invalid-credential') {
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
    setIsSubmitting(true);
    try {
      // Step 1: Check if user already exists in Firestore (most reliable way)
      console.log("Checking for existing user by email...");
      const existingUser = await storage.findUserByEmail(values.email);
      if (existingUser) {
        throw new Error(t('toast.signup.error.emailExists'));
      }
      console.log("No existing user found. Proceeding with registration...");

      // Step 2: Create user in Firebase Authentication
      console.log("Creating auth user...");
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const { user: firebaseUser } = userCredential;
      console.log("Auth user created, UID:", firebaseUser.uid);

      // Step 3: Create user profile document in Firestore
      const isAdmin = firebaseUser.email?.toLowerCase() === 'sarunas.zekonis@gmail.com';
      const userProfileData: Omit<UserProfile, 'id'> = {
          email: values.email.toLowerCase(),
          companyName: values.companyName,
          companyCode: values.companyCode,
          vatCode: values.vatCode || '',
          address: values.address,
          contactPerson: values.contactPerson,
          phone: values.phone,
          paymentStatus: isAdmin ? 'active' : 'pending_verification',
          isAdmin: isAdmin,
          agreeToTerms: values.agreeToTerms,
          registeredAt: Timestamp.now(),
          accountActivatedAt: isAdmin ? Timestamp.now() : null, // Use null instead of undefined
          subUsers: [],
      };
      
      console.log("Saving profile to Firestore...");
      // This part is critical and was failing before.
      // Firestore rules require the user to be authenticated to write to their own document.
      // Since we just created the auth user, they are now authenticated for this write.
      await setDoc(doc(db, "users", firebaseUser.uid), userProfileData as UserProfile);
      console.log("Profile saved successfully!");

      // Step 4: Show success and redirect
      toast({
          title: t('toast.signup.success.title'),
          description: t('toast.signup.success.description'),
      });
      
      router.push('/auth/pending-approval');

    } catch(error: any) {
        console.error("Signup failed:", error);
        let errorMessage = error.message;
        if (error.code === 'auth/email-already-in-use') {
            errorMessage = t('toast.signup.error.emailExists');
        } else if (error.code === 'auth/weak-password') {
            errorMessage = t('signup.form.password.label') + ' must be at least 8 characters long.';
        }
        toast({ variant: 'destructive', title: t('toast.signup.error.title'), description: errorMessage });
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
  
  // Local state for the signup form specifically
  const [isSubmitting, setIsSubmitting] = useState(false);

  const value = { user, loading: loading || isSubmitting, login, signup, logout, updateUserInContext };

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
