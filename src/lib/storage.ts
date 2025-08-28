
"use client";

import type { Report, UserProfile, SearchLog, AuditLogEntry, UserNotification } from '@/types';
import { 
    MOCK_ADMIN_USER, 
    MOCK_ALL_USERS, 
    MOCK_GENERAL_REPORTS, 
    MOCK_USER_REPORTS,
    MOCK_USER_SEARCH_LOGS
} from './mock-data';

// This is a mock storage implementation that uses localStorage to simulate a database.
// This allows the app to function without a real backend.

const getFromStorage = <T>(key: string, defaultValue: T): T => {
    if (typeof window === 'undefined') {
        return defaultValue;
    }
    try {
        const item = window.localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.error(`Error reading from localStorage key “${key}”:`, error);
        return defaultValue;
    }
};

const saveToStorage = <T>(key: string, value: T): void => {
    if (typeof window === 'undefined') {
        return;
    }
    try {
        const item = JSON.stringify(value);
        window.localStorage.setItem(key, item);
    } catch (error) {
        console.error(`Error writing to localStorage key “${key}”:`, error);
    }
};

// Initialize with mock data if storage is empty
const initializeStorage = () => {
    if (typeof window !== 'undefined' && !localStorage.getItem('reports')) {
        saveToStorage('reports', [...MOCK_GENERAL_REPORTS, ...MOCK_USER_REPORTS]);
    }
    if (typeof window !== 'undefined' && !localStorage.getItem('users')) {
        saveToStorage('users', MOCK_ALL_USERS);
    }
    if (typeof window !== 'undefined' && !localStorage.getItem('searchLogs')) {
        saveToStorage('searchLogs', MOCK_USER_SEARCH_LOGS);
    }
     if (typeof window !== 'undefined' && !localStorage.getItem('auditLogs')) {
        saveToStorage('auditLogs', []);
    }
    if (typeof window !== 'undefined' && !localStorage.getItem('notifications')) {
        saveToStorage('notifications', []);
    }
};

// Call initialization on load
initializeStorage();


// --- User Management ---

export async function getAllUsers(): Promise<UserProfile[]> {
    return Promise.resolve(getFromStorage<UserProfile[]>('users', []));
}

export async function addUsersBatch(usersData: Omit<UserProfile, 'id'>[]): Promise<void> {
    const currentUsers = await getAllUsers();
    const newUsers = usersData.map((data, index) => ({
        ...data,
        id: `imported-user-${Date.now()}-${index}`,
        registeredAt: new Date(),
    }));
    const updatedUsers = [...currentUsers, ...newUsers];
    saveToStorage('users', updatedUsers);
    return Promise.resolve();
}

export async function updateUserProfile(userId: string, userData: Partial<UserProfile>): Promise<void> {
    const users = await getAllUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex > -1) {
        users[userIndex] = { ...users[userIndex], ...userData };
        saveToStorage('users', users);
    }
    return Promise.resolve();
}

export async function findUserByEmail(email: string): Promise<UserProfile | null> {
    const users = await getAllUsers();
    return Promise.resolve(users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null);
}

export async function getUserById(userId: string): Promise<UserProfile | null> {
    const users = await getAllUsers();
    return Promise.resolve(users.find(u => u.id === userId) || null);
}

// --- Report Management ---

export async function getAllReports(): Promise<Report[]> {
    const reports = getFromStorage<Report[]>('reports', []);
    return Promise.resolve(reports);
}

export async function addReport(reportData: Omit<Report, 'id' | 'createdAt' | 'deletedAt'>): Promise<void> {
    const reports = await getAllReports();
    const newReport: Report = {
        ...reportData,
        id: `report-${Date.now()}-${Math.random()}`,
        createdAt: new Date(),
        deletedAt: null,
    };
    reports.unshift(newReport); // Add to the beginning
    saveToStorage('reports', reports);
    return Promise.resolve();
}

export async function softDeleteReport(reportId: string): Promise<void> {
    let reports = await getAllReports();
    reports = reports.map(r => r.id === reportId ? { ...r, deletedAt: new Date() } : r);
    saveToStorage('reports', reports);
    return Promise.resolve();
}

export async function softDeleteAllReports(): Promise<number> {
    let reports = await getAllReports();
    let count = 0;
    reports = reports.map(r => {
        if (!r.deletedAt) {
            count++;
            return { ...r, deletedAt: new Date() };
        }
        return r;
    });
    saveToStorage('reports', reports);
    return Promise.resolve(count);
}

export async function getUserReports(userId: string): Promise<{ active: Report[], deleted: Report[] }> {
    const allReports = await getAllReports();
    const userReports = allReports.filter(r => r.reporterId === userId);
    
    const active = userReports
      .filter(r => !r.deletedAt)
      .sort((a, b) => new Date(b.createdAt as Date).getTime() - new Date(a.createdAt as Date).getTime());
    
    const deleted = userReports
      .filter(r => r.deletedAt)
      .sort((a, b) => new Date(b.deletedAt as Date).getTime() - new Date(a.deletedAt as Date).getTime());

    return Promise.resolve({ active, deleted });
}

// --- Log Management ---

export async function getSearchLogs(userId?: string): Promise<SearchLog[]> {
    const allLogs = getFromStorage<SearchLog[]>('searchLogs', []);
    if (userId) {
        return Promise.resolve(allLogs.filter(log => log.userId === userId));
    }
    return Promise.resolve(allLogs);
}

export async function addSearchLog(logData: Omit<SearchLog, 'id' | 'timestamp'>): Promise<void> {
    const logs = await getSearchLogs();
    const newLog: SearchLog = {
        ...logData,
        id: `log-${Date.now()}`,
        timestamp: new Date(),
    };
    logs.unshift(newLog);
    saveToStorage('searchLogs', logs);
    return Promise.resolve();
}


export async function getAuditLogs(): Promise<AuditLogEntry[]> {
    return Promise.resolve(getFromStorage<AuditLogEntry[]>('auditLogs', []));
}

export async function addAuditLogEntry(entryData: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<void> {
    const logs = await getAuditLogs();
    const newLog: AuditLogEntry = {
        ...entryData,
        id: `audit-${Date.now()}`,
        timestamp: new Date(),
    };
    logs.unshift(newLog);
    saveToStorage('auditLogs', logs);
}

// --- Notification Management ---

export async function getUserNotifications(userId: string): Promise<UserNotification[]> {
    const allNotifications = getFromStorage<UserNotification[]>('notifications', []);
    return Promise.resolve(allNotifications.filter(n => n.userId === userId));
}

export async function addUserNotification(userId: string, notificationData: Omit<UserNotification, 'id' | 'createdAt' | 'read' | 'userId'>): Promise<void> {
    const notifications = getFromStorage<UserNotification[]>('notifications', []);
    const newNotification: UserNotification = {
        ...notificationData,
        id: `notif-${Date.now()}`,
        userId,
        createdAt: new Date(),
        read: false,
    };
    notifications.unshift(newNotification);
    saveToStorage('notifications', notifications);
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
    const notifications = getFromStorage<UserNotification[]>('notifications', []);
    const updatedNotifications = notifications.map(n => n.id === notificationId ? { ...n, read: true } : n);
    saveToStorage('notifications', updatedNotifications);
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
    const notifications = getFromStorage<UserNotification[]>('notifications', []);
    const updatedNotifications = notifications.map(n => n.userId === userId ? { ...n, read: true } : n);
    saveToStorage('notifications', updatedNotifications);
}

// --- File Management ---
export async function uploadReportImage(file: File): Promise<{ url: string; dataAiHint: string }> {
  console.log("Simulating file upload for:", file.name);
  await new Promise(res => setTimeout(res, 500));
  const hint = file.name.split('.')[0].replace(/[^a-zA-Z\s]/g, '').substring(0, 20);
  return { 
    url: `https://placehold.co/600x400.png?text=Uploaded+${encodeURIComponent(file.name)}`,
    dataAiHint: hint
  };
}
