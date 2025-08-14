
"use client";

import type { Report, UserProfile, SearchLog, AuditLogEntry, UserNotification } from '@/types';
import { db, storage as firebaseStorage, serverTimestamp, Timestamp } from '@/lib/firebase';
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
  orderBy
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const USERS_COLLECTION = 'users';
const REPORTS_COLLECTION = 'reports';
const SEARCH_LOGS_COLLECTION = 'searchLogs';
const AUDIT_LOGS_COLLECTION = 'auditLogs';
const NOTIFICATIONS_COLLECTION = 'notifications';

// --- File Management ---
export async function uploadReportImage(file: File): Promise<{ url: string; dataAiHint: string }> {
  const fileRef = ref(firebaseStorage, `report-images/${Date.now()}-${file.name}`);
  const snapshot = await uploadBytes(fileRef, file);
  const downloadURL = await getDownloadURL(snapshot.ref);
  
  // Simple hint generation from filename
  const hint = file.name.split('.')[0].replace(/[^a-zA-Z\s]/g, '').substring(0, 20);

  return { url: downloadURL, dataAiHint: hint };
}


// --- User Management ---

export async function getAllUsers(): Promise<UserProfile[]> {
    const usersCollectionRef = collection(db, USERS_COLLECTION);
    const snapshot = await getDocs(usersCollectionRef);
    const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfile));
    return users;
}

export async function addUsersBatch(users: UserProfile[]): Promise<void> {
  const batch = writeBatch(db);
  const usersCollectionRef = collection(db, USERS_COLLECTION);
  
  const allCurrentUsers = await getAllUsers();
  const existingEmails = new Set(allCurrentUsers.map(u => u.email.toLowerCase()));
  const existingCompanyCodes = new Set(allCurrentUsers.map(u => u.companyCode));

  for (const user of users) {
    if (!existingEmails.has(user.email.toLowerCase()) && !existingCompanyCodes.has(user.companyCode)) {
      const userDocRef = doc(usersCollectionRef); // Auto-generate ID
      const userWithTimestamp: UserProfile = { 
          ...user, 
          id: userDocRef.id, 
          registeredAt: serverTimestamp() 
        };
      batch.set(userDocRef, userWithTimestamp);
      existingEmails.add(user.email.toLowerCase());
      existingCompanyCodes.add(user.companyCode);
    } else {
        console.warn(`storage.addUsersBatch: Skipping user due to duplicate email or company code: ${user.email} / ${user.companyCode}`);
    }
  }

  await batch.commit();
}


export async function updateUserProfile(userId: string, userData: Partial<UserProfile>): Promise<void> {
    if (!userId) {
        throw new Error("Cannot update user profile with undefined ID.");
    }
    const userDocRef = doc(db, USERS_COLLECTION, userId);
    await updateDoc(userDocRef, userData);
}

export async function findUserByEmail(email: string): Promise<UserProfile | null> {
    const q = query(collection(db, USERS_COLLECTION), where("email", "==", email.toLowerCase()));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      return null;
    }
    const userDoc = querySnapshot.docs[0];
    return { id: userDoc.id, ...userDoc.data() } as UserProfile;
}

export async function getUserById(userId: string): Promise<UserProfile | null> {
    if (!userId) {
      console.error("storage.getUserById: Attempted to fetch user with invalid ID.");
      return null;
    }
    try {
        const userDocRef = doc(db, USERS_COLLECTION, userId);
        const docSnap = await getDoc(userDocRef);

        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as UserProfile;
        } else {
            console.warn("storage.getUserById: No profile document found for userId:", userId);
            return null;
        }
    } catch (error) {
        console.error("storage.getUserById: Firestore error:", error);
        return null; 
    }
}


// --- Report Management ---

export async function getAllReports(): Promise<Report[]> {
    const reportsCollectionRef = collection(db, REPORTS_COLLECTION);
    const q = query(reportsCollectionRef, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    const reports = snapshot.docs.map(doc => {
        return { 
            id: doc.id, 
            ...doc.data(),
        } as Report;
    });
    return reports;
}

export async function addReport(reportData: Omit<Report, 'id' | 'createdAt' | 'deletedAt'>): Promise<string> {
    const reportsCollectionRef = collection(db, REPORTS_COLLECTION);
    const docRef = await addDoc(reportsCollectionRef, {
        ...reportData,
        createdAt: serverTimestamp(),
        deletedAt: null
    });
    return docRef.id;
}


export async function softDeleteReport(reportId: string): Promise<void> {
     if (!reportId) {
        console.error("storage.softDeleteReport: Error - undefined reportId.");
        return;
    }
    const reportDocRef = doc(db, REPORTS_COLLECTION, reportId);
    await updateDoc(reportDocRef, { deletedAt: serverTimestamp() });
}

export async function softDeleteAllReports(): Promise<number> {
    const reportsCollectionRef = collection(db, REPORTS_COLLECTION);
    const q = query(reportsCollectionRef, where("deletedAt", "==", null));
    const reportsSnapshot = await getDocs(q);
    
    if (reportsSnapshot.empty) {
        return 0;
    }

    const batch = writeBatch(db);
    reportsSnapshot.docs.forEach(doc => {
        batch.update(doc.ref, { deletedAt: serverTimestamp() });
    });
    await batch.commit();
    return reportsSnapshot.size;
}

export async function getUserReports(userId: string): Promise<{ active: Report[], deleted: Report[] }> {
     if (!userId) {
        return { active: [], deleted: [] };
    }
    const reportsCollectionRef = collection(db, REPORTS_COLLECTION);
    const q = query(reportsCollectionRef, where("reporterId", "==", userId), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    const allUserReports = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Report));

    const active = allUserReports.filter(r => !r.deletedAt);
    const deleted = allUserReports.filter(r => !!r.deletedAt);
      
    return { active, deleted };
}

// --- Log Management ---

export async function getSearchLogs(userId: string): Promise<SearchLog[]> {
    const logsCollectionRef = collection(db, SEARCH_LOGS_COLLECTION);
    
    if (!userId) {
       return [];
    }
    
    const q = query(logsCollectionRef, where("userId", "==", userId), orderBy("timestamp", "desc"));
    
    const snapshot = await getDocs(q);
    const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SearchLog));
    return logs;
}

export async function addSearchLog(logData: Omit<SearchLog, 'id' | 'timestamp'>): Promise<void> {
    if (!logData.userId) {
       return;
    }
    const logsCollectionRef = collection(db, SEARCH_LOGS_COLLECTION);
    await addDoc(logsCollectionRef, { ...logData, timestamp: serverTimestamp() });
}

export async function getAuditLogs(): Promise<AuditLogEntry[]> {
    const auditLogsCollectionRef = collection(db, AUDIT_LOGS_COLLECTION);
    const q = query(auditLogsCollectionRef, orderBy("timestamp", "desc"));
    const snapshot = await getDocs(q);
    const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AuditLogEntry));
    return logs;
}

export async function addAuditLogEntry(entryData: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<void> {
     if (!entryData.adminId) {
       return;
    }
    const auditLogsCollectionRef = collection(db, AUDIT_LOGS_COLLECTION);
    await addDoc(auditLogsCollectionRef, { ...entryData, timestamp: serverTimestamp() });
}

// --- Notification Management ---

export async function getUserNotifications(userId: string): Promise<UserNotification[]> {
    if (!userId) {
        return [];
    }
    const notificationsCollectionRef = collection(db, NOTIFICATIONS_COLLECTION);
    const q = query(notificationsCollectionRef, where("userId", "==", userId), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserNotification));
    return notifs;
}

export async function addUserNotification(userId: string, notificationData: Omit<UserNotification, 'id' | 'createdAt' | 'read' | 'userId'>): Promise<void> {
     if (!userId) {
        return;
    }
    const notificationsCollectionRef = collection(db, NOTIFICATIONS_COLLECTION);
    await addDoc(notificationsCollectionRef, {
        userId,
        ...notificationData,
        createdAt: serverTimestamp(),
        read: false,
    });
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
    if (!notificationId) {
        return;
    }
    const notifDocRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId);
    await updateDoc(notifDocRef, { read: true });
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
     if (!userId) {
        return;
    }
    const notificationsCollectionRef = collection(db, NOTIFICATIONS_COLLECTION);
    const q = query(notificationsCollectionRef, where("userId", "==", userId), where("read", "==", false));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
        return;
    }

    const batch = writeBatch(db);
    snapshot.docs.forEach(doc => {
        batch.update(doc.ref, { read: true });
    });
    await batch.commit();
}
