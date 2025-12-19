export enum FopGroup {
  GROUP_1 = 1,
  GROUP_2 = 2,
  GROUP_3 = 3
}

export enum TaxRate {
  PERCENT_5 = 0.05,
  PERCENT_3 = 0.03
}

export interface UserProfile {
  name: string;
  email?: string;
  photoUrl?: string;
  group: FopGroup;
  taxRate: TaxRate;
  hasEmployees: boolean;
  isOnboarded: boolean;
}

export interface Income {
  id: string;
  amount: number;
  currency: 'UAH' | 'USD' | 'EUR';
  date: string;
  description: string;
  source: 'manual' | 'ai-scan';
  originalDocumentUrl?: string; // Base64 or URL
  amountUah?: number;
  clientOrProject?: string;
  comment?: string;
  category?: string;
  attachments?: string[];
}

export interface TaxStatus {
  totalIncomeUah: number;
  taxAmount: number;
  esvAmount: number;
  limitTotal: number;
  limitUsedPercent: number;
  limitRemaining: number;
}

export interface Alert {
  id: string;
  type: 'warning' | 'info' | 'success' | 'danger';
  message: string;
  date: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface Chat {
  id: string;
  title: string;
  messages: ChatMessage[];
  timestamp: number;
}

export type ViewState = 'landing' | 'login' | 'onboarding' | 'dashboard' | 'reports' | 'settings' | 'transactions' | 'transactionDetails' | 'taxAdvisor';