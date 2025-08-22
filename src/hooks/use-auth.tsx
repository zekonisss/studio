
"use client";

import type { UserProfile } from '@/types';
import React, { createContext, useContext, useState } from 'react';
import { MOCK_ADMIN_USER } from '@/lib/mock-data';

// This hook provides a mock user context without any real authentication.
// It ensures that the application operates as if a user is always logged in.

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  updateUserInContext: (updatedUser: UserProfile) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(MOCK_ADMIN_USER);
  
  // Loading is always false as we are not performing any async operations.
  const loading = false;

  const updateUserInContext = async (updatedUser: UserProfile) => {
      // This is a mock function. In a real scenario, it would update the backend.
      setUser(updatedUser);
  };

  const value = { user, loading, updateUserInContext };

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
