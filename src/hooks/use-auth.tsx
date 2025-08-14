
"use client";

import type { UserProfile } from '@/types';
import type { LoginFormValues, SignUpFormValues } from '@/lib/schemas';
import React, { useEffect, useState, useContext, createContext } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/language-context';
import * as storage from '@/lib/storage';
import { useRouter } from 'next/navigation';
import { MOCK_ADMIN_USER, MOCK_TEST_CLIENT_USER } from '@/lib/mock-data';

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
    // Simulate checking auth state on component mount
    try {
      const storedUser = sessionStorage.getItem('drivercheck-user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.error("Could not parse user from sessionStorage", e);
      sessionStorage.removeItem('drivercheck-user');
    }
    setLoading(false);
  }, []);

  const updateUserInContext = async (updatedUser: UserProfile) => {
    setUser(updatedUser);
    try {
        sessionStorage.setItem('drivercheck-user', JSON.stringify(updatedUser));
    } catch(e) {
        console.error("Could not update user in sessionStorage", e)
    }
    await storage.updateUserProfile(updatedUser.id, updatedUser);
  };

  const login = async (values: LoginFormValues): Promise<void> => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay

    let foundUser: UserProfile | null = null;
    if (values.email.toLowerCase() === MOCK_ADMIN_USER.email.toLowerCase()) {
      foundUser = MOCK_ADMIN_USER;
    } else if (values.email.toLowerCase() === MOCK_TEST_CLIENT_USER.email.toLowerCase()) {
      foundUser = MOCK_TEST_CLIENT_USER;
    }

    if (foundUser) {
      setUser(foundUser);
       try {
        sessionStorage.setItem('drivercheck-user', JSON.stringify(foundUser));
      } catch (e) {
        console.error("Could not set user in sessionStorage", e);
      }
      toast({
        title: t('toast.login.success.title'),
        description: t('toast.login.success.description'),
      });
      const targetPath = foundUser.isAdmin ? '/admin' : '/dashboard';
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
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast({
        title: t('toast.signup.success.title'),
        description: t('toast.signup.success.description'),
    });
    
    router.push('/auth/pending-approval');
    setLoading(false);
  };

  const logout = async () => {
    setUser(null);
    try {
      sessionStorage.removeItem('drivercheck-user');
    } catch (e) {
        console.error("Could not remove user from sessionStorage", e);
    }
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
