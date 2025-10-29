"use client";

import type { UserProfile } from '@/types';
import type { LoginFormValues, SignupFormValuesExtended } from '@/lib/schemas';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';
import { MOCK_ADMIN_USER } from '@/lib/mock-data';
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
  const pathname = usePathname();
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
            const userProfile = await fetchUserProfile(firebaseUser);
            if (userProfile) {
              setUser(userProfile);
            } else {
              // This can happen if the user is authenticated in Firebase Auth but profile document doesn't exist
              // For now, we sign them out.
              await signOut(auth);
              setUser(null);
            }
        } else {
            setUser(null);
        }
        setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const fetchUserProfile = async (firebaseUser: FirebaseUser): Promise<UserProfile | null> => {
      try {
          const docRef = doc(db, "users", firebaseUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
              return { id: docSnap.id, ...docSnap.data() } as UserProfile;
          } else {
              console.log("No such user profile!");
              return null;
          }
      } catch (error) {
          console.error("Error fetching user profile:", error);
          return null;
      }
  };

  const login = async (values: LoginFormValues) => {
    setLoading(true);
    try {
        await signInWithEmailAndPassword(auth, values.email, values.password);
        toast({
          title: t('toast.login.success.title'),
          description: t('toast.login.success.description'),
        });
        router.push('/dashboard');
    } catch(error: any) {
        console.error(error);
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
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const firebaseUser = userCredential.user;

      const newUserProfile: Omit<UserProfile, 'id'> = {
        email: values.email,
        companyName: values.companyName,
        companyCode: values.companyCode,
        vatCode: values.vatCode,
        address: values.address,
        contactPerson: values.contactPerson,
        phone: values.phone,
        isAdmin: values.email === 'admin@drivercheck.lt', // Make admin if specific email
        paymentStatus: 'pending_verification',
        agreeToTerms: values.agreeToTerms,
        registeredAt: new Date().toISOString(),
        subUsers: [],
      };
      
      await setDoc(doc(db, "users", firebaseUser.uid), newUserProfile);
      
      // Logout user immediately after signup to enforce admin verification
      await signOut(auth);

      toast({
        title: t('toast.signup.success.title'),
        description: t('toast.signup.success.description'),
      });

      router.push('/login');

    } catch (error: any) {
      console.error(error);
      const description = error.code === 'auth/email-already-in-use' 
        ? t('toast.signup.error.emailExists') 
        : t('toast.signup.error.descriptionGeneric');
      toast({
        variant: "destructive",
        title: t('toast.signup.error.title'),
        description,
      });
    } finally {
        setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      toast({ title: t('toast.logout.success.title') });
      router.push('/login');
    } catch(error) {
      console.error(error);
      toast({ variant: "destructive", title: t('toast.logout.error.title')});
    } finally {
        // We don't set loading to false here, because the onAuthStateChanged listener will handle it.
    }
  };
  
  const updateUserInContext = async (updatedUserData: UserProfile) => {
    setUser(updatedUserData);
    try {
      const { id, ...dataToSave } = updatedUserData;
      await setDoc(doc(db, "users", id), dataToSave, { merge: true });
    } catch (error) {
       console.error("Error updating user profile in DB:", error);
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
