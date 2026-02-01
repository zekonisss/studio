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
}

export interface Company {
  id: string;
  name: string;
  ownerId: string;
  vatCode?: string;
  address?: string;
  
  // Prenumerata
  subscriptionStatus: 'active' | 'trial' | 'past_due' | 'canceled';
  plan: 'solo' | 'team' | 'corporate'; 
  
  // Limitai
  maxSeats: number;
  credits?: number;
  
  createdAt: any;
  updatedAt?: any;
}

// Vartotojo profilis
export interface UserProfile {
  id: string;
  email: string;
  fullName?: string;
  
  // Įmonės duomenys
  companyName?: string;
  companyCode?: string;
  vatCode?: string;
  address?: string;
  
  // Kontaktiniai duomenys
  contactPerson?: string;
  position?: string;
  phone?: string;
  
  // Registracijos info
  subscriptionType?: string;
  agreeToTerms?: boolean;
  
  // B2B Laukai
  companyId?: string | null;
  role?: 'owner' | 'admin' | 'member' | 'suspended';
  
  // Statusai
  isAdmin?: boolean; 
  paymentStatus?: 'active' | 'trial' | 'past_due' | 'canceled';
  
  // Kreditai
  searchCredits?: number;
  reportCredits?: number;
  
  // Datos
  createdAt: any;
  registeredAt?: any;
  accountActivatedAt?: any;
}

export type UserProfileFirestore = Omit<UserProfile, 'id'>;

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

// --- FORMAI REIKALINGAS TIPAS (Šito trūko jūsų nuotraukoje) ---
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