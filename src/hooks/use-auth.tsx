
"use client";

import type { UserProfile } from '@/types';
import type { LoginFormValues, SignUpFormValues } from '@/lib/schemas';
import React from 'react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/language-context';
import * as appStorage from '@/lib/storage';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, setDoc, Timestamp } from 'firebase/firestore';


interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (values: LoginFormValues) => Promise<void>;
  signup: (values: SignUpFormValues) => Promise<void>;
  logout: () => Promise<void>;
  updateUserInContext: (updatedUser: UserProfile) => Promise<void>;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = React.useState<UserProfile | null>(null);
  const [loading, setLoading] = React.useState(true);
  const { toast } = useToast();
  const { t } = useLanguage();
  const router = useRouter();

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
            const userProfile = await appStorage.getUserById(firebaseUser.uid);
            if (userProfile) {
                setUser(userProfile);
            } else {
                console.error("Auth user exists, but Firestore profile not found. Forcing logout.");
                await signOut(auth);
                setUser(null);
            }
        } catch (error) {
             console.error("Error fetching user profile:", error);
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

  const updateUserInContext = async (updatedUser: UserProfile) => {
    setUser(updatedUser);
    await appStorage.updateUserProfile(updatedUser.id, updatedUser);
  };

  const login = async (values: LoginFormValues): Promise<void> => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      // onAuthStateChanged will handle setting the user, loading state, and redirects
    } catch (error: any) {
      let description = t('toast.login.error.descriptionGeneric');
       if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        description = t('toast.login.error.invalidCredentials');
      }
      toast({
        variant: 'destructive',
        title: t('toast.login.error.title'),
        description: description,
      });
      setLoading(false);
    }
  };

  const signup = async (values: SignUpFormValues): Promise<void> => {
    setLoading(true);
    let newFirebaseUser;
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      newFirebaseUser = userCredential.user;

      const isAdmin = newFirebaseUser.email?.toLowerCase() === 'admin@drivercheck.lt';
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
      
      await setDoc(doc(db, "users", newFirebaseUser.uid), userProfileData);

      toast({
          title: t('toast.signup.success.title'),
          description: "Jūsų paskyra sukurta ir laukia administratoriaus patvirtinimo.",
      });
      
      router.push('/auth/pending-approval');

    } catch(error: any) {
        let errorMessage = t('toast.signup.error.descriptionGeneric');
        if (error.code === 'auth/email-already-in-use') {
            errorMessage = t('toast.signup.error.emailExists');
        } else if (error.message.includes('firestore')) {
             errorMessage = "Klaida išsaugant profilį. Patikrinkite Firestore duomenų bazės nustatymus ir saugumo taisykles.";
        }
        
        toast({ 
            variant: 'destructive', 
            title: t('toast.signup.error.title'), 
            description: errorMessage,
            duration: 9000,
        });

        // If user was created in Auth but profile saving failed, we should probably delete the auth user
        if (newFirebaseUser) {
            console.warn("Signup: Profile creation failed, but Auth user was created. Deleting auth user to prevent orphaned account.");
            await newFirebaseUser.delete();
        }

    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      setUser(null); 
      router.push('/auth/login');
      toast({ title: t('toast.logout.success.title') });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: t('toast.logout.error.title'),
        description: error.message,
      });
    } finally {
        setLoading(false);
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
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
