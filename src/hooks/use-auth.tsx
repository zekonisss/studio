
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
    const initializeAuth = async () => {
      // Ensure mock users are created in Auth and Firestore if they don't exist.
      await storage.seedInitialUsers();

      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
        if (firebaseUser) {
          try {
            const currentUserData = await storage.getUserById(firebaseUser.uid);
            if (currentUserData) {
              setUser(currentUserData);
            } else {
              // This can happen if a user exists in Auth but not in Firestore.
              // For this app's logic, we log them out.
              setUser(null);
              await signOut(auth);
            }
          } catch (e) {
            console.error("Failed to fetch user profile", e);
            setUser(null);
            await signOut(auth);
          }
        } else {
          setUser(null);
        }
        setLoading(false);
      });
      return unsubscribe;
    };

    const unsubscribePromise = initializeAuth();

    return () => {
      unsubscribePromise.then(unsubscribe => unsubscribe && unsubscribe());
    };
  }, []);

  const updateUserInContext = async (updatedUser: UserProfile) => {
    setUser(updatedUser);
    await storage.updateUserProfile(updatedUser.id, updatedUser);
  };

  const login = async (values: LoginFormValues): Promise<boolean> => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
      const userFromDb = await storage.getUserById(userCredential.user.uid);

      if (userFromDb) {
        if (userFromDb.paymentStatus === 'active' || userFromDb.isAdmin) {
          // setUser is handled by onAuthStateChanged listener, no need to set here.
          toast({
            title: t('toast.login.success.title'),
            description: t('toast.login.success.description'),
          });
          router.push(userFromDb.isAdmin ? '/admin' : '/dashboard');
          return true;
        } else {
          let errorMessage = t('toast.login.error.accessDenied');
          if (userFromDb.paymentStatus === 'pending_verification') errorMessage = t('toast.login.error.pendingVerification');
          else if (userFromDb.paymentStatus === 'pending_payment') errorMessage = t('toast.login.error.pendingPayment');
          else if (userFromDb.paymentStatus === 'inactive') errorMessage = t('toast.login.error.inactive');
          await signOut(auth);
          throw new Error(errorMessage);
        }
      } else {
        // This case is unlikely if signup is correct, but good to have.
        await signOut(auth);
        throw new Error(t('toast.login.error.invalidCredentials'));
      }
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
      // Step 1: Check if user already exists in Firestore before creating in Auth
      const email = values.email.toLowerCase();
      const existingUser = await storage.findUserByEmail(email);
      if (existingUser) {
        throw new Error(t('toast.signup.error.emailExists'));
      }
      
      if(values.addOneSubUser && values.subUserEmail){
         const subUserEmail = values.subUserEmail.toLowerCase();
         if(email === subUserEmail){
            throw new Error(t('toast.signup.error.subUserEmailSameAsMain'));
         }
         const existingSubUser = await storage.findUserByEmail(subUserEmail);
         if (existingSubUser) {
            throw new Error(t('toast.signup.error.subUserEmailExists'));
         }
      }

      // Step 2: Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, values.password);
      const newFirebaseUser = userCredential.user;

      // Step 3: Create user profile in Firestore
      const userToCreate: UserProfile = {
        id: newFirebaseUser.uid, // Use the UID from Firebase Auth
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
        vatCode: values.vatCode || '', // Ensure it's an empty string if not provided
      };
      
      if (values.addOneSubUser && values.subUserName && values.subUserEmail && values.subUserPassword) {
        userToCreate.subUsers = [{
          id: `subuser-${Date.now()}`,
          fullName: values.subUserName,
          email: values.subUserEmail.toLowerCase(),
          // Don't store passwords in Firestore
        }];
      }
      
      await storage.addUserProfile(userToCreate);

      // Step 4: Log out the newly created user until admin approval
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
      // setUser(null) is handled by onAuthStateChanged
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
