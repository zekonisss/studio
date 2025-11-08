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
import { doc, setDoc, Timestamp, getDoc } from "firebase/firestore";
import * as storageApi from '@/lib/storage';
import { useToast } from './use-toast';
import { useRouter } from 'next/navigation';

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
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUserProfileLoading(true);
        try {
          const userProfile = await storageApi.getUserById(firebaseUser.uid);
          if (userProfile) {
            setUser(userProfile);
          } else {
            console.warn("No Firestore profile found for authenticated user.");
            toast({
              variant: "destructive",
              title: "Profilio Klaida",
              description: "Jūsų profilis nerastas. Prašome susisiekti su palaikymo komanda.",
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
          setUser(null); // Clear user on error
        } finally {
          setUserProfileLoading(false);
          setLoading(false);
        }
      } else {
        setUser(null);
        setLoading(false);
        setUserProfileLoading(false);
      }
    });

    return () => unsubscribe();
  }, [toast]);


  const login = async (values: LoginFormValues) => {
    await signInWithEmailAndPassword(auth, values.email, values.password);
    // onAuthStateChanged will handle the rest, including profile fetching
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
      accountActivatedAt: undefined,
      subUsers: [],
    };

    await setDoc(doc(db, "users", fbUser.uid), newUserProfile);
    // onAuthStateChanged will handle the state update after registration
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    router.push('/login'); // Redirect to login on logout
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
