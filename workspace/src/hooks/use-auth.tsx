
"use client";

import type { UserProfile } from '@/types';
import type { LoginFormValues, SignUpFormValues } from '@/lib/schemas';
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/language-context';
import * as storage from '@/lib/storage';
import { useRouter } from 'next/navigation';
import { getAuthInstance, getFirestoreInstance, Timestamp } from '@/lib/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User as FirebaseUser,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';


interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (values: LoginFormValues) => Promise<void>;
  signup: (values: SignUpFormValues) => Promise<void>;
  logout: () => Promise<void>;
  updateUserInContext: (updatedUser: UserProfile) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { t } = useLanguage();
  const router = useRouter();

  // Effect to listen for Firebase auth state changes
  useEffect(() => {
    const auth = getAuthInstance();
    if (!auth) {
      console.warn("AuthProvider: Firebase Auth is not available.");
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      console.log("AuthProvider: onAuthStateChanged triggered. Firebase user:", fbUser?.uid || null);
      setFirebaseUser(fbUser);
      // Set loading to false only after the first auth state is determined
      setLoading(false);
    });

    return () => {
      console.log("AuthProvider: Cleaning up onAuthStateChanged listener.");
      unsubscribe();
    };
  }, []);

  // Effect to fetch user profile from Firestore when firebaseUser state changes
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (firebaseUser) {
        // Now we are sure firebaseUser exists and has a uid
        try {
          const userProfile = await storage.getUserById(firebaseUser.uid);
          if (userProfile) {
            console.log("AuthProvider: User profile found.", userProfile);
            setUser(userProfile);
          } else {
            console.error("AuthProvider: Auth user exists, but Firestore profile not found. Forcing logout.");
            await logout();
          }
        } catch (error) {
          console.error("AuthProvider: Error fetching user profile:", error);
          await logout();
        }
      } else {
        // When firebaseUser is null (logged out or initially), clear our app's user state
        setUser(null);
      }
    };

    if (!loading) { // Only run this logic after initial auth check is complete
        fetchUserProfile();
    }
  }, [firebaseUser, loading]); // This effect depends on firebaseUser and the initial loading state

  const updateUserInContext = async (updatedUser: UserProfile) => {
    setUser(updatedUser);
    await storage.updateUserProfile(updatedUser.id, updatedUser);
  };

  const login = async (values: LoginFormValues): Promise<void> => {
    const auth = getAuthInstance();
    if (!auth) return;

    // The login process will trigger onAuthStateChanged, which will then trigger
    // the useEffect to fetch the profile. No need to fetch profile here.
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
    } catch (error: any) {
      console.error("Login: An error occurred.", error);
      let description = error.message;
       if (error.code === 'auth/invalid-credential') {
        description = t('toast.login.error.invalidCredentials');
      }
      toast({
        variant: 'destructive',
        title: t('toast.login.error.title'),
        description: description,
      });
    }
  };

  const signup = async (values: SignUpFormValues): Promise<void> => {
    const auth = getAuthInstance();
    const db = getFirestoreInstance();
    if (!auth || !db) return;

    try {
      const existingUser = await storage.findUserByEmail(values.email);
      if (existingUser) {
        throw new Error(t('toast.signup.error.emailExists'));
      }

      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const { user: newFirebaseUser } = userCredential;

      const isAdmin = newFirebaseUser.email?.toLowerCase() === 'sarunas.zekonis@gmail.com';
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
          registeredAt: Timestamp.now(),
          accountActivatedAt: isAdmin ? Timestamp.now() : undefined,
          subUsers: [],
      };
      
      await setDoc(doc(db, "users", newFirebaseUser.uid), userProfileData as UserProfile);

      toast({
          title: t('toast.signup.success.title'),
          description: t('toast.signup.success.description'),
      });
      
      router.push('/auth/pending-approval');

    } catch(error: any) {
        let errorMessage = error.message || t('toast.signup.error.descriptionGeneric');
        if (error.code === 'auth/email-already-in-use' || errorMessage === t('toast.signup.error.emailExists')) {
            errorMessage = t('toast.signup.error.emailExists');
        }
        toast({ variant: 'destructive', title: t('toast.signup.error.title'), description: errorMessage });
    }
  };

  const logout = async () => {
    const auth = getAuthInstance();
    if (!auth) return;
    try {
      await signOut(auth);
      // setFirebaseUser(null) will be called by the onAuthStateChanged listener,
      // which will then trigger the other useEffect to clear the user profile.
      router.push('/auth/login');
      toast({ title: t('toast.logout.success.title') });
    } catch (error: any) {
      toast({
        variant: 'destructive',
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
