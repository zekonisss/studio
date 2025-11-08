"use client";

import type { UserProfile } from '@/types';
import type { LoginFormValues, SignupFormValuesExtended } from '@/lib/schemas';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/language-context';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged,
    type User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, getDoc } from "firebase/firestore";

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
            console.warn("User document not found in Firestore");
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

  const login = async (values: LoginFormValues) => {
    setLoading(true);
    try {
        await signInWithEmailAndPassword(auth, values.email, values.password);
        toast({
          title: t('toast.login.success.title'),
          description: t('toast.login.success.description'),
        });
        router.push('/dashboard');
    } catch (error: any) {
        console.error("Login error:", error);
        toast({
          variant: "destructive",
          title: t('toast.login.error.title'),
          description: t('toast.login.error.invalidCredentials'),
        });
    } finally {
        setLoading(false);
    }
  };

  const signup = async (values: SignupFormValuesExtended) => {
    setLoading(true);
    try {
      console.log("[SIGNUP] Starting signup process...");
      
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const firebaseUser = userCredential.user;
      console.log("[SIGNUP] User created in Firebase Auth:", firebaseUser.uid);

      const newUserProfile: Omit<UserProfile, 'id'> = {
        email: values.email,
        companyName: values.companyName,
        companyCode: values.companyCode,
        vatCode: values.vatCode,
        address: values.address,
        contactPerson: values.contactPerson,
        phone: values.phone,
        paymentStatus: 'pending_verification',
        isAdmin: false,
        agreeToTerms: values.agreeToTerms,
        registeredAt: new Date().toISOString(),
        accountActivatedAt: null,
        subUsers: [],
      };

      const userDocRef = doc(db, "users", firebaseUser.uid);
      console.log("[SIGNUP] Saving user profile to Firestore...");
      await setDoc(userDocRef, newUserProfile);
      console.log("[SIGNUP] User profile saved successfully");

      toast({
        title: t('toast.signup.success.title'),
        description: t('toast.signup.success.description'),
      });

      console.log("[SIGNUP] Redirecting to dashboard...");
      router.push('/dashboard');

    } catch (error: any) {
      console.error("[SIGNUP] Error:", error);
      console.error("[SIGNUP] Error code:", error.code);
      console.error("[SIGNUP] Error message:", error.message);
      
      let errorMessage = t('toast.signup.error.descriptionGeneric');
      
      if (error.code) {
        switch (error.code) {
          case 'auth/email-already-in-use':
            errorMessage = t('toast.signup.error.emailExists');
            break;
          case 'auth/weak-password':
            errorMessage = t('toast.signup.error.weakPassword');
            break;
          case 'auth/invalid-email':
            errorMessage = t('toast.signup.error.invalidEmail');
            break;
          default:
            errorMessage = error.message || t('toast.signup.error.descriptionGeneric');
        }
      }

      toast({
        variant: "destructive",
        title: t('toast.signup.error.title'),
        description: errorMessage,
      });
    } finally {
      setLoading(false);
      console.log("[SIGNUP] Process completed, loading set to false");
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      toast({
        title: t('toast.logout.success.title'),
        description: t('toast.logout.success.description'),
      });
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        variant: "destructive",
        title: t('toast.logout.error.title'),
        description: t('toast.logout.error.description'),
      });
    }
  };
  
  const updateUserInContext = async (updatedUserData: UserProfile) => {
    setUser(updatedUserData);
    
    try {
      if (updatedUserData.id) {
        const userDocRef = doc(db, "users", updatedUserData.id);
        const { id, ...dataWithoutId } = updatedUserData;
        await setDoc(userDocRef, dataWithoutId, { merge: true });
      }
    } catch (error) {
      console.error("Error updating user in Firestore:", error);
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
