
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
  registeredAt: string; // Changed from Timestamp
  accountActivatedAt?: string; // Changed from Timestamp
  subUsers: string[];
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
  createdAt: Date; // Changed from Timestamp
  deletedAt?: Date | null; // Changed from Timestamp
}

export interface SearchLog {
  id: string;
  userId: string;
  searchText: string;
  resultsCount: number;
  timestamp: Date; // Changed from Timestamp
}

export interface AuditLogEntry {
  id: string;
  adminId: string;
  adminName: string;
  actionKey: string;
  details: Record<string, any>;
  timestamp: Date; // Changed from Timestamp
}

export interface UserNotification {
  id: string;
  userId: string;
  type: 'account_status_change' | 'subscription_warning' | 'new_feature' | 'general';
  titleKey: string;
  messageKey: string;
  messageParams?: Record<string, any>;
  link?: string;
  createdAt: Date; // Changed from Timestamp
  read: boolean;
}

export interface DetailedCategory {
  id: string;
  nameKey: string;
  tags: string[];
}
