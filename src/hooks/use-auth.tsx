"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: any;
  login: (values: any) => Promise<void>;
  signup: (data: any) => Promise<any>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true); // Pradedame nuo true!
  const router = useRouter();

// 1️⃣ UŽKRAUNAME SESIJĄ IŠ LOCAL STORAGE
useEffect(() => {
  const savedUser = localStorage.getItem('auth_user');
  if (savedUser) {
    setUser(JSON.parse(savedUser));
  }
  setIsLoading(false);
}, []);

// 2️⃣ DEBUG – STEBIM REALŲ USER OBJEKTĄ
useEffect(() => {
  console.log('AUTH USER FROM LOCALSTORAGE:', user);
}, [user]);

  const login = async (values: any) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!response.ok) throw new Error("Klaida");

      const userData = await response.json();
      
      // IŠSAUGOME Į LOCAL STORAGE
      localStorage.setItem('auth_user', JSON.stringify(userData));
      setUser(userData);

      if (userData.role?.toUpperCase() === 'ADMIN') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    } catch (error: any) {
      alert("Prisijungti nepavyko");
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_user');
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, login, signup: async () => {}, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth error');
  return context;
};