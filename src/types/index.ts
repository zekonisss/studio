
// src/types/index.ts

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
  statusUpdatedAt?: any;
  deleteRequestReason?: string;
  adminRejectReason?: string;
  deletedAt?: any;
  dataAiHint?: string | null;
  subjectCompany?: string;
  // New fields for import
  source?: string;
  matchQuality?: 'low' | 'high';
  fingerprint?: string;
}

export interface Company {
  id: string;
  name: string;
  ownerId: string;
  vatCode?: string;
  address?: string;
  
  // Subscription info
  subscriptionStatus: 'active' | 'trial' | 'past_due' | 'canceled';
  plan: 'solo' | 'team' | 'corporate'; 
  
  // Limits
  maxSeats: number;
  
  createdAt: any;
  updatedAt?: any;
}

// User Profile
export interface UserProfile {
  id: string;
  email: string;
  fullName?: string;
  
  // Company details
  companyName: string;
  companyCode?: string;
  vatCode?: string;
  address?: string;
  
  // Contact details
  contactPerson: string;
  position?: string;
  phone?: string;
  
  // Registration info
  subscriptionType: 'trial' | 'paid';
  agreeToTerms: boolean;
  
  // B2B Fields
  companyId?: string | null;
  role: 'owner' | 'admin' | 'member' | 'suspended';
  
  // Statuses
  isAdmin: boolean; 
  paymentStatus: 'active' | 'trial' | 'pending_verification' | 'pending_payment' | 'inactive';
  subscriptionEndDate?: string;
  stripeCustomerId?: string;
  
  // Session Management
  currentSessionToken?: string;

  // Credits
  searchCredits: number;
  reportCredits: number;
  
  // Dates
  createdAt: any;
  registeredAt: any;
  accountActivatedAt?: any;
  updatedAt?: any;
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
  acceptedAt?: any;
  acceptedByUserId?: string;
}

// Firestore-specific types with Timestamps
export interface ReportFirestore extends Omit<Report, 'createdAt' | 'updatedAt' | 'statusUpdatedAt' | 'deletedAt'> {
  createdAt: any; // Firestore Timestamp
  updatedAt?: any;
  statusUpdatedAt?: any;
  deletedAt?: any;
}

export interface UserProfileFirestore extends Omit<UserProfile, 'id' | 'createdAt' | 'registeredAt' | 'accountActivatedAt' | 'updatedAt'> {
  createdAt: any;
  registeredAt: any;
  accountActivatedAt?: any;
  updatedAt?: any;
}

// Log types
export interface SearchLog {
  id: string;
  userId: string;
  searchText: string;
  firstName: string;
  lastName: string;
  driverHash: string;
  resultsCount?: number;
  timestamp: string;
}

export interface SearchLogFirestore extends Omit<SearchLog, 'id' | 'timestamp'> {
    timestamp: any;
}

export interface AuditLogEntry {
    id: string;
    adminId: string;
    adminName: string;
    actionKey: string;
    details: Record<string, any>;
    timestamp: string;
}

export interface AuditLogEntryFirestore extends Omit<AuditLogEntry, 'id' | 'timestamp'> {
    timestamp: any;
}

export interface LoginLog {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
}

export interface LoginLogFirestore extends Omit<LoginLog, 'id' | 'timestamp'> {
  timestamp: any; // Firestore Timestamp
}


// Notification types
export interface UserNotification {
    id: string;
    userId: string;
    title: string;
    description: string;
    link?: string;
    read: boolean;
    createdAt: string;
}

export interface UserNotificationFirestore extends Omit<UserNotification, 'id' | 'createdAt'> {
    createdAt: any;
}

// Other types
export interface DetailedCategory {
  id: string;
  nameKey: string;
  tags: string[];
}

export interface SignupFormValuesExtended {
  email: string;
  password: string;
  companyName: string;
  companyCode: string;
  vatCode?: string;
  address: string;
  contactPerson: string;
  position: string;
  phone: string;
  subscriptionType: 'trial' | 'paid';
  agreeToTerms: boolean;
}
