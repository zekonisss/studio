import { type Timestamp } from 'firebase/firestore';

// --- Firestore Data Types ---

export interface CompanyFirestore {
  id: string;
  name: string;
  ownerId: string;
  vatCode?: string;
  address?: string;
  subscriptionStatus: 'active' | 'trial' | 'past_due' | 'canceled';
  plan: 'solo' | 'team' | 'corporate';
  maxSeats: number;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

export interface UserProfileFirestore {
  id: string;
  email: string;
  fullName?: string;
  companyId?: string | null;
  role?: 'owner' | 'admin' | 'member' | 'suspended';
  isAdmin?: boolean;
  paymentStatus?: 'active' | 'trial' | 'past_due' | 'canceled';
  searchCredits?: number;
  reportCredits?: number;
  createdAt: Timestamp;
}

export interface InvitationFirestore {
  id: string;
  companyId: string;
  companyName: string;
  inviterId: string;
  email: string;
  token: string;
  role: 'member' | 'admin';
  status: 'pending' | 'accepted' | 'expired';
  createdAt: Timestamp;
  expiresAt: Timestamp;
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
  
  // Status management fields
  status: 'active' | 'pending_delete' | 'deleted';
  deleteRequestReason?: string | null;
  adminRejectReason?: string | null;
  statusUpdatedAt?: Timestamp | null;
  deletedAt?: Timestamp | null;

  // New field for import
  subjectCompany?: string;
}

export interface SearchLogFirestore {
  id: string;
  userId: string;
  driverHash: string;
  firstName: string;
  lastName: string;
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

export interface Company {
  id: string;
  name: string;
  ownerId: string;
  vatCode?: string;
  address?: string;
  subscriptionStatus: 'active' | 'trial' | 'past_due' | 'canceled';
  plan: 'solo' | 'team' | 'corporate';
  maxSeats: number;
  createdAt: string;
  updatedAt?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName?: string;
  companyId?: string | null;
  role?: 'owner' | 'admin' | 'member' | 'suspended';
  isAdmin?: boolean;
  paymentStatus?: 'active' | 'trial' | 'past_due' | 'canceled';
  searchCredits?: number;
  reportCredits?: number;
  createdAt: string;
}

export interface Invitation {
  id: string;
  companyId: string;
  companyName: string;
  inviterId: string;
  email: string;
  token: string;
  role: 'member' | 'admin';
  status: 'pending' | 'accepted' | 'expired';
  createdAt: string;
  expiresAt: string;
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

  // Status management fields
  status: 'active' | 'pending_delete' | 'deleted';
  deleteRequestReason?: string | null;
  adminRejectReason?: string | null;
  statusUpdatedAt?: string | null;
  deletedAt?: string | null;
  
  // New field for import
  subjectCompany?: string;
}

export interface SearchLog {
  id: string;
  userId: string;
  driverHash: string;
  firstName: string;
  lastName: string;
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
