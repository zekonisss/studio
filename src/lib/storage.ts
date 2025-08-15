
"use client";

import type { Report, UserProfile, SearchLog, AuditLogEntry, UserNotification } from '@/types';
import { db, storage as firebaseStorage } from '@/lib/firebase';
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
  Timestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { categorizeReport } from '@/ai/flows/categorize-report-flow';


// --- File Management ---
export async function uploadReportImage(file: File): Promise<{ url: string; dataAiHint: string }> {
  try {
    const storageRef = ref(firebaseStorage, `report-images/${Date.now()}-${file.name}`);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    
    // Simple hint generation
    const hint = file.name.split('.')[0].replace(/[^a-zA-Z\s]/g, '').substring(0, 20);

    return { url: downloadURL, dataAiHint: hint };
  } catch (error) {
    console.error("Error uploading file to Firebase Storage:", error);
    throw error;
  }
}

// --- User Management ---

export async function getAllUsers(): Promise<UserProfile[]> {
  try {
    const usersCollectionRef = collection(db, 'users');
    const snapshot = await getDocs(usersCollectionRef);
    return snapshot.docs.map(doc => {
        const data = doc.data();
        return { 
            id: doc.id,
            ...data,
            registeredAt: (data.registeredAt as Timestamp)?.toDate().toISOString(),
            accountActivatedAt: (data.accountActivatedAt as Timestamp)?.toDate().toISOString()
         } as UserProfile
    });
  } catch (error) {
    console.error("Error in getAllUsers:", error);
    throw error;
  }
}

export async function addUsersBatch(users: Omit<UserProfile, 'id'>[]): Promise<void> {
  const batch = writeBatch(db);
  const usersCollectionRef = collection(db, 'users');
  
  try {
    const allCurrentUsers = await getAllUsers();
    const existingEmails = new Set(allCurrentUsers.map(u => u.email.toLowerCase()));
    const existingCompanyCodes = new Set(allCurrentUsers.map(u => u.companyCode));

    for (const user of users) {
      if (!existingEmails.has(user.email.toLowerCase()) && !existingCompanyCodes.has(user.companyCode)) {
        const userDocRef = doc(usersCollectionRef); 
        const userWithTimestamp = { 
          ...user,
          registeredAt: Timestamp.now() 
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
    const userDocRef = doc(db, 'users', userId);
    const dataToUpdate = { ...userData };
    // Convert ISO strings back to Timestamps if they exist
    if (dataToUpdate.registeredAt) {
      dataToUpdate.registeredAt = Timestamp.fromDate(new Date(dataToUpdate.registeredAt));
    }
     if (dataToUpdate.accountActivatedAt) {
      dataToUpdate.accountActivatedAt = Timestamp.fromDate(new Date(dataToUpdate.accountActivatedAt));
    }
    await updateDoc(userDocRef, dataToUpdate);
  } catch (error) {
    console.error(`Error updating user profile for user ID ${userId}:`, error);
    throw error;
  }
}

export async function findUserByEmail(email: string): Promise<UserProfile | null> {
  try {
    const q = query(collection(db, 'users'), where("email", "==", email.toLowerCase()));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      return null;
    }
    const userDoc = querySnapshot.docs[0];
    const data = userDoc.data();
    return { 
        id: userDoc.id, 
        ...data,
        registeredAt: (data.registeredAt as Timestamp)?.toDate().toISOString(),
        accountActivatedAt: (data.accountActivatedAt as Timestamp)?.toDate().toISOString()
    } as UserProfile;
  } catch(error) {
      console.error(`Error finding user by email ${email}:`, error);
      throw error;
  }
}

export async function getUserById(userId: string): Promise<UserProfile | null> {
    if (!userId || userId === "undefined") {
      return null;
    }
    try {
        const userDocRef = doc(db, 'users', userId);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            return { 
                id: docSnap.id, 
                ...data,
                registeredAt: (data.registeredAt as Timestamp)?.toDate().toISOString(),
                accountActivatedAt: (data.accountActivatedAt as Timestamp)?.toDate().toISOString()
            } as UserProfile;
        }
        return null;
    } catch (error) {
        console.error(`Error in getUserById for UID ${userId}:`, error);
        throw error;
    }
}

// --- Report Management ---

export async function getAllReports(): Promise<Report[]> {
    try {
        const reportsCollectionRef = collection(db, 'reports');
        const q = query(reportsCollectionRef, orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: (data.createdAt as Timestamp).toDate(),
                deletedAt: (data.deletedAt as Timestamp)?.toDate(),
            } as Report
        });
    } catch (error) {
        console.error("Error in getAllReports:", error);
        return [];
    }
}

export async function addReport(reportData: Omit<Report, 'id' | 'createdAt' | 'deletedAt'>): Promise<string> {
    try {
        const reportsCollectionRef = collection(db, 'reports');
        const docRef = await addDoc(reportsCollectionRef, {
            ...reportData,
            createdAt: Timestamp.now()
        });
        return docRef.id;
    } catch (error) {
        console.error("Error in addReport:", error);
        throw error;
    }
}


export async function softDeleteReport(reportId: string): Promise<void> {
    try {
        const reportDocRef = doc(db, 'reports', reportId);
        await updateDoc(reportDocRef, {
            deletedAt: Timestamp.now(),
        });
    } catch (error) {
        console.error(`Error soft-deleting report ID ${reportId}:`, error);
        throw new Error("Failed to update report for deletion.");
    }
}

export async function softDeleteAllReports(): Promise<number> {
    try {
        const reportsCollectionRef = collection(db, 'reports');
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
        console.error("Error in softDeleteAllReports:", error);
        throw error;
    }
}

export async function getUserReports(userId: string): Promise<{ active: Report[], deleted: Report[] }> {
    try {
        const reportsCollectionRef = collection(db, 'reports');
        const q = query(reportsCollectionRef, where("reporterId", "==", userId));
        const snapshot = await getDocs(q);
        const allUserReports = snapshot.docs.map(doc => {
             const data = doc.data();
             return {
                id: doc.id,
                ...data,
                createdAt: (data.createdAt as Timestamp).toDate(),
                deletedAt: (data.deletedAt as Timestamp)?.toDate(),
             } as Report
        });

        const active = allUserReports
          .filter(r => !r.deletedAt)
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        
        const deleted = allUserReports
          .filter(r => !!r.deletedAt)
          .sort((a, b) => (b.deletedAt as Date).getTime() - (a.deletedAt as Date).getTime());
        
        return { active, deleted };
    } catch (error) {
        console.error(`Error getting user reports for user ID ${userId}:`, error);
        return { active: [], deleted: [] };
    }
}

// --- Log Management ---

export async function getSearchLogs(userId?: string): Promise<SearchLog[]> {
    try {
        const logsCollectionRef = collection(db, 'searchLogs');
        const q = userId 
            ? query(logsCollectionRef, where("userId", "==", userId), orderBy("timestamp", "desc"))
            : query(logsCollectionRef, orderBy("timestamp", "desc"));
        
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                timestamp: (data.timestamp as Timestamp).toDate()
            } as SearchLog
        });
    } catch (error) {
        console.error(`Error getting search logs for user ID ${userId || 'all'}:`, error);
        return [];
    }
}

export async function addSearchLog(logData: Omit<SearchLog, 'id' | 'timestamp'>): Promise<void> {
    try {
        const logsCollectionRef = collection(db, 'searchLogs');
        await addDoc(logsCollectionRef, {
            ...logData,
            timestamp: Timestamp.now(),
        });
    } catch (error) {
        console.error("Error in addSearchLog:", error);
    }
}

export async function getAuditLogs(): Promise<AuditLogEntry[]> {
    try {
        const auditLogsCollectionRef = collection(db, 'auditLogs');
        const q = query(auditLogsCollectionRef, orderBy("timestamp", "desc"));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                timestamp: (data.timestamp as Timestamp).toDate()
            } as AuditLogEntry;
        });
    } catch (error) {
        console.error("Error in getAuditLogs:", error);
        return [];
    }
}

export async function addAuditLogEntry(entryData: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<void> {
    try {
        const auditLogsCollectionRef = collection(db, 'auditLogs');
        await addDoc(auditLogsCollectionRef, {
            ...entryData,
            timestamp: Timestamp.now(),
        });
    } catch (error) {
        console.error("Error in addAuditLogEntry:", error);
    }
}

// --- Notification Management ---

export async function getUserNotifications(userId: string): Promise<UserNotification[]> {
    try {
        const notificationsCollectionRef = collection(db, 'notifications');
        const q = query(notificationsCollectionRef, where("userId", "==", userId), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: (data.createdAt as Timestamp).toDate()
            } as UserNotification
        });
    } catch (error) {
        console.error(`Error getting notifications for user ID ${userId}:`, error);
        return [];
    }
}

export async function addUserNotification(userId: string, notificationData: Omit<UserNotification, 'id' | 'createdAt' | 'read' | 'userId'>): Promise<void> {
    try {
        const notificationsCollectionRef = collection(db, 'notifications');
        await addDoc(notificationsCollectionRef, {
            userId,
            ...notificationData,
            createdAt: Timestamp.now(),
            read: false,
        });
    } catch (error) {
        console.error(`Error adding notification for user ID ${userId}:`, error);
    }
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
    try {
        const notifDocRef = doc(db, 'notifications', notificationId);
        await updateDoc(notifDocRef, { read: true });
    } catch (error) {
        console.error(`Error marking notification ID ${notificationId} as read:`, error);
    }
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
    try {
        const notificationsCollectionRef = collection(db, 'notifications');
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
