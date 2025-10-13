
"use client";

import type { UserProfile } from '@/types';
import type { LoginFormValues, SignupFormValuesExtended } from '@/lib/schemas';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/language-context';
import { useRouter } from 'next/navigation';
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

  useEffect(() => {
    // Simulate fetching a logged-in user
    setUser(MOCK_ADMIN_USER);
    setLoading(false);
  }, []);

  const login = async (values: LoginFormValues) => {
    console.log("Simulating login for", values.email);
    toast({ title: "Login (Demo)", description: "This is a demo. No real login happens." });
    return Promise.resolve();
  };

  const signup = async (values: SignupFormValuesExtended) => {
    console.log("Simulating signup for", values.email);
    toast({ title: "Signup (Demo)", description: "This is a demo. No real user is created." });
    return Promise.resolve();
  };

  const logout = async () => {
    console.log("Simulating logout");
    setUser(null);
    toast({ title: "Logout (Demo)" });
    router.push("/");
    return Promise.resolve();
  };
  
  const updateUserInContext = async (updatedUserData: UserProfile) => {
    setUser(updatedUserData);
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
