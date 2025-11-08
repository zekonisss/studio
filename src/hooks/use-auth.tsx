
"use client";

import type { UserProfile } from '@/types';
import type { LoginFormValues, SignupFormValuesExtended } from '@/lib/schemas';
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { app, auth, db } from '@/lib/firebase';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged,
    type User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, Timestamp, getDoc } from "firebase/firestore";
import * as storageApi from '@/lib/storage';
import { useToast } from './use-toast';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  userProfileLoading: boolean;
  login: (values: LoginFormValues) => Promise<void>;
  signup: (values: SignupFormValuesExtended) => Promise<void>;
  logout: () => Promise<void>;
  updateUserInContext: (updatedUser: UserProfile) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [userProfileLoading, setUserProfileLoading] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      setFirebaseUser(fbUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const fetchUserProfile = useCallback(async (fbUser: FirebaseUser) => {
    setUserProfileLoading(true);
    try {
      const userProfile = await storageApi.getUserById(fbUser.uid);
      if (userProfile) {
        setUser(userProfile);
      } else {
        console.warn("User authenticated with Firebase, but no Firestore profile found.");
        toast({
          variant: "destructive",
          title: "Profilio Klaida",
          description: "Jūsų profilis nerastas duomenų bazėje. Prašome susisiekti su palaikymo komanda.",
        });
        await signOut(auth);
        setUser(null);
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      toast({
        variant: "destructive",
        title: "Autentifikacijos Klaida",
        description: "Nepavyko gauti vartotojo profilio. Bandykite perkrauti puslapį.",
      });
      setUser(null);
    } finally {
      setUserProfileLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (firebaseUser) {
      fetchUserProfile(firebaseUser);
    } else {
      setUser(null);
      setUserProfileLoading(false);
    }
  }, [firebaseUser, fetchUserProfile]);


  const login = async (values: LoginFormValues) => {
    await signInWithEmailAndPassword(auth, values.email, values.password);
    // onAuthStateChanged will handle the rest
  };

  const signup = async (values: SignupFormValuesExtended) => {
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
    await signOut(auth);
    setUser(null);
    setFirebaseUser(null);
  };
  
  const updateUserInContext = async (updatedUserData: UserProfile) => {
    setUser(updatedUserData);
    if (updatedUserData.id) {
        await storageApi.updateUserProfile(updatedUserData.id, updatedUserData);
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
