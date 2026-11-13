export interface PlatformClient {
  id: string;
  name: string;
  companyName: string;
  unp: string;
  niche: 'driving_school' | 'auto_service' | 'medical_clinic' | 'beauty_salon' | 'custom';
  city: string;
  phone: string;
  email: string;
  balanceMinutes: number;
  ratePerMinute: number;
  spentMinutesTotal: number;
  spentBynTotal: number;
  sipProvider: 'mts' | 'a1' | 'life' | 'beltelecom' | 'other';
  sipStatus: 'connected' | 'warning' | 'disconnected';
  isActive: boolean;
  createdAt: string;
  contractNumber: string;
}

export interface PlatformTransaction {
  id: string;
  clientId: string;
  clientName: string;
  unp: string;
  amountByn: number;
  minutesAdded: number;
  paymentMethod: 'bepaid_card' | 'erip' | 'bank_transfer_act';
  status: 'successful' | 'pending' | 'failed';
  invoiceNumber: string;
  createdAt: string;
  actGenerated: boolean;
}

export interface PlatformTelephonyLog {
  id: string;
  clientId: string;
  companyName: string;
  callerPhone: string;
  assistantVoice: 'anna' | 'maxim';
  durationSeconds: number;
  costByn: number;
  sipTrunk: string;
  status: 'completed' | 'lead_captured' | 'transferred' | 'amd_filtered';
  sentiment: 'positive' | 'neutral' | 'negative';
  timestamp: string;
  transcriptSnippet: string;
}
