
"use client";

import type { UserProfile } from '@/types';
import type { LoginFormValues, SignUpFormValues } from '@/lib/schemas';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { MOCK_USER, getAllUsers, saveAllUsers } from '@/types'; // Import MOCK_USER and user management functions

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (values: LoginFormValues) => Promise<void>;
  signup: (values: SignUpFormValues) => Promise<void>;
  logout: () => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
  updateUserInContext: (updatedUser: UserProfile) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuthState = async () => {
      setLoading(true);
      const storedUserJson = localStorage.getItem('driverShieldUser');
      if (storedUserJson) {
        try {
          const storedUser = JSON.parse(storedUserJson);
          const allSystemUsers = getAllUsers();
          const currentUserData = allSystemUsers.find(u => u.id === storedUser.id);

          if (currentUserData) {
             setUser(currentUserData);
          } else {
            localStorage.removeItem('driverShieldUser');
             setUser(null);
          }

        } catch (e) {
          console.error("Failed to parse user from session storage", e);
          localStorage.removeItem('driverShieldUser');
          setUser(null);
        }
      }
      setLoading(false);
    };
    checkAuthState();
  }, []);

  const updateUserInContext = (updatedUser: UserProfile) => {
    setUser(updatedUser);
    localStorage.setItem('driverShieldUser', JSON.stringify(updatedUser));
  };

  const login = async (values: LoginFormValues) => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));

    const allSystemUsers = getAllUsers();
    const foundUser = allSystemUsers.find(u => u.email === values.email);

    if (foundUser) {
      if (foundUser.paymentStatus === 'pending_verification') {
        setLoading(false);
        router.push('/auth/pending-approval');
        throw new Error("Jūsų paskyra laukia administratoriaus tapatybės patvirtinimo.");
      }
      if (foundUser.paymentStatus === 'pending_payment') {
        setLoading(false);
        router.push('/auth/pending-approval'); // Redirect to pending, message indicates payment needed
        throw new Error("Jūsų paskyra laukia apmokėjimo patvirtinimo. Instrukcijos jums buvo 'išsiųstos'.");
      }
      if (foundUser.paymentStatus === 'inactive') {
        setLoading(false);
        throw new Error("Jūsų paskyra yra neaktyvi. Susisiekite su administratoriumi.");
      }
      // Only allow login if status is 'active' (or if it's an admin for MOCK_USER)
      if (foundUser.paymentStatus === 'active' || (foundUser.id === MOCK_USER.id && MOCK_USER.isAdmin)) {
        setUser(foundUser);
        localStorage.setItem('driverShieldUser', JSON.stringify(foundUser));
        router.push('/dashboard');
      } else {
        setLoading(false);
        throw new Error("Paskyra nėra aktyvi arba neturite prieigos.");
      }
    } else if (values.email === MOCK_USER.email) { // Fallback for the main mock user if not in localStorage yet
       if (MOCK_USER.paymentStatus === 'pending_verification') {
        setLoading(false);
        router.push('/auth/pending-approval');
        throw new Error("Jūsų paskyra laukia administratoriaus tapatybės patvirtinimo.");
      }
      if (MOCK_USER.paymentStatus === 'pending_payment') {
        setLoading(false);
        router.push('/auth/pending-approval');
        throw new Error("Jūsų paskyra laukia apmokėjimo patvirtinimo. Instrukcijos jums buvo 'išsiųstos'.");
      }
      setUser(MOCK_USER);
      localStorage.setItem('driverShieldUser', JSON.stringify(MOCK_USER));
      router.push('/dashboard');
    }
    else {
      setLoading(false);
      throw new Error("Neteisingas el. paštas arba slaptažodis.");
    }
    setLoading(false);
  };

  const signup = async (values: SignUpFormValues) => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));

    const allUsers = getAllUsers();
    if (allUsers.some(u => u.email === values.email)) {
      setLoading(false);
      throw new Error("Vartotojas su tokiu el. paštu jau egzistuoja.");
    }

    const newUserId = `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newUserProfile: UserProfile = {
      id: newUserId,
      companyName: values.companyName,
      companyCode: values.companyCode,
      vatCode: values.vatCode || undefined,
      address: values.address,
      contactPerson: values.contactPerson,
      email: values.email,
      phone: values.phone,
      paymentStatus: 'pending_verification', // Initial status
      isAdmin: false,
      agreeToTerms: values.agreeToTerms,
    };

    const updatedUsers = [...allUsers, newUserProfile];
    saveAllUsers(updatedUsers);

    console.log("New user registered (pending verification):", newUserProfile);
    router.push('/auth/pending-approval');
    setLoading(false);
  };

  const logout = async () => {
    setLoading(true);
    setUser(null);
    localStorage.removeItem('driverShieldUser');
    await new Promise(resolve => setTimeout(resolve, 500));
    router.push('/auth/login');
    setLoading(false);
  };

  const sendVerificationEmail = async () => {
    console.log("Simulating admin notification / user pending state...");
    await new Promise(resolve => setTimeout(resolve, 1000));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, sendVerificationEmail, updateUserInContext }}>
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
