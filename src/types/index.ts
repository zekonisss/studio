
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
  registeredAt: Date | string | any; // Changed to any to support serverTimestamp
  accountActivatedAt?: Date | string | null;
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
  createdAt: Date | string | any; // Changed to any to support serverTimestamp
  deletedAt?: (Date | string | any) | null; // Changed to any to support serverTimestamp
}

export interface SearchLog {
  id: string;
  userId: string;
  searchText: string;
  resultsCount: number;
  timestamp: Date | string | any; // Changed to any to support serverTimestamp
}

export interface AuditLogEntry {
  id: string;
  adminId: string;
  adminName: string;
  actionKey: string;
  details: Record<string, any>;
  timestamp: Date | string | any; // Changed to any to support serverTimestamp
}

export interface UserNotification {
  id: string;
  userId: string;
  type: 'account_status_change' | 'subscription_warning' | 'new_feature' | 'general';
  titleKey: string;
  messageKey: string;
  messageParams?: Record<string, any>;
  link?: string;
  createdAt: Date | string | any; // Changed to any to support serverTimestamp
  read: boolean;
}

export interface DetailedCategory {
  id: string;
  nameKey: string;
  tags: string[];
}
