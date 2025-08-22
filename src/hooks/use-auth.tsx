
"use client";

import type { UserProfile } from '@/types';
import React, { createContext, useContext } from 'react';
import { MOCK_ADMIN_USER } from '@/lib/mock-data';

// Since there is no more login, we will always use the mock admin user.
// This allows the rest of the application to function as if a user is logged in.

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: () => Promise<void>;
  signup: () => Promise<void>;
  logout: () => Promise<void>;
  updateUserInContext: (updatedUser: UserProfile) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const user = MOCK_ADMIN_USER;
  const loading = false;

  const login = async () => {};
  const signup = async () => {};
  const logout = async () => {};
  const updateUserInContext = async (updatedUser: UserProfile) => {};

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
