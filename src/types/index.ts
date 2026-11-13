export type BusinessNiche = 
  | 'driving_school' 
  | 'auto_service' 
  | 'medical_clinic' 
  | 'beauty_salon' 
  | 'custom';

export type VoiceId = 'anna' | 'maxim';
export type CallSentiment = 'positive' | 'neutral' | 'negative';

export interface YclientsSlotConfig {
  isEnabled: boolean;
  companyId: string;
  partnerToken: string;
  platform: 'none' | 'yclients' | 'google_calendar';
  autoBookSlots: boolean;
  notifyClientSms: boolean;
  selectedStaff?: string;
  liveSlotCheckingEnabled?: boolean;
  slotDurationMinutes?: number;
  availableDaysAhead?: number;
}

export interface CallerNotificationConfig {
  isEnabled: boolean;
  channel: 'sms' | 'viber' | 'telegram';
  provider: 'sms_by' | 'rocketsms' | 'viber_business' | 'webhook' | 'mock';
  template: string;
  sendMapLink: boolean;
  notifyOnlyOnLead: boolean;
  senderName?: string;
  apiKey?: string;
  apiLogin?: string;
  webhookUrl?: string;
  testPhone?: string;
}

export interface AgentConfig {
  id: string;
  name: string;
  niche: BusinessNiche;
  voice: VoiceId;
  speechRate: number; // 0.8 to 1.2
  formality: 'formal' | 'friendly';
  companyName: string;
  city: string;
  address: string;
  phone: string;
  workingHours: string;
  pricingAndServices: string;
  knowledgeBase: string;
  firstMessage: string;
  // Direct Caller Notifications (Priority 1)
  callerNotification?: CallerNotificationConfig;
  systemPrompt: string;
  vapiAssistantId?: string;
  yclientsConfig?: YclientsSlotConfig;
  autoFollowUp?: {
    isEnabled: boolean;
    channel: 'telegram' | 'sms' | 'both';
    sendOnLeadOnly: boolean;
    template?: string;
  };
  isActive: boolean;
  updatedAt: string;
}

export interface SipSettings {
  provider: 'mts' | 'a1' | 'beltelecom' | 'axatel' | 'unitalk' | 'zadarma' | 'custom';
  sipServer: string;
  sipLogin: string;
  sipPassword?: string;
  callerId: string;
  status: 'connected' | 'disconnected' | 'testing';
  lastPing?: string;
  // BYO-SIP & Fallback
  byoSipMode: boolean;
  fallbackEnabled: boolean;
  fallbackPhone: string;
  fallbackTrigger: 'human_request' | 'conflict_or_emergency' | 'all';
  // Warm Handoff & SIP Transfer (Priority 2)
  warmTransferEnabled: boolean;
  transferNumber?: string;
  transferPhone: string;
  transferTriggers: ('human_request' | 'conflict' | 'conflict_or_complaint' | 'complex_query')[];
  whisperMessage: string;
  sendSummaryBeforeTransfer?: boolean;
  sendTelegramSummaryOnTransfer: boolean;
  // Law 99-Z & NCZPD Compliance
  piiMaskingEnabled: boolean;
  recordingDisclaimerEnabled: boolean;
  disclaimerText: string;
}

export interface TelegramSettings {
  botToken: string;
  chatId: string;
  isEnabled: boolean;
  notifyOnLead: boolean;
  notifyOnMissed: boolean;
}

export interface WebhookSettings {
  webhookUrl: string;
  secretKey: string;
  isEnabled: boolean;
  sendFormat: 'json_standard' | 'bitrix24' | 'amocrm';
}

export interface VapiSettings {
  apiKey: string;
  assistantId?: string;
  isConnected: boolean;
  selectedModel: string;
}

export interface TranscriptMessage {
  speaker: 'caller' | 'assistant';
  text: string;
  time: string;
}

export interface CapturedLeadData {
  clientName?: string;
  phone?: string;
  service?: string;
  preferredDate?: string;
  preferredTime?: string;
  cityOrBranch?: string;
  vehicleOrDetails?: string;
  estimatedPriceByn?: number;
  urgency?: 'high' | 'medium' | 'normal';
}

export interface MinutePackage {
  id: string;
  name: string;
  minutes: number;
  priceByn: number;
  ratePerMinute: number;
  badge?: string;
  isPopular?: boolean;
  savingsPercent?: number;
  description: string;
}

export interface CallLog {
  id: string;
  niche?: BusinessNiche;
  callerNumber: string;
  callerName?: string;
  timestamp: string;
  durationSeconds: number;
  status: 'lead_captured' | 'consultation' | 'forwarded' | 'spam';
  dealValueByn: number;
  costByn?: number;
  audioDuration: string;
  summary: string;
  sentiment?: CallSentiment;
  tags?: string[];
  followUpSent?: boolean;
  followUpChannel?: 'telegram' | 'sms' | 'none';
  followUpText?: string;
  callerFollowUpSent?: boolean;
  callerFollowUpChannel?: 'sms' | 'viber' | 'telegram';
  callerFollowUpText?: string;
  bookedSlot?: {
    date: string;
    time: string;
    service?: string;
    isRealtimeChecked: boolean;
  };
  transferDetails?: {
    targetPhone: string;
    reason: 'human_request' | 'conflict' | 'complex_query';
    summarySentToStaff: boolean;
  };
  capturedData: CapturedLeadData;
  transcript: TranscriptMessage[];
}

export interface UserSession {
  id: string;
  email: string;
  companyName: string;
  balanceMinutes: number;
  ratePerMinute: number;
  spentMinutes: number;
}
