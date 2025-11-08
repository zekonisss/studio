"use client";

import type { UserProfile } from '@/types';
import type { LoginFormValues, SignupFormValuesExtended } from '@/lib/schemas';
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { auth, db } from '@/lib/firebase';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged,
    type User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, getDoc, Timestamp } from "firebase/firestore";
import * as storage from '@/lib/storage';
import { useToast } from './use-toast';


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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userProfile = await storage.getUserById(firebaseUser.uid);
          if (userProfile) {
            setUser(userProfile);
          } else {
            // This case might happen if a user is authenticated in Firebase
            // but their profile document doesn't exist in Firestore.
            setUser(null); 
            console.warn("User is authenticated, but no profile found in Firestore.");
          }
        } catch (error: any) {
          console.error("Failed to get document because the client is offline or other error:", error);
          toast({
            variant: "destructive",
            title: "Diagnostikos Klaida: Firestore Nepasiekiama",
            description: `Nepavyko gauti vartotojo profilio. Priežastis: ${error.message}. Tai tikriausiai reiškia, kad Firestore duomenų bazė nėra sukurta arba aktyvuota.`,
            duration: 10000,
          });
          // Still set user to null and stop loading to prevent infinite loop
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);

  const login = async (values: LoginFormValues) => {
    await signInWithEmailAndPassword(auth, values.email, values.password);
  };

  const signup = async (values: SignupFormValuesExtended) => {
    const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
    const firebaseUser = userCredential.user;

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

    await setDoc(doc(db, "users", firebaseUser.uid), newUserProfile);
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };
  
  const updateUserInContext = async (updatedUserData: UserProfile) => {
    setUser(updatedUserData);
    if (updatedUserData.id) {
        await storage.updateUserProfile(updatedUserData.id, updatedUserData);
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
