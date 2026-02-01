// src/types/index.ts

// --- PAGRINDINIAI TIPAI ---

export interface Report {
  id: string;
  reporterId: string;
  reporterCompanyName?: string;
  fullName: string;
  nationality: string;
  birthYear?: number;
  category: string;
  tags: string[];
  comment?: string;
  imageUrl?: string | null;
  status: 'active' | 'pending_delete' | 'deleted';
  createdAt: any;
  updatedAt?: any;
  dataAiHint?: string | null;
  deleteRequestReason?: string;
  statusUpdatedAt?: any;
  deletedAt?: any;
  adminRejectReason?: string;
}

export type ReportFirestore = Omit<Report, 'id'>;

export interface Company {
  id: string;
  name: string;
  ownerId: string;
  vatCode?: string;
  address?: string;
  
  subscriptionStatus: 'active' | 'trial' | 'past_due' | 'canceled';
  plan: 'solo' | 'team' | 'corporate'; 
  
  maxSeats: number;
  
  createdAt: any;
  updatedAt?: any;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName?: string;
  companyName: string;
  companyCode: string;
  vatCode?: string;
  address: string;
  contactPerson: string;
  position: string;
  phone: string;
  subscriptionType: string;
  agreeToTerms: boolean;
  companyId?: string | null;
  role?: 'owner' | 'admin' | 'member' | 'suspended';
  isAdmin?: boolean; 
  paymentStatus: 'active' | 'trial' | 'pending_payment' | 'pending_verification' | 'inactive';
  searchCredits: number;
  reportCredits: number;
  createdAt: string; // ISO string
  registeredAt: string; // ISO string
  accountActivatedAt?: string; // ISO string
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  stripePriceId?: string;
  subscriptionEndDate?: string; // ISO string
}

export type UserProfileFirestore = Omit<UserProfile, 'id' | 'createdAt' | 'registeredAt' | 'accountActivatedAt' | 'subscriptionEndDate'> & {
    createdAt: any; // serverTimestamp
    registeredAt: any; // serverTimestamp
    accountActivatedAt?: any;
    subscriptionEndDate?: any;
};


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

// --- FORMAI REIKALINGAS TIPAS ---
export interface SignupFormValuesExtended {
  email: string;
  password: string;
  confirmPassword?: string;
  companyName: string;
  companyCode: string;
  vatCode?: string;
  address: string;
  contactPerson: string;
  position: string;
  phone: string;
  subscriptionType: string;
  agreeToTerms: boolean;
}

export interface SearchLog {
  id: string;
  userId: string;
  searchText: string;
  timestamp: string;
  resultsCount: number;
}

export type SearchLogFirestore = Omit<SearchLog, 'id' | 'timestamp'> & {
    timestamp: any;
}

export interface AuditLogEntry {
  id: string;
  adminId: string;
  adminName: string;
  actionKey: string;
  details: Record<string, any>;
  timestamp: string; // ISO string
}

export type AuditLogEntryFirestore = Omit<AuditLogEntry, 'id' | 'timestamp'> & {
    timestamp: any; // serverTimestamp
};

export interface UserNotification {
    id: string;
    userId: string;
    title: string;
    message: string;
    link?: string;
    read: boolean;
    createdAt: string; // ISO String
}

export type UserNotificationFirestore = Omit<UserNotification, 'id' | 'createdAt'> & {
    createdAt: any; // serverTimestamp
};


export interface DetailedCategory {
  id: string;
  nameKey: string;
  tags: string[];
}
