
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
import { doc, setDoc, Timestamp, getDoc, serverTimestamp } from "firebase/firestore";
import * as storageApi from '@/lib/storage';
import { useToast } from './use-toast';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (values: LoginFormValues) => Promise<FirebaseUser>;
  signup: (values: SignupFormValuesExtended) => Promise<void>;
  logout: () => Promise<void>;
  updateUserInContext: (updatedUser: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        try {
          const userProfile = await storageApi.getUserById(firebaseUser.uid);
          if (userProfile) {
            setUser(userProfile);
          } else {
            // This case might happen if the Firestore user document creation fails after auth creation.
            console.warn("No Firestore profile found for authenticated user:", firebaseUser.uid);
            await signOut(auth); // Log out the user to prevent inconsistent state
            setUser(null);
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);


  const login = async (values: LoginFormValues): Promise<FirebaseUser> => {
    const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
    const firebaseUser = userCredential.user;
    
    // The onAuthStateChanged listener will handle fetching the profile and setting the user state.
    // This simplifies logic and avoids race conditions.
    
    return firebaseUser;
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
      registeredAt: serverTimestamp(),
      accountActivatedAt: null,
      subUsers: [],
    };

    await setDoc(doc(db, "users", fbUser.uid), newUserProfile);
    
    // The onAuthStateChanged listener will pick up the new user and set the state.
    // We don't need to call setUser here directly.
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    // Redirecting here ensures a clean state after logout.
    router.push('/login');
  };
  
  const updateUserInContext = async (updatedUserData: Partial<UserProfile>) => {
    if (user) {
        const newUserData = { ...user, ...updatedUserData };
        setUser(newUserData);
        await storageApi.updateUserProfile(user.id, updatedUserData);
    }
  };

  const value = { user, loading, login, signup, logout, updateUserInContext };

  // Render children only when loading is complete to avoid flashes of incorrect content.
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
