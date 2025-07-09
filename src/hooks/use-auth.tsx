
"use client";

import type { UserProfile } from '@/types';
import type { LoginFormValues, SignUpFormValues } from '@/lib/schemas';
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/language-context';
import * as storage from '@/lib/storage';

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

  const login = async (values: LoginFormValues): Promise<boolean> => {
    setLoading(true);
    try {
      await storage.seedInitialUsers();

      const userFromDb = await storage.findUserByEmail(values.email);

      if (userFromDb && userFromDb.password === values.password) {
        if (userFromDb.paymentStatus === 'active') {
          setUser(userFromDb);
          localStorage.setItem(USER_ID_STORAGE_KEY, userFromDb.id);
          toast({ title: t('toast.login.success.title'), description: t('toast.login.success.description') });
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
      toast({ variant: 'destructive', title: t('toast.login.error.title'), description: error.message });
      return false;
    } finally {
      setLoading(false);
    }
  };


  const signup = async (values: SignUpFormValues): Promise<boolean> => {
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
        return true;
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: t('toast.signup.error.title'),
            description: error.message || t('toast.signup.error.descriptionGeneric'),
        });
        return false;
    } finally {
        setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    setUser(null);
    localStorage.removeItem(USER_ID_STORAGE_KEY);
    // The redirect is now handled by the layout component which will see the user is null
    setLoading(false); 
    toast({ title: t('toast.logout.success.title') });
  };
  
  // This is a mock function, not needed for real Firebase Auth, but kept for consistency
  const sendVerificationEmail = async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
  };

  const value = { user, loading, login, signup, logout, sendVerificationEmail: sendVerificationEmail, updateUserInContext };

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
