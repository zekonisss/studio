
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
  Timestamp,
  deleteDoc
} from 'firebase/firestore';

const isBrowser = typeof window !== 'undefined';
const USERS_COLLECTION = 'users';
const REPORTS_COLLECTION = 'reports';
const SEARCH_LOGS_COLLECTION = 'searchLogs';
const AUDIT_LOGS_COLLECTION = 'auditLogs';
const NOTIFICATIONS_COLLECTION = 'notifications';

// --- Helper ---

const convertFirestoreTimestampToDate = (data: any) => {
    if (!data) return data;
    const convertedData = { ...data };
    for (const key in convertedData) {
        if (convertedData[key] instanceof Timestamp) {
            convertedData[key] = convertedData[key].toDate();
        }
    }
    return convertedData;
};

// --- User Management ---

export async function getAllUsers(): Promise<UserProfile[]> {
  if (!isBrowser) return [];
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
    if (!isBrowser) return;
    try {
        const userDocRef = doc(db, USERS_COLLECTION, user.id);
        await setDoc(userDocRef, user);
    } catch (error) {
        console.error("Failed to add user to Firestore:", error);
        throw new Error("Failed to save user profile to the database.");
    }
}

export async function addUsersBatch(users: UserProfile[]): Promise<void> {
  if (!isBrowser) return;
  const batch = writeBatch(db);
  users.forEach(user => {
      // Create a new document reference with a unique ID for each user in the batch
      const userDocRef = doc(collection(db, USERS_COLLECTION));
      // Use the newly generated ID in the user object
      const userWithId = { ...user, id: userDocRef.id };
      batch.set(userDocRef, userWithId);
  });
  await batch.commit();
}

export async function updateUserProfile(userId: string, userData: Partial<UserProfile>): Promise<void> {
  if (!isBrowser) return;
  try {
    const userDocRef = doc(db, USERS_COLLECTION, userId);
    await updateDoc(userDocRef, userData);
  } catch (error) {
    console.error("Error updating user profile:", error);
  }
}

export async function findUserByEmail(email: string): Promise<UserProfile | null> {
  if (!isBrowser) return null;
  const q = query(collection(db, USERS_COLLECTION), where("email", "==", email.toLowerCase()));
  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) {
    return null;
  }
  const userDoc = querySnapshot.docs[0];
  return { id: userDoc.id, ...userDoc.data() } as UserProfile;
}

export async function getUserById(userId: string): Promise<UserProfile | null> {
    if (!isBrowser) return null;
    try {
        const userDocRef = doc(db, USERS_COLLECTION, userId);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as UserProfile;
        }
        // If the document does not exist, it's a clear "not found" case.
        return null;
    } catch (error) {
        console.error("Error in getUserById:", error);
        // Rethrow the error so it can be caught by the calling function (e.g., in useAuth)
        // This provides more specific error messages than just "profile not found".
        throw error;
    }
}

// --- Report Management ---

export async function getAllReports(): Promise<Report[]> {
    if (!isBrowser) return [];
    try {
        const q = query(collection(db, REPORTS_COLLECTION), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => convertFirestoreTimestampToDate({ id: doc.id, ...doc.data() }) as Report);
    } catch (error) {
        console.error("Error getting all reports:", error);
        return [];
    }
}

export async function addReport(reportData: Omit<Report, 'id' | 'createdAt'>): Promise<void> {
    if (!isBrowser) return;
    try {
        // The createdAt field should be a Firestore Timestamp for proper server-side ordering.
        const dataWithTimestamp = {
            ...reportData,
            createdAt: Timestamp.fromDate(new Date()),
        };
        await addDoc(collection(db, REPORTS_COLLECTION), dataWithTimestamp);
    } catch (error) {
        console.error("Error adding report:", error);
        // Provide a more specific error for permission issues
        if (error instanceof Error && 'code' in error && (error as any).code === 'permission-denied') {
             throw new Error("Permission denied. Check Firestore security rules for the 'reports' collection.");
        }
        throw new Error("Failed to add report to the database.");
    }
}

export async function softDeleteReport(reportId: string): Promise<void> {
    if (!isBrowser) return;
    try {
        const reportDocRef = doc(db, REPORTS_COLLECTION, reportId);
        await updateDoc(reportDocRef, {
            deletedAt: new Date().toISOString(),
        });
    } catch (error) {
        console.error("Error soft-deleting report:", error);
        throw new Error("Failed to update report for deletion.");
    }
}

export async function softDeleteAllReports(): Promise<number> {
    if (!isBrowser) return 0;
    try {
        const reportsSnapshot = await getDocs(query(collection(db, REPORTS_COLLECTION), where("deletedAt", "==", null)));
        const batch = writeBatch(db);
        reportsSnapshot.docs.forEach(doc => {
            batch.update(doc.ref, { deletedAt: new Date().toISOString() });
        });
        await batch.commit();
        return reportsSnapshot.size;
    } catch (error) {
        console.error("Error soft-deleting all reports:", error);
        return 0;
    }
}

export async function getUserReports(userId: string): Promise<{ active: Report[], deleted: Report[] }> {
    if (!isBrowser) return { active: [], deleted: [] };
    try {
        const q = query(collection(db, REPORTS_COLLECTION), where("reporterId", "==", userId));
        const snapshot = await getDocs(q);
        const allUserReports = snapshot.docs.map(doc => convertFirestoreTimestampToDate({ id: doc.id, ...doc.data() }) as Report);

        const active = allUserReports.filter(r => !r.deletedAt).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        const deleted = allUserReports.filter(r => !!r.deletedAt).sort((a, b) => new Date(b.deletedAt!).getTime() - new Date(a.deletedAt!).getTime());
        
        return { active, deleted };
    } catch (error) {
        console.error("Error getting user reports:", error);
        return { active: [], deleted: [] };
    }
}

// --- Log Management ---

export async function getSearchLogs(userId?: string): Promise<SearchLog[]> {
    if (!isBrowser) return [];
    try {
        const logsCollectionRef = collection(db, SEARCH_LOGS_COLLECTION);
        const q = userId 
            ? query(logsCollectionRef, where("userId", "==", userId), orderBy("timestamp", "desc"))
            : query(logsCollectionRef, orderBy("timestamp", "desc"));
        
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => convertFirestoreTimestampToDate({ id: doc.id, ...doc.data() }) as SearchLog);
    } catch (error) {
        console.error("Error getting search logs:", error);
        return [];
    }
}

export async function addSearchLog(logData: Omit<SearchLog, 'id' | 'timestamp'>): Promise<void> {
    if (!isBrowser) return;
    try {
        await addDoc(collection(db, SEARCH_LOGS_COLLECTION), {
            ...logData,
            timestamp: Timestamp.fromDate(new Date()),
        });
    } catch (error) {
        console.error("Error adding search log:", error);
    }
}

export async function getAuditLogs(): Promise<AuditLogEntry[]> {
    if (!isBrowser) return [];
    try {
        const q = query(collection(db, AUDIT_LOGS_COLLECTION), orderBy("timestamp", "desc"));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => convertFirestoreTimestampToDate({ id: doc.id, ...doc.data() }) as AuditLogEntry);
    } catch (error) {
        console.error("Error getting audit logs:", error);
        return [];
    }
}

export async function addAuditLogEntry(entryData: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<void> {
    if (!isBrowser) return;
    try {
        await addDoc(collection(db, AUDIT_LOGS_COLLECTION), {
            ...entryData,
            timestamp: Timestamp.fromDate(new Date()),
        });
    } catch (error) {
        console.error("Error adding audit log entry:", error);
    }
}

// --- Notification Management ---

export async function getUserNotifications(userId: string): Promise<UserNotification[]> {
    if (!isBrowser) return [];
    try {
        const q = query(collection(db, NOTIFICATIONS_COLLECTION), where("userId", "==", userId), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserNotification));
    } catch (error) {
        console.error("Error getting user notifications:", error);
        return [];
    }
}

export async function addUserNotification(userId: string, notificationData: Omit<UserNotification, 'id' | 'createdAt' | 'read' | 'userId'>): Promise<void> {
    if (!isBrowser) return;
    try {
        await addDoc(collection(db, NOTIFICATIONS_COLLECTION), {
            userId,
            ...notificationData,
            createdAt: new Date().toISOString(),
            read: false,
        });
    } catch (error) {
        console.error("Error adding user notification:", error);
    }
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
    if (!isBrowser) return;
    try {
        const notifDocRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId);
        await updateDoc(notifDocRef, { read: true });
    } catch (error) {
        console.error("Error marking notification as read:", error);
    }
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
    if (!isBrowser) return;
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
