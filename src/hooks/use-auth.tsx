"use client";

import type { UserProfile } from '@/types';
import type { LoginFormValues, SignupFormValuesExtended } from '@/lib/schemas';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getFirebase } from '@/lib/firebase';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged,
    type User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, Timestamp } from "firebase/firestore";
import * as storage from '@/lib/storage';
import { useToast } from './use-toast';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean; // This is for the initial auth check
  userProfileLoading: boolean; // This is for fetching the firestore document
  login: (values: LoginFormValues) => Promise<void>;
  signup: (values: SignupFormValuesExtended) => Promise<void>;
  logout: () => Promise<void>;
  updateUserInContext: (updatedUser: UserProfile) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true); // For initial auth state check
  const [userProfileLoading, setUserProfileLoading] = useState(false); // For fetching the profile doc
  const { toast } = useToast();

  useEffect(() => {
    const { auth } = getFirebase();
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      setUserProfileLoading(true);
      if (firebaseUser) {
        try {
          const userProfile = await storage.getUserById(firebaseUser.uid);
          if (userProfile) {
            setUser(userProfile);
          } else {
             // This can happen if user exists in Auth but not in Firestore
            console.warn("User authenticated with Firebase, but no Firestore profile found.");
            setUser(null);
            await signOut(auth); // Log out to prevent inconsistent state
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          toast({
            variant: "destructive",
            title: "Autentifikacijos Klaida",
            description: "Nepavyko gauti vartotojo profilio. Bandykite perkrauti puslapį.",
          });
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setUserProfileLoading(false);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);

  const login = async (values: LoginFormValues) => {
    const { auth } = getFirebase();
    await signInWithEmailAndPassword(auth, values.email, values.password);
    // onAuthStateChanged will handle the rest
  };

  const signup = async (values: SignupFormValuesExtended) => {
    const { auth, db } = getFirebase();
    const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
    const fbUser = userCredential.user;

    const newUserProfile: Omit<UserProfile, 'id'> = {
      email: values.email,
      companyName: values.companyName,
      companyCode: values.companyCode,
      vatCode: values.vatCode || "",
      address: values.address,
      contactPerson: values.contactPerson,
      phone: values.phone,
      paymentStatus: 'pending_verification',
      isAdmin: false,
      agreeToTerms: values.agreeToTerms,
      registeredAt: Timestamp.now(),
      accountActivatedAt: null,
      subUsers: [],
    };

    await setDoc(doc(db, "users", fbUser.uid), newUserProfile);
    // onAuthStateChanged will handle the state update
  };

  const logout = async () => {
    const { auth } = getFirebase();
    await signOut(auth);
    setUser(null);
  };
  
  const updateUserInContext = async (updatedUserData: UserProfile) => {
    setUser(updatedUserData);
    if (updatedUserData.id) {
        await storage.updateUserProfile(updatedUserData.id, updatedUserData);
    }
  };

  const value = { user, loading, userProfileLoading, login, signup, logout, updateUserInContext };

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
