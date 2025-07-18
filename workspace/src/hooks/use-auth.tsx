
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
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { t } = useLanguage();
  const router = useRouter();

  useEffect(() => {
    console.log("AuthProvider: Setting up onAuthStateChanged listener.");
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      setFirebaseUser(fbUser);
    });
    return () => {
      console.log("AuthProvider: Cleaning up onAuthStateChanged listener.");
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const handleUserSession = async () => {
        if (firebaseUser) {
            console.log("AuthProvider: Firebase user detected (UID: " + firebaseUser.uid + "). Fetching profile...");
            try {
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
            console.log("AuthProvider: No Firebase user. Setting user to null.");
            setUser(null);
        }
        setLoading(false);
        console.log("AuthProvider: Loading state set to false.");
    };
    handleUserSession();
  }, [firebaseUser]);

  const updateUserInContext = async (updatedUser: UserProfile) => {
    setUser(updatedUser);
    await storage.updateUserProfile(updatedUser.id, updatedUser);
  };

  const login = async (values: LoginFormValues): Promise<void> => {
    setLoading(true);
    console.log("Login: Attempting to sign in with email:", values.email);
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      // onAuthStateChanged and the subsequent useEffect will handle the rest.
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
      setLoading(false);
    }
  };

  const signup = async (values: SignUpFormValues): Promise<void> => {
    setLoading(true);
    console.log("Signup: Starting registration for email:", values.email);

    try {
      console.log("Signup: Checking for existing user by email...");
      const existingUser = await storage.findUserByEmail(values.email);
      if (existingUser) {
        throw new Error(t('toast.signup.error.emailExists'));
      }
      console.log("Signup: No existing user found. Proceeding with auth creation.");

      console.log("Creating user...");
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const { user: newFirebaseUser } = userCredential;
      console.log("Created user, UID:", newFirebaseUser.uid);

      const isAdmin = newFirebaseUser.email?.toLowerCase() === 'sarunas.zekonis@gmail.com';
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
      
      console.log("Saving profile...");
      await setDoc(doc(db, "users", newFirebaseUser.uid), userProfileData);
      console.log("Profile saved!");

      toast({
          title: t('toast.signup.success.title'),
          description: t('toast.signup.success.description'),
      });
      
      router.push('/auth/pending-approval');
      console.log("Signup: Redirecting to pending-approval page.");

    } catch(error: any) {
        console.error("Signup: An error occurred.", error);
        let errorMessage = error.message || t('toast.signup.error.descriptionGeneric');
        if (error.code === 'auth/email-already-in-use' || errorMessage === t('toast.signup.error.emailExists')) {
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
      setFirebaseUser(null);
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
