
"use client";

import type { Report, UserProfile, SearchLog, AuditLogEntry, UserNotification } from '@/types';
import type { SignUpFormValues } from './schemas';
import { MOCK_ALL_USERS, MOCK_GENERAL_REPORTS, MOCK_USER_REPORTS, MOCK_USER_SEARCH_LOGS } from './mock-data';

// This is an in-memory simulation of a database.
// On page refresh, data will reset to the initial mock data.
let users: UserProfile[] = [...MOCK_ALL_USERS];
let reports: Report[] = [...MOCK_GENERAL_REPORTS, ...MOCK_USER_REPORTS];
let searchLogs: SearchLog[] = [...MOCK_USER_SEARCH_LOGS];
let auditLogs: AuditLogEntry[] = [];
let notifications: UserNotification[] = [];


// --- User Management ---

export async function getAllUsers(): Promise<UserProfile[]> {
  return Promise.resolve(users);
}

export async function findUserByEmail(email: string): Promise<UserProfile | null> {
    const foundUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    return Promise.resolve(foundUser || null);
}

export async function getUserById(userId: string): Promise<UserProfile | null> {
    const foundUser = users.find(u => u.id === userId);
    return Promise.resolve(foundUser || null);
}

export async function createUser(values: SignUpFormValues): Promise<UserProfile> {
    const isAdmin = values.email.toLowerCase() === 'sarunas.zekonis@gmail.com';
    const newUser: UserProfile = {
        id: `user-${Date.now()}-${Math.random()}`,
        email: values.email.toLowerCase(),
        companyName: values.companyName,
        companyCode: values.companyCode,
        vatCode: values.vatCode || '',
        address: values.address,
        contactPerson: values.contactPerson,
        phone: values.phone,
        paymentStatus: isAdmin ? 'active' : 'pending_verification',
        isAdmin: isAdmin,
        agreeToTerms: values.agreeToTerms,
        registeredAt: new Date(),
        accountActivatedAt: isAdmin ? new Date() : undefined,
        subUsers: [],
    };
    users.push(newUser);
    return Promise.resolve(newUser);
}


export async function addUsersBatch(newUsers: UserProfile[]): Promise<void> {
  const existingEmails = new Set(users.map(u => u.email.toLowerCase()));
  const newValidUsers = newUsers.filter(u => !existingEmails.has(u.email.toLowerCase()));
  users = [...users, ...newValidUsers];
  return Promise.resolve();
}

export async function updateUserProfile(userId: string, userData: Partial<UserProfile>): Promise<void> {
  users = users.map(u => u.id === userId ? { ...u, ...userData } : u);
  return Promise.resolve();
}


// --- Report Management ---

export async function getAllReports(): Promise<Report[]> {
    return Promise.resolve(reports);
}

export async function addReport(reportData: Omit<Report, 'id' | 'deletedAt' | 'createdAt'>): Promise<void> {
    const newReport: Report = {
        id: `report-${Date.now()}`,
        ...reportData,
        createdAt: new Date(),
        deletedAt: null,
    };
    reports.unshift(newReport); // Add to the beginning
    return Promise.resolve();
}


export async function softDeleteReport(reportId: string): Promise<void> {
    reports = reports.map(r => r.id === reportId ? { ...r, deletedAt: new Date() } : r);
    return Promise.resolve();
}

export async function softDeleteAllReports(): Promise<number> {
    let count = 0;
    reports = reports.map(r => {
        if (!r.deletedAt) {
            count++;
            return { ...r, deletedAt: new Date() };
        }
        return r;
    });
    return Promise.resolve(count);
}

export async function getUserReports(userId: string): Promise<{ active: Report[], deleted: Report[] }> {
    const userReports = reports.filter(r => r.reporterId === userId);
    const active = userReports.filter(r => !r.deletedAt).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    const deleted = userReports.filter(r => !!r.deletedAt).sort((a, b) => b.deletedAt!.getTime() - a.deletedAt!.getTime());
    return Promise.resolve({ active, deleted });
}

// --- Log Management ---

export async function getSearchLogs(userId?: string): Promise<SearchLog[]> {
    const logs = userId ? searchLogs.filter(log => log.userId === userId) : searchLogs;
    return Promise.resolve(logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()));
}

export async function addSearchLog(logData: Omit<SearchLog, 'id' | 'timestamp'>): Promise<void> {
    const newLog: SearchLog = {
        id: `log-${Date.now()}`,
        ...logData,
        timestamp: new Date(),
    };
    searchLogs.unshift(newLog);
    return Promise.resolve();
}

export async function getAuditLogs(): Promise<AuditLogEntry[]> {
    return Promise.resolve(auditLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()));
}

export async function addAuditLogEntry(entryData: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<void> {
    const newLog: AuditLogEntry = {
        id: `audit-${Date.now()}`,
        ...entryData,
        timestamp: new Date(),
    };
    auditLogs.unshift(newLog);
    return Promise.resolve();
}

// --- Notification Management ---

export async function getUserNotifications(userId: string): Promise<UserNotification[]> {
    const userNotifications = notifications.filter(n => n.userId === userId);
    return Promise.resolve(userNotifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
}

export async function addUserNotification(userId: string, notificationData: Omit<UserNotification, 'id' | 'createdAt' | 'read' | 'userId'>): Promise<void> {
    const newNotification: UserNotification = {
        id: `notif-${Date.now()}`,
        userId,
        ...notificationData,
        createdAt: new Date(),
        read: false,
    };
    notifications.unshift(newNotification);
    return Promise.resolve();
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
    notifications = notifications.map(n => n.id === notificationId ? { ...n, read: true } : n);
    return Promise.resolve();
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
    notifications = notifications.map(n => n.userId === userId ? { ...n, read: true } : n);
    return Promise.resolve();
}
