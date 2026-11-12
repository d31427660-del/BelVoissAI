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
import {
  getIspDbStatus,
  ispConfirmResetPassword,
  ispResetPassword,
  ispSignIn,
  ispSignUp,
  IspWorkspaceBundle,
} from '../lib/ispDbClient';
import { UserSession } from '../types';
import { LegalDocType } from './Footer';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserSession, workspace?: Partial<IspWorkspaceBundle>) => void;
  onOpenLegalDoc?: (doc: LegalDocType) => void;
  initialResetEmail?: string;
  initialResetToken?: string;
}

function localizeAuthError(msg: string): string {
  const lower = msg.toLowerCase();
  if (lower.includes('invalid login credentials')) return 'Неверный адрес электронной почты или пароль';
  if (lower.includes('user already registered')) return 'Пользователь с таким email уже зарегистрирован. Пожалуйста, выполните вход';
  if (lower.includes('email not confirmed')) return 'Email не подтверждён. Проверьте почту для перехода по ссылке активации';
  if (lower.includes('rate limit')) return 'Слишком много попыток. Пожалуйста, подождите минуту перед повтором';
  if (lower.includes('password should be at least')) return 'Пароль должен содержать не менее 6 символов';
  if (lower.includes('invalid email')) return 'Пожалуйста, введите корректный адрес электронной почты';
  return msg;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  onOpenLegalDoc,
  initialResetEmail,
  initialResetToken
}) => {
  const [mode, setMode] = useState<'signin' | 'signup' | 'reset' | 'confirm_reset'>(
    initialResetToken ? 'confirm_reset' : 'signin'
  );
  const [email, setEmail] = useState(initialResetEmail || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [consentAccepted, setConsentAccepted] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  useEffect(() => {
    if (initialResetToken) {
      setMode('confirm_reset');
      if (initialResetEmail) setEmail(initialResetEmail);
    }
  }, [initialResetEmail, initialResetToken]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setInfoMessage('');

    if (!email.trim()) {
      setErrorMessage('Пожалуйста, укажите корпоративный email');
      return;
    }

    const ispStatus = await getIspDbStatus();

    if (mode === 'reset') {
      setLoading(true);
      try {
        if (ispStatus.available && ispStatus.configured) {
          if (!ispStatus.connected) {
            throw new Error(ispStatus.error || 'База данных хостинга недоступна. Проверьте api/config.php');
          }
          const msg = await ispResetPassword(email.trim());
          setInfoMessage(msg);
        } else {
          setInfoMessage('Демо-режим: используйте кнопки быстрого демо-входа выше без пароля.');
        }
      } catch (err: unknown) {
        setErrorMessage(localizeAuthError(err instanceof Error ? err.message : 'Не удалось отправить письмо'));
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!password || password.length < 6) {
      setErrorMessage('Пароль должен содержать не менее 6 символов');
      return;
    }

    if (mode === 'confirm_reset' && initialResetToken) {
      setLoading(true);
      try {
        const bundle = await ispConfirmResetPassword(email.trim(), initialResetToken, password);
        onLoginSuccess(bundle.user, bundle);
        onClose();
      } catch (err: unknown) {
        setErrorMessage(localizeAuthError(err instanceof Error ? err.message : 'Ошибка смены пароля'));
      } finally {
        setLoading(false);
      }
      return;
    }

    if (mode === 'signup' && !consentAccepted) {
      setErrorMessage('Для регистрации необходимо согласие на обработку персональных данных (Закон РБ № 99-З)');
      return;
    }

    setLoading(true);

    // 1. Авторизация через MySQL на хостинге ISPmanager (/api/db)
    if (ispStatus.available && ispStatus.configured) {
      try {
        if (!ispStatus.connected) {
          throw new Error(
            ispStatus.error || 'Не удалось подключиться к БД MySQL в ISPmanager. Проверьте api/config.php'
          );
        }
        if (mode === 'signup') {
          const bundle = await ispSignUp(
            email.trim(),
            password,
            companyName.trim() || 'Моя компания РБ'
          );
          onLoginSuccess(bundle.user, bundle);
          onClose();
        } else {
          const bundle = await ispSignIn(email.trim(), password);
          onLoginSuccess(bundle.user, bundle);
          onClose();
        }
      } catch (err: unknown) {
        const rawMsg = err instanceof Error ? err.message : 'Ошибка авторизации';
        setErrorMessage(localizeAuthError(rawMsg));
      } finally {
        setLoading(false);
      }
      return;
    }

    // 2. Ознакомительный песочный режим (если локальная среда разработки без активной БД)
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
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="auth-modal-title"
      onClose={onClose}
      onClick={handleBackdropClick}
      className="w-[calc(100%-1.5rem)] max-w-md rounded-[16px] liquid-glass-card shadow-2xl p-0 text-black backdrop:bg-black/40 backdrop:backdrop-blur-sm open:animate-fadeIn m-auto"
    >
      {/* Header */}
      <div className="px-7 py-5 border-b border-black/[0.06] flex items-center justify-between">
        <div>
          <p className="text-xs font-normal text-[#777169] mb-0.5">
            Voxi Studio
          </p>
          <h2 id="auth-modal-title" className="text-lg font-medium tracking-tight text-black">
            {mode === 'signup'
              ? 'Регистрация (+15 мин в подарок)'
              : mode === 'reset'
              ? 'Восстановление доступа'
              : mode === 'confirm_reset'
              ? 'Установка нового пароля'
              : 'Вход в личный кабинет'}
          </h2>
        </div>
        <button
          type="button"
          aria-label="Закрыть окно входа"
          onClick={onClose}
          className="w-9 h-9 rounded-full liquid-glass-pill text-[#777169] hover:text-black flex items-center justify-center transition-colors cursor-pointer"
        >
          <CloseCircleIcon size={18} />
        </button>
      </div>

      {/* Body */}
      <div className="p-7 space-y-5 max-h-[82vh] overflow-y-auto">

        {/* Quick 1-Click Demo Login Banner */}
        <div className="p-4 rounded-[12px] liquid-glass-cream space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-black font-medium text-xs">
              <BoltCircleIcon size={16} className="text-black" aria-hidden="true" />
              <span>Ознакомительный демо-стенд</span>
            </div>
            <span className="text-[10px] font-normal uppercase tracking-wide px-2 py-0.5 rounded-full liquid-glass-pill text-black">
              Без пароля
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleDemoLogin('Автошкола "Драйв-Минск"')}
              className="px-3 py-2 rounded-full liquid-glass-pill text-black font-normal text-xs text-center transition-all hover:bg-white cursor-pointer"
            >
              Автошкола (Минск)
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin('СТО "Минск-Моторс"')}
              className="px-3 py-2 rounded-full liquid-glass-pill text-black font-normal text-xs text-center transition-all hover:bg-white cursor-pointer"
            >
              СТО и Сервис
            </button>
          </div>
        </div>

        <div className="relative flex items-center justify-center">
          <div className="border-t border-black/[0.06] w-full"></div>
          <span className="bg-[#FAF8F5] px-3 text-xs text-[#777169] shrink-0">
            или аккаунт компании
          </span>
        </div>

        {errorMessage && (
          <div role="alert" className="p-3.5 rounded-[12px] bg-rose-50 border border-rose-200 text-rose-900 font-normal text-xs">
            {errorMessage}
          </div>
        )}

        {infoMessage && (
          <div role="status" className="p-3.5 rounded-[12px] bg-emerald-50 border border-emerald-200 text-emerald-900 font-normal text-xs">
            {infoMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'signup' && (
            <div>
              <label htmlFor="auth-company" className="block text-xs font-normal text-black mb-1.5">
                Название компании или ИП
              </label>
              <div className="relative">
                <Buildings2Icon size={17} className="text-[#777169] absolute left-4 top-3.5 pointer-events-none" aria-hidden="true" />
                <input
                  id="auth-company"
                  name="organization"
                  type="text"
                  autoComplete="organization"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Стоматология «Дент», СТО"
                  className="w-full pl-11 pr-4 py-2.5 rounded-full bg-white border border-black/[0.08] text-black text-xs sm:text-sm focus:outline-none focus:border-black transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <label htmlFor="auth-email" className="block text-xs font-normal text-black mb-1.5">
              Корпоративный Email
            </label>
            <div className="relative">
              <LetterIcon size={17} className="text-[#777169] absolute left-4 top-3.5 pointer-events-none" aria-hidden="true" />
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
                className="w-full pl-11 pr-4 py-2.5 rounded-full bg-white border border-black/[0.08] text-black text-xs sm:text-sm focus:outline-none focus:border-black transition-colors"
              />
            </div>
          </div>

          {mode !== 'reset' && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="auth-password" className="block text-xs font-normal text-black">
                  Пароль
                </label>
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => setMode('reset')}
                    className="text-[11px] text-black hover:underline font-normal cursor-pointer"
                  >
                    Забыли пароль?
                  </button>
                )}
              </div>
              {mode === 'signup' && (
                <span id="auth-password-hint" className="block text-[11px] text-[#777169] mb-1.5 font-normal">
                  Минимум 6 символов
                </span>
              )}
              <div className="relative">
                <LockKeyholeMinimalisticIcon size={17} className="text-[#777169] absolute left-4 top-3.5 pointer-events-none" aria-hidden="true" />
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
                  className="w-full pl-11 pr-11 py-2.5 rounded-full bg-white border border-black/[0.08] text-black text-xs sm:text-sm focus:outline-none focus:border-black transition-colors"
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-2.5 text-[#777169] hover:text-black p-0.5 rounded-full cursor-pointer"
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
                className="mt-0.5 h-4 w-4 rounded border-black/20 text-black focus:ring-black shrink-0 accent-black"
              />
              <label htmlFor="auth-consent-99z" className="text-[11px] text-[#777169] leading-snug">
                Я принимаю условия{' '}
                <button
                  type="button"
                  onClick={() => onOpenLegalDoc?.('offer')}
                  className="text-black hover:underline font-medium cursor-pointer"
                >
                  публичной оферты
                </button>{' '}
                и даю согласие на обработку персональных данных в соответствии с{' '}
                <button
                  type="button"
                  onClick={() => onOpenLegalDoc?.('privacy')}
                  className="text-black hover:underline font-medium cursor-pointer"
                >
                  Политикой (Закон РБ № 99‑З)
                </button>.
              </label>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-full liquid-glass-btn-primary text-white font-normal text-xs sm:text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer active:scale-[0.98]"
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
                    : mode === 'confirm_reset'
                    ? 'Сохранить новый пароль'
                    : 'Войти в кабинет'}
                </span>
                <ArrowRightIcon size={17} aria-hidden="true" />
              </>
            )}
          </button>
        </form>

        <div className="flex items-center justify-between text-xs text-[#777169] pt-1">
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
            className="text-black hover:underline font-medium cursor-pointer"
          >
            {mode === 'signin' ? 'Создать аккаунт' : 'Войти по паролю'}
          </button>
        </div>

        <div className="text-center text-xs text-[#777169] flex items-center justify-center gap-1.5">
          <ShieldCheckIcon size={15} className="text-black" aria-hidden="true" />
          <span>Защита данных (Закон № 99‑З) • ИП Беляков К. О.</span>
        </div>

      </div>
    </dialog>
  );
};
