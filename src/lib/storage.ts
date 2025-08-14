
"use client";

import type { Report, UserProfile, SearchLog, AuditLogEntry, UserNotification } from '@/types';
import { 
    MOCK_ALL_USERS, 
    MOCK_GENERAL_REPORTS, 
    MOCK_USER_REPORTS,
    MOCK_USER_SEARCH_LOGS,
    MOCK_ADMIN_USER
} from '@/lib/mock-data';

// --- File Management ---
export async function uploadReportImage(file: File): Promise<{ url: string; dataAiHint: string }> {
  // This is a mock function. In a real app, this would upload to a cloud storage.
  console.log("Mock uploading file:", file.name);
  await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
  const hint = file.name.split('.')[0].replace(/[^a-zA-Z\s]/g, '').substring(0, 20);
  return { 
    url: `https://placehold.co/600x400.png?text=Uploaded+${encodeURI(file.name)}`,
    dataAiHint: hint 
  };
}


// --- User Management ---

export async function getAllUsers(): Promise<UserProfile[]> {
    console.log("storage.ts (mock): getAllUsers called");
    return Promise.resolve(MOCK_ALL_USERS);
}

export async function addUsersBatch(users: UserProfile[]): Promise<void> {
    console.log("storage.ts (mock): addUsersBatch called with", users);
    users.forEach(user => {
        if (!MOCK_ALL_USERS.find(u => u.email === user.email)) {
            MOCK_ALL_USERS.push({ ...user, id: `mock-user-${Date.now()}` });
        }
    });
    return Promise.resolve();
}


export async function updateUserProfile(userId: string, userData: Partial<UserProfile>): Promise<void> {
    console.log(`storage.ts (mock): updateUserProfile called for ${userId} with`, userData);
    const userIndex = MOCK_ALL_USERS.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
        MOCK_ALL_USERS[userIndex] = { ...MOCK_ALL_USERS[userIndex], ...userData };
    }
    return Promise.resolve();
}

export async function findUserByEmail(email: string): Promise<UserProfile | null> {
    console.log(`storage.ts (mock): findUserByEmail called for ${email}`);
    const foundUser = MOCK_ALL_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
    return Promise.resolve(foundUser || null);
}

export async function getUserById(userId: string): Promise<UserProfile | null> {
    console.log(`storage.ts (mock): getUserById called for ${userId}`);
    const foundUser = MOCK_ALL_USERS.find(u => u.id === userId);
    return Promise.resolve(foundUser || null);
}


// --- Report Management ---

export async function getAllReports(): Promise<Report[]> {
    console.log("storage.ts (mock): getAllReports called");
    const allReports = [...MOCK_GENERAL_REPORTS, ...MOCK_USER_REPORTS];
    return Promise.resolve(allReports.sort((a,b) => b.createdAt.getTime() - a.createdAt.getTime()));
}

export async function addReport(reportData: Omit<Report, 'id' | 'createdAt' | 'deletedAt'>): Promise<string> {
    console.log("storage.ts (mock): addReport called with", reportData);
    const newReport: Report = {
        ...reportData,
        id: `report-user-${Date.now()}`,
        createdAt: new Date(),
    };
    MOCK_USER_REPORTS.unshift(newReport);
    return Promise.resolve(newReport.id);
}


export async function softDeleteReport(reportId: string): Promise<void> {
    console.log(`storage.ts (mock): softDeleteReport called for ${reportId}`);
    let reportIndex = MOCK_USER_REPORTS.findIndex(r => r.id === reportId);
    if (reportIndex !== -1) {
        MOCK_USER_REPORTS[reportIndex].deletedAt = new Date();
    } else {
        reportIndex = MOCK_GENERAL_REPORTS.findIndex(r => r.id === reportId);
        if (reportIndex !== -1) {
            MOCK_GENERAL_REPORTS[reportIndex].deletedAt = new Date();
        }
    }
    return Promise.resolve();
}

export async function softDeleteAllReports(): Promise<number> {
    console.log("storage.ts (mock): softDeleteAllReports called");
    let count = 0;
    MOCK_GENERAL_REPORTS.forEach(r => {
        if (!r.deletedAt) {
            r.deletedAt = new Date();
            count++;
        }
    });
    MOCK_USER_REPORTS.forEach(r => {
        if (!r.deletedAt) {
            r.deletedAt = new Date();
            count++;
        }
    });
    return Promise.resolve(count);
}

export async function getUserReports(userId: string): Promise<{ active: Report[], deleted: Report[] }> {
    console.log(`storage.ts (mock): getUserReports called for ${userId}`);
    const userReports = userId === MOCK_ADMIN_USER.id ? MOCK_USER_REPORTS : []; // Simplified for mock
    const active = userReports.filter(r => !r.deletedAt);
    const deleted = userReports.filter(r => !!r.deletedAt);
    return Promise.resolve({ active, deleted });
}

// --- Log Management ---

export async function getSearchLogs(userId: string): Promise<SearchLog[]> {
    console.log(`storage.ts (mock): getSearchLogs called for ${userId}`);
    return Promise.resolve(MOCK_USER_SEARCH_LOGS);
}

export async function addSearchLog(logData: Omit<SearchLog, 'id' | 'timestamp'>): Promise<void> {
    console.log("storage.ts (mock): addSearchLog called with", logData);
    const newLog: SearchLog = {
        ...logData,
        id: `log-${Date.now()}`,
        timestamp: new Date()
    };
    MOCK_USER_SEARCH_LOGS.unshift(newLog);
    return Promise.resolve();
}

export async function getAuditLogs(): Promise<AuditLogEntry[]> {
    console.log("storage.ts (mock): getAuditLogs called");
    // Mock audit logs if needed
    return Promise.resolve([]);
}

export async function addAuditLogEntry(entryData: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<void> {
    console.log("storage.ts (mock): addAuditLogEntry called with", entryData);
    // Mock adding audit logs if needed
    return Promise.resolve();
}

// --- Notification Management ---

export async function getUserNotifications(userId: string): Promise<UserNotification[]> {
    console.log(`storage.ts (mock): getUserNotifications called for ${userId}`);
    // Mock notifications
    return Promise.resolve([
        {
            id: 'notif-1',
            userId: userId,
            type: 'account_status_change',
            titleKey: 'notifications.accountStatusChanged.title',
            messageKey: 'notifications.accountStatusChanged.message',
            messageParams: { oldStatus: 'Pending', newStatus: 'Active', adminName: 'Admin' },
            link: '/account?tab=details',
            createdAt: new Date(),
            read: false,
        }
    ]);
}

export async function addUserNotification(userId: string, notificationData: Omit<UserNotification, 'id' | 'createdAt' | 'read' | 'userId'>): Promise<void> {
    console.log(`storage.ts (mock): addUserNotification for ${userId} with`, notificationData);
    return Promise.resolve();
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
    console.log(`storage.ts (mock): markNotificationAsRead called for ${notificationId}`);
    return Promise.resolve();
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
     console.log(`storage.ts (mock): markAllNotificationsAsRead called for ${userId}`);
    return Promise.resolve();
}
