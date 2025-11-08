
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
  loading: boolean; // For initial auth state check (page load)
  userProfileLoading: boolean; // For subsequent profile fetches
  login: (values: LoginFormValues) => Promise<FirebaseUser>;
  signup: (values: SignupFormValuesExtended) => Promise<void>;
  logout: () => Promise<void>;
  updateUserInContext: (updatedUser: UserProfile) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true); // For initial auth state check
  const [userProfileLoading, setUserProfileLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        setUserProfileLoading(true);
        try {
          const userProfile = await storageApi.getUserById(firebaseUser.uid);
          if (userProfile) {
            setUser(userProfile);
          } else {
            console.warn("No Firestore profile found for authenticated user:", firebaseUser.uid);
            // This might happen if user is deleted from DB but not from Auth
            // Or during signup race conditions. Force sign out.
            setUser(null);
            await signOut(auth);
          }
        } catch (error) {
          console.error("Error fetching user profile during auth state change:", error);
          toast({
            variant: "destructive",
            title: "Autentifikacijos klaida",
            description: "Nepavyko gauti vartotojo profilio. Bandykite perkrauti puslapį.",
          });
          setUser(null);
        } finally {
          setUserProfileLoading(false);
        }
      } else {
        setUser(null);
        setUserProfileLoading(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);


  const login = async (values: LoginFormValues): Promise<FirebaseUser> => {
    const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
    // onAuthStateChanged will handle setting the user profile state.
    // We return the user credential to confirm success on the login page.
    return userCredential.user;
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
    // onAuthStateChanged will set the user state after this.
    // For signup, we can optimistically set it to redirect faster.
    setUser({ id: fbUser.uid, ...newUserProfile });
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
