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

export type ViewState = 'login' | 'onboarding' | 'dashboard' | 'reports' | 'settings' | 'transactions' | 'transactionDetails';

export interface Alert {
  id: string;
  type: 'warning' | 'info' | 'success' | 'danger';
  message: string;
  date: string;
}