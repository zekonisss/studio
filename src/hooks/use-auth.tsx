
"use client";

import type { UserProfile } from '@/types';
import type { LoginFormValues, SignUpFormValues } from '@/lib/schemas';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { MOCK_USER, getAllUsers, saveAllUsers } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/language-context'; // Import useLanguage

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
  const { toast } = useToast();
  const { t } = useLanguage(); // Get translation function

  useEffect(() => {
    const checkAuthState = async () => {
      setLoading(true);
      const storedUserJson = localStorage.getItem('driverCheckUser'); // Updated key
      if (storedUserJson) {
        try {
          const storedUser = JSON.parse(storedUserJson);
          const allSystemUsers = getAllUsers();
          const currentUserData = allSystemUsers.find(u => u.id === storedUser.id);

          if (currentUserData) {
             setUser(currentUserData);
          } else {
            localStorage.removeItem('driverCheckUser');
             setUser(null);
          }

        } catch (e) {
          console.error("Failed to parse user from session storage", e);
          localStorage.removeItem('driverCheckUser');
          setUser(null);
        }
      }
      setLoading(false);
    };
    checkAuthState();
  }, []);

  const updateUserInContext = (updatedUser: UserProfile) => {
    setUser(updatedUser);
    localStorage.setItem('driverCheckUser', JSON.stringify(updatedUser));
  };

  const login = async (values: LoginFormValues) => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const allSystemUsers = getAllUsers();
      const foundUser = allSystemUsers.find(u => u.email === values.email);

      let loginError: { messageKey: string, isAuthManagedError?: boolean } | null = null;

      if (foundUser) {
        if (foundUser.paymentStatus === 'pending_verification') {
          loginError = { messageKey: 'toast.login.error.pendingVerification', isAuthManagedError: true };
          router.push('/auth/pending-approval');
        } else if (foundUser.paymentStatus === 'pending_payment') {
          loginError = { messageKey: 'toast.login.error.pendingPayment', isAuthManagedError: true };
          router.push('/auth/pending-approval');
        } else if (foundUser.paymentStatus === 'inactive') {
          loginError = { messageKey: 'toast.login.error.inactive', isAuthManagedError: true };
        } else if (foundUser.paymentStatus === 'active' || (foundUser.id === MOCK_USER.id && MOCK_USER.isAdmin)) {
          setUser(foundUser);
          localStorage.setItem('driverCheckUser', JSON.stringify(foundUser));
          toast({
            title: t('toast.login.success.title'),
            description: t('toast.login.success.description'),
          });
          router.push('/dashboard');
        } else {
          loginError = { messageKey: 'toast.login.error.accessDenied', isAuthManagedError: true };
        }
      } else if (values.email === MOCK_USER.email) { // Fallback for the main mock user if not in localStorage yet
         if (MOCK_USER.paymentStatus === 'pending_verification') {
            loginError = { messageKey: 'toast.login.error.pendingVerification', isAuthManagedError: true };
            router.push('/auth/pending-approval');
         } else if (MOCK_USER.paymentStatus === 'pending_payment') {
            loginError = { messageKey: 'toast.login.error.pendingPayment', isAuthManagedError: true };
            router.push('/auth/pending-approval');
         } else {
            setUser(MOCK_USER);
            localStorage.setItem('driverCheckUser', JSON.stringify(MOCK_USER));
            toast({
                title: t('toast.login.success.title'),
                description: t('toast.login.success.description'),
            });
            router.push('/dashboard');
         }
      }
      else {
        loginError = { messageKey: 'toast.login.error.invalidCredentials', isAuthManagedError: true };
      }

      if (loginError) {
        toast({
          variant: "destructive",
          title: t('toast.login.error.title'),
          description: t(loginError.messageKey),
        });
        // Throw an error so onSubmit in LoginForm knows it failed if needed
        const error = new Error(t(loginError.messageKey)) as any;
        error.isAuthManagedError = loginError.isAuthManagedError;
        throw error;
      }
    } finally {
      setLoading(false);
    }
  };

  const signup = async (values: SignUpFormValues) => {
    setLoading(true);
    try {
        await new Promise(resolve => setTimeout(resolve, 1000));

        const allUsers = getAllUsers();
        if (allUsers.some(u => u.email === values.email)) {
          toast({
            variant: "destructive",
            title: t('toast.signup.error.title'),
            description: t('toast.signup.error.emailExists'),
          });
          throw new Error(t('toast.signup.error.emailExists'));
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
          accountActivatedAt: undefined, // Ensure this is undefined initially
        };

        const updatedUsers = [...allUsers, newUserProfile];
        saveAllUsers(updatedUsers);

        toast({
          title: t('toast.signup.success.title'),
          description: t('toast.signup.success.description'),
        });
        router.push('/auth/pending-approval');
    } catch (error: any) {
        // If not already a toast from email exists, show generic one
        if (!error.message.includes(t('toast.signup.error.emailExists'))) {
             toast({
                variant: "destructive",
                title: t('toast.signup.error.title'),
                description: error.message || t('toast.signup.error.descriptionGeneric'),
            });
        }
    } finally {
        setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    setUser(null);
    localStorage.removeItem('driverCheckUser');
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
    // console.log("Simulating admin notification / user pending state...");
    await new Promise(resolve => setTimeout(resolve, 1000));
    // Potentially add a toast here for "Verification email resent"
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
