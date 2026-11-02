import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('https://') &&
  !supabaseUrl.includes('your-project') &&
  !supabaseUrl.includes('your-supabase-url')
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Local storage keys for demo / offline workspace state
export const LOCAL_STORAGE_KEYS = {
  AGENT_CONFIG: 'voxi_agent_config',
  CALL_LOGS: 'voxi_call_logs',
  SIP_SETTINGS: 'voxi_sip_settings',
  TELEGRAM_SETTINGS: 'voxi_tg_settings',
  WEBHOOK_SETTINGS: 'voxi_webhook_settings',
  VAPI_SETTINGS: 'voxi_vapi_settings',
  DEMO_AUTH_USER: 'voxi_demo_auth_user',
};
