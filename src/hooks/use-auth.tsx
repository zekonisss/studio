"use client";

import type { UserProfile } from '@/types';
import type { LoginFormValues, SignupFormValuesExtended } from '@/lib/schemas';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { auth } from '@/lib/firebase';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged,
    type User as FirebaseUser
} from 'firebase/auth';
import * as actions from '@/lib/server/actions';
import { useToast } from './use-toast';
import { useRouter } from 'next/navigation';
import { serverTimestamp } from 'firebase/firestore';


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
          const userProfile = await actions.getUserById(firebaseUser.uid);
          if (userProfile) {
            setUser(userProfile);
          } else {
            console.warn("No Firestore profile for authenticated user, logging out:", firebaseUser.uid);
            await signOut(auth);
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
      registeredAt: serverTimestamp(),
      accountActivatedAt: null,
      subUsers: [],
    };
    
    // Call server action to create the user profile in Firestore
    await actions.createUserProfile(fbUser.uid, newUserProfile);
    
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    router.push('/login');
  };
  
  const updateUserInContext = async (updatedUserData: Partial<UserProfile>) => {
    if (user) {
        const newUserData = { ...user, ...updatedUserData };
        setUser(newUserData);
        await actions.updateUserProfile(user.id, updatedUserData);
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
