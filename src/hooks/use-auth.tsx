
"use client";

import type { UserProfile } from '@/types';
import type { LoginFormValues, SignupFormValuesExtended } from '@/lib/schemas';
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
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
  loading: boolean;
  login: (values: LoginFormValues) => Promise<void>;
  signup: (values: SignupFormValuesExtended) => Promise<void>;
  logout: () => Promise<void>;
  updateUserInContext: (updatedUser: UserProfile) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const { auth } = getFirebase();
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      setFirebaseUser(fbUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (firebaseUser) {
        setLoading(true);
        try {
          const userProfile = await storage.getUserById(firebaseUser.uid);
          if (userProfile) {
            setUser(userProfile);
          } else {
            // This case can happen if a user is created in Auth but their Firestore doc fails to be created
            // Or if a user is deleted from Firestore but not Auth
            console.warn("User authenticated with Firebase, but no Firestore profile found.");
            const { auth } = getFirebase();
            await signOut(auth); // Log out to prevent inconsistent state
            setUser(null);
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          toast({
            variant: "destructive",
            title: "Autentifikacijos Klaida",
            description: "Nepavyko gauti vartotojo profilio. Bandykite perkrauti puslapį.",
          });
          setUser(null); // Ensure user is null on error
        } finally {
          setLoading(false);
        }
      } else {
        setUser(null);
      }
    };
    
    fetchUserProfile();
  }, [firebaseUser, toast]);

  const login = async (values: LoginFormValues) => {
    const { auth } = getFirebase();
    await signInWithEmailAndPassword(auth, values.email, values.password);
    // onAuthStateChanged will handle setting the user state
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
    setFirebaseUser(null);
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

