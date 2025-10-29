
"use client";

import type { Report, UserProfile, SearchLog, AuditLogEntry, UserNotification } from '@/types';
import { db } from './firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  updateDoc, 
  doc, 
  query, 
  where, 
  limit, 
  orderBy, 
  serverTimestamp,
  getDoc,
  writeBatch
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

// --- User Management ---

export async function getAllUsers(): Promise<UserProfile[]> {
    const usersCol = collection(db, "users");
    const userSnapshot = await getDocs(usersCol);
    const userList = userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfile));
    return userList;
}

export async function addUsersBatch(usersData: Omit<UserProfile, 'id'>[]): Promise<void> {
    const batch = writeBatch(db);
    usersData.forEach((userData) => {
        const userRef = doc(collection(db, "users"));
        batch.set(userRef, { ...userData, registeredAt: serverTimestamp() });
    });
    await batch.commit();
}

export async function updateUserProfile(userId: string, userData: Partial<UserProfile>): Promise<void> {
    const userDocRef = doc(db, "users", userId);
    await updateDoc(userDocRef, userData);
}

export async function findUserByEmail(email: string): Promise<UserProfile | null> {
    const usersQuery = query(collection(db, "users"), where("email", "==", email), limit(1));
    const querySnapshot = await getDocs(usersQuery);
    if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        return { id: userDoc.id, ...userDoc.data() } as UserProfile;
    }
    return null;
}

export async function getUserById(userId: string): Promise<UserProfile | null> {
    const userDocRef = doc(db, "users", userId);
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
        return { id: userDoc.id, ...userDoc.data() } as UserProfile;
    }
    return null;
}

// --- Report Management ---

export async function getAllReports(): Promise<Report[]> {
    const reportsCol = collection(db, "reports");
    const reportsQuery = query(reportsCol, orderBy("createdAt", "desc"));
    const reportSnapshot = await getDocs(reportsQuery);
    return reportSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Report));
}

export async function addReport(reportData: Omit<Report, 'id' | 'createdAt' | 'deletedAt'>): Promise<void> {
    await addDoc(collection(db, "reports"), { ...reportData, createdAt: serverTimestamp(), deletedAt: null });
}

export async function softDeleteReport(reportId: string): Promise<void> {
    const reportDocRef = doc(db, "reports", reportId);
    await updateDoc(reportDocRef, { deletedAt: serverTimestamp() });
}

export async function softDeleteAllReports(): Promise<number> {
    const reportsCol = collection(db, "reports");
    const q = query(reportsCol, where("deletedAt", "==", null));
    const reportSnapshot = await getDocs(q);
    
    const batch = writeBatch(db);
    reportSnapshot.docs.forEach(document => {
        batch.update(document.ref, { deletedAt: serverTimestamp() });
    });
    
    await batch.commit();
    return reportSnapshot.size;
}

export async function getUserReports(userId: string): Promise<{ active: Report[], deleted: Report[] }> {
    const reportsQuery = query(collection(db, "reports"), where("reporterId", "==", userId));
    const reportSnapshot = await getDocs(reportsQuery);
    const userReports = reportSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Report));

    const active = userReports
      .filter(r => !r.deletedAt)
      .sort((a, b) => (b.createdAt as any)?.seconds - (a.createdAt as any)?.seconds);

    const deleted = userReports
      .filter(r => r.deletedAt)
      .sort((a, b) => (b.deletedAt as any)?.seconds - (a.deletedAt as any)?.seconds);

    return { active, deleted };
}

// --- Log Management ---

export async function getSearchLogs(userId?: string): Promise<SearchLog[]> {
    let logsQuery = query(collection(db, "searchLogs"), orderBy("timestamp", "desc"));
    if (userId) {
        logsQuery = query(collection(db, "searchLogs"), where("userId", "==", userId), orderBy("timestamp", "desc"));
    }
    const logSnapshot = await getDocs(logsQuery);
    return logSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SearchLog));
}

export async function addSearchLog(logData: Omit<SearchLog, 'id' | 'timestamp'>): Promise<void> {
    await addDoc(collection(db, "searchLogs"), { ...logData, timestamp: serverTimestamp() });
}


export async function getAuditLogs(): Promise<AuditLogEntry[]> {
    const logsQuery = query(collection(db, "auditLogs"), orderBy("timestamp", "desc"));
    const logSnapshot = await getDocs(logsQuery);
    return logSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AuditLogEntry));
}

export async function addAuditLogEntry(entryData: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<void> {
    await addDoc(collection(db, "auditLogs"), { ...entryData, timestamp: serverTimestamp() });
}

// --- Notification Management ---

export async function getUserNotifications(userId: string): Promise<UserNotification[]> {
    const notifQuery = query(collection(db, "notifications"), where("userId", "==", userId), orderBy("createdAt", "desc"));
    const notifSnapshot = await getDocs(notifQuery);
    return notifSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserNotification));
}

export async function addUserNotification(userId: string, notificationData: Omit<UserNotification, 'id' | 'createdAt' | 'read' | 'userId'>): Promise<void> {
    await addDoc(collection(db, "notifications"), {
        ...notificationData,
        userId,
        createdAt: serverTimestamp(),
        read: false,
    });
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
    const notifDocRef = doc(db, "notifications", notificationId);
    await updateDoc(notifDocRef, { read: true });
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
    const notifQuery = query(collection(db, "notifications"), where("userId", "==", userId), where("read", "==", false));
    const notifSnapshot = await getDocs(notifQuery);

    const batch = writeBatch(db);
    notifSnapshot.docs.forEach(document => {
        batch.update(document.ref, { read: true });
    });
    
    await batch.commit();
}

// --- File Management ---
export async function uploadReportImage(file: File): Promise<{ url: string; dataAiHint: string }> {
  const storage = getStorage();
  const storageRef = ref(storage, `reports/${Date.now()}-${file.name}`);

  const snapshot = await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(snapshot.ref);

  // Simple hint generation, can be improved
  const hint = file.name.split('.')[0].replace(/[^a-zA-Z\s]/g, '').substring(0, 20);

  return {
    url: downloadURL,
    dataAiHint: hint,
  };
}
