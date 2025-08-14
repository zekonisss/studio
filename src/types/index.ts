export interface UserProfile {
  id?: string;
  email: string;
  companyCode: string;
  registeredAt?: any;
}

export interface Report {
  id?: string;
  reporterId: string;
  description: string;
  createdAt?: any;
  deletedAt?: any;
}

export interface SearchLog {
  id?: string;
  userId: string;
  searchQuery: string;
  timestamp?: any;
}

export interface AuditLogEntry {
  id?: string;
  adminId: string;
  adminName: string;
  action: string;
  timestamp?: any;
}

export interface UserNotification {
  id?: string;
  userId: string;
  title: string;
  message: string;
  createdAt?: any;
  read?: boolean;
}
