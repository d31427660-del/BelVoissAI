export type BusinessNiche = 
  | 'driving_school' 
  | 'auto_service' 
  | 'medical_clinic' 
  | 'beauty_salon' 
  | 'custom';

export type VoiceId = 'anna' | 'maxim';

export interface PhoneticRule {
  id: string;
  word: string;
  stressed: string;
  ttsReplacement: string;
  category: 'toponym' | 'surname' | 'abbr' | 'custom';
  samplePhrase?: string;
  enabled: boolean;
}

export interface YclientsSlotConfig {
  isEnabled: boolean;
  companyId: string;
  partnerToken: string;
  platform: 'none' | 'yclients' | 'altegio' | 'dikidi' | 'bitrix24';
  autoBookSlots: boolean;
  notifyClientSms: boolean;
  selectedStaff?: string;
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
  systemPrompt: string;
  phoneticRules?: PhoneticRule[];
  vapiAssistantId?: string;
  yclientsConfig?: YclientsSlotConfig;
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
  isMock: boolean;
}

export interface MysteryAuditItem {
  id: string;
  companyName: string;
  niche: BusinessNiche;
  city: string;
  phone: string;
  callTime: string;
  callStatus: 'no_answer' | 'busy' | 'late_answer' | 'answered';
  ringsCount: number;
  lostEstimatedByn: number;
  aiDemoAudioText: string;
  pitchMessage: string;
}
