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
          // Add a small delay to stabilize Firestore connection
          await new Promise(resolve => setTimeout(resolve, 50));

          const userProfile = await storageApi.getUserById(firebaseUser.uid);
          if (userProfile) {
            setUser(userProfile);
          } else {
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
    try {
        const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
        return userCredential.user;
    } catch (error: any) {
        console.error("Login failed:", error);
        toast({
            title: "Prisijungimo klaida",
            description: error.message || "Patikrinkite el. paštą ir slaptažodį.",
            variant: "destructive",
        });
        throw error;
    }
  };

  const signup = async (values: SignupFormValuesExtended) => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
        const fbUser = userCredential.user;

        const newUserProfile: Omit<UserProfile, 'id' | 'registeredAt' | 'accountActivatedAt'> = {
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
          subUsers: [],
        };

        await setDoc(doc(db, "users", fbUser.uid), {
            ...newUserProfile,
            registeredAt: serverTimestamp(),
            accountActivatedAt: null,
        });
        
    } catch (error: any) {
        console.error("Signup failed:", error);
        toast({
            title: "Registracijos klaida",
            description: error.message || "Nepavyko užregistruoti vartotojo.",
            variant: "destructive",
        });
        throw error;
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    router.push('/login');
  };
  
  const updateUserInContext = async (updatedUserData: Partial<UserProfile>) => {
    if (user) {
        try {
            // 1. First, update Firestore
            await storageApi.updateUserProfile(user.id, updatedUserData); 
            
            // 2. Only on success, update the local state
            const newUserData = { ...user, ...updatedUserData };
            setUser(newUserData);
        } catch (error: any) {
            console.error("Failed to update user context and Firestore:", error);
            toast({
                title: "Atnaujinimo klaida",
                description: "Nepavyko išsaugoti pakeitimų serveryje.",
                variant: "destructive",
            });
            throw error;
        }
    }
  };

  const value = { user, loading, login, signup, logout, updateUserInContext };

  return (
    <AuthContext.Provider value={value}>
      {loading ? null : children}
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
