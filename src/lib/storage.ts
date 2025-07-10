import type { Report, UserProfile, SearchLog, AuditLogEntry, UserNotification } from '@/types';
import { MOCK_ALL_USERS, MOCK_GENERAL_REPORTS, MOCK_USER_REPORTS, MOCK_USER_SEARCH_LOGS, MOCK_ADMIN_USER, MOCK_TEST_CLIENT_USER } from './mock-data';
import { db, auth } from './firebase';
import { collection, getDocs, doc, setDoc, query, where, getDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';


const LOCAL_STORAGE_REPORTS_KEY = 'driverCheckReports';
const LOCAL_STORAGE_SEARCH_LOGS_KEY = 'driverCheckSearchLogs';
const LOCAL_STORAGE_AUDIT_LOGS_KEY = 'driverCheckAuditLogs';
const LOCAL_STORAGE_NOTIFICATIONS_KEY = 'driverCheckNotifications';

const isBrowser = typeof window !== 'undefined';
const USERS_COLLECTION = 'users';


// --- User Management (Firestore) ---

// Helper function to seed or update mock users from mock-data.ts
// This function is now more robust. It creates users in Auth and then in Firestore.
export async function seedInitialUsers() {
  if (!isBrowser) return;

  const usersToSeed = [MOCK_ADMIN_USER, MOCK_TEST_CLIENT_USER];

  for (const mockUser of usersToSeed) {
    try {
      // Check if user already exists in Firestore by email
      const existingUser = await findUserByEmail(mockUser.email);
      if (existingUser) {
        // console.log(`User with email ${mockUser.email} already exists. Skipping seeding.`);
        continue;
      }

      // If user does not exist, create them in Firebase Auth
      // We need to sign out any currently signed-in user to do this cleanly
      const currentAuthUser = auth.currentUser;
      if (currentAuthUser) {
        await auth.signOut();
      }

      const userCredential = await createUserWithEmailAndPassword(auth, mockUser.email, mockUser.password || 'password123' );
      const newFirebaseUser = userCredential.user;

      console.log(`Created user in Auth with UID: ${newFirebaseUser.uid}`);

      const userProfileData: UserProfile = {
        ...mockUser,
        id: newFirebaseUser.uid, // IMPORTANT: Use the UID from Auth
      };
      
      // Add the full profile to Firestore
      await addUserProfile(userProfileData);
      console.log(`User profile for ${mockUser.email} created in Firestore.`);

      // After seeding, sign out to leave a clean state
      await auth.signOut();

    } catch (error: any) {
      // It's common for this to fail if the user already exists in Auth but not Firestore
      // (e.g., from a previous failed attempt). This is okay.
      if (error.code === 'auth/email-already-in-use') {
         // console.log(`Auth user for ${mockUser.email} already exists. Skipping Auth creation.`);
      } else {
        console.error("Error seeding user:", mockUser.email, error);
      }
      // Ensure we are signed out even if seeding fails
      if(auth.currentUser) await auth.signOut();
    }
  }
}


export async function getAllUsers(): Promise<UserProfile[]> {
  if (!isBrowser) return [];
  const usersCollectionRef = collection(db, USERS_COLLECTION);
  const snapshot = await getDocs(usersCollectionRef);
  const users: UserProfile[] = [];
  snapshot.forEach(doc => {
    users.push({ id: doc.id, ...doc.data() } as UserProfile);
  });
  return users;
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
      const userDocRef = doc(db, USERS_COLLECTION, user.id);
      batch.set(userDocRef, user);
  });
  await batch.commit();
}

export async function updateUserProfile(userId: string, userData: Partial<UserProfile>): Promise<void> {
  if (!isBrowser) return;
  const userDocRef = doc(db, USERS_COLLECTION, userId);
  await updateDoc(userDocRef, userData);
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
    const userDocRef = doc(db, USERS_COLLECTION, userId);
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as UserProfile;
    }
    return null;
}

// --- Report, Log, and Notification Management (Still using localStorage) ---

function getLocalReports(): Report[] {
  if (!isBrowser) return [...MOCK_USER_REPORTS, ...MOCK_GENERAL_REPORTS];
  
  const reportsJSON = localStorage.getItem(LOCAL_STORAGE_REPORTS_KEY);
  if (reportsJSON) {
    try {
      return JSON.parse(reportsJSON).map((report: any) => ({
        ...report,
        createdAt: new Date(report.createdAt),
      }));
    } catch (e) {
        console.error("Failed to parse reports from localStorage", e);
        localStorage.removeItem(LOCAL_STORAGE_REPORTS_KEY);
    }
  }

  const initialReports = [...MOCK_USER_REPORTS, ...MOCK_GENERAL_REPORTS];
  localStorage.setItem(LOCAL_STORAGE_REPORTS_KEY, JSON.stringify(initialReports));
  return initialReports;
}

function saveLocalReports(reports: Report[]): void {
  if (isBrowser) {
    localStorage.setItem(LOCAL_STORAGE_REPORTS_KEY, JSON.stringify(reports));
  }
}

export function getAllReports(): Report[] {
  const localReports = getLocalReports();
  const uniqueReportsMap = new Map<string, Report>();

  localReports.forEach(report => {
    if (!uniqueReportsMap.has(report.id)) {
      uniqueReportsMap.set(report.id, { ...report, createdAt: new Date(report.createdAt) });
    }
  });

  return Array.from(uniqueReportsMap.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function addReport(report: Report): void {
  const reports = getLocalReports();
  reports.push(report);
  saveLocalReports(reports);
}

export function saveAllReports(reports: Report[]): void {
  saveLocalReports(reports);
}

export function softDeleteReport(reportId: string): void {
  const reports = getLocalReports();
  const updatedReports = reports.map(report =>
    report.id === reportId ? { ...report, deletedAt: new Date().toISOString() } : report
  );
  saveLocalReports(updatedReports);
}

export function softDeleteAllReports(): number {
  const reports = getLocalReports();
  const reportsToDelete = reports.filter(r => !r.deletedAt);
  const updatedReports = reports.map(r =>
    !r.deletedAt ? { ...r, deletedAt: new Date().toISOString() } : r
  );
  saveLocalReports(updatedReports);
  return reportsToDelete.length;
}

export function getUserReports(userId: string): { active: Report[], deleted: Report[] } {
  const allUserReports = getLocalReports().filter(r => r.reporterId === userId);
  const active = allUserReports.filter(r => !r.deletedAt).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const deleted = allUserReports.filter(r => !!r.deletedAt).sort((a, b) => new Date(b.deletedAt!).getTime() - new Date(a.deletedAt!).getTime());
  return { active, deleted };
}

export function getSearchLogs(userId?: string): SearchLog[] {
    if (!isBrowser) return MOCK_USER_SEARCH_LOGS;

    const logsJSON = localStorage.getItem(LOCAL_STORAGE_SEARCH_LOGS_KEY);
    let allLogs: SearchLog[] = [];
    if(logsJSON) {
        try {
            allLogs = JSON.parse(logsJSON).map((log: any) => ({ ...log, timestamp: new Date(log.timestamp) }));
        } catch(e) {
            console.error("Failed to parse search logs from localStorage", e);
            localStorage.removeItem(LOCAL_STORAGE_SEARCH_LOGS_KEY);
        }
    } else {
        allLogs = MOCK_USER_SEARCH_LOGS;
        localStorage.setItem(LOCAL_STORAGE_SEARCH_LOGS_KEY, JSON.stringify(allLogs));
    }

    if (userId) {
        return allLogs.filter(log => log.userId === userId);
    }
    return allLogs;
}

export function addSearchLog(log: SearchLog): void {
  if (isBrowser) {
    const logs = getSearchLogs();
    logs.unshift(log);
    localStorage.setItem(LOCAL_STORAGE_SEARCH_LOGS_KEY, JSON.stringify(logs));
  }
}

export function getAuditLogs(): AuditLogEntry[] {
    if (!isBrowser) return [];
    const logsJSON = localStorage.getItem(LOCAL_STORAGE_AUDIT_LOGS_KEY);
    if (logsJSON) {
        try {
            return JSON.parse(logsJSON).map((log: any) => ({ ...log, timestamp: new Date(log.timestamp) }));
        } catch(e) {
            console.error("Failed to parse audit logs from localStorage", e);
            localStorage.removeItem(LOCAL_STORAGE_AUDIT_LOGS_KEY);
        }
    }
    return [];
}

export function addAuditLogEntry(entry: AuditLogEntry): void {
    if (isBrowser) {
        const logs = getAuditLogs();
        logs.unshift(entry);
        localStorage.setItem(LOCAL_STORAGE_AUDIT_LOGS_KEY, JSON.stringify(logs));
    }
}

function getAllNotifications(): UserNotification[] {
  if (!isBrowser) return [];
  const json = localStorage.getItem(LOCAL_STORAGE_NOTIFICATIONS_KEY);
  if (json) {
    try {
      return JSON.parse(json);
    } catch(e) {
        console.error("Failed to parse notifications from localStorage", e);
        localStorage.removeItem(LOCAL_STORAGE_NOTIFICATIONS_KEY);
    }
  }
  return [];
}

function saveAllNotifications(notifications: UserNotification[]): void {
  if (isBrowser) {
    localStorage.setItem(LOCAL_STORAGE_NOTIFICATIONS_KEY, JSON.stringify(notifications));
  }
}

export function getUserNotifications(userId: string): UserNotification[] {
  return getAllNotifications()
    .filter(n => n.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function addUserNotification(userId: string, notificationData: Omit<UserNotification, 'id' | 'createdAt' | 'read' | 'userId'>): void {
  const allNotifications = getAllNotifications();
  const newNotification: UserNotification = {
    id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    userId,
    ...notificationData,
    createdAt: new Date().toISOString(),
    read: false,
  };
  allNotifications.push(newNotification);
  saveAllNotifications(allNotifications);
}

export function markNotificationAsRead(userId: string, notificationId: string): void {
  const allNotifications = getAllNotifications();
  const updatedNotifications = allNotifications.map(n => 
    (n.userId === userId && n.id === notificationId) ? { ...n, read: true } : n
  );
  saveAllNotifications(updatedNotifications);
}

export function markAllNotificationsAsRead(userId: string): void {
  const allNotifications = getAllNotifications();
  const updatedNotifications = allNotifications.map(n => 
    n.userId === userId ? { ...n, read: true } : n
  );
  saveAllNotifications(updatedNotifications);
}
