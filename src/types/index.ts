import type { Timestamp } from 'firebase/firestore';

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
  registeredAt?: any;
  accountActivatedAt?: any;
  subUsers?: string[];
}

export interface Report {
  id: string;
  reporterId: string;
  reporterCompanyName: string;
  fullName: string;
  nationality?: string;
  birthYear?: number;
  category: string;
  tags: string[];
  comment: string;
  imageUrl?: string;
  dataAiHint?: string;
  createdAt: any;
  deletedAt?: any;
}

export interface SearchLog {
  id: string;
  userId: string;
  searchText: string;
  resultsCount: number;
  timestamp: any;
}

export interface AuditLogEntry {
  id: string;
  adminId: string;
  adminName: string;
  actionKey: string;
  details: Record<string, any>;
  timestamp: any;
}

export interface UserNotification {
  id: string;
  userId: string;
  type: 'account_status_change' | 'subscription_warning' | 'new_feature' | 'general';
  titleKey: string;
  messageKey: string;
  messageParams?: Record<string, any>;
  link?: string;
  createdAt: any;
  read: boolean;
}
