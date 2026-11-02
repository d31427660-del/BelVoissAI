import React, { useState, useEffect, useRef } from 'react';
import {
  CloseCircleIcon,
  LetterIcon,
  LockKeyholeMinimalisticIcon,
  Buildings2Icon,
  ArrowRightIcon,
  ShieldCheckIcon,
  BoltCircleIcon,
  EyeIcon,
  EyeClosedIcon
} from '@solar-icons/react/bold-duotone';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { UserSession } from '../types';
import { LegalDocType } from './Footer';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserSession) => void;
  onOpenLegalDoc?: (doc: LegalDocType) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  onOpenLegalDoc
}) => {
  const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [consentAccepted, setConsentAccepted] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen) {
      setErrorMessage('');
      setInfoMessage('');
      if (!dialog.open) {
        dialog.showModal();
      }
    } else if (dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const rect = dialog.getBoundingClientRect();
    const isOutside =
      e.clientX < rect.left ||
      e.clientX > rect.right ||
      e.clientY < rect.top ||
      e.clientY > rect.bottom;
    if (isOutside) {
      onClose();
    }
  };

  const handleDemoLogin = (company = 'Автошкола "Драйв-Минск"') => {
    const demoUser: UserSession = {
      id: 'demo-user-bel-01',
      email: 'owner@drive-minsk.by',
      companyName: company,
      balanceMinutes: 145,
      ratePerMinute: 0.45,
      spentMinutes: 55,
      isMock: true
    };
    onLoginSuccess(demoUser);
    onClose();
  };

  const fetchUserProfile = async (userId: string, fallbackEmail: string, fallbackCompany: string): Promise<UserSession> => {
    if (supabase) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('email, company_name, balance_minutes, rate_per_minute, spent_minutes')
        .eq('id', userId)
        .maybeSingle();

      if (profile) {
        return {
          id: userId,
          email: profile.email || fallbackEmail,
          companyName: profile.company_name || fallbackCompany,
          balanceMinutes: Number(profile.balance_minutes ?? 15),
          ratePerMinute: Number(profile.rate_per_minute ?? 0.45),
          spentMinutes: Number(profile.spent_minutes ?? 0),
          isMock: false
        };
      }
    }
    return {
      id: userId,
      email: fallbackEmail,
      companyName: fallbackCompany,
      balanceMinutes: 15,
      ratePerMinute: 0.45,
      spentMinutes: 0,
      isMock: false
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setInfoMessage('');

    if (!email.trim()) {
      setErrorMessage('Пожалуйста, укажите корпоративный email');
      return;
    }

    if (mode === 'reset') {
      setLoading(true);
      try {
        if (isSupabaseConfigured && supabase) {
          const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
            redirectTo: `${window.location.origin}/`
          });
          if (error) throw error;
          setInfoMessage('Ссылка для сброса пароля отправлена на указанный email.');
        } else {
          setInfoMessage('Демо-режим: используйте кнопки быстрого демо-входа выше без пароля.');
        }
      } catch (err: unknown) {
        setErrorMessage(err instanceof Error ? err.message : 'Не удалось отправить письмо');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!password || password.length < 6) {
      setErrorMessage('Пароль должен содержать не менее 6 символов');
      return;
    }

    if (mode === 'signup' && !consentAccepted) {
      setErrorMessage('Для регистрации необходимо согласие на обработку персональных данных (Закон РБ № 99-З)');
      return;
    }

    setLoading(true);

    if (isSupabaseConfigured && supabase) {
      try {
        if (mode === 'signup') {
          const { data, error } = await supabase.auth.signUp({
            email: email.trim(),
            password,
            options: {
              data: {
                company_name: companyName.trim() || 'Моя компания РБ'
              }
            }
          });
          if (error) throw error;

          // If email confirmation is enabled in Supabase, session will be null until confirmed
          if (data.user && !data.session) {
            setInfoMessage('На ваш email отправлено письмо для подтверждения аккаунта. Перейдите по ссылке в письме, чтобы получить 15 бесплатных минут.');
            setLoading(false);
            return;
          }

          if (data.user && data.session) {
            const sessionProfile = await fetchUserProfile(
              data.user.id,
              data.user.email || email.trim(),
              companyName.trim() || 'Моя компания РБ'
            );
            onLoginSuccess(sessionProfile);
            onClose();
          }
        } else {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password
          });
          if (error) throw error;
          if (data.user) {
            const sessionProfile = await fetchUserProfile(
              data.user.id,
              data.user.email || email.trim(),
              data.user.user_metadata?.company_name || 'Бизнес РБ'
            );
            onLoginSuccess(sessionProfile);
            onClose();
          }
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Ошибка авторизации';
        setErrorMessage(msg);
      } finally {
        setLoading(false);
      }
    } else {
      // Demo sandbox mode when Supabase keys are not yet configured
      setTimeout(() => {
        onLoginSuccess({
          id: `usr_demo_${Date.now()}`,
          email: email.trim(),
          companyName: companyName.trim() || 'Моя компания РБ',
          balanceMinutes: 15,
          ratePerMinute: 0.45,
          spentMinutes: 0,
          isMock: true
        });
        setLoading(false);
        onClose();
      }, 300);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="auth-modal-title"
      onClose={onClose}
      onClick={handleBackdropClick}
      className="w-full max-w-md rounded-[40px] bg-[#ffffff] border border-[#e5e5ea] overflow-hidden shadow-2xl p-0 text-[#1d1d1f] backdrop:bg-black/50 backdrop:backdrop-blur-md open:animate-fadeIn m-auto"
    >
      {/* Header */}
      <div className="px-7 py-5 border-b border-[#e5e5ea] flex items-center justify-between bg-[#ffffff]">
        <div>
          <p className="text-xs font-medium text-[#6e6e73] mb-0.5">
            Voxi Studio
          </p>
          <h2 id="auth-modal-title" className="text-lg font-semibold tracking-tight text-[#1d1d1f]">
            {mode === 'signup'
              ? 'Регистрация (+15 мин в подарок)'
              : mode === 'reset'
              ? 'Восстановление доступа'
              : 'Вход в личный кабинет'}
          </h2>
        </div>
        <button
          type="button"
          aria-label="Закрыть окно входа"
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-[#f5f5f7] text-[#6e6e73] hover:text-[#1d1d1f] flex items-center justify-center transition-colors"
        >
          <CloseCircleIcon size={18} />
        </button>
      </div>

      {/* Body */}
      <div className="p-7 space-y-5 max-h-[82vh] overflow-y-auto">

        {/* Quick 1-Click Demo Login Banner */}
        <div className="p-4 rounded-[28px] bg-blue-50/80 border border-blue-100 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-[#2563eb] font-semibold text-xs">
              <BoltCircleIcon size={16} className="text-[#2563eb]" aria-hidden="true" />
              <span>Ознакомительный демо-стенд</span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-white text-[#2563eb] border border-blue-200">
              Без пароля
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleDemoLogin('Автошкола "Драйв-Минск"')}
              className="px-3 py-2.5 rounded-full bg-[#ffffff] hover:bg-[#2563eb] hover:text-[#ffffff] text-[#2563eb] border border-blue-200 font-semibold text-xs text-center transition-all"
            >
              Автошкола (Минск)
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin('СТО "Минск-Моторс"')}
              className="px-3 py-2.5 rounded-full bg-[#ffffff] hover:bg-[#2563eb] hover:text-[#ffffff] text-[#2563eb] border border-blue-200 font-semibold text-xs text-center transition-all"
            >
              СТО и Сервис
            </button>
          </div>
        </div>

        <div className="relative flex items-center justify-center">
          <div className="border-t border-[#e5e5ea] w-full"></div>
          <span className="bg-[#ffffff] px-3 text-xs text-[#6e6e73] shrink-0">
            или аккаунт компании
          </span>
        </div>

        {errorMessage && (
          <div role="alert" className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 font-medium text-xs">
            {errorMessage}
          </div>
        )}

        {infoMessage && (
          <div role="status" className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 font-medium text-xs">
            {infoMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'signup' && (
            <div>
              <label htmlFor="auth-company" className="block text-xs font-medium text-[#1d1d1f] mb-1.5">
                Название компании или ИП
              </label>
              <div className="relative">
                <Buildings2Icon size={17} className="text-[#6e6e73] absolute left-4 top-3.5 pointer-events-none" aria-hidden="true" />
                <input
                  id="auth-company"
                  name="organization"
                  type="text"
                  autoComplete="organization"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Стоматология «Дент», СТО"
                  className="w-full pl-11 pr-4 py-3 rounded-full bg-[#f5f5f7] border border-transparent text-[#1d1d1f] text-sm focus:outline-none focus:bg-[#ffffff] focus:border-[#1d1d1f] transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <label htmlFor="auth-email" className="block text-xs font-medium text-[#1d1d1f] mb-1.5">
              Корпоративный Email
            </label>
            <div className="relative">
              <LetterIcon size={17} className="text-[#6e6e73] absolute left-4 top-3.5 pointer-events-none" aria-hidden="true" />
              <input
                id="auth-email"
                name="email"
                type="email"
                autoComplete="username"
                spellCheck={false}
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@company.by"
                className="w-full pl-11 pr-4 py-3 rounded-full bg-[#f5f5f7] border border-transparent text-[#1d1d1f] text-sm focus:outline-none focus:bg-[#ffffff] focus:border-[#1d1d1f] transition-colors"
              />
            </div>
          </div>

          {mode !== 'reset' && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="auth-password" className="block text-xs font-medium text-[#1d1d1f]">
                  Пароль
                </label>
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => setMode('reset')}
                    className="text-[11px] text-[#2563eb] hover:underline font-medium"
                  >
                    Забыли пароль?
                  </button>
                )}
              </div>
              {mode === 'signup' && (
                <span id="auth-password-hint" className="block text-[11px] text-[#6e6e73] mb-1.5">
                  Минимум 6 символов
                </span>
              )}
              <div className="relative">
                <LockKeyholeMinimalisticIcon size={17} className="text-[#6e6e73] absolute left-4 top-3.5 pointer-events-none" aria-hidden="true" />
                <input
                  id="auth-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  aria-describedby={mode === 'signup' ? 'auth-password-hint' : undefined}
                  minLength={6}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-11 py-3 rounded-full bg-[#f5f5f7] border border-transparent text-[#1d1d1f] text-sm focus:outline-none focus:bg-[#ffffff] focus:border-[#1d1d1f] transition-colors"
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-[#6e6e73] hover:text-[#1d1d1f] p-0.5 rounded-full"
                >
                  {showPassword ? <EyeClosedIcon size={17} /> : <EyeIcon size={17} />}
                </button>
              </div>
            </div>
          )}

          {mode === 'signup' && (
            <div className="flex items-start gap-2.5 pt-1">
              <input
                id="auth-consent-99z"
                type="checkbox"
                checked={consentAccepted}
                onChange={(e) => setConsentAccepted(e.target.checked)}
                required
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#2563eb] focus:ring-[#2563eb] shrink-0"
              />
              <label htmlFor="auth-consent-99z" className="text-[11px] text-[#6e6e73] leading-snug">
                Я принимаю условия{' '}
                <button
                  type="button"
                  onClick={() => onOpenLegalDoc?.('offer')}
                  className="text-[#2563eb] hover:underline font-medium"
                >
                  публичной оферты
                </button>{' '}
                и даю согласие на обработку персональных данных в соответствии с{' '}
                <button
                  type="button"
                  onClick={() => onOpenLegalDoc?.('privacy')}
                  className="text-[#2563eb] hover:underline font-medium"
                >
                  Политикой (Закон РБ № 99‑З)
                </button>.
              </label>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#2563eb] to-[#4f46e5] hover:from-[#1d4ed8] hover:to-[#4338ca] text-[#ffffff] font-semibold text-sm flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 transition-all disabled:opacity-50"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" aria-label="Загрузка"></div>
            ) : (
              <>
                <span>
                  {mode === 'signup'
                    ? 'Зарегистрироваться'
                    : mode === 'reset'
                    ? 'Отправить ссылку сброса'
                    : 'Войти в кабинет'}
                </span>
                <ArrowRightIcon size={17} aria-hidden="true" />
              </>
            )}
          </button>
        </form>

        <div className="flex items-center justify-between text-xs text-[#6e6e73] pt-1">
          <span>
            {mode === 'signup'
              ? 'Уже есть аккаунт?'
              : mode === 'reset'
              ? 'Вспомнили пароль?'
              : 'Впервые в Voxi?'}
          </span>
          <button
            type="button"
            onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
            className="text-[#1d1d1f] hover:underline font-medium"
          >
            {mode === 'signin' ? 'Создать аккаунт' : 'Войти по паролю'}
          </button>
        </div>

        <div className="text-center text-xs text-[#6e6e73] flex items-center justify-center gap-1.5">
          <ShieldCheckIcon size={15} className="text-[#1d1d1f]" aria-hidden="true" />
          <span>Защита данных (Закон № 99‑З) • ИП Беляков К. О.</span>
        </div>

      </div>
    </dialog>
  );
};
