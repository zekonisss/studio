
"use client";

import type { UserProfile } from '@/types';
import type { LoginFormValues, SignUpFormValues } from '@/lib/schemas';
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/language-context';
import * as storage from '@/lib/storage';
import { MOCK_ADMIN_USER, MOCK_TEST_CLIENT_USER } from '@/lib/mock-data';

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
    // No need to set loading to true here, initial state is true
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

  const login = async (values: LoginFormValues) => {
    setLoading(true);
    try {
      // Hardcoded check for admin and test users to ensure login always works
      if (values.email.toLowerCase() === MOCK_ADMIN_USER.email.toLowerCase() && values.password === MOCK_ADMIN_USER.password) {
        setUser(MOCK_ADMIN_USER);
        localStorage.setItem(USER_ID_STORAGE_KEY, MOCK_ADMIN_USER.id);
        toast({
          title: t('toast.login.success.title'),
          description: t('toast.login.success.description'),
        });
        router.push('/admin');
        // setLoading(false) will be handled in finally
        return; 
      }
  
      if (values.email.toLowerCase() === MOCK_TEST_CLIENT_USER.email.toLowerCase() && values.password === MOCK_TEST_CLIENT_USER.password) {
        setUser(MOCK_TEST_CLIENT_USER);
        localStorage.setItem(USER_ID_STORAGE_KEY, MOCK_TEST_CLIENT_USER.id);
        toast({
          title: t('toast.login.success.title'),
          description: t('toast.login.success.description'),
        });
        router.push('/dashboard');
        // setLoading(false) will be handled in finally
        return;
      }
  
      // If not a hardcoded user, proceed with Firestore lookup
      await storage.seedInitialUsers(); 
      const foundUser = await storage.findUserByEmail(values.email);
  
      if (foundUser && foundUser.password === values.password) {
        // Status checks
        if (foundUser.paymentStatus === 'active') {
          setUser(foundUser);
          localStorage.setItem(USER_ID_STORAGE_KEY, foundUser.id);
          toast({
            title: t('toast.login.success.title'),
            description: t('toast.login.success.description'),
          });
          router.push(foundUser.isAdmin ? '/admin' : '/dashboard');
        } else {
            let errorMessage = t('toast.login.error.accessDenied');
            if (foundUser.paymentStatus === 'pending_verification') {
                errorMessage = t('toast.login.error.pendingVerification');
            } else if (foundUser.paymentStatus === 'pending_payment') {
                errorMessage = t('toast.login.error.pendingPayment');
            } else if (foundUser.paymentStatus === 'inactive') {
                errorMessage = t('toast.login.error.inactive');
            }
            throw new Error(errorMessage);
        }
      } else {
        throw new Error(t('toast.login.error.invalidCredentials'));
      }
    } catch (error: any) {
      toast({ variant: 'destructive', title: t('toast.login.error.title'), description: error.message });
      setLoading(false); // Set loading to false on error
    } 
    // Do not set loading to false in a finally block here, 
    // because successful navigation will unmount this context in some cases, 
    // and the new page's AuthProvider will handle its own loading state.
    // However, if an error occurs, we must set it to false to allow another attempt.
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
