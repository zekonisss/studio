
"use client";

import type { UserProfile } from '@/types';
import type { LoginFormValues, SignUpFormValues } from '@/lib/schemas';
import React, { useEffect, useState, useContext, createContext } from 'react';
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
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';


interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (values: LoginFormValues) => Promise<void>;
  signup: (values: SignUpFormValues) => Promise<void>;
  logout: () => Promise<void>;
  updateUserInContext: (updatedUser: UserProfile) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { t } = useLanguage();
  const router = useRouter();

  useEffect(() => {
    console.log("AuthProvider: Setting up onAuthStateChanged listener.");
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("AuthProvider: onAuthStateChanged triggered. Firebase user:", firebaseUser);
      if (firebaseUser) {
        try {
            console.log(`AuthProvider: Firebase user detected (UID: ${firebaseUser.uid}). Fetching profile...`);
            const userProfile = await storage.getUserById(firebaseUser.uid);
            console.log("AuthProvider: User profile fetched from storage:", userProfile);
            if (userProfile) {
                if (userProfile.paymentStatus === 'active' && userProfile.accountActivatedAt) {
                    console.log("AuthProvider: User is active. Setting user state.");
                    setUser(userProfile);
                } else {
                    console.log(`AuthProvider: User is not active (status: ${userProfile.paymentStatus}) or accountActivatedAt is missing. Signing out.`);
                    await signOut(auth);
                    let errorMessage = t('toast.login.error.accessDenied');
                    if (userProfile.paymentStatus === 'pending_verification') {
                        errorMessage = t('toast.login.error.pendingVerification');
                    } else if (userProfile.paymentStatus === 'pending_payment') {
                        errorMessage = t('toast.login.error.pendingPayment');
                    }
                    toast({ variant: 'destructive', title: t('toast.login.error.title'), description: errorMessage });
                }
            } else {
                console.error(`AuthProvider: Auth user ${firebaseUser.uid} exists, but Firestore profile not found. Forcing logout.`);
                await signOut(auth);
            }
        } catch (error) {
             console.error("AuthProvider: Error fetching user profile:", error);
             await signOut(auth);
        }
      } else {
        console.log("AuthProvider: No Firebase user. Setting user state to null.");
        setUser(null);
      }
      console.log("AuthProvider: Setting loading to false.");
      setLoading(false);
    });

    return () => {
        console.log("AuthProvider: Cleaning up onAuthStateChanged listener.");
        unsubscribe();
    }
  }, [t, toast, router]);

  const updateUserInContext = async (updatedUser: UserProfile) => {
    console.log("AuthProvider.updateUserInContext: Updating user in context and storage. User ID:", updatedUser.id);
    setUser(updatedUser);
    await storage.updateUserProfile(updatedUser.id, updatedUser);
  };

 const login = async (values: LoginFormValues): Promise<void> => {
    console.log("AuthProvider.login: Attempting to log in for email:", values.email);
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
      console.log("AuthProvider.login: signInWithEmailAndPassword successful. UserCredential:", userCredential);
      // onAuthStateChanged will handle the rest
    } catch (error: any) {
      console.error("AuthProvider.login: Login failed:", error);
      let description = t('toast.login.error.descriptionGeneric');
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        description = t('toast.login.error.invalidCredentials');
      }
      toast({
        variant: 'destructive',
        title: t('toast.login.error.title'),
        description,
      });
       setLoading(false);
    }
  };

  const signup = async (values: SignUpFormValues): Promise<void> => {
    console.log("AuthProvider.signup: Starting registration for email:", values.email);
    setLoading(true);
    try {
      console.log("AuthProvider.signup: Checking for existing user by email:", values.email);
      const existingUser = await storage.findUserByEmail(values.email);
      if (existingUser) {
        throw new Error(t('toast.signup.error.emailExists'));
      }
       console.log("AuthProvider.signup: No existing user found. Proceeding with Firebase auth creation.");
      
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const newFirebaseUser = userCredential.user;
       console.log("AuthProvider.signup: Firebase user created. UID:", newFirebaseUser.uid);

      const isAdmin = newFirebaseUser.email?.toLowerCase() === 'sarunas.zekonis@gmail.com';
      
      const userProfileData = {
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
          registeredAt: serverTimestamp(),
          accountActivatedAt: isAdmin ? serverTimestamp() : null,
          subUsers: [],
      };
      
      console.log("AuthProvider.signup: Preparing to save user profile to Firestore for UID:", newFirebaseUser.uid);
      await setDoc(doc(db, "users", newFirebaseUser.uid), userProfileData);
      console.log("AuthProvider.signup: User profile saved to Firestore.");

      toast({
          title: t('toast.signup.success.title'),
          description: t('toast.signup.success.description'),
      });
      
      router.push('/auth/pending-approval');

    } catch(error: any) {
        console.error("AuthProvider.signup: Signup failed:", error);
        let errorMessage = error.message || t('toast.signup.error.descriptionGeneric');
        if (error.code === 'auth/email-already-in-use') {
            errorMessage = t('toast.signup.error.emailExists');
        }
        toast({ variant: 'destructive', title: t('toast.signup.error.title'), description: errorMessage });
    } finally {
        setLoading(false);
    }
  };

  const logout = async () => {
    console.log("AuthProvider.logout: Attempting to sign out.");
    try {
      await signOut(auth);
      setUser(null); 
      router.push('/auth/login');
      toast({ title: t('toast.logout.success.title') });
      console.log("AuthProvider.logout: Sign out successful.");
    } catch (error: any) {
      console.error("AuthProvider.logout: Sign out failed:", error);
      toast({
        variant: "destructive",
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
