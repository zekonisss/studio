
"use client";

import type { UserProfile } from '@/types';
import type { LoginFormValues, SignUpFormValues } from '@/lib/schemas';
import React, { useEffect, useState, useContext, createContext } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/language-context';
import * as storage from '@/lib/storage';
import { useRouter } from 'next/navigation';

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
    // Simulate checking for a logged-in user in localStorage
    try {
      const storedUser = localStorage.getItem('drivercheck-user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
      localStorage.removeItem('drivercheck-user');
    }
    setLoading(false);
  }, []);

  const updateUserInContext = async (updatedUser: UserProfile) => {
    setUser(updatedUser);
    localStorage.setItem('drivercheck-user', JSON.stringify(updatedUser));
    await storage.updateUserProfile(updatedUser.id, updatedUser); // This will update the mock data array
  };

  const login = async (values: LoginFormValues): Promise<void> => {
    setLoading(true);
    const loggedInUser = await storage.findUserByEmail(values.email);

    if (loggedInUser) {
       // In a real scenario, you'd check the password. Here, we just log in.
      setUser(loggedInUser);
      localStorage.setItem('drivercheck-user', JSON.stringify(loggedInUser));
      toast({
          title: t('toast.login.success.title'),
          description: t('toast.login.success.description'),
      });
      const targetPath = loggedInUser.isAdmin ? '/admin' : '/dashboard';
      router.push(targetPath);
    } else {
      toast({
        variant: 'destructive',
        title: t('toast.login.error.title'),
        description: t('toast.login.error.invalidCredentials'),
      });
    }
    setLoading(false);
  };

  const signup = async (values: SignUpFormValues): Promise<void> => {
    setLoading(true);
    const existingUser = await storage.findUserByEmail(values.email);
    if (existingUser) {
      toast({ variant: 'destructive', title: t('toast.signup.error.title'), description: t('toast.signup.error.emailExists') });
      setLoading(false);
      return;
    }

    const newUser = await storage.createUser(values);
    
    toast({
        title: t('toast.signup.success.title'),
        description: t('toast.signup.success.description'),
    });

    // In this mock version, we don't need to log in the user,
    // they are just redirected to a page informing about approval.
    router.push('/auth/pending-approval');
    setLoading(false);
  };

  const logout = async () => {
    setUser(null);
    localStorage.removeItem('drivercheck-user');
    router.push('/auth/login');
    toast({ title: t('toast.logout.success.title') });
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
