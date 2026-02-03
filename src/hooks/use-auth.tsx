"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
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

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  isLoading: boolean;
  login: (values: LoginFormValues) => Promise<UserProfile>;
  signup: (data: SignupFormValuesExtended) => Promise<void>;
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
  
  useEffect(() => {
    if (!auth) {
        setIsLoading(false);
        return;
    };
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        try {
          const userProfile = await getUserProfile(fbUser.uid);
          setUser(userProfile);
        } catch (error) {
          console.error("Error fetching user profile:", error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  
  const login = async (values: LoginFormValues): Promise<UserProfile> => {
    if (!auth) throw new Error("Firebase auth not initialized");
    const { email, password } = values;
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const userProfile = await getUserProfile(userCredential.user.uid);

    if (!userProfile) {
      await signOut(auth);
      throw new Error("User profile not found in database.");
    }
    setUser(userProfile);
    return userProfile;
  };

  const logout = async () => {
    if (!auth) return;
    await signOut(auth);
    setUser(null);
    setFirebaseUser(null);
    window.location.assign('/login');
  };

  const signup = async (data: SignupFormValuesExtended) => {
     if (!auth || !db) throw new Error("Firebase not initialized");
     
     const { email, password, companyName, companyCode, vatCode, address, contactPerson, position, phone, subscriptionType, agreeToTerms } = data;
     
     if (!email || typeof email !== 'string' || !email.includes('@')) {
       throw new Error("Būtinas teisingas el. paštas.");
     }
     if (!password || typeof password !== 'string' || password.length < 6) {
       throw new Error("Slaptažodis turi būti bent 6 simbolių.");
     }

     // 1. Create Firebase Auth User
     const userCredential = await createUserWithEmailAndPassword(auth, email, password);
     const uid = userCredential.user.uid;
     
     const isTrial = subscriptionType === 'trial';

     // 2. Create Company
     const companyRef = await addDoc(collection(db, "companies"), {
        name: companyName,
        ownerId: uid,
        plan: isTrial ? 'trial' : 'corporate', 
        maxSeats: isTrial ? 1 : 20,
        subscriptionStatus: isTrial ? 'trial' : 'pending_verification',
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
        subscriptionType,
        agreeToTerms,
        
        companyId: companyRef.id,
        role: 'owner', // First user is the owner
        
        paymentStatus: isTrial ? 'trial' : 'pending_verification', 
        isAdmin: false, // Regular users are not platform admins
        
        createdAt: serverTimestamp() as any, 
        registeredAt: serverTimestamp() as any,
        accountActivatedAt: isTrial ? serverTimestamp() as any : null,

        // Correct credits based on plan
        searchCredits: isTrial ? 3 : 0,
        reportCredits: isTrial ? 1 : 0,
     };

     await setDoc(doc(db, "users", uid), newUserProfile);
     
     const createdProfile = await getUserProfile(uid);
     setUser(createdProfile);
     
     // Redirect based on plan
     if (isTrial) {
        router.push("/dashboard");
     } else {
        router.push("/activation-pending");
     }
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
