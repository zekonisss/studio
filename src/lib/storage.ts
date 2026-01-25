"use client";

import type { Report, ReportFirestore, UserProfile, UserProfileFirestore, SearchLog, SearchLogFirestore, AuditLogEntry, AuditLogEntryFirestore, UserNotification, UserNotificationFirestore } from '@/types';
import { db, storage as fbStorage } from './firebase'; 
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
  serverTimestamp,
  deleteDoc
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const isTimestamp = (value: any): value is Timestamp => {
  return value && typeof value.toDate === 'function';
};

const processDoc = <T extends { id: string }>(firestoreData: any): T => {
  const data = { ...firestoreData };
  const processedData: { [key: string]: any } = { id: data.id };

  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      const value = data[key];
      if (isTimestamp(value)) {
        processedData[key] = value.toDate().toISOString();
      } else {
        processedData[key] = value;
      }
    }
  }
  return processedData as T;
};

// --- User Management ---

export async function getAllUsers(): Promise<UserProfile[]> {
  const usersCol = collection(db, "users");
  const userSnapshot = await getDocs(usersCol);
  const userList = userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfileFirestore));
  return userList.map(u => processDoc<UserProfile>(u));
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
        const firestoreData = { id: userDoc.id, ...userDoc.data() } as UserProfileFirestore;
        return processDoc<UserProfile>(firestoreData);
    }
    return null;
}

export async function getUserById(userId: string): Promise<UserProfile | null> {
    const docRef = doc(db, "users", userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        const firestoreData = { id: docSnap.id, ...docSnap.data() } as UserProfileFirestore;
        return processDoc<UserProfile>(firestoreData);
    }
    return null;
}


// --- Report Management ---

export async function getAllReports(forAdmin: boolean = false): Promise<Report[]> {
  const reportsCol = collection(db, "reports");
  const q = query(reportsCol, orderBy("createdAt", "desc"));
  const reportSnapshot = await getDocs(q);
  
  const allReports = reportSnapshot.docs.map(doc => {
    const firestoreData = { id: doc.id, ...doc.data() } as ReportFirestore;
    return processDoc<Report>(firestoreData);
  });

  if (forAdmin) {
    return allReports; // Admin gets all reports regardless of status
  }
  
  // Regular users see only active reports
  return allReports.filter(report => report.status === 'active');
}


export async function addReport(reportData: Omit<Report, 'id' | 'status' | 'statusUpdatedAt' | 'createdAt' | 'deletedAt'> & {createdAt?: Date}): Promise<void> {
  const reportsCol = collection(db, "reports");
  
  const finalData = {
    ...reportData,
    createdAt: reportData.createdAt ? Timestamp.fromDate(reportData.createdAt) : serverTimestamp(),
    status: 'active',
    statusUpdatedAt: serverTimestamp(),
  };

  await addDoc(reportsCol, finalData);
}

export async function updateReport(reportId: string, data: Partial<Report>): Promise<void> {
    const reportRef = doc(db, "reports", reportId);
    await updateDoc(reportRef, {
        ...data,
        statusUpdatedAt: serverTimestamp()
    });
}

export async function deleteReport(reportId: string): Promise<void> {
    const reportRef = doc(db, "reports", reportId);
    await updateDoc(reportRef, {
        status: 'deleted',
        deletedAt: serverTimestamp(),
        statusUpdatedAt: serverTimestamp()
    });
}


export async function requestReportDeletion(reportId: string, reason: string): Promise<void> {
  const reportRef = doc(db, "reports", reportId);
  await updateDoc(reportRef, {
    status: 'pending_delete',
    deleteRequestReason: reason,
    statusUpdatedAt: serverTimestamp()
  });
}

export async function reviewDeletionRequest(
    reportId: string,
    decision: 'approved' | 'rejected',
    adminComment: string = ""
): Promise<void> {
    const reportRef = doc(db, "reports", reportId);
    
    if (decision === 'approved') {
        await updateDoc(reportRef, {
            status: 'deleted',
            deletedAt: serverTimestamp(),
            statusUpdatedAt: serverTimestamp()
        });
    } else { // 'rejected'
        await updateDoc(reportRef, {
            status: 'active',
            adminRejectReason: adminComment,
            deleteRequestReason: null, // Clear the request reason
            statusUpdatedAt: serverTimestamp()
        });
    }
}

export async function deleteAllReports(): Promise<number> {
    const reportsCol = collection(db, "reports");
    // We only want to "delete" active reports in this mass operation.
    const q = query(reportsCol, where("status", "==", "active"));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
        return 0;
    }

    const batch = writeBatch(db);
    snapshot.docs.forEach(document => {
        batch.update(document.ref, {
            status: 'deleted',
            deletedAt: serverTimestamp(),
            statusUpdatedAt: serverTimestamp()
        });
    });

    await batch.commit();
    return snapshot.size;
}

export async function getUserReports(userId: string): Promise<{ active: Report[], deleted: Report[], pending: Report[] }> {
  const q = query(collection(db, "reports"), where("reporterId", "==", userId), orderBy("createdAt", "desc"));
  const querySnapshot = await getDocs(q);
  
  const reports = querySnapshot.docs.map(doc => {
      const firestoreData = { id: doc.id, ...doc.data() } as ReportFirestore;
      return processDoc<Report>(firestoreData);
  });
  
  const active = reports.filter(r => r.status === 'active');
  const deleted = reports.filter(r => r.status === 'deleted');
  const pending = reports.filter(r => r.status === 'pending_delete');
  
  return { active, deleted, pending };
}


// --- Log Management ---

export async function getSearchLogs(userId?: string): Promise<SearchLog[]> {
  if (!userId) return [];
  const q = query(collection(db, "searchLogs"), where("userId", "==", userId), orderBy("timestamp", "desc"), limit(50));
  const querySnapshot = await getDocs(q);
  const logList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SearchLogFirestore));
  return logList.map(log => processDoc<SearchLog>(log));
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
    const logList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AuditLogEntryFirestore));
    return logList.map(log => processDoc<AuditLogEntry>(log));
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
    const notificationList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserNotificationFirestore));
    return notificationList.map(n => processDoc<UserNotification>(n));
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

export async function fixMissingStatus() {
  const reportsCol = collection(db, "reports");
  const snapshot = await getDocs(reportsCol);
  const batch = writeBatch(db);
  let count = 0;

  snapshot.docs.forEach(document => {
    const data = document.data();
    // Jei įrašas neturi statuso, suteikiame jam 'active'
    if (!data.status) {
      batch.update(document.ref, { 
        status: 'active',
        statusUpdatedAt: serverTimestamp() 
      });
      count++;
    }
  });

  if (count > 0) {
    await batch.commit();
    console.log(`Sėkmingai sutvarkyti ${count} įrašai.`);
  }
}
