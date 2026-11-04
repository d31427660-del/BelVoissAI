-- Voxi.by — Production Supabase Schema (Hardened RLS & Billing Protection)
-- ИП Беляков Кирилл Олегович (УНП 193991846)
-- Выполните этот скрипт в Supabase SQL Editor после создания проекта

-- 1. Таблица профилей и баланса минут (создается автоматически триггером из auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  company_name TEXT NOT NULL DEFAULT 'Моя компания РБ',
  niche TEXT NOT NULL DEFAULT 'driving_school',
  balance_minutes NUMERIC(10, 2) NOT NULL DEFAULT 15.00 CHECK (balance_minutes >= 0),
  rate_per_minute NUMERIC(6, 2) NOT NULL DEFAULT 0.45 CHECK (rate_per_minute > 0),
  spent_minutes NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (spent_minutes >= 0),
  spent_total_byn NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (spent_total_byn >= 0),
  consent_99z_accepted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Таблица конфигураций голосовых ИИ-ассистентов
CREATE TABLE IF NOT EXISTS public.assistants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  niche TEXT NOT NULL DEFAULT 'driving_school',
  voice TEXT NOT NULL DEFAULT 'anna',
  speech_rate NUMERIC(3, 2) NOT NULL DEFAULT 1.00,
  formality TEXT NOT NULL DEFAULT 'friendly',
  company_name TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT 'Минск',
  address TEXT,
  phone TEXT,
  working_hours TEXT,
  pricing_and_services TEXT,
  knowledge_base TEXT,
  first_message TEXT,
  system_prompt TEXT,
  vapi_assistant_id TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Таблица настроек интеграций (SIP РБ, Telegram, Webhook CRM)
CREATE TABLE IF NOT EXISTS public.integrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  sip_provider TEXT NOT NULL DEFAULT 'mts',
  sip_server TEXT NOT NULL DEFAULT 'sip.mts.by:5060',
  sip_login TEXT,
  sip_caller_id TEXT,
  sip_status TEXT NOT NULL DEFAULT 'disconnected',
  telegram_chat_id TEXT,
  telegram_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  webhook_url TEXT,
  webhook_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Журнал звонков и лидов (пишется только серверным вебхуком телефонии)
CREATE TABLE IF NOT EXISTS public.call_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  caller_number TEXT NOT NULL,
  caller_name TEXT,
  call_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  duration_seconds INTEGER NOT NULL DEFAULT 0 CHECK (duration_seconds >= 0),
  cost_byn NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (cost_byn >= 0),
  status TEXT NOT NULL CHECK (status IN ('lead_captured', 'consultation', 'forwarded', 'spam', 'voicemail_detected')),
  deal_value_byn NUMERIC(10, 2) NOT NULL DEFAULT 0,
  summary TEXT,
  captured_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  transcript JSONB NOT NULL DEFAULT '[]'::jsonb,
  audio_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Транзакции минут (пополнения через bePaid / ЕРИП и списания за звонки)
CREATE TABLE IF NOT EXISTS public.minute_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('topup', 'deduction', 'gift')),
  minutes NUMERIC(10, 2) NOT NULL,
  amount_byn NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  payment_method TEXT,
  external_uid TEXT UNIQUE, -- Защита от повторной обработки вебхука bePaid (идемпотентность)
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Индексы на все внешние ключи (FK) и колонки RLS для быстрых запросов
CREATE INDEX IF NOT EXISTS assistants_user_id_idx ON public.assistants (user_id);
CREATE INDEX IF NOT EXISTS call_logs_user_id_timestamp_idx ON public.call_logs (user_id, call_timestamp DESC);
CREATE INDEX IF NOT EXISTS minute_transactions_user_id_created_idx ON public.minute_transactions (user_id, created_at DESC);

-- ============================================================================
-- БЕЗОПАСНОСТЬ ROW LEVEL SECURITY (RLS) И ЗАЩИТА БАЛАНСА ОТ НАКРУТКИ
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assistants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.minute_transactions ENABLE ROW LEVEL SECURITY;

-- PROFILES: чтение своего профиля; обновление ТОЛЬКО названия компании и ниши.
-- Поля balance_minutes, rate_per_minute, spent_minutes, spent_total_byn защищены на уровне GRANT!
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = id);

CREATE POLICY "profiles_update_safe_fields_own"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

-- Запрещаем роли authenticated напрямую менять колонки биллинга в profiles
REVOKE INSERT, DELETE ON public.profiles FROM anon, authenticated;
REVOKE UPDATE ON public.profiles FROM anon, authenticated;
GRANT UPDATE (company_name, niche, updated_at) ON public.profiles TO authenticated;

-- ASSISTANTS: полный доступ только к своим ассистентам
CREATE POLICY "assistants_select_own"
  ON public.assistants FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "assistants_insert_own"
  ON public.assistants FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "assistants_update_own"
  ON public.assistants FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "assistants_delete_own"
  ON public.assistants FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- INTEGRATIONS: полный доступ только к своим настройкам интеграций
CREATE POLICY "integrations_select_own"
  ON public.integrations FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "integrations_insert_own"
  ON public.integrations FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "integrations_update_own"
  ON public.integrations FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- CALL LOGS & MINUTE TRANSACTIONS: ТОЛЬКО чтение для клиента!
-- Запись выполняется исключительно серверными функциями через service_role.
CREATE POLICY "call_logs_select_own"
  ON public.call_logs FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "minute_transactions_select_own"
  ON public.minute_transactions FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

REVOKE INSERT, UPDATE, DELETE ON public.call_logs FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.minute_transactions FROM anon, authenticated;

-- ============================================================================
-- ТРИГГЕР АВТОМАТИЧЕСКОГО СОЗДАНИЯ ПРОФИЛЯ И +15 ПОДАРОЧНЫХ МИНУТ ПРИ РЕГИСТРАЦИИ
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_company TEXT;
BEGIN
  v_company := COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'company_name'), ''), 'Моя компания РБ');

  INSERT INTO public.profiles (id, email, company_name, balance_minutes, rate_per_minute)
  VALUES (NEW.id, COALESCE(NEW.email, ''), v_company, 15.00, 0.45)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.minute_transactions (user_id, type, minutes, amount_byn, payment_method, description)
  VALUES (NEW.id, 'gift', 15.00, 0.00, 'signup_bonus', 'Приветственные 15 минут при регистрации в Voxi.by');

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- АТОМАРНОЕ ЗАЧИСЛЕНИЕ МИНУТ ИЗ ВЕБХУКА BEPAID (ТОЛЬКО ДЛЯ SERVICE_ROLE)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.credit_minutes_from_payment(
  p_user_id UUID,
  p_minutes NUMERIC,
  p_amount_byn NUMERIC,
  p_payment_method TEXT,
  p_external_uid TEXT,
  p_description TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF p_minutes <= 0 THEN
    RETURN FALSE;
  END IF;

  INSERT INTO public.minute_transactions (
    user_id, type, minutes, amount_byn, payment_method, external_uid, description
  )
  VALUES (
    p_user_id, 'topup', p_minutes, p_amount_byn, p_payment_method, NULLIF(p_external_uid, ''), p_description
  )
  ON CONFLICT (external_uid) DO NOTHING;

  IF NOT FOUND THEN
    RETURN FALSE; -- Платеж уже был зачислен ранее
  END IF;

  UPDATE public.profiles
  SET balance_minutes = balance_minutes + p_minutes,
      updated_at = NOW()
  WHERE id = p_user_id;

  RETURN TRUE;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.credit_minutes_from_payment(UUID, NUMERIC, NUMERIC, TEXT, TEXT, TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.credit_minutes_from_payment(UUID, NUMERIC, NUMERIC, TEXT, TEXT, TEXT)
  TO service_role;
