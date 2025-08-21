
"use client";

import type { UserProfile } from '@/types';
import type { LoginFormValues, SignUpFormValues } from '@/lib/schemas';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/language-context';
import * as storage from '@/lib/storage';
import { useRouter } from 'next/navigation';
import { MOCK_ADMIN_USER, MOCK_TEST_CLIENT_USER, MOCK_ALL_USERS } from '@/lib/mock-data';

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
    setLoading(true);
    try {
      const storedUser = localStorage.getItem('drivercheck-mock-user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.error("Could not access localStorage for auth", e);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateUserInContext = async (updatedUser: UserProfile) => {
    setUser(updatedUser);
    localStorage.setItem('drivercheck-mock-user', JSON.stringify(updatedUser));
  };
  
  const login = async (values: LoginFormValues) => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay

    let foundUser: UserProfile | null = null;
    if (values.email.toLowerCase() === MOCK_ADMIN_USER.email.toLowerCase()) {
        foundUser = MOCK_ADMIN_USER;
    } else if (values.email.toLowerCase() === MOCK_TEST_CLIENT_USER.email.toLowerCase()) {
        foundUser = MOCK_TEST_CLIENT_USER;
    } else {
        foundUser = MOCK_ALL_USERS.find(u => u.email.toLowerCase() === values.email.toLowerCase()) || null;
    }

    if (foundUser) {
      if (foundUser.paymentStatus === 'inactive') {
        toast({ variant: 'destructive', title: t('toast.login.error.title'), description: t('toast.login.error.inactive') });
        setLoading(false);
        return;
      }
      setUser(foundUser);
      localStorage.setItem('drivercheck-mock-user', JSON.stringify(foundUser));
      toast({ title: t('toast.login.success.title'), description: t('toast.login.success.description') });
      if (foundUser.paymentStatus === 'pending_verification' || foundUser.paymentStatus === 'pending_payment') {
         router.push('/account?tab=payment');
      } else {
         router.push('/dashboard');
      }
    } else {
      toast({ variant: 'destructive', title: t('toast.login.error.title'), description: t('toast.login.error.invalidCredentials') });
    }
    setLoading(false);
  };

  const signup = async (values: SignUpFormValues) => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const existingUser = MOCK_ALL_USERS.find(u => u.email.toLowerCase() === values.email.toLowerCase());
    if (existingUser) {
        toast({ variant: 'destructive', title: t('toast.signup.error.title'), description: t('toast.signup.error.emailExists') });
        setLoading(false);
        return;
    }

    const newUser: UserProfile = {
      id: `mock-user-${Date.now()}`,
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
      subUsers: [],
    };

    MOCK_ALL_USERS.push(newUser);

    toast({
      title: t('toast.signup.success.title'),
      description: "Jūsų paskyra sukurta ir laukia administratoriaus patvirtinimo (demonstracinė versija).",
    });
    router.push('/auth/pending-approval');
    setLoading(false);
  };

  const logout = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 300));
    setUser(null);
    localStorage.removeItem('drivercheck-mock-user');
    router.push('/auth/login');
    toast({ title: t('toast.logout.success.title') });
    setLoading(false);
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
