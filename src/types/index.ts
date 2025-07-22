
export interface SubUserProfile {
  id: string;
  fullName: string;
  email: string;
}

export interface UserProfile {
  id: string;
  companyName: string;
  companyCode: string;
  vatCode?: string;
  address: string;
  contactPerson: string;
  email: string;
  phone: string;
  paymentStatus: 'active' | 'inactive' | 'pending_verification' | 'pending_payment';
  isAdmin?: boolean;
  registeredAt?: Date | string; 
  accountActivatedAt?: Date | string;
  agreeToTerms?: boolean;
  subUsers?: SubUserProfile[];
}

export interface DetailedCategory {
  id: string;
  nameKey: string; 
  tags: string[];
}

export interface Report {
  id: string;
  reporterId: string;
  reporterCompanyName?: string;
  fullName: string;
  nationality?: string;
  birthYear?: number;
  category: string;
  tags: string[];
  comment: string;
  imageUrl?: string;
  dataAiHint?: string;
  createdAt: Date; 
  deletedAt: Date | null;
}


export interface SearchLog {
  id: string;
  userId: string;
  searchText: string;
  timestamp: Date; 
  resultsCount: number;
}

export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  adminId: string;
  adminName: string; 
  actionKey: string;
  details: Record<string, any>;
}

export interface UserNotification {
  id: string;
  userId: string;
  type: 'account_status_change' | 'subscription_warning' | 'generic_message' | 'inquiry_received';
  titleKey: string;
  messageKey: string;
  messageParams?: Record<string, string | number>;
  createdAt: Date;
  read: boolean;
  link?: string;
  senderId?: string;
  senderCompanyName?: string;
}
