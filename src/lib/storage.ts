
"use client";

import type { Report, UserProfile, SearchLog, AuditLogEntry, UserNotification } from '@/types';
import { db } from '@/lib/firebase';
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
  serverTimestamp,
  Timestamp,
  deleteDoc
} from 'firebase/firestore';

const USERS_COLLECTION = 'users';
const REPORTS_COLLECTION = 'reports';
const SEARCH_LOGS_COLLECTION = 'searchLogs';
const AUDIT_LOGS_COLLECTION = 'auditLogs';
const NOTIFICATIONS_COLLECTION = 'notifications';

// --- File Management ---
// Firebase Storage is not correctly configured, this part is temporarily disabled.
// export async function uploadFile(file: File, reportId: string): Promise<string> {
//     const storageRef = ref(firebaseStorage, `reports/${reportId}/${file.name}`);
//     const snapshot = await uploadBytes(storageRef, file);
//     const downloadURL = await getDownloadURL(snapshot.ref);
//     return downloadURL;
// }


// --- User Management ---

export async function getAllUsers(): Promise<UserProfile[]> {
    const usersCollectionRef = collection(db, USERS_COLLECTION);
    const snapshot = await getDocs(usersCollectionRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfile));
}

export async function addUsersBatch(users: UserProfile[]): Promise<void> {
  const batch = writeBatch(db);
  const usersCollectionRef = collection(db, USERS_COLLECTION);
  
  const allCurrentUsers = await getAllUsers();
  const existingEmails = new Set(allCurrentUsers.map(u => u.email.toLowerCase()));
  const existingCompanyCodes = new Set(allCurrentUsers.map(u => u.companyCode));

  for (const user of users) {
    if (!existingEmails.has(user.email.toLowerCase()) && !existingCompanyCodes.has(user.companyCode)) {
      const userDocRef = doc(usersCollectionRef); 
      const userWithTimestamp: Omit<UserProfile, 'id' | 'registeredAt'> & { registeredAt: any } = { 
        ...user, 
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
}


export async function updateUserProfile(userId: string, userData: Partial<UserProfile>): Promise<void> {
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
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      console.error("storage.ts: getUserById was called with an invalid UID!", userId);
      return null;
    }
    const userDocRef = doc(db, USERS_COLLECTION, userId);
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
        const data = docSnap.data();
        // Convert Firestore Timestamps to Date objects
        if (data.registeredAt && data.registeredAt instanceof Timestamp) {
            data.registeredAt = data.registeredAt.toDate();
        }
        if (data.accountActivatedAt && data.accountActivatedAt instanceof Timestamp) {
            data.accountActivatedAt = data.accountActivatedAt.toDate();
        }
        return { id: docSnap.id, ...data } as UserProfile;
    }
    return null;
}

// --- Report Management ---

export async function getAllReports(): Promise<Report[]> {
    const reportsCollectionRef = collection(db, REPORTS_COLLECTION);
    const q = query(reportsCollectionRef, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
        const data = doc.data();
        return { 
            id: doc.id, 
            ...data,
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
            deletedAt: data.deletedAt instanceof Timestamp ? data.deletedAt.toDate() : null,
        } as Report;
    });
}

export async function addReport(reportData: Omit<Report, 'id'| 'deletedAt' | 'createdAt'>): Promise<string> {
    const reportsCollectionRef = collection(db, REPORTS_COLLECTION);
    const docRef = await addDoc(reportsCollectionRef, {
        ...reportData,
        createdAt: serverTimestamp(),
        deletedAt: null
    });
    return docRef.id;
}

export async function updateReport(reportId: string, reportData: Partial<Report>): Promise<void> {
    const reportDocRef = doc(db, REPORTS_COLLECTION, reportId);
    await updateDoc(reportDocRef, reportData);
}

export async function softDeleteReport(reportId: string): Promise<void> {
    const reportDocRef = doc(db, REPORTS_COLLECTION, reportId);
    await updateDoc(reportDocRef, { deletedAt: serverTimestamp() });
}

export async function softDeleteAllReports(): Promise<number> {
    const reportsCollectionRef = collection(db, REPORTS_COLLECTION);
    const q = query(reportsCollectionRef, where("deletedAt", "==", null));
    const reportsSnapshot = await getDocs(q);
    
    if (reportsSnapshot.empty) return 0;

    const batch = writeBatch(db);
    reportsSnapshot.docs.forEach(doc => {
        batch.update(doc.ref, { deletedAt: serverTimestamp() });
    });
    await batch.commit();
    return reportsSnapshot.size;
}

export async function getUserReports(userId: string): Promise<{ active: Report[], deleted: Report[] }> {
    const reportsCollectionRef = collection(db, REPORTS_COLLECTION);
    const q = query(reportsCollectionRef, where("reporterId", "==", userId));
    const snapshot = await getDocs(q);
    const allUserReports = snapshot.docs.map(doc => {
        const data = doc.data();
        return { 
            id: doc.id, 
            ...data,
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
            deletedAt: data.deletedAt instanceof Timestamp ? data.deletedAt.toDate() : null,
        } as Report;
    });

    const active = allUserReports
      .filter(r => !r.deletedAt)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    const deleted = allUserReports
      .filter(r => r.deletedAt)
      .sort((a, b) => b.deletedAt!.getTime() - a.deletedAt!.getTime());
      
    return { active, deleted };
}

// --- Log Management ---

export async function getSearchLogs(userId?: string): Promise<SearchLog[]> {
    const logsCollectionRef = collection(db, SEARCH_LOGS_COLLECTION);
    const q = userId 
        ? query(logsCollectionRef, where("userId", "==", userId), orderBy("timestamp", "desc"))
        : query(logsCollectionRef, orderBy("timestamp", "desc"));
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            timestamp: data.timestamp instanceof Timestamp ? data.timestamp.toDate() : new Date(),
        } as SearchLog
    });
}

export async function addSearchLog(logData: Omit<SearchLog, 'id' | 'timestamp'>): Promise<void> {
    const logsCollectionRef = collection(db, SEARCH_LOGS_COLLECTION);
    await addDoc(logsCollectionRef, { ...logData, timestamp: serverTimestamp() });
}

export async function getAuditLogs(): Promise<AuditLogEntry[]> {
    const auditLogsCollectionRef = collection(db, AUDIT_LOGS_COLLECTION);
    const q = query(auditLogsCollectionRef, orderBy("timestamp", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
             id: doc.id,
             ...data,
             timestamp: data.timestamp instanceof Timestamp ? data.timestamp.toDate() : new Date(),
        } as AuditLogEntry;
    });
}

export async function addAuditLogEntry(entryData: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<void> {
    const auditLogsCollectionRef = collection(db, AUDIT_LOGS_COLLECTION);
    await addDoc(auditLogsCollectionRef, { ...entryData, timestamp: serverTimestamp() });
}

// --- Notification Management ---

export async function getUserNotifications(userId: string): Promise<UserNotification[]> {
    const notificationsCollectionRef = collection(db, NOTIFICATIONS_COLLECTION);
    const q = query(notificationsCollectionRef, where("userId", "==", userId), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
             id: doc.id, 
             ...data,
             createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
        } as UserNotification
    });
}

export async function addUserNotification(userId: string, notificationData: Omit<UserNotification, 'id' | 'createdAt' | 'read' | 'userId'>): Promise<void> {
    const notificationsCollectionRef = collection(db, NOTIFICATIONS_COLLECTION);
    await addDoc(notificationsCollectionRef, {
        userId,
        ...notificationData,
        createdAt: serverTimestamp(),
        read: false,
    });
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
    const notifDocRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId);
    await updateDoc(notifDocRef, { read: true });
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
    const notificationsCollectionRef = collection(db, NOTIFICATIONS_COLLECTION);
    const q = query(notificationsCollectionRef, where("userId", "==", userId), where("read", "==", false));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) return;

    const batch = writeBatch(db);
    snapshot.docs.forEach(doc => {
        batch.update(doc.ref, { read: true });
    });
    await batch.commit();
}
