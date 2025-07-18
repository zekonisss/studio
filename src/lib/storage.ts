
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
  serverTimestamp
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
    console.error("Error in getAllUsers:", error);
    throw error;
  }
}

export async function addUsersBatch(users: UserProfile[]): Promise<void> {
  const batch = writeBatch(db);
  const usersCollectionRef = collection(db, USERS_COLLECTION);
  
  try {
    const allCurrentUsers = await getAllUsers();
    const existingEmails = new Set(allCurrentUsers.map(u => u.email.toLowerCase()));
    const existingCompanyCodes = new Set(allCurrentUsers.map(u => u.companyCode));

    for (const user of users) {
      if (!existingEmails.has(user.email.toLowerCase()) && !existingCompanyCodes.has(user.companyCode)) {
        const userDocRef = doc(usersCollectionRef); 
        const userWithTimestamp: Omit<UserProfile, 'id' | 'registeredAt'> & { registeredAt: any } = { 
          ...user, 
          id: userDocRef.id, 
          registeredAt: serverTimestamp() 
        };
        batch.set(userDocRef, userWithTimestamp);
        existingEmails.add(user.email.toLowerCase());
        existingCompanyCodes.add(user.companyCode);
      } else {
          console.warn(`Skipping user due to duplicate email or company code: ${user.email} / ${user.companyCode}`);
      }
    }

    await batch.commit();
  } catch (error) {
    console.error("Error in addUsersBatch:", error);
    throw error;
  }
}


export async function updateUserProfile(userId: string, userData: Partial<UserProfile>): Promise<void> {
  try {
    const userDocRef = doc(db, USERS_COLLECTION, userId);
    await updateDoc(userDocRef, userData);
  } catch (error) {
    console.error(`Error updating user profile for user ID ${userId}:`, error);
    throw error;
  }
}


export async function findUserByEmail(email: string): Promise<UserProfile | null> {
  try {
    const q = query(collection(db, USERS_COLLECTION), where("email", "==", email.toLowerCase()));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      return null;
    }
    const userDoc = querySnapshot.docs[0];
    return { id: userDoc.id, ...userDoc.data() } as UserProfile;
  } catch(error) {
      console.error(`Error finding user by email ${email}:`, error);
      throw error;
  }
}

export async function getUserById(userId: string): Promise<UserProfile | null> {
  // Robust validation to prevent Firestore errors with invalid paths.
  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    console.error('❌ Invalid userId passed to getUserById. Aborting Firestore call. Received:', userId);
    return null; // Return null instead of throwing to avoid crashing the auth flow.
  }

  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      console.warn(`No user profile found in Firestore for UID: ${userId}`);
      return null;
    }

    return { id: userSnap.id, ...userSnap.data() } as UserProfile;
  } catch(error) {
     console.error(`Error fetching user by ID ${userId}:`, error);
     return null;
  }
};


// --- Report Management ---

export async function getAllReports(): Promise<Report[]> {
    try {
        const reportsCollectionRef = collection(db, REPORTS_COLLECTION);
        const q = query(reportsCollectionRef, orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Report);
    } catch (error) {
        console.error("Error in getAllReports:", error);
        return [];
    }
}

export async function addReport(reportData: Omit<Report, 'id' | 'deletedAt' | 'createdAt'>): Promise<void> {
    try {
        const reportsCollectionRef = collection(db, REPORTS_COLLECTION);
        await addDoc(reportsCollectionRef, {
            ...reportData,
            createdAt: serverTimestamp()
        });
    } catch (error) {
        console.error("Error in addReport:", error);
        throw error;
    }
}


export async function softDeleteReport(reportId: string): Promise<void> {
    try {
        const reportDocRef = doc(db, REPORTS_COLLECTION, reportId);
        await updateDoc(reportDocRef, {
            deletedAt: serverTimestamp(),
        });
    } catch (error) {
        console.error(`Error soft-deleting report ID ${reportId}:`, error);
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
        reportsSnapshot.docs.forEach(document => {
            batch.update(document.ref, { deletedAt: serverTimestamp() });
        });
        await batch.commit();
        return reportsSnapshot.size;
    } catch (error) {
        console.error("Error in softDeleteAllReports:", error);
        throw error;
    }
}

export async function getUserReports(userId: string): Promise<{ active: Report[], deleted: Report[] }> {
    try {
        const reportsCollectionRef = collection(db, REPORTS_COLLECTION);
        const q = query(reportsCollectionRef, where("reporterId", "==", userId));
        const snapshot = await getDocs(q);
        const allUserReports = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Report);

        const active = allUserReports
          .filter(r => !r.deletedAt)
          .sort((a, b) => (b.createdAt as Timestamp).toMillis() - (a.createdAt as Timestamp).toMillis());
        
        const deleted = allUserReports
          .filter(r => r.deletedAt && r.deletedAt instanceof Timestamp)
          .sort((a, b) => (b.deletedAt as Timestamp).toMillis() - (a.deletedAt as Timestamp).toMillis());
        
        return { active, deleted };
    } catch (error) {
        console.error(`Error getting user reports for user ID ${userId}:`, error);
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
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Report);
    } catch (error) {
        console.error(`Error getting search logs for user ID ${userId || 'all'}:`, error);
        return [];
    }
}

export async function addSearchLog(logData: Omit<SearchLog, 'id' | 'timestamp'>): Promise<void> {
    try {
        const logsCollectionRef = collection(db, SEARCH_LOGS_COLLECTION);
        await addDoc(logsCollectionRef, {
            ...logData,
            timestamp: serverTimestamp(),
        });
    } catch (error) {
        console.error("Error in addSearchLog:", error);
    }
}

export async function getAuditLogs(): Promise<AuditLogEntry[]> {
    try {
        const auditLogsCollectionRef = collection(db, AUDIT_LOGS_COLLECTION);
        const q = query(auditLogsCollectionRef, orderBy("timestamp", "desc"));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as AuditLogEntry);
    } catch (error) {
        console.error("Error in getAuditLogs:", error);
        return [];
    }
}

export async function addAuditLogEntry(entryData: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<void> {
    try {
        const auditLogsCollectionRef = collection(db, AUDIT_LOGS_COLLECTION);
        await addDoc(auditLogsCollectionRef, {
            ...entryData,
            timestamp: serverTimestamp(),
        });
    } catch (error) {
        console.error("Error in addAuditLogEntry:", error);
    }
}

// --- Notification Management ---

export async function getUserNotifications(userId: string): Promise<UserNotification[]> {
    try {
        const notificationsCollectionRef = collection(db, NOTIFICATIONS_COLLECTION);
        const q = query(notificationsCollectionRef, where("userId", "==", userId), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as UserNotification);
    } catch (error) {
        console.error(`Error getting notifications for user ID ${userId}:`, error);
        return [];
    }
}

export async function addUserNotification(userId: string, notificationData: Omit<UserNotification, 'id' | 'createdAt' | 'read' | 'userId'>): Promise<void> {
    try {
        const notificationsCollectionRef = collection(db, NOTIFICATIONS_COLLECTION);
        await addDoc(notificationsCollectionRef, {
            userId,
            ...notificationData,
            createdAt: serverTimestamp(),
            read: false,
        });
    } catch (error) {
        console.error(`Error adding notification for user ID ${userId}:`, error);
    }
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
    try {
        const notifDocRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId);
        await updateDoc(notifDocRef, { read: true });
    } catch (error) {
        console.error(`Error marking notification ID ${notificationId} as read:`, error);
    }
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
    try {
        const notificationsCollectionRef = collection(db, NOTIFICATIONS_COLLECTION);
        const q = query(notificationsCollectionRef, where("userId", "==", userId), where("read", "==", false));
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) return;

        const batch = writeBatch(db);
        snapshot.docs.forEach(doc => {
            batch.update(doc.ref, { read: true });
        });
        await batch.commit();
    } catch (error) {
        console.error(`Error marking all notifications as read for user ID ${userId}:`, error);
    }
}
