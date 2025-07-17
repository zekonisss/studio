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
    console.log("AuthProvider: Setting up onAuthStateChanged listener.");
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("AuthProvider: onAuthStateChanged triggered.", firebaseUser ? `User: ${firebaseUser.uid}` : "No user");
      if (firebaseUser) {
        try {
          console.log("AuthProvider: Fetching user profile for UID:", firebaseUser.uid);
          const userProfile = await storage.getUserById(firebaseUser.uid);
          if (userProfile) {
            console.log("AuthProvider: User profile found.", userProfile);
            setUser(userProfile);
          } else {
             console.error("AuthProvider: Auth user exists, but Firestore profile not found. Forcing logout.");
             await signOut(auth);
             setUser(null); 
          }
        } catch (error) {
          console.error("AuthProvider: Error fetching user profile:", error);
          await signOut(auth);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
      console.log("AuthProvider: Loading state set to false.");
    });
    return () => {
      console.log("AuthProvider: Cleaning up onAuthStateChanged listener.");
      unsubscribe();
    };
  }, []);

  const updateUserInContext = async (updatedUser: UserProfile) => {
    setUser(updatedUser);
    await storage.updateUserProfile(updatedUser.id, updatedUser);
  };

  const login = async (values: LoginFormValues): Promise<void> => {
    setLoading(true);
    console.log("Login: Attempting to sign in with email:", values.email);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
      console.log("Login: Firebase auth successful for UID:", userCredential.user.uid);
      
      const userProfile = await storage.getUserById(userCredential.user.uid);
      console.log("Login: Fetched profile from Firestore.", userProfile);

      if (!userProfile) {
        await signOut(auth);
        toast({ variant: 'destructive', title: t('toast.login.error.title'), description: t('toast.login.error.noProfile') });
        console.error("Login: Profile not found in Firestore. Logging out.");
        return;
      }
      
      setUser(userProfile);
      console.log("Login: User state set in context.");

      if (userProfile.paymentStatus === 'active') {
        const targetPath = userProfile.isAdmin ? '/admin' : '/dashboard';
        console.log("Login: Active user. Redirecting to:", targetPath);
        router.replace(targetPath);
        toast({ title: t('toast.login.success.title') });
      } else {
         console.log("Login: Inactive user. Redirecting to pending approval.");
         router.replace('/auth/pending-approval');
      }
    } catch (error: any) {
      console.error("Login: An error occurred.", error);
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
      console.log("Login: Process finished, loading set to false.");
    }
  };

  const signup = async (values: SignUpFormValues): Promise<void> => {
    setLoading(true);
    console.log("Signup: Starting registration for email:", values.email);

    try {
      // Step 1: Check if user already exists in Firestore (reliable way)
      console.log("Signup: Checking for existing user by email...");
      const existingUser = await storage.findUserByEmail(values.email);
      if (existingUser) {
        throw new Error(t('toast.signup.error.emailExists'));
      }
      console.log("Signup: No existing user found. Proceeding with auth creation.");

      // Step 2: Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const { user: firebaseUser } = userCredential;
      console.log("Signup: Auth user created, UID:", firebaseUser.uid);

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
          accountActivatedAt: isAdmin ? Timestamp.now() : null,
          subUsers: [],
      };
      
      console.log("Signup: Attempting to save profile to Firestore...");
      await setDoc(doc(db, "users", firebaseUser.uid), userProfileData as UserProfile);
      console.log("Signup: Profile saved to Firestore successfully!");

      // Step 4: Show success and redirect
      toast({
          title: t('toast.signup.success.title'),
          description: t('toast.signup.success.description'),
      });
      
      router.push('/auth/pending-approval');
      console.log("Signup: Redirecting to pending-approval page.");

    } catch(error: any) {
        console.error("Signup: An error occurred.", error);
        let errorMessage = error.message || t('toast.signup.error.descriptionGeneric');
        if (error.code === 'auth/email-already-in-use') {
            errorMessage = t('toast.signup.error.emailExists');
        }
        toast({ variant: 'destructive', title: t('toast.signup.error.title'), description: errorMessage });
    } finally {
      setLoading(false);
      console.log("Signup: Process finished, loading set to false.");
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
