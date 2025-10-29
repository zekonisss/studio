
"use client";

import type { UserProfile } from '@/types';
import type { LoginFormValues, SignupFormValuesExtended } from '@/lib/schemas';
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/language-context';
import { useRouter, usePathname } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged,
    type User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { MOCK_ADMIN_USER } from '@/lib/mock-data';

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
  const pathname = usePathname();

  const handleAuthChange = useCallback(async (firebaseUser: FirebaseUser | null) => {
    if (firebaseUser) {
        const userDocRef = doc(db, "users", firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
            const userProfile = userDoc.data() as UserProfile;
            setUser({ ...userProfile, id: firebaseUser.uid });
        } else {
             // This case might happen if user is created in Auth but not in Firestore.
             // For this app, we'll log them out.
            await signOut(auth);
            setUser(null);
        }
    } else {
        setUser(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, handleAuthChange);
    return () => unsubscribe();
  }, [handleAuthChange]);


  const login = async (values: LoginFormValues) => {
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      router.push('/dashboard');
    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        variant: 'destructive',
        title: t('toast.login.error.title'),
        description: t('toast.login.error.invalidCredentials')
      });
    }
  };

  const signup = async (values: SignupFormValuesExtended) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const newUser = userCredential.user;

      const userProfile: Omit<UserProfile, 'id'> = {
          email: values.email,
          companyName: values.companyName,
          companyCode: values.companyCode,
          vatCode: values.vatCode || '',
          address: values.address,
          contactPerson: values.contactPerson,
          phone: values.phone,
          paymentStatus: 'pending_verification',
          isAdmin: values.email === 'admin@drivercheck.lt',
          agreeToTerms: values.agreeToTerms,
          registeredAt: serverTimestamp(),
          subUsers: [],
      };
      
      await setDoc(doc(db, "users", newUser.uid), userProfile);
      
      toast({
          title: t('toast.signup.success.title'),
          description: t('toast.signup.success.description'),
      });

      await signOut(auth);
      router.push('/login');

    } catch (error: any) {
      console.error("Signup error:", error);
      toast({
        variant: 'destructive',
        title: t('toast.signup.error.title'),
        description: error.code === 'auth/email-already-in-use' ? t('toast.signup.error.emailExists') : t('toast.signup.error.descriptionGeneric'),
      });
    }
  };

  const logout = async () => {
    try {
        await signOut(auth);
        router.push('/login');
    } catch (error) {
        console.error("Logout error:", error);
        toast({ variant: 'destructive', title: t('toast.logout.error.title') });
    }
  };
  
  const updateUserInContext = async (updatedUserData: UserProfile) => {
    setUser(updatedUserData);
    // In a real app, this would also update the Firestore document.
    // For now, it just updates the local state.
    console.log("Simulating user update in context", updatedUserData);
    return Promise.resolve();
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
