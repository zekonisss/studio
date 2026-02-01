
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
  id: string; // Not in doc, but added in processing
  email: string;
  fullName?: string;
  contactPerson?: string;
  companyId?: string | null;
  role?: 'owner' | 'admin' | 'member' | 'suspended';
  
  // Denormalized company info + contact info
  companyName: string;
  companyCode: string;
  vatCode?: string;
  address: string;
  position?: string;
  phone: string;

  // Subscription/Status
  subscriptionType: 'trial' | 'paid';
  agreeToTerms: boolean;
  isAdmin?: boolean;
  paymentStatus?: 'active' | 'trial' | 'pending_verification' | 'pending_payment' | 'inactive';
  searchCredits?: number;
  reportCredits?: number;
  
  // Timestamps
  registeredAt: Timestamp;
  accountActivatedAt?: Timestamp;
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


// --- NEW B2B TYPES ---

export interface Company {
  id: string;
  name: string;
  ownerId: string; // The user who pays
  vatCode?: string;
  address?: string;
  
  // Subscription & Limits
  subscriptionStatus: 'active' | 'trial' | 'past_due' | 'canceled';
  plan: 'solo' | 'team' | 'corporate'; 
  
  maxSeats: number; // LIMIT: How many users can be in this company
  
  createdAt: any; // Firebase Timestamp or Date
  updatedAt?: any;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  contactPerson: string;
  
  // B2B Fields
  companyId?: string | null;
  role?: 'owner' | 'admin' | 'member' | 'suspended';
  
  // Company Info
  companyName: string;
  companyCode: string;
  vatCode?: string;
  address: string;
  position?: string;
  phone: string;

  // Subscription & Status
  subscriptionType: 'trial' | 'paid';
  agreeToTerms: boolean;
  isAdmin?: boolean; 
  paymentStatus: 'active' | 'trial' | 'pending_verification' | 'pending_payment' | 'inactive';
  searchCredits: number;
  reportCredits: number;
  
  // Timestamps
  registeredAt: string;
  accountActivatedAt?: string;
  subscriptionEndDate?: string;
  stripeCustomerId?: string;
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
  
  createdAt: any;
  expiresAt: any;
}
