
"use client";

import type { UserProfile } from '@/types';
import type { LoginFormValues, SignUpFormValues } from '@/lib/schemas';
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/language-context';
import * as storage from '@/lib/storage';
import { useRouter } from 'next/navigation';
import { MOCK_ADMIN_USER } from '@/lib/mock-data';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (values: LoginFormValues) => Promise<boolean>;
  signup: (values: SignUpFormValues) => Promise<boolean>;
  logout: () => Promise<void>;
  updateUserInContext: (updatedUser: UserProfile) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const USER_ID_STORAGE_KEY = 'driverCheckUserId';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { t } = useLanguage();
  const router = useRouter();

  const checkAuthState = useCallback(async () => {
    setLoading(true);
    const storedUserId = localStorage.getItem(USER_ID_STORAGE_KEY); 
    if (storedUserId) {
      try {
        await storage.seedInitialUsers(); 
        const currentUserData = await storage.getUserById(storedUserId);
        if (currentUserData) {
           setUser(currentUserData);
        } else {
          localStorage.removeItem(USER_ID_STORAGE_KEY);
          setUser(null);
        }
      } catch (e) {
        console.error("Failed to fetch user from storage", e);
        localStorage.removeItem(USER_ID_STORAGE_KEY);
        setUser(null);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    checkAuthState();
  }, [checkAuthState]);

  const updateUserInContext = async (updatedUser: UserProfile) => {
    setUser(updatedUser);
    await storage.updateUserProfile(updatedUser.id, updatedUser);
  };

  const login = async (values: LoginFormValues): Promise<boolean> => {
    // Hardcoded admin login check
    if (values.email.toLowerCase() === MOCK_ADMIN_USER.email && values.password === MOCK_ADMIN_USER.password) {
        setUser(MOCK_ADMIN_USER);
        localStorage.setItem(USER_ID_STORAGE_KEY, MOCK_ADMIN_USER.id);
        toast({
            title: t('toast.login.success.title'),
            description: t('toast.login.success.description'),
        });
        router.push('/admin');
        return true;
    }

    try {
        const userFromDb = await storage.findUserByEmail(values.email);

        if (userFromDb && userFromDb.password === values.password) {
            if (userFromDb.paymentStatus === 'active' || userFromDb.isAdmin) {
                setUser(userFromDb);
                localStorage.setItem(USER_ID_STORAGE_KEY, userFromDb.id);
                toast({
                    title: t('toast.login.success.title'),
                    description: t('toast.login.success.description'),
                });
                router.push(userFromDb.isAdmin ? '/admin' : '/dashboard');
                return true;
            } else {
                let errorMessage = t('toast.login.error.accessDenied');
                if (userFromDb.paymentStatus === 'pending_verification') errorMessage = t('toast.login.error.pendingVerification');
                else if (userFromDb.paymentStatus === 'pending_payment') errorMessage = t('toast.login.error.pendingPayment');
                else if (userFromDb.paymentStatus === 'inactive') errorMessage = t('toast.login.error.inactive');
                throw new Error(errorMessage);
            }
        } else {
            throw new Error(t('toast.login.error.invalidCredentials'));
        }
    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: t('toast.login.error.title'),
            description: error.message,
        });
        return false;
    }
  };

  const signup = async (values: SignUpFormValues): Promise<boolean> => {
    try {
      const email = values.email.toLowerCase();
      const subUserEmail = values.subUserEmail?.toLowerCase();

      const existingUser = await storage.findUserByEmail(email);
      if (existingUser) {
        throw new Error(t('toast.signup.error.emailExists'));
      }

      if (values.addOneSubUser && subUserEmail) {
        if (subUserEmail === email) {
          throw new Error(t('toast.signup.error.subUserEmailSameAsMain'));
        }
        const existingSubUser = await storage.findUserByEmail(subUserEmail);
        if (existingSubUser) {
          throw new Error(t('toast.signup.error.subUserEmailExists'));
        }
      }

      const newUserId = `user-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 7)}`;
      
      const userToCreate: UserProfile = {
        id: newUserId,
        companyName: values.companyName,
        companyCode: values.companyCode,
        address: values.address,
        contactPerson: values.contactPerson,
        email: email,
        phone: values.phone,
        password: values.password,
        paymentStatus: 'pending_verification',
        isAdmin: false,
        registeredAt: new Date().toISOString(),
        agreeToTerms: values.agreeToTerms,
        subUsers: [],
      };
      
      if (values.vatCode) {
        userToCreate.vatCode = values.vatCode;
      }
      
      if (
        values.addOneSubUser &&
        values.subUserName &&
        subUserEmail &&
        values.subUserPassword
      ) {
        userToCreate.subUsers = [
          {
            id: `subuser-${Date.now()}-${Math.random()
              .toString(36)
              .substring(2, 9)}`,
            fullName: values.subUserName,
            email: subUserEmail,
            tempPassword: values.subUserPassword,
          },
        ];
      }
      
      await storage.addUserProfile(userToCreate);

      toast({
        title: t('toast.signup.success.title'),
        description: t('toast.signup.success.description'),
      });
      return true;

    } catch (error: any) {
      console.error('Signup error in useAuth:', error);
      toast({
        variant: 'destructive',
        title: t('toast.signup.error.title'),
        description:
          error.message || t('toast.signup.error.descriptionGeneric'),
      });
      return false;
    }
  };

  const logout = async () => {
    setLoading(true);
    setUser(null);
    localStorage.removeItem(USER_ID_STORAGE_KEY);
    router.push('/auth/login');
    setLoading(false); 
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
