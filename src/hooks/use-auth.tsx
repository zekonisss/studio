
"use client";

import type { UserProfile } from '@/types';
import type { LoginFormValues, SignUpFormValues } from '@/lib/schemas';
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/language-context';
import * as storage from '@/lib/storage';
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
          // If user ID is in storage but not in DB, clear it.
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

  const login = async (values: LoginFormValues): Promise<void> => {
    setLoading(true);
    try {
      if (
        values.email.toLowerCase() === MOCK_ADMIN_USER.email.toLowerCase() &&
        values.password === MOCK_ADMIN_USER.password
      ) {
        const adminUserFromDb = await storage.getUserById(MOCK_ADMIN_USER.id);
        if (!adminUserFromDb) {
           await storage.seedInitialUsers();
        }
        const finalAdminUser = await storage.getUserById(MOCK_ADMIN_USER.id);
        setUser(finalAdminUser);
        localStorage.setItem(USER_ID_STORAGE_KEY, MOCK_ADMIN_USER.id);
      } else {
         await storage.seedInitialUsers();
        const userFromDb = await storage.findUserByEmail(values.email);

        if (userFromDb && userFromDb.password === values.password) {
          if (userFromDb.paymentStatus === 'active') {
            setUser(userFromDb);
            localStorage.setItem(USER_ID_STORAGE_KEY, userFromDb.id);
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
      }
        toast({
            title: t('toast.login.success.title'),
            description: t('toast.login.success.description'),
        });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: t('toast.login.error.title'),
        description: error.message,
      });
    } finally {
        setLoading(false);
    }
  };

  const signup = async (values: SignUpFormValues): Promise<void> => {
    setLoading(true);
    try {
        const existingUser = await storage.findUserByEmail(values.email);
        if (existingUser) {
          throw new Error(t('toast.signup.error.emailExists'));
        }
        if (values.addOneSubUser && values.subUserEmail) {
            const existingSubUser = await storage.findUserByEmail(values.subUserEmail);
            if(existingSubUser) throw new Error(t('toast.signup.error.subUserEmailExists'));
            if(values.subUserEmail === values.email) throw new Error(t('toast.signup.error.subUserEmailSameAsMain'));
        }

        const newUserId = `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        const newUserProfile: UserProfile = {
          id: newUserId,
          companyName: values.companyName,
          companyCode: values.companyCode,
          vatCode: values.vatCode || '',
          address: values.address,
          contactPerson: values.contactPerson,
          email: values.email.toLowerCase(),
          phone: values.phone,
          password: values.password, 
          paymentStatus: 'pending_verification', 
          isAdmin: false,
          registeredAt: new Date().toISOString(),
          agreeToTerms: values.agreeToTerms,
          subUsers: [],
        };
        
        if (values.addOneSubUser && values.subUserName && values.subUserEmail && values.subUserPassword) {
            newUserProfile.subUsers?.push({
                id: `subuser-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                fullName: values.subUserName,
                email: values.subUserEmail,
                tempPassword: values.subUserPassword,
            });
        }
        
        await storage.addUserProfileWithId(newUserId, newUserProfile);

        toast({
          title: t('toast.signup.success.title'),
          description: t('toast.signup.success.description'),
        });
        router.push('/auth/pending-approval');
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: t('toast.signup.error.title'),
            description: error.message || t('toast.signup.error.descriptionGeneric'),
        });
    } finally {
        setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    setUser(null);
    localStorage.removeItem(USER_ID_STORAGE_KEY);
    setLoading(false); 
    toast({ title: t('toast.logout.success.title') });
    router.push('/auth/login');
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
