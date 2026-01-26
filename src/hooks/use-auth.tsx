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
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
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
      // This case should ideally not happen if signup is robust
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
    router.push('/login');
  };

  const signup = async (data: SignupFormValuesExtended) => {
     if (!auth || !db) throw new Error("Firebase not initialized");
     const { email, password, companyName, companyCode, vatCode, address, contactPerson, phone, agreeToTerms } = data;
     const userCredential = await createUserWithEmailAndPassword(auth, email, password);
     const uid = userCredential.user.uid;

     const newUserProfile: Omit<UserProfileFirestore, 'id'> = {
        email: email.toLowerCase(),
        companyName,
        companyCode,
        vatCode: vatCode || '',
        address,
        contactPerson,
        phone,
        paymentStatus: 'pending_verification',
        isAdmin: false,
        agreeToTerms,
        registeredAt: serverTimestamp() as any, // Cast because serverTimestamp is special
        accountActivatedAt: null,
        subUsers: [],
     };

     await setDoc(doc(db, "users", uid), newUserProfile);
     const createdProfile = await getUserProfile(uid);
     setUser(createdProfile);
  };
  
  const updateUserInContext = async (data: Partial<UserProfile>) => {
      if (!user || !db) return;
      
      const userRef = doc(db, 'users', user.id);
      await setDoc(userRef, data, { merge: true });

      const updatedProfile = await getUserProfile(user.id);
      setUser(updatedProfile);
  }

  return (
    <AuthContext.Provider value={{ user, firebaseUser, isLoading, login, signup, logout, updateUserInContext }}>
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
