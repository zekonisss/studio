
import { type Timestamp } from 'firebase/firestore';

// --- Firestore Data Types ---

export interface UserProfileFirestore {
  id: string;
  email: string;
  companyName: string;
  companyCode: string;
  vatCode?: string;
  address: string;
  contactPerson: string;
  phone: string;
  paymentStatus: 'active' | 'inactive' | 'pending_verification' | 'pending_payment';
  isAdmin: boolean;
  agreeToTerms: boolean;
  registeredAt: Timestamp;
  accountActivatedAt?: Timestamp | null;
  subUsers: string[];
}

export interface ReportFirestore {
  id: string;
  reporterId: string;
  reporterCompanyName: string;
  fullName: string;
  nationality?: string;
  birthYear?: number | null;
  category: string;
  tags: string[];
  comment: string;
  imageUrl?: string | null;
  dataAiHint?: string | null;
  createdAt: Timestamp;
  deletedAt?: Timestamp | null;
}

export interface SearchLogFirestore {
  id: string;
  userId: string;
  searchText: string;
  resultsCount: number;
  timestamp: Timestamp;
}

export interface AuditLogEntryFirestore {
  id: string;
  adminId: string;
  adminName: string;
  actionKey: string;
  details: Record<string, any>;
  timestamp: Timestamp;
}

export interface UserNotificationFirestore {
  id: string;
  userId: string;
  type: 'account_status_change' | 'subscription_warning' | 'new_feature' | 'general';
  titleKey: string;
  messageKey: string;
  messageParams?: Record<string, any>;
  link?: string;
  createdAt: Timestamp;
  read: boolean;
}


// --- Client-Side Data Types ---

export interface UserProfile {
  id: string;
  email: string;
  companyName: string;
  companyCode: string;
  vatCode?: string;
  address: string;
  contactPerson: string;
  phone: string;
  paymentStatus: 'active' | 'inactive' | 'pending_verification' | 'pending_payment';
  isAdmin: boolean;
  agreeToTerms: boolean;
  registeredAt: string; 
  accountActivatedAt?: string | null;
  subUsers: string[];
}

export interface Report {
  id: string;
  reporterId: string;
  reporterCompanyName: string;
  fullName: string;
  nationality?: string;
  birthYear?: number | null;
  category: string;
  tags: string[];
  comment: string;
  imageUrl?: string | null;
  dataAiHint?: string | null;
  createdAt: string;
  deletedAt?: string | null;
}

export interface SearchLog {
  id: string;
  userId: string;
  searchText: string;
  resultsCount: number;
  timestamp: string;
}

export interface AuditLogEntry {
  id: string;
  adminId: string;
  adminName: string;
  actionKey: string;
  details: Record<string, any>;
  timestamp: string;
}

export interface UserNotification {
  id: string;
  userId: string;
  type: 'account_status_change' | 'subscription_warning' | 'new_feature' | 'general';
  titleKey: string;
  messageKey: string;
  messageParams?: Record<string, any>;
  link?: string;
  createdAt: string;
  read: boolean;
}

export interface DetailedCategory {
  id: string;
  nameKey: string;
  tags: string[];
}
