
"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  type User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, updateDoc, collection, addDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { UserProfile, UserProfileFirestore, SignupFormValuesExtended } from '@/types';
import { useRouter } from 'next/navigation';
import { useToast } from './use-toast';
import type { LoginFormValues } from '@/lib/schemas';
import { handleSuccessfulLogin } from '@/app/actions/auth';

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  isLoading: boolean;
  login: (values: LoginFormValues) => Promise<UserProfile>;
  signup: (data: Omit<SignupFormValuesExtended, 'subscriptionType'>) => Promise<void>;
  logout: () => void;
  updateUserInContext: (data: Partial<UserProfile>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
    if (!db) return null;
    const userDocRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
      const firestoreData = { id: userDoc.id, ...userDoc.data() };

      const processedData: { [key: string]: any } = {};
      for (const key in firestoreData) {
        if (Object.prototype.hasOwnProperty.call(firestoreData, key)) {
          const value = (firestoreData as any)[key];
          if (value && typeof value.toDate === 'function') {
            processedData[key] = value.toDate().toISOString();
          } else {
            processedData[key] = value;
          }
        }
      }
      return processedData as UserProfile;
    }
    return null;
  };
  
  const logout = useCallback(async () => {
    if (!auth) return;
    await signOut(auth);
    setUser(null);
    setFirebaseUser(null);
    window.location.assign('/login');
  }, []);

  useEffect(() => {
    if (!auth) {
        setIsLoading(false);
        return;
    };
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        // For session watching, we need to get the user profile
        // but we don't set it here directly to avoid race conditions with login.
        // The login function will set the user with the session token.
        if (!user) { // Only fetch if user is not already set by login flow
             const userProfile = await getUserProfile(fbUser.uid);
             setUser(userProfile);
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Concurrent session checker
  useEffect(() => {
    if (!user || !user.currentSessionToken) {
      return; 
    }

    const intervalId = setInterval(async () => {
      if (auth.currentUser) {
        const latestProfile = await getUserProfile(auth.currentUser.uid);
        if (latestProfile && latestProfile.currentSessionToken !== user.currentSessionToken) {
          clearInterval(intervalId); // Stop checking
          toast({
            variant: "destructive",
            title: "Sesija nutraukta",
            description: "Jūs buvote atjungtas, nes prisijungta kitame įrenginyje.",
            duration: 5000,
          });
          setTimeout(() => logout(), 1000); 
        }
      }
    }, 60000); // Check every 60 seconds

    return () => clearInterval(intervalId);
  }, [user, toast, logout]);


  
  const login = async (values: LoginFormValues): Promise<UserProfile> => {
    if (!auth) throw new Error("Firebase auth not initialized");
    const { email, password } = values;

    // 1. Client signs in with Firebase Auth
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;

    // 2. Call server action to log the login and get a session token
    const { success, token, error } = await handleSuccessfulLogin(uid);
    if (!success || !token) {
        await signOut(auth); // Log out if server-side logic fails
        throw new Error(error || "Server-side session handling failed.");
    }

    // 3. Get the user profile from Firestore
    const userProfile = await getUserProfile(uid);
    if (!userProfile) {
      await signOut(auth);
      throw new Error("User profile not found in database.");
    }

    // 4. Set the user in context, WITH the new session token
    const userWithSession: UserProfile = { ...userProfile, currentSessionToken: token };
    setUser(userWithSession);
    
    return userWithSession;
  };


  const signup = async (data: Omit<SignupFormValuesExtended, 'subscriptionType'>) => {
     if (!auth || !db) throw new Error("Firebase not initialized");
     
     const { email, password, companyName, companyCode, vatCode, address, contactPerson, position, phone, agreeToTerms } = data;
     
     if (!email || typeof email !== 'string' || !email.includes('@')) {
       throw new Error("Būtinas teisingas el. paštas.");
     }
     if (!password || typeof password !== 'string' || password.length < 6) {
       throw new Error("Slaptažodis turi būti bent 6 simbolių.");
     }

     // 1. Create Firebase Auth User
     const userCredential = await createUserWithEmailAndPassword(auth, email, password);
     const uid = userCredential.user.uid;
     
     // 2. Create Company
     const companyRef = await addDoc(collection(db, "companies"), {
        name: companyName,
        ownerId: uid,
        plan: 'corporate', 
        maxSeats: 1, // Default seats for a new company
        subscriptionStatus: 'pending_verification',
        createdAt: serverTimestamp(),
        vatCode: vatCode || '',
        address: address,
     });
     
     // 3. Create User Document in Firestore
     const newUserProfile: Omit<UserProfileFirestore, 'id'> = {
        email: email.toLowerCase(),
        companyName,
        companyCode,
        vatCode: vatCode || '',
        address,
        fullName: contactPerson,
        contactPerson: contactPerson,
        position,
        phone,
        subscriptionType: 'paid', // All new users start as 'paid' pending verification
        agreeToTerms,
        
        companyId: companyRef.id,
        role: 'owner', // First user is the owner
        
        paymentStatus: 'pending_verification', 
        isAdmin: false,
        
        createdAt: serverTimestamp() as any, 
        registeredAt: serverTimestamp() as any,
        accountActivatedAt: null,

        searchCredits: 0,
        reportCredits: 0,
     };

     await setDoc(doc(db, "users", uid), newUserProfile);
     
     const createdProfile = await getUserProfile(uid);
     setUser(createdProfile);
     
     router.push("/activation-pending");
  };
  
  const updateUserInContext = async (data: Partial<UserProfile>) => {
      if (!user || !db) return;
      
      const userRef = doc(db, 'users', user.id);
      await updateDoc(userRef, data);

      const updatedProfile = await getUserProfile(user.id);
      setUser(updatedProfile);
  }

  const refreshUser = async () => {
    if (!firebaseUser) return;
    const userProfile = await getUserProfile(firebaseUser.uid);
    setUser(userProfile);
  }

  return (
    <AuthContext.Provider value={{ user, firebaseUser, isLoading, login, signup, logout, updateUserInContext, refreshUser }}>
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
