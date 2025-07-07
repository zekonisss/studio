
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
  login: (values: LoginFormValues) => Promise<void>;
  signup: (values: SignUpFormValues) => Promise<void>;
  logout: () => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
  updateUserInContext: (updatedUser: UserProfile) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const USER_ID_STORAGE_KEY = 'driverCheckUserId';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useLanguage(); 

  const checkAuthState = useCallback(async () => {
    setLoading(true);
    await storage.seedInitialUsers(); 
    const storedUserId = localStorage.getItem(USER_ID_STORAGE_KEY); 
    if (storedUserId) {
      try {
        const currentUserData = await storage.getUserById(storedUserId);
        if (currentUserData) {
           setUser(currentUserData);
        } else {
          localStorage.removeItem(USER_ID_STORAGE_KEY);
           setUser(null);
        }
      } catch (e) {
        console.error("Failed to fetch user from Firestore", e);
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

  const login = async (values: LoginFormValues) => {
    setLoading(true);
    try {
      // Hardcoded check for special demo users to ensure they can always log in.
      // This bypasses any potential issues with stale database passwords for these specific accounts.
      const demoUsers = {
        'sarunas.zekonis@gmail.com': { id: 'dev-user-123', pass: 'Septoleteq1223' },
        'test@drivercheck.lt': { id: 'test-client-001', pass: 'driver1' },
      };

      const emailLower = values.email.toLowerCase();
      const demoUser = demoUsers[emailLower as keyof typeof demoUsers];
      
      let foundUser: UserProfile | null = null;
      let passwordCorrect = false;

      if (demoUser && demoUser.pass === values.password) {
        // For demo users, if password is correct, fetch the latest profile from DB to get latest statuses etc.
        foundUser = await storage.getUserById(demoUser.id);
        passwordCorrect = !!foundUser;
      } else if (!demoUser) {
        // For regular users, check password from the database
        foundUser = await storage.findUserByEmail(values.email);
        if (foundUser && foundUser.password === values.password) {
          passwordCorrect = true;
        }
      }

      let loginError: { messageKey: string; isAuthManagedError?: boolean; route?: string } | null = null;

      if (foundUser && passwordCorrect) {
        // Common success/status check logic for all users
        if (foundUser.paymentStatus === 'pending_verification') {
          loginError = { messageKey: 'toast.login.error.pendingVerification', isAuthManagedError: true, route: '/auth/pending-approval' };
        } else if (foundUser.paymentStatus === 'pending_payment') {
          loginError = { messageKey: 'toast.login.error.pendingPayment', isAuthManagedError: true, route: '/auth/pending-approval' };
        } else if (foundUser.paymentStatus === 'inactive') {
          loginError = { messageKey: 'toast.login.error.inactive', isAuthManagedError: true };
        } else if (foundUser.paymentStatus === 'active') {
          setUser(foundUser);
          localStorage.setItem(USER_ID_STORAGE_KEY, foundUser.id);
          toast({
            title: t('toast.login.success.title'),
            description: t('toast.login.success.description'),
          });
          router.push('/dashboard');
        } else {
          loginError = { messageKey: 'toast.login.error.accessDenied', isAuthManagedError: true };
        }
      } else {
        loginError = { messageKey: 'toast.login.error.invalidCredentials', isAuthManagedError: true };
      }

      if (loginError) {
        toast({
          variant: 'destructive',
          title: t('toast.login.error.title'),
          description: t(loginError.messageKey),
        });
        if (loginError.route) {
          router.push(loginError.route);
        }
        const error = new Error(t(loginError.messageKey)) as any;
        error.isAuthManagedError = loginError.isAuthManagedError;
        throw error;
      }
    } catch (error: any) {
      if (!error.isAuthManagedError) {
        toast({
          variant: 'destructive',
          title: t('toast.login.error.title'),
          description: t('toast.login.error.descriptionGeneric'),
        });
      }
    } finally {
      setLoading(false);
    }
  };


  const signup = async (values: SignUpFormValues) => {
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
          vatCode: values.vatCode || undefined,
          address: values.address,
          contactPerson: values.contactPerson,
          email: values.email.toLowerCase(),
          phone: values.phone,
          password: values.password, 
          paymentStatus: 'pending_verification', 
          isAdmin: false,
          registeredAt: new Date().toISOString(),
          accountActivatedAt: undefined,
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
        const customError = new Error(error.message) as any;
        customError.isAuthManagedError = true;
        throw customError;
    } finally {
        setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    setUser(null);
    localStorage.removeItem(USER_ID_STORAGE_KEY);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      toast({ title: t('toast.logout.success.title') });
      router.push('/auth/login');
    } catch (error) {
       toast({ variant: "destructive", title: t('toast.logout.error.title') });
    } finally {
      setLoading(false);
    }
  };

  const sendVerificationEmail = async () => {
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
