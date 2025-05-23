"use client";

import type { UserProfile } from '@/types';
import type { LoginFormValues, SignUpFormValues } from '@/lib/schemas';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { MOCK_USER } from '@/types'; // Import mock user

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (values: LoginFormValues) => Promise<void>;
  signup: (values: SignUpFormValues) => Promise<void>;
  logout: () => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Simulate checking auth state on mount
    const checkAuthState = async () => {
      setLoading(true);
      // In a real app, you'd check Firebase auth state or a token
      const storedUser = localStorage.getItem('driverShieldUser');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
      setLoading(false);
    };
    checkAuthState();
  }, []);

  const login = async (values: LoginFormValues) => {
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (values.email === MOCK_USER.email) { // Simplified check
      const loggedInUser = { ...MOCK_USER };
      setUser(loggedInUser);
      localStorage.setItem('driverShieldUser', JSON.stringify(loggedInUser));
      router.push('/dashboard');
    } else {
      throw new Error("Neteisingas el. paštas arba slaptažodis.");
    }
    setLoading(false);
  };

  const signup = async (values: SignUpFormValues) => {
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    // In a real app, this would create a user in Firebase Auth
    // For now, we'll just log it and redirect to a verify email page.
    console.log("Signup values:", values);
    // Simulate user creation and needing verification
    router.push('/auth/verify-email');
    setLoading(false);
  };

  const logout = async () => {
    setLoading(true);
    setUser(null);
    localStorage.removeItem('driverShieldUser');
    // In a real app, you'd sign out from Firebase
    await new Promise(resolve => setTimeout(resolve, 500));
    router.push('/auth/login');
    setLoading(false);
  };
  
  const sendVerificationEmail = async () => {
    console.log("Simulating sending verification email...");
    await new Promise(resolve => setTimeout(resolve, 1000));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, sendVerificationEmail }}>
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
