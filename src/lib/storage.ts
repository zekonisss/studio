import type { Report, UserProfile, SearchLog, AuditLogEntry, UserNotification } from '@/types';
import { MOCK_ALL_USERS, MOCK_GENERAL_REPORTS, MOCK_USER_REPORTS, MOCK_USER_SEARCH_LOGS } from './mock-data';

const LOCAL_STORAGE_USERS_KEY = 'driverCheckAllUsers';
const LOCAL_STORAGE_REPORTS_KEY = 'driverCheckReports';
const LOCAL_STORAGE_SEARCH_LOGS_KEY = 'driverCheckSearchLogs';
const LOCAL_STORAGE_AUDIT_LOGS_KEY = 'driverCheckAuditLogs';
const LOCAL_STORAGE_NOTIFICATIONS_KEY = 'driverCheckNotifications';

const isBrowser = typeof window !== 'undefined';

// --- User Management ---

export function getAllUsers(): UserProfile[] {
  if (!isBrowser) return MOCK_ALL_USERS;

  const storedUsersJSON = localStorage.getItem(LOCAL_STORAGE_USERS_KEY);
  if (storedUsersJSON) {
    try {
      const localUsers: UserProfile[] = JSON.parse(storedUsersJSON);
      const usersMap = new Map<string, UserProfile>();
      MOCK_ALL_USERS.forEach(user => usersMap.set(user.id, { ...user, subUsers: user.subUsers || [] }));
      localUsers.forEach(user => usersMap.set(user.id, { ...user, subUsers: user.subUsers || [] }));
      return Array.from(usersMap.values());
    } catch (e) {
      console.error("Failed to parse users from localStorage", e);
      localStorage.removeItem(LOCAL_STORAGE_USERS_KEY);
    }
  }
  
  localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(MOCK_ALL_USERS));
  return MOCK_ALL_USERS;
}

export function saveAllUsers(users: UserProfile[]): void {
  if (isBrowser) {
    localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(users.map(u => ({ ...u, subUsers: u.subUsers || [] }))));
  }
}

// --- Report Management ---

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

// --- Search Log Management ---

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

// --- Audit Log Management ---

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

// --- Notification Management ---

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
