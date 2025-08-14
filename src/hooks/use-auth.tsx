
"use client";

import type { UserProfile } from '@/types';
import type { LoginFormValues, SignUpFormValues } from '@/lib/schemas';
import React, { useEffect, useState, useContext, createContext } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/language-context';
import * as storage from '@/lib/storage';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User as FirebaseUser,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';


interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (values: LoginFormValues) => Promise<void>;
  signup: (values: SignUpFormValues) => Promise<void>;
  logout: () => Promise<void>;
  updateUserInContext: (updatedUser: UserProfile) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { t } = useLanguage();
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("AuthProvider: Auth state changed. Firebase user:", firebaseUser ? firebaseUser.uid : null);
      if (firebaseUser) {
        try {
            const userProfile = await storage.getUserById(firebaseUser.uid);
            console.log("AuthProvider: Fetched user profile:", userProfile);
            if (userProfile) {
                setUser(userProfile);
            } else {
                console.warn(`AuthProvider: User profile not found for UID ${firebaseUser.uid}. Forcing logout.`);
                await signOut(auth); // Force sign out if profile doesn't exist
                setUser(null);
            }
        } catch (error) {
             console.error("AuthProvider: Error fetching user profile:", error);
             await signOut(auth);
             setUser(null);
        }
      } else {
        setUser(null);
      }
      // This is crucial: set loading to false after we are done checking for a user.
      setLoading(false);
      console.log("AuthProvider: Loading set to false.");
    });

    return () => unsubscribe();
  }, []);

  const updateUserInContext = async (updatedUser: UserProfile) => {
    if (updatedUser.id) {
        setUser(updatedUser);
        await storage.updateUserProfile(updatedUser.id, updatedUser);
    }
  };

 const login = async (values: LoginFormValues): Promise<void> => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      // Let onAuthStateChanged handle setting user, just show toast here.
      toast({ title: t('toast.login.success.title'), description: t('toast.login.success.description') });
    } catch (error: any) {
      console.error("AuthProvider.login: Login failed:", error);
      let description = t('toast.login.error.descriptionGeneric');
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        description = t('toast.login.error.invalidCredentials');
      }
      toast({
        variant: 'destructive',
        title: t('toast.login.error.title'),
        description,
      });
      setLoading(false); // Ensure loading is false on error
    }
  };

  const signup = async (values: SignUpFormValues): Promise<void> => {
    setLoading(true);
    try {
      // Check for existing user first to provide a better error message
      const existingUser = await storage.findUserByEmail(values.email);
      if (existingUser) {
        throw new Error(t('toast.signup.error.emailExists'));
      }
      
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const newFirebaseUser = userCredential.user;
      const isAdmin = newFirebaseUser.email?.toLowerCase() === 'sarunas.zekonis@gmail.com';
      
      // We are creating a new object to be stored in Firestore.
      // Notice we are NOT including the `id` property here, as Firestore will generate it.
      const userProfileData: Omit<UserProfile, 'id'> = {
          email: values.email.toLowerCase(),
          companyName: values.companyName,
          companyCode: values.companyCode,
          vatCode: values.vatCode || '',
          address: values.address,
          contactPerson: values.contactPerson,
          phone: values.phone,
          paymentStatus: isAdmin ? 'active' : 'pending_verification',
          isAdmin: isAdmin,
          agreeToTerms: values.agreeToTerms,
          registeredAt: serverTimestamp(),
          accountActivatedAt: isAdmin ? serverTimestamp() : undefined,
          subUsers: [],
      };
      
      // Use the UID from the created auth user as the document ID in Firestore
      await setDoc(doc(db, "users", newFirebaseUser.uid), userProfileData);

      toast({
          title: t('toast.signup.success.title'),
          description: t('toast.signup.success.description'),
      });
      
      // Redirect to a page that informs the user their account is pending approval
      router.push('/auth/pending-approval');

    } catch(error: any) {
        let errorMessage = error.message || t('toast.signup.error.descriptionGeneric');
        // Firebase Auth might also throw this, so we handle it gracefully.
        if (error.code === 'auth/email-already-in-use') {
            errorMessage = t('toast.signup.error.emailExists');
        }
        toast({ variant: 'destructive', title: t('toast.signup.error.title'), description: errorMessage });
    } finally {
        setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null); 
      router.push('/auth/login');
      toast({ title: t('toast.logout.success.title') });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t('toast.logout.error.title'),
        description: error.message,
      });
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
