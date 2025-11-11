
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
  login: (values: LoginFormValues) => Promise<FirebaseUser>;
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

  const fetchAndSetUser = useCallback(async (firebaseUser: FirebaseUser | null) => {
    if (firebaseUser) {
      setUserProfileLoading(true);
      try {
        const userProfile = await storageApi.getUserById(firebaseUser.uid);
        if (userProfile) {
          setUser(userProfile);
          return userProfile;
        } else {
          console.warn("No Firestore profile found for authenticated user:", firebaseUser.uid);
          await signOut(auth); // Sign out user without a profile
          setUser(null);
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
        setUser(null);
      } finally {
        setUserProfileLoading(false);
      }
    } else {
      setUser(null);
    }
    return null;
  }, []);


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      // Always set loading to true at the beginning of a state change check
      setLoading(true); 
      await fetchAndSetUser(firebaseUser);
      // Set loading to false only after the user profile has been fetched (or not found)
      setLoading(false);
    });

    return () => unsubscribe();
  }, [fetchAndSetUser]);


  const login = async (values: LoginFormValues): Promise<FirebaseUser> => {
    const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
    const firebaseUser = userCredential.user;
    // After successful login, immediately fetch and set the user in context.
    // This will trigger a re-render in consumers of the context BEFORE the redirect happens.
    if (firebaseUser) {
        await fetchAndSetUser(firebaseUser);
    }
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
      registeredAt: Timestamp.now(),
      accountActivatedAt: undefined,
      subUsers: [],
    };

    await setDoc(doc(db, "users", fbUser.uid), newUserProfile);
    // Set user immediately after creating profile in DB
    setUser({ id: fbUser.uid, ...newUserProfile });
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    // Force a hard redirect to the login page to clear any state.
    router.push('/login');
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
