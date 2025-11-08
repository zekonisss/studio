"use client";

import type { UserProfile } from '@/types';
import type { LoginFormValues, SignupFormValuesExtended } from '@/lib/schemas';
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/language-context';
import { auth, db } from '@/lib/firebase';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged,
    type User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, getDoc, Timestamp, updateDoc } from "firebase/firestore";
import { useRouter } from 'next/navigation';

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
  const { t } = useLanguage();
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
          try {
            const userDocRef = doc(db, "users", firebaseUser.uid);
            const userDocSnap = await getDoc(userDocRef);
            
            if (userDocSnap.exists()) {
              const userData = userDocSnap.data() as Omit<UserProfile, 'id'>;
              setUser({ id: firebaseUser.uid, ...userData });
            } else {
              console.warn("User document not found in Firestore on auth state change. Logging out.");
              await signOut(auth);
              setUser(null);
            }
          } catch (error) {
            console.error("Error fetching user profile on auth state change:", error);
            setUser(null);
          } finally {
            setLoading(false);
          }
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const login = async (values: LoginFormValues) => {
    await signInWithEmailAndPassword(auth, values.email, values.password);
    // onAuthStateChanged will handle setting the user state.
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
    // onAuthStateChanged will set the user state after signup.
  };

  const logout = async () => {
    try {
      await signOut(auth);
      // setUser(null) is handled by onAuthStateChanged
      router.push("/login");
      toast({
        title: t('toast.logout.success.title'),
      });
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        variant: "destructive",
        title: t('toast.logout.error.title'),
      });
    }
  };
  
  const updateUserInContext = async (updatedUserData: UserProfile) => {
    setUser(updatedUserData);
    
    try {
      if (updatedUserData.id) {
        const userDocRef = doc(db, "users", updatedUserData.id);
        const { id, ...dataWithoutId } = updatedUserData;
        // Firestore does not allow `id` field to be written
        const dataToUpdate = Object.fromEntries(Object.entries(dataWithoutId).map(([key, value]) => {
          if (value instanceof Date) {
            return [key, Timestamp.fromDate(value)];
          }
          return [key, value];
        }));

        await updateDoc(userDocRef, dataToUpdate);
      }
    } catch (error) {
      console.error("Error updating user in Firestore:", error);
      throw error; // Re-throw to be caught in UI
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
