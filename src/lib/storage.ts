"use client";

import type { Report, UserProfile, SearchLog, AuditLogEntry, UserNotification } from '@/types';
import { MOCK_ALL_USERS, MOCK_GENERAL_REPORTS, MOCK_USER_REPORTS, MOCK_USER_SEARCH_LOGS } from './mock-data';

// --- User Management ---

export async function getAllUsers(): Promise<UserProfile[]> {
  console.log("storage.ts: Fetching all mock users.");
  return Promise.resolve(MOCK_ALL_USERS);
}

export async function addUsersBatch(usersData: Omit<UserProfile, 'id'>[]): Promise<void> {
    console.log("storage.ts: Simulating adding user batch:", usersData);
    return Promise.resolve();
}

export async function updateUserProfile(userId: string, userData: Partial<UserProfile>): Promise<void> {
  console.log(`storage.ts: Simulating update for user ${userId} with`, userData);
  return Promise.resolve();
}

export async function findUserByEmail(email: string): Promise<UserProfile | null> {
    const user = MOCK_ALL_USERS.find(u => u.email === email);
    console.log(`storage.ts: Simulating findUserByEmail for ${email}. Found:`, !!user);
    return Promise.resolve(user || null);
}

export async function getUserById(userId: string): Promise<UserProfile | null> {
    const user = MOCK_ALL_USERS.find(u => u.id === userId);
    console.log(`storage.ts: Simulating getUserById for ${userId}. Found:`, !!user);
    return Promise.resolve(user || null);
}


// --- Report Management ---

export async function getAllReports(): Promise<Report[]> {
  console.log("storage.ts: Fetching all mock general reports.");
  return Promise.resolve(MOCK_GENERAL_REPORTS);
}

export async function addReport(reportData: Omit<Report, 'id'>): Promise<void> {
  console.log("storage.ts: Simulating adding report:", reportData);
  return Promise.resolve();
}

export async function softDeleteReport(reportId: string): Promise<void> {
  console.log(`storage.ts: Simulating soft delete for report ${reportId}`);
  return Promise.resolve();
}

export async function softDeleteAllReports(): Promise<number> {
    console.log("storage.ts: Simulating soft deleting all reports.");
    const count = MOCK_GENERAL_REPORTS.length;
    return Promise.resolve(count);
}

export async function getUserReports(userId: string): Promise<{ active: Report[], deleted: Report[] }> {
  console.log(`storage.ts: Fetching mock reports for user ${userId}.`);
  const active = MOCK_USER_REPORTS.filter(r => !r.deletedAt);
  const deleted = MOCK_USER_REPORTS.filter(r => r.deletedAt);
  return Promise.resolve({ active, deleted });
}

// --- Log Management ---

export async function getSearchLogs(userId?: string): Promise<SearchLog[]> {
  console.log(`storage.ts: Fetching mock search logs for user ${userId}.`);
  return Promise.resolve(MOCK_USER_SEARCH_LOGS);
}

export async function addSearchLog(logData: Omit<SearchLog, 'id'>): Promise<void> {
  console.log("storage.ts: Simulating adding search log:", logData);
  return Promise.resolve();
}

export async function getAuditLogs(): Promise<AuditLogEntry[]> {
    console.log("storage.ts: Fetching mock audit logs.");
    const MOCK_AUDIT_LOGS: AuditLogEntry[] = [
      { id: 'log1', adminId: 'admin-user-001', adminName: 'Admin User', actionKey: 'auditLog.action.userStatusChanged', details: { userId: 'dev-user-101', companyName: 'MB "Logist"', userEmail: 'laura@logist.lt', oldStatus: 'Laukia Patvirtinimo', newStatus: 'Aktyvi' }, timestamp: new Date() },
    ];
    return Promise.resolve(MOCK_AUDIT_LOGS);
}

export async function addAuditLogEntry(entryData: Omit<AuditLogEntry, 'id'>): Promise<void> {
    console.log("storage.ts: Simulating adding audit log:", entryData);
    return Promise.resolve();
}

// --- Notification Management ---

export async function getUserNotifications(userId: string): Promise<UserNotification[]> {
    console.log(`storage.ts: Fetching mock notifications for user ${userId}.`);
     const MOCK_NOTIFICATIONS: UserNotification[] = [
        { id: 'notif1', userId: 'admin-user-001', type: 'account_status_change', titleKey: 'notifications.accountStatusChanged.title', messageKey: 'notifications.accountStatusChanged.message', messageParams: { oldStatus: 'Laukia Patvirtinimo', newStatus: 'Aktyvi', adminName: 'Sistemos Admin' }, createdAt: new Date(), read: false, link: '/account?tab=details' },
        { id: 'notif2', userId: 'admin-user-001', type: 'subscription_warning', titleKey: 'notifications.subscriptionWarning.title', messageKey: 'notifications.subscriptionWarning.message', messageParams: { endDate: '2024-12-31', daysLeft: 30 }, createdAt: new Date(Date.now() - 86400000 * 2), read: true, link: '/account?tab=payment' },
     ];
    return Promise.resolve(MOCK_NOTIFICATIONS);
}

export async function addUserNotification(userId: string, notificationData: Omit<UserNotification, 'id' | 'createdAt' | 'read' | 'userId'>): Promise<void> {
    console.log(`storage.ts: Simulating adding notification for user ${userId}:`, notificationData);
    return Promise.resolve();
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
    console.log(`storage.ts: Simulating marking notification ${notificationId} as read.`);
    return Promise.resolve();
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
    console.log(`storage.ts: Simulating marking all notifications as read for user ${userId}.`);
    return Promise.resolve();
}


// --- File Management ---
export async function uploadReportImage(file: File): Promise<{ url: string, dataAiHint: string }> {
  console.log("storage.ts: Simulating image upload for file:", file.name);
  const randomId = Math.floor(Math.random() * 1000);
  const hint = file.name.split('.')[0].replace(/[^a-zA-Z\s]/g, '').substring(0, 20) || 'document scan';

  // Using a placeholder service that generates images from text
  const placeholderUrl = `https://placehold.co/600x400/EFEFEF/7F7F7F?text=${encodeURIComponent(hint)}`;
  
  return Promise.resolve({
    url: placeholderUrl,
    dataAiHint: hint,
  });
}
