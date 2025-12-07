"use client";

import type { Report, UserProfile, SearchLog, AuditLogEntry, UserNotification } from '@/types';
import { db, storage as fbStorage } from './firebase'; // Renamed to avoid name collision
import { 
  collection, 
  getDocs, 
  addDoc, 
  doc, 
  updateDoc, 
  query, 
  where, 
  limit,
  orderBy,
  Timestamp,
  getDoc,
  writeBatch,
  serverTimestamp
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const isTimestamp = (value: any): value is Timestamp => {
  return value && typeof value.toDate === 'function';
};

const processDoc = <T extends { id: string }>(doc: any): T => {
  const data = doc.data();
  const processedData: { [key: string]: any } = { id: doc.id };

  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      if (isTimestamp(data[key])) {
        processedData[key] = data[key].toDate().toISOString();
      } else {
        processedData[key] = data[key];
      }
    }
  }
  return processedData as T;
};

// --- User Management ---

export async function getAllUsers(): Promise<UserProfile[]> {
  const usersCol = collection(db, "users");
  const userSnapshot = await getDocs(usersCol);
  return userSnapshot.docs.map(doc => processDoc<UserProfile>(doc));
}

export async function addUsersBatch(usersData: Omit<UserProfile, 'id' | 'registeredAt'>[]): Promise<void> {
    const batch = writeBatch(db);
    usersData.forEach(userData => {
        const newUserRef = doc(collection(db, "users")); // Auto-generate ID
        const finalUserData = {
          ...userData,
          registeredAt: serverTimestamp()
        };
        batch.set(newUserRef, finalUserData);
    });
    await batch.commit();
}

export async function updateUserProfile(userId: string, userData: Partial<UserProfile>): Promise<void> {
  const userRef = doc(db, "users", userId);
  await updateDoc(userRef, userData);
}

export async function findUserByEmail(email: string): Promise<UserProfile | null> {
    const q = query(collection(db, "users"), where("email", "==", email), limit(1));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        return processDoc<UserProfile>(userDoc);
    }
    return null;
}

export async function getUserById(userId: string): Promise<UserProfile | null> {
    const docRef = doc(db, "users", userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return processDoc<UserProfile>(docSnap);
    }
    return null;
}


// --- Report Management ---

export async function getAllReports(): Promise<Report[]> {
  const reportsCol = collection(db, "reports");
  const q = query(reportsCol, orderBy("createdAt", "desc"));
  const reportSnapshot = await getDocs(q);
  return reportSnapshot.docs.map(doc => processDoc<Report>(doc));
}

export async function addReport(reportData: Omit<Report, 'id' | 'createdAt' | 'deletedAt'>): Promise<void> {
  const reportsCol = collection(db, "reports");
  const dataWithTimestamp = {
    ...reportData,
    createdAt: serverTimestamp(),
    deletedAt: null,
  };
  await addDoc(reportsCol, dataWithTimestamp);
}

export async function softDeleteReport(reportId: string): Promise<void> {
  const reportRef = doc(db, "reports", reportId);
  await updateDoc(reportRef, {
    deletedAt: serverTimestamp()
  });
}

export async function softDeleteAllReports(): Promise<number> {
    const reportsCol = collection(db, "reports");
    const reportSnapshot = await getDocs(reportsCol);
    const batch = writeBatch(db);
    reportSnapshot.docs.forEach(document => {
        batch.update(document.ref, { deletedAt: serverTimestamp() });
    });
    await batch.commit();
    return reportSnapshot.size;
}

export async function getUserReports(userId: string): Promise<{ active: Report[], deleted: Report[] }> {
  const q = query(collection(db, "reports"), where("reporterId", "==", userId), orderBy("createdAt", "desc"));
  const querySnapshot = await getDocs(q);
  const reports = querySnapshot.docs.map(doc => processDoc<Report>(doc));
  const active = reports.filter(r => !r.deletedAt);
  const deleted = reports.filter(r => !!r.deletedAt);
  return { active, deleted };
}

// --- Log Management ---

export async function getSearchLogs(userId?: string): Promise<SearchLog[]> {
  if (!userId) return [];
  const q = query(collection(db, "searchLogs"), where("userId", "==", userId), orderBy("timestamp", "desc"), limit(50));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => processDoc<SearchLog>(doc));
}

export async function addSearchLog(logData: Omit<SearchLog, 'id' | 'timestamp'>): Promise<void> {
  const dataWithTimestamp = {
    ...logData,
    timestamp: serverTimestamp(),
  };
  await addDoc(collection(db, "searchLogs"), dataWithTimestamp);
}

export async function getAuditLogs(): Promise<AuditLogEntry[]> {
    const q = query(collection(db, "auditLogs"), orderBy("timestamp", "desc"), limit(100));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => processDoc<AuditLogEntry>(doc));
}

export async function addAuditLogEntry(entryData: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<void> {
    const dataWithTimestamp = {
        ...entryData,
        timestamp: serverTimestamp(),
    };
    await addDoc(collection(db, "auditLogs"), dataWithTimestamp);
}

// --- Notification Management ---

export async function getUserNotifications(userId: string): Promise<UserNotification[]> {
    const q = query(collection(db, "notifications"), where("userId", "==", userId), orderBy("createdAt", "desc"), limit(20));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => processDoc<UserNotification>(doc));
}

export async function addUserNotification(userId: string, notificationData: Omit<UserNotification, 'id' | 'createdAt' | 'read' | 'userId'>): Promise<void> {
    const data = {
        ...notificationData,
        userId,
        read: false,
        createdAt: serverTimestamp(),
    };
    await addDoc(collection(db, "notifications"), data);
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
    const notifRef = doc(db, "notifications", notificationId);
    await updateDoc(notifRef, { read: true });
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
    const q = query(collection(db, "notifications"), where("userId", "==", userId), where("read", "==", false));
    const querySnapshot = await getDocs(q);
    const batch = writeBatch(db);
    querySnapshot.docs.forEach(document => {
        batch.update(document.ref, { read: true });
    });
    await batch.commit();
}


// --- File Management ---
export async function uploadReportImage(file: File): Promise<{ url: string, dataAiHint: string }> {
  const fileId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  const fileExtension = file.name.split('.').pop();
  const storageRef = ref(fbStorage, `reports/${fileId}.${fileExtension}`);

  await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(storageRef);

  const hint = file.name.split('.')[0].replace(/[^a-zA-Z\s]/g, '').substring(0, 20) || 'document scan';

  return {
    url: downloadURL,
    dataAiHint: hint,
  };
}
