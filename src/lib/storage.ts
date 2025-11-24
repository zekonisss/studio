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

const convertTimestamp = (data: any) => {
  const convertValue = (value: any): any => {
    if (value instanceof Timestamp) {
      return value.toDate().toISOString();
    }
    if (Array.isArray(value)) {
      return value.map(convertValue);
    }
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        const newObj: { [key: string]: any } = {};
        for (const key in value) {
            if (Object.prototype.hasOwnProperty.call(value, key)) {
                newObj[key] = convertValue(value[key]);
            }
        }
        return newObj;
    }
    return value;
  };
  return convertValue(data);
};


// --- User Management ---

export async function getAllUsers(): Promise<UserProfile[]> {
  const usersCol = collection(db, "users");
  const userSnapshot = await getDocs(usersCol);
  const userList = userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfile));
  return convertTimestamp(userList);
}

export async function addUsersBatch(usersData: Omit<UserProfile, 'id'>[]): Promise<void> {
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
        return convertTimestamp({ id: userDoc.id, ...userDoc.data() } as UserProfile);
    }
    return null;
}

export async function getUserById(userId: string): Promise<UserProfile | null> {
    const docRef = doc(db, "users", userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return convertTimestamp({ id: docSnap.id, ...docSnap.data() } as UserProfile);
    }
    return null;
}


// --- Report Management ---

export async function getAllReports(): Promise<Report[]> {
  const reportsCol = collection(db, "reports");
  const q = query(reportsCol, orderBy("createdAt", "desc"));
  const reportSnapshot = await getDocs(q);
  const reportList = reportSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Report));
  return convertTimestamp(reportList);
}

export async function addReport(reportData: Omit<Report, 'id'>): Promise<void> {
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
  const reports = querySnapshot.docs.map(doc => convertTimestamp({ id: doc.id, ...doc.data() } as Report));
  const active = reports.filter(r => !r.deletedAt);
  const deleted = reports.filter(r => !!r.deletedAt);
  return { active, deleted };
}

// --- Log Management ---

export async function getSearchLogs(userId?: string): Promise<SearchLog[]> {
  if (!userId) return [];
  const q = query(collection(db, "searchLogs"), where("userId", "==", userId), orderBy("timestamp", "desc"), limit(50));
  const querySnapshot = await getDocs(q);
  const logs = querySnapshot.docs.map(doc => convertTimestamp({ id: doc.id, ...doc.data() } as SearchLog));
  return logs;
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
    return querySnapshot.docs.map(doc => convertTimestamp({ id: doc.id, ...doc.data() } as AuditLogEntry));
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
    return querySnapshot.docs.map(doc => convertTimestamp({ id: doc.id, ...doc.data() } as UserNotification));
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
