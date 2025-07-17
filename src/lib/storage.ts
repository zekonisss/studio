"use client";

import type { Report, UserProfile, SearchLog, AuditLogEntry, UserNotification } from '@/types';
import { db, Timestamp } from '@/lib/firebase';
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  query, 
  where, 
  getDoc, 
  updateDoc, 
  writeBatch, 
  addDoc,
  orderBy,
  deleteDoc
} from 'firebase/firestore';

const USERS_COLLECTION = 'users';
const REPORTS_COLLECTION = 'reports';
const SEARCH_LOGS_COLLECTION = 'searchLogs';
const AUDIT_LOGS_COLLECTION = 'auditLogs';
const NOTIFICATIONS_COLLECTION = 'notifications';

// --- User Management ---

export async function getAllUsers(): Promise<UserProfile[]> {
  try {
    const usersCollectionRef = collection(db, USERS_COLLECTION);
    const snapshot = await getDocs(usersCollectionRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfile));
  } catch (error) {
    console.error("Error getting all users:", error);
    return [];
  }
}

export async function addUserProfile(user: UserProfile): Promise<void> {
    try {
        const userDocRef = doc(db, USERS_COLLECTION, user.id);
        const userDataForFirestore = {
            ...user,
            registeredAt: Timestamp.now(),
            accountActivatedAt: user.accountActivatedAt ? Timestamp.fromDate(new Date(user.accountActivatedAt)) : undefined
        };
        await setDoc(userDocRef, userDataForFirestore);
    } catch (error) {
        console.error("Failed to add user to Firestore:", error);
        throw new Error("Failed to save user profile to the database.");
    }
}

export async function addUsersBatch(users: UserProfile[]): Promise<void> {
  const batch = writeBatch(db);
  const usersCollectionRef = collection(db, USERS_COLLECTION);
  
  const allUsers = await getAllUsers();
  const existingEmails = new Set(allUsers.map(u => u.email.toLowerCase()));
  const existingCompanyCodes = new Set(allUsers.map(u => u.companyCode));

  users.forEach(user => {
    if (!existingEmails.has(user.email.toLowerCase()) && !existingCompanyCodes.has(user.companyCode)) {
      const userDocRef = doc(usersCollectionRef); 
      const userWithTimestamp = { 
        ...user, 
        id: userDocRef.id, 
        registeredAt: Timestamp.now() 
      };
      batch.set(userDocRef, userWithTimestamp);
      existingEmails.add(user.email.toLowerCase());
      existingCompanyCodes.add(user.companyCode);
    } else {
        console.warn(`Skipping user due to duplicate email or company code: ${user.email} / ${user.companyCode}`);
    }
  });

  await batch.commit();
}


export async function updateUserProfile(userId: string, userData: Partial<UserProfile>): Promise<void> {
  try {
    const userDocRef = doc(db, USERS_COLLECTION, userId);
    await updateDoc(userDocRef, userData);
  } catch (error) {
    console.error("Error updating user profile:", error);
  }
}

export async function findUserByEmail(email: string): Promise<UserProfile | null> {
  const q = query(collection(db, USERS_COLLECTION), where("email", "==", email.toLowerCase()));
  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) {
    return null;
  }
  const userDoc = querySnapshot.docs[0];
  const userData = userDoc.data();
  return { id: userDoc.id, ...userData } as UserProfile;
}

export async function getUserById(userId: string): Promise<UserProfile | null> {
    try {
        const userDocRef = doc(db, USERS_COLLECTION, userId);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as UserProfile;
        }
        return null;
    } catch (error) {
        console.error("Error in getUserById:", error);
        throw error;
    }
}

// --- Report Management ---

export async function getAllReports(): Promise<Report[]> {
    try {
        const q = query(collection(db, REPORTS_COLLECTION), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Report);
    } catch (error) {
        console.error("Error getting all reports:", error);
        return [];
    }
}

export async function addReport(reportData: Omit<Report, 'id' | 'createdAt'>): Promise<void> {
    try {
        const reportWithTimestamp = {
            ...reportData,
            createdAt: Timestamp.now()
        };
        await addDoc(collection(db, REPORTS_COLLECTION), reportWithTimestamp);
    } catch (error) {
        console.error("Error adding report:", error);
        if (error instanceof Error && 'code' in error && (error as any).code === 'permission-denied') {
             throw new Error("Permission denied. Check Firestore security rules for the 'reports' collection.");
        }
        throw new Error("Failed to add report to the database.");
    }
}


export async function softDeleteReport(reportId: string): Promise<void> {
    try {
        const reportDocRef = doc(db, REPORTS_COLLECTION, reportId);
        await updateDoc(reportDocRef, {
            deletedAt: Timestamp.now(),
        });
    } catch (error) {
        console.error("Error soft-deleting report:", error);
        throw new Error("Failed to update report for deletion.");
    }
}

export async function softDeleteAllReports(): Promise<number> {
    try {
        const reportsCollectionRef = collection(db, REPORTS_COLLECTION);
        const q = query(reportsCollectionRef, where("deletedAt", "==", null));
        const reportsSnapshot = await getDocs(q);
        
        if (reportsSnapshot.empty) {
            return 0;
        }

        const batch = writeBatch(db);
        reportsSnapshot.docs.forEach(doc => {
            batch.update(doc.ref, { deletedAt: Timestamp.now() });
        });
        await batch.commit();
        return reportsSnapshot.size;
    } catch (error) {
        console.error("Error soft-deleting all reports:", error);
        return 0;
    }
}

export async function getUserReports(userId: string): Promise<{ active: Report[], deleted: Report[] }> {
    try {
        const q = query(collection(db, REPORTS_COLLECTION), where("reporterId", "==", userId));
        const snapshot = await getDocs(q);
        const allUserReports = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Report);

        const active = allUserReports.filter(r => !r.deletedAt).sort((a, b) => (b.createdAt as Timestamp).toMillis() - (a.createdAt as Timestamp).toMillis());
        const deleted = allUserReports.filter(r => !!r.deletedAt).sort((a, b) => (b.deletedAt as Timestamp).toMillis() - (a.deletedAt as Timestamp).toMillis());
        
        return { active, deleted };
    } catch (error) {
        console.error("Error getting user reports:", error);
        return { active: [], deleted: [] };
    }
}

// --- Log Management ---

export async function getSearchLogs(userId?: string): Promise<SearchLog[]> {
    try {
        const logsCollectionRef = collection(db, SEARCH_LOGS_COLLECTION);
        const q = userId 
            ? query(logsCollectionRef, where("userId", "==", userId), orderBy("timestamp", "desc"))
            : query(logsCollectionRef, orderBy("timestamp", "desc"));
        
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as SearchLog);
    } catch (error) {
        console.error("Error getting search logs:", error);
        return [];
    }
}

export async function addSearchLog(logData: Omit<SearchLog, 'id' | 'timestamp'>): Promise<void> {
    try {
        await addDoc(collection(db, SEARCH_LOGS_COLLECTION), {
            ...logData,
            timestamp: Timestamp.now(),
        });
    } catch (error) {
        console.error("Error adding search log:", error);
    }
}

export async function getAuditLogs(): Promise<AuditLogEntry[]> {
    try {
        const q = query(collection(db, AUDIT_LOGS_COLLECTION), orderBy("timestamp", "desc"));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as AuditLogEntry);
    } catch (error) {
        console.error("Error getting audit logs:", error);
        return [];
    }
}

export async function addAuditLogEntry(entryData: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<void> {
    try {
        await addDoc(collection(db, AUDIT_LOGS_COLLECTION), {
            ...entryData,
            timestamp: Timestamp.now(),
        });
    } catch (error) {
        console.error("Error adding audit log entry:", error);
    }
}

// --- Notification Management ---

export async function getUserNotifications(userId: string): Promise<UserNotification[]> {
    try {
        const q = query(collection(db, NOTIFICATIONS_COLLECTION), where("userId", "==", userId), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as UserNotification);
    } catch (error) {
        console.error("Error getting user notifications:", error);
        return [];
    }
}

export async function addUserNotification(userId: string, notificationData: Omit<UserNotification, 'id' | 'createdAt' | 'read' | 'userId'>): Promise<void> {
    try {
        await addDoc(collection(db, NOTIFICATIONS_COLLECTION), {
            userId,
            ...notificationData,
            createdAt: Timestamp.now(),
            read: false,
        });
    } catch (error) {
        console.error("Error adding user notification:", error);
    }
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
    try {
        const notifDocRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId);
        await updateDoc(notifDocRef, { read: true });
    } catch (error) {
        console.error("Error marking notification as read:", error);
    }
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
    try {
        const q = query(collection(db, NOTIFICATIONS_COLLECTION), where("userId", "==", userId), where("read", "==", false));
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) return;

        const batch = writeBatch(db);
        snapshot.docs.forEach(doc => {
            batch.update(doc.ref, { read: true });
        });
        await batch.commit();
    } catch (error) {
        console.error("Error marking all notifications as read:", error);
    }
}
