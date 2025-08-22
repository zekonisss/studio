
"use client";

import type { UserProfile } from '@/types';
import React, { createContext, useContext, useState } from 'react';
import { MOCK_ADMIN_USER } from '@/lib/mock-data';

// Since there is no login, we will always use the mock admin user.
// This allows the rest of the application to function as if a user is logged in.

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  updateUserInContext: (updatedUser: UserProfile) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(MOCK_ADMIN_USER);
  const loading = false;

  const updateUserInContext = async (updatedUser: UserProfile) => {
      // In a real app, this would also update the backend.
      setUser(updatedUser);
      console.log("Mock user context updated.", updatedUser);
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
