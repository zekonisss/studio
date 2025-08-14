
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
  console.log("storage.uploadReportImage: Uploading file:", file.name);
  const fileRef = ref(firebaseStorage, `report-images/${Date.now()}-${file.name}`);
  const snapshot = await uploadBytes(fileRef, file);
  const downloadURL = await getDownloadURL(snapshot.ref);
  console.log("storage.uploadReportImage: File uploaded, URL:", downloadURL);
  
  // Basic AI hint generation from file name
  const hint = file.name.split('.')[0].replace(/[^a-zA-Z\s]/g, '').substring(0, 20);

  return { url: downloadURL, dataAiHint: hint };
}


// --- User Management ---

export async function getAllUsers(): Promise<UserProfile[]> {
    console.log("storage.getAllUsers: Fetching all documents from collection:", USERS_COLLECTION);
    const usersCollectionRef = collection(db, USERS_COLLECTION);
    const snapshot = await getDocs(usersCollectionRef);
    const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfile));
    console.log(`storage.getAllUsers: Found ${users.length} users.`);
    return users;
}

export async function addUsersBatch(users: UserProfile[]): Promise<void> {
  console.log("storage.addUsersBatch: Starting batch add for users:", users.length);
  const batch = writeBatch(db);
  const usersCollectionRef = collection(db, USERS_COLLECTION);
  
  const allCurrentUsers = await getAllUsers();
  const existingEmails = new Set(allCurrentUsers.map(u => u.email.toLowerCase()));
  const existingCompanyCodes = new Set(allCurrentUsers.map(u => u.companyCode));

  for (const user of users) {
    if (!existingEmails.has(user.email.toLowerCase()) && !existingCompanyCodes.has(user.companyCode)) {
      console.log("storage.addUsersBatch: Adding user to batch:", user.email);
      const userDocRef = doc(usersCollectionRef); 
      const userWithTimestamp = { ...user, registeredAt: serverTimestamp() };
      batch.set(userDocRef, userWithTimestamp);
      existingEmails.add(user.email.toLowerCase());
      existingCompanyCodes.add(user.companyCode);
    } else {
        console.warn(`storage.addUsersBatch: Skipping user due to duplicate email or company code: ${user.email} / ${user.companyCode}`);
    }
  }

  await batch.commit();
  console.log("storage.addUsersBatch: Batch commit successful.");
}


export async function updateUserProfile(userId: string, userData: Partial<UserProfile>): Promise<void> {
    console.log("storage.updateUserProfile: Updating profile for userId:", userId, "with data:", userData);
    if (!userId) {
        console.error("storage.updateUserProfile: Error - undefined userId.");
        throw new Error("Cannot update user profile with undefined ID.");
    }
    const userDocRef = doc(db, USERS_COLLECTION, userId);
    await updateDoc(userDocRef, userData);
}

export async function findUserByEmail(email: string): Promise<UserProfile | null> {
    console.log("storage.findUserByEmail: Querying for email:", email);
    const q = query(collection(db, USERS_COLLECTION), where("email", "==", email.toLowerCase()));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      console.log("storage.findUserByEmail: No user found.");
      return null;
    }
    const userDoc = querySnapshot.docs[0];
    console.log("storage.findUserByEmail: User found:", userDoc.id);
    return { id: userDoc.id, ...userDoc.data() } as UserProfile;
}

export async function getUserById(userId: string): Promise<UserProfile | null> {
    console.log("storage.getUserById: Fetching profile for userId:", userId);
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      console.error("storage.getUserById: Error - invalid or undefined userId provided:", userId);
      return null;
    }
    const userDocRef = doc(db, USERS_COLLECTION, userId);
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
        const data = docSnap.data();
        console.log("storage.getUserById: Profile found for userId:", userId, data);
        return { id: docSnap.id, ...data } as UserProfile;
    }
    console.warn("storage.getUserById: No profile document found for userId:", userId);
    return null;
}

// --- Report Management ---

export async function getAllReports(): Promise<Report[]> {
    console.log("storage.getAllReports: Fetching all reports from collection:", REPORTS_COLLECTION);
    const reportsCollectionRef = collection(db, REPORTS_COLLECTION);
    const q = query(reportsCollectionRef, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    const reports = snapshot.docs.map(doc => {
        const data = doc.data();
        return { 
            id: doc.id, 
            ...data,
        } as Report;
    });
    console.log(`storage.getAllReports: Found ${reports.length} reports.`);
    return reports;
}

export async function addReport(reportData: Omit<Report, 'id' | 'createdAt' | 'deletedAt'>): Promise<string> {
    console.log("storage.addReport: Adding new report:", reportData);
    const reportsCollectionRef = collection(db, REPORTS_COLLECTION);
    const docRef = await addDoc(reportsCollectionRef, {
        ...reportData,
        createdAt: serverTimestamp(),
        deletedAt: null
    });
    console.log("storage.addReport: Report added with ID:", docRef.id);
    return docRef.id;
}


export async function softDeleteReport(reportId: string): Promise<void> {
    console.log("storage.softDeleteReport: Soft deleting report with ID:", reportId);
     if (!reportId) {
        console.error("storage.softDeleteReport: Error - undefined reportId.");
        return;
    }
    const reportDocRef = doc(db, REPORTS_COLLECTION, reportId);
    await updateDoc(reportDocRef, { deletedAt: serverTimestamp() });
}

export async function softDeleteAllReports(): Promise<number> {
    console.log("storage.softDeleteAllReports: Attempting to delete all non-deleted reports.");
    const reportsCollectionRef = collection(db, REPORTS_COLLECTION);
    const q = query(reportsCollectionRef, where("deletedAt", "==", null));
    const reportsSnapshot = await getDocs(q);
    
    if (reportsSnapshot.empty) {
        console.log("storage.softDeleteAllReports: No active reports to delete.");
        return 0;
    }

    console.log(`storage.softDeleteAllReports: Found ${reportsSnapshot.size} reports to delete.`);
    const batch = writeBatch(db);
    reportsSnapshot.docs.forEach(doc => {
        batch.update(doc.ref, { deletedAt: serverTimestamp() });
    });
    await batch.commit();
    console.log("storage.softDeleteAllReports: Batch delete successful.");
    return reportsSnapshot.size;
}

export async function getUserReports(userId: string): Promise<{ active: Report[], deleted: Report[] }> {
    console.log("storage.getUserReports: Fetching reports for userId:", userId);
     if (!userId) {
        console.error("storage.getUserReports: Error - undefined userId.");
        return { active: [], deleted: [] };
    }
    const reportsCollectionRef = collection(db, REPORTS_COLLECTION);
    const q = query(reportsCollectionRef, where("reporterId", "==", userId));
    const snapshot = await getDocs(q);
    const allUserReports = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Report));

    const active = allUserReports
      .filter(r => !r.deletedAt)
      .sort((a, b) => ((b.createdAt as Timestamp).toMillis() - (a.createdAt as Timestamp).toMillis()));
    
    const deleted = allUserReports
      .filter(r => r.deletedAt)
      .sort((a, b) => ((b.deletedAt as Timestamp).toMillis() - (a.deletedAt as Timestamp).toMillis()));
      
    console.log(`storage.getUserReports: Found ${active.length} active and ${deleted.length} deleted reports.`);
    return { active, deleted };
}

// --- Log Management ---

export async function getSearchLogs(userId?: string): Promise<SearchLog[]> {
    console.log("storage.getSearchLogs: Fetching search logs for userId:", userId || "all");
    const logsCollectionRef = collection(db, SEARCH_LOGS_COLLECTION);
    
    if (!userId) {
       console.warn("storage.getSearchLogs: Called without a userId.");
       return [];
    }
    
    const q = query(logsCollectionRef, where("userId", "==", userId), orderBy("timestamp", "desc"));
    
    const snapshot = await getDocs(q);
    const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SearchLog));
    console.log(`storage.getSearchLogs: Found ${logs.length} logs for user ${userId}.`);
    return logs;
}

export async function addSearchLog(logData: Omit<SearchLog, 'id' | 'timestamp'>): Promise<void> {
    console.log("storage.addSearchLog: Adding search log for userId:", logData.userId);
    if (!logData.userId) {
       console.error("storage.addSearchLog: Error - cannot add log without userId.");
       return;
    }
    const logsCollectionRef = collection(db, SEARCH_LOGS_COLLECTION);
    await addDoc(logsCollectionRef, { ...logData, timestamp: serverTimestamp() });
}

export async function getAuditLogs(): Promise<AuditLogEntry[]> {
    console.log("storage.getAuditLogs: Fetching all audit logs.");
    const auditLogsCollectionRef = collection(db, AUDIT_LOGS_COLLECTION);
    const q = query(auditLogsCollectionRef, orderBy("timestamp", "desc"));
    const snapshot = await getDocs(q);
    const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AuditLogEntry));
     console.log(`storage.getAuditLogs: Found ${logs.length} audit logs.`);
    return logs;
}

export async function addAuditLogEntry(entryData: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<void> {
    console.log("storage.addAuditLogEntry: Adding audit log entry for admin:", entryData.adminName);
     if (!entryData.adminId) {
       console.error("storage.addAuditLogEntry: Error - cannot add log without adminId.");
       return;
    }
    const auditLogsCollectionRef = collection(db, AUDIT_LOGS_COLLECTION);
    await addDoc(auditLogsCollectionRef, { ...entryData, timestamp: serverTimestamp() });
}

// --- Notification Management ---

export async function getUserNotifications(userId: string): Promise<UserNotification[]> {
    console.log("storage.getUserNotifications: Fetching notifications for userId:", userId);
    if (!userId) {
        console.error("storage.getUserNotifications: Error - undefined userId.");
        return [];
    }
    const notificationsCollectionRef = collection(db, NOTIFICATIONS_COLLECTION);
    const q = query(notificationsCollectionRef, where("userId", "==", userId), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserNotification));
    console.log(`storage.getUserNotifications: Found ${notifs.length} notifications.`);
    return notifs;
}

export async function addUserNotification(userId: string, notificationData: Omit<UserNotification, 'id' | 'createdAt' | 'read' | 'userId'>): Promise<void> {
    console.log("storage.addUserNotification: Adding notification for userId:", userId);
     if (!userId) {
        console.error("storage.addUserNotification: Error - undefined userId.");
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
    console.log("storage.markNotificationAsRead: Marking notification as read. ID:", notificationId);
    if (!notificationId) {
        console.error("storage.markNotificationAsRead: Error - undefined notificationId.");
        return;
    }
    const notifDocRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId);
    await updateDoc(notifDocRef, { read: true });
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
    console.log("storage.markAllNotificationsAsRead: Marking all as read for userId:", userId);
     if (!userId) {
        console.error("storage.markAllNotificationsAsRead: Error - undefined userId.");
        return;
    }
    const notificationsCollectionRef = collection(db, NOTIFICATIONS_COLLECTION);
    const q = query(notificationsCollectionRef, where("userId", "==", userId), where("read", "!=", true));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
        console.log("storage.markAllNotificationsAsRead: No unread notifications to mark.");
        return;
    }

    const batch = writeBatch(db);
    snapshot.docs.forEach(doc => {
        batch.update(doc.ref, { read: true });
    });
    await batch.commit();
     console.log(`storage.markAllNotificationsAsRead: Marked ${snapshot.size} notifications as read.`);
}
