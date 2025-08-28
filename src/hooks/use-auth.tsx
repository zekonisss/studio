"use client";

import type { UserProfile } from '@/types';
import type { LoginFormValues, SignUpFormValues } from '@/lib/schemas';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/language-context';
import { MOCK_ADMIN_USER } from '@/lib/mock-data';

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
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { t } = useLanguage();

  useEffect(() => {
    // Simulate fetching user data
    setTimeout(() => {
      setUser(MOCK_ADMIN_USER);
      setLoading(false);
    }, 500);
  }, []);

  const login = async (values: LoginFormValues): Promise<void> => {
    setLoading(true);
    console.log("Simulating login for:", values.email);
    await new Promise(res => setTimeout(res, 500));
    setUser(MOCK_ADMIN_USER);
    toast({ title: t('toast.login.success.title'), description: t('toast.login.success.description') });
    setLoading(false);
  };

  const signup = async (values: SignUpFormValues): Promise<void> => {
    setLoading(true);
    console.log("Simulating signup for:", values.email);
    await new Promise(res => setTimeout(res, 1000));
    toast({ title: "Registracija (DEMO)", description: "Ši funkcija yra demonstracinė." });
    setLoading(false);
  };

  const logout = async () => {
    console.log("Simulating logout.");
    setLoading(true);
    await new Promise(res => setTimeout(res, 300));
    setUser(null);
    setLoading(false);
    window.location.reload(); 
  };
  
  const updateUserInContext = async (updatedUserData: UserProfile) => {
    console.log("Simulating user update in context:", updatedUserData);
    setUser(updatedUserData);
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
