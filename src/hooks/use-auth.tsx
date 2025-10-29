"use client";

import type { UserProfile } from '@/types';
import type { LoginFormValues, SignupFormValuesExtended } from '@/lib/schemas';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';
import { MOCK_ADMIN_USER } from '@/lib/mock-data';
import { useLanguage } from '@/contexts/language-context';
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
    // Simulate fetching the logged-in user
    setLoading(true);
    setTimeout(() => {
      // In this version, we always set the mock admin user
      setUser(MOCK_ADMIN_USER);
      setLoading(false);
    }, 500);
  }, []);

  const login = async (values: LoginFormValues) => {
    console.log("Simulating login with:", values);
    setLoading(true);
    // In a real Firebase app, you would use signInWithEmailAndPassword
    setTimeout(() => {
        setUser(MOCK_ADMIN_USER);
        setLoading(false);
        toast({
          title: t('toast.login.success.title'),
          description: t('toast.login.success.description'),
        });
        router.push('/dashboard');
    }, 1000);
    return Promise.resolve();
  };

  const signup = async (values: SignupFormValuesExtended) => {
    console.log("Simulating signup with:", values);
    toast({
      title: t('toast.signup.success.title'),
      description: "Ši funkcija yra imituojama.",
    });
    router.push('/login');
    return Promise.resolve();
  };

  const logout = async () => {
    console.log("Simulating logout.");
    setLoading(true);
    setTimeout(() => {
        setUser(null);
        setLoading(false);
        toast({ title: t('toast.logout.success.title') });
        router.push('/login');
    }, 500);
    return Promise.resolve();
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
