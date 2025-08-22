
"use client";

import type { Report, UserProfile, SearchLog, AuditLogEntry, UserNotification } from '@/types';
import { MOCK_ALL_USERS, MOCK_GENERAL_REPORTS, MOCK_USER_REPORTS, MOCK_USER_SEARCH_LOGS } from '@/lib/mock-data';

// --- File Management (Placeholder) ---
export async function uploadReportImage(file: File): Promise<{ url: string; dataAiHint: string }> {
  console.log("Simulating file upload for:", file.name);
  // In a real scenario, this would upload to a service and return a URL.
  // For mock, we'll return a placeholder.
  await new Promise(res => setTimeout(res, 500)); // Simulate network delay
  const hint = file.name.split('.')[0].replace(/[^a-zA-Z\s]/g, '').substring(0, 20);
  return { 
    url: `https://placehold.co/600x400.png?text=Uploaded+${encodeURIComponent(file.name)}`,
    dataAiHint: hint
  };
}


// --- User Management ---

export async function getAllUsers(): Promise<UserProfile[]> {
  console.log("storage.ts: getAllUsers called, returning mock data.");
  return Promise.resolve(MOCK_ALL_USERS);
}

export async function addUsersBatch(users: Omit<UserProfile, 'id'>[]): Promise<void> {
    console.log("storage.ts: addUsersBatch called with mock data.", users);
    // This is a mock implementation
    users.forEach(user => {
        const newUser: UserProfile = {
            id: `mock-user-${Math.random().toString(36).substring(2, 9)}`,
            ...user,
            registeredAt: new Date().toISOString(),
        };
        MOCK_ALL_USERS.push(newUser);
    });
    return Promise.resolve();
}

export async function updateUserProfile(userId: string, userData: Partial<UserProfile>): Promise<void> {
  console.log(`storage.ts: updateUserProfile called for ${userId}`, userData);
  const userIndex = MOCK_ALL_USERS.findIndex(u => u.id === userId);
  if (userIndex !== -1) {
    MOCK_ALL_USERS[userIndex] = { ...MOCK_ALL_USERS[userIndex], ...userData };
  }
  return Promise.resolve();
}

export async function findUserByEmail(email: string): Promise<UserProfile | null> {
  console.log(`storage.ts: findUserByEmail called for ${email}`);
  const user = MOCK_ALL_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
  return Promise.resolve(user || null);
}

export async function getUserById(userId: string): Promise<UserProfile | null> {
  console.log(`storage.ts: getUserById called for ${userId}`);
  const user = MOCK_ALL_USERS.find(u => u.id === userId);
  return Promise.resolve(user || null);
}


// --- Report Management ---

export async function getAllReports(): Promise<Report[]> {
    console.log("storage.ts: getAllReports called, returning mock data.");
    const allReports = [...MOCK_GENERAL_REPORTS, ...MOCK_USER_REPORTS].map(report => ({
        ...report,
        createdAt: new Date(report.createdAt), // Ensure createdAt is a Date object
        deletedAt: report.deletedAt ? new Date(report.deletedAt) : null,
    }));
    return Promise.resolve(allReports);
}

export async function addReport(reportData: Omit<Report, 'id' | 'createdAt' | 'deletedAt'>): Promise<string> {
    console.log("storage.ts: addReport called with mock data.", reportData);
    const newReport: Report = {
        id: `report-mock-${Date.now()}`,
        ...reportData,
        createdAt: new Date(),
    };
    MOCK_USER_REPORTS.push(newReport);
    return Promise.resolve(newReport.id);
}

export async function softDeleteReport(reportId: string): Promise<void> {
    console.log(`storage.ts: softDeleteReport called for ${reportId}`);
    const reportIndex = MOCK_USER_REPORTS.findIndex(r => r.id === reportId);
    if (reportIndex !== -1) {
        MOCK_USER_REPORTS[reportIndex].deletedAt = new Date();
    }
    const generalReportIndex = MOCK_GENERAL_REPORTS.findIndex(r => r.id === reportId);
     if (generalReportIndex !== -1) {
        MOCK_GENERAL_REPORTS[generalReportIndex].deletedAt = new Date();
    }
    return Promise.resolve();
}

export async function softDeleteAllReports(): Promise<number> {
    console.log("storage.ts: softDeleteAllReports called.");
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
    console.log(`storage.ts: getUserReports called for ${userId}`);
    const allUserReports = MOCK_USER_REPORTS
        .filter(r => r.reporterId === userId)
        .map(report => ({
            ...report,
            createdAt: new Date(report.createdAt),
            deletedAt: report.deletedAt ? new Date(report.deletedAt) : undefined,
        }));
        
    const active = allUserReports.filter(r => !r.deletedAt);
    const deleted = allUserReports.filter(r => !!r.deletedAt);
    return Promise.resolve({ active, deleted });
}

// --- Log Management ---

const MOCK_SEARCH_LOGS: SearchLog[] = MOCK_USER_SEARCH_LOGS.map(log => ({
    ...log,
    timestamp: new Date(log.timestamp)
}));


export async function getSearchLogs(userId?: string): Promise<SearchLog[]> {
    console.log(`storage.ts: getSearchLogs called for ${userId || 'all'}`);
    if (userId) {
        return Promise.resolve(MOCK_SEARCH_LOGS.filter(log => log.userId === userId));
    }
    return Promise.resolve(MOCK_SEARCH_LOGS);
}

export async function addSearchLog(logData: Omit<SearchLog, 'id' | 'timestamp'>): Promise<void> {
    console.log("storage.ts: addSearchLog called with mock data.", logData);
    const newLog: SearchLog = {
        id: `log-mock-${Date.now()}`,
        ...logData,
        timestamp: new Date(),
    };
    MOCK_SEARCH_LOGS.unshift(newLog);
    return Promise.resolve();
}

// In a real app, audit logs would be written to a secure backend.
const MOCK_AUDIT_LOGS: AuditLogEntry[] = [];

export async function getAuditLogs(): Promise<AuditLogEntry[]> {
    console.log("storage.ts: getAuditLogs called, returning mock data.");
    return Promise.resolve(MOCK_AUDIT_LOGS);
}

export async function addAuditLogEntry(entryData: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<void> {
    console.log("storage.ts: addAuditLogEntry called with mock data.", entryData);
    const newEntry: AuditLogEntry = {
        id: `audit-mock-${Date.now()}`,
        ...entryData,
        timestamp: new Date(),
    };
    MOCK_AUDIT_LOGS.unshift(newEntry);
    return Promise.resolve();
}


// --- Notification Management (Mock) ---
const MOCK_NOTIFICATIONS: UserNotification[] = [];

export async function getUserNotifications(userId: string): Promise<UserNotification[]> {
    console.log(`storage.ts: getUserNotifications for ${userId}`);
    return Promise.resolve(MOCK_NOTIFICATIONS.filter(n => n.userId === userId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
}

export async function addUserNotification(userId: string, notificationData: Omit<UserNotification, 'id' | 'createdAt' | 'read' | 'userId'>): Promise<void> {
    console.log(`storage.ts: addUserNotification for ${userId}`, notificationData);
    const newNotification: UserNotification = {
        id: `notif-mock-${Date.now()}`,
        userId,
        ...notificationData,
        createdAt: new Date(),
        read: false,
    };
    MOCK_NOTIFICATIONS.unshift(newNotification);
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
    console.log(`storage.ts: markNotificationAsRead for ${notificationId}`);
    const notification = MOCK_NOTIFICATIONS.find(n => n.id === notificationId);
    if (notification) {
        notification.read = true;
    }
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
    console.log(`storage.ts: markAllNotificationsAsRead for ${userId}`);
    MOCK_NOTIFICATIONS.forEach(n => {
        if (n.userId === userId) {
            n.read = true;
        }
    });
}
