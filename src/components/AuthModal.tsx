import React, { useState, useEffect, useRef } from 'react';
import {
  CloseCircleIcon,
  LetterIcon,
  LockKeyholeMinimalisticIcon,
  Buildings2Icon,
  ArrowRightIcon,
  ShieldCheckIcon,
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
import { LoadingSuccessButton } from '@/components/motion';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserSession, workspace?: Partial<IspWorkspaceBundle>) => void;
  onOpenLegalDoc?: (doc: LegalDocType) => void;
  initialMode?: 'signin' | 'signup';
  initialResetEmail?: string;
  initialResetToken?: string;
  pendingPackageLabel?: string | null;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

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
  initialMode,
  initialResetEmail,
  initialResetToken,
  pendingPackageLabel,
}) => {
  const [mode, setMode] = useState<'signin' | 'signup' | 'reset' | 'confirm_reset'>(
    initialResetToken ? 'confirm_reset' : (initialMode || 'signin')
  );
  const [email, setEmail] = useState(initialResetEmail || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  useEffect(() => {
    if (initialResetToken) {
      setMode('confirm_reset');
      if (initialResetEmail) setEmail(initialResetEmail);
    } else if (isOpen && initialMode) {
      setMode(initialMode);
    }
  }, [initialResetEmail, initialResetToken, isOpen, initialMode]);

  const dialogRef = useRef<HTMLDialogElement>(null);
  const pressedOutsideRef = useRef(false);

  const switchMode = (nextMode: 'signin' | 'signup' | 'reset' | 'confirm_reset') => {
    setErrorMessage('');
    setInfoMessage('');
    setMode(nextMode);
  };

  useEffect(() => {
    setErrorMessage('');
    setInfoMessage('');
  }, [mode]);

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

  const isPointerOutside = (e: React.PointerEvent<HTMLDialogElement>, dialog: HTMLDialogElement) => {
    const rect = dialog.getBoundingClientRect();
    return (
      e.clientX < rect.left ||
      e.clientX > rect.right ||
      e.clientY < rect.top ||
      e.clientY > rect.bottom
    );
  };

  const hasStackedDialogOnTop = () => {
    const openDialogs = document.querySelectorAll('dialog[open]');
    return openDialogs.length > 1 && openDialogs[openDialogs.length - 1] !== dialogRef.current;
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDialogElement>) => {
    const dialog = dialogRef.current;
    if (!dialog || hasStackedDialogOnTop()) {
      pressedOutsideRef.current = false;
      return;
    }
    pressedOutsideRef.current = isPointerOutside(e, dialog);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDialogElement>) => {
    const dialog = dialogRef.current;
    if (!dialog || hasStackedDialogOnTop()) {
      pressedOutsideRef.current = false;
      return;
    }
    if (pressedOutsideRef.current && isPointerOutside(e, dialog)) {
      onClose();
    }
    pressedOutsideRef.current = false;
  };

  const handleCancel = (e: React.SyntheticEvent<HTMLDialogElement>) => {
    if (hasStackedDialogOnTop()) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setErrorMessage('');
    setInfoMessage('');

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !EMAIL_REGEX.test(trimmedEmail)) {
      setErrorMessage('Пожалуйста, укажите корректный email (например, name@company.by)');
      return;
    }

    if (mode === 'signup' && !companyName.trim()) {
      setErrorMessage('Пожалуйста, укажите название компании или ИП');
      return;
    }

    if (mode !== 'reset' && (!password || password.length < 6)) {
      setErrorMessage('Пароль должен содержать не менее 6 символов');
      return;
    }

    if (mode === 'signup' && !consentAccepted) {
      setErrorMessage('Для регистрации необходимо согласие на обработку персональных данных (Закон РБ № 99-З)');
      return;
    }

    setLoading(true);
    try {
      const ispStatus = await getIspDbStatus();
      if (!ispStatus.available || !ispStatus.configured || !ispStatus.connected) {
        throw new Error('Сервис временно недоступен. Попробуйте позже или напишите в поддержку.');
      }

      if (mode === 'reset') {
        const msg = await ispResetPassword(trimmedEmail);
        setInfoMessage(msg);
        return;
      }

      if (mode === 'confirm_reset' && initialResetToken) {
        const bundle = await ispConfirmResetPassword(trimmedEmail, initialResetToken, password);
        onLoginSuccess(bundle.user, bundle);
        onClose();
        return;
      }

      const bundle =
        mode === 'signup'
          ? await ispSignUp(trimmedEmail, password, companyName.trim())
          : await ispSignIn(trimmedEmail, password);
      onLoginSuccess(bundle.user, bundle);
      onClose();
    } catch (err: unknown) {
      const rawMsg = err instanceof Error ? err.message : 'Ошибка авторизации';
      setErrorMessage(localizeAuthError(rawMsg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="auth-modal-title"
      onCancel={handleCancel}
      onClose={() => {
        if (!hasStackedDialogOnTop()) onClose();
      }}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      className="w-[calc(100%-1.5rem)] max-w-md rounded-[24px] bg-white border border-black/[0.1] shadow-2xl p-0 text-black backdrop:bg-black/65 backdrop:backdrop-blur-sm open:animate-fadeIn m-auto"
    >
      {/* Header */}
      <div className="px-7 py-5 border-b border-black/[0.08] flex items-center justify-between">
        <div>
          <p className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-[#737373] mb-1">
            VOXI.BY · КАБИНЕТ
          </p>
          <h2 id="auth-modal-title" className="font-display text-xl font-bold tracking-[-0.025em] text-black">
            {mode === 'signup'
              ? 'Регистрация (+15 мин)'
              : mode === 'reset'
              ? 'Восстановление доступа'
              : mode === 'confirm_reset'
              ? 'Новый пароль'
              : 'Вход в кабинет'}
          </h2>
        </div>
        <button
          type="button"
          aria-label={
            mode === 'signup'
              ? 'Закрыть окно регистрации'
              : mode === 'reset'
              ? 'Закрыть окно восстановления доступа'
              : mode === 'confirm_reset'
              ? 'Закрыть окно смены пароля'
              : 'Закрыть окно входа'
          }
          onClick={onClose}
          className="w-11 h-11 rounded-full bg-[#F5F5F5] hover:bg-black hover:text-white text-[#525252] flex items-center justify-center transition-colors cursor-pointer shrink-0"
        >
          <CloseCircleIcon size={18} aria-hidden="true" />
        </button>
      </div>

      {/* Body */}
      <div className="p-7 space-y-5 max-h-[82vh] overflow-y-auto">
        {errorMessage && (
          <div role="alert" className="p-3.5 rounded-[14px] bg-[#FFF5F3] border border-[#FE432A]/40 text-[#991B1B] font-medium text-[12.5px]">
            {errorMessage}
          </div>
        )}

        {infoMessage && (
          <div role="status" className="p-3.5 rounded-[14px] bg-[#0A0A0A] text-white font-medium text-[12.5px]">
            {infoMessage}
          </div>
        )}

        {pendingPackageLabel && (mode === 'signin' || mode === 'signup') && (
          <div className="p-3.5 rounded-[14px] bg-[#D8E738] text-black text-[12px] flex items-center justify-between gap-2">
            <span>После входа откроется оплата:</span>
            <strong className="font-mono font-bold shrink-0">{pendingPackageLabel}</strong>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label htmlFor="auth-company" className="block text-[12.5px] font-semibold text-black mb-1.5">
                Название компании или ИП
              </label>
              <div className="relative">
                <Buildings2Icon size={17} className="text-[#737373] absolute left-3.5 top-3 pointer-events-none" aria-hidden="true" />
                <input
                  id="auth-company"
                  name="organization"
                  type="text"
                  autoComplete="organization"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Название компании или ИП"
                  className="w-full pl-10 pr-4 py-2.5 min-h-[42px] rounded-[12px] bg-[#F5F5F5] focus:bg-white border border-black/[0.08] focus:border-black text-black text-[13px] focus:outline-none transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <label htmlFor="auth-email" className="block text-[12.5px] font-semibold text-black mb-1.5">
              Корпоративный Email
            </label>
            <div className="relative">
              <LetterIcon size={17} className="text-[#737373] absolute left-3.5 top-3 pointer-events-none" aria-hidden="true" />
              <input
                id="auth-email"
                name="email"
                type="email"
                autoComplete="username"
                spellCheck={false}
                required
                value={email}
                readOnly={mode === 'confirm_reset' && Boolean(initialResetEmail)}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.by"
                className="w-full pl-10 pr-4 py-2.5 min-h-[42px] rounded-[12px] bg-[#F5F5F5] focus:bg-white border border-black/[0.08] focus:border-black text-black text-[13px] focus:outline-none transition-colors read-only:opacity-65"
              />
            </div>
          </div>

          {mode !== 'reset' && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="auth-password" className="block text-[12.5px] font-semibold text-black">
                  Пароль
                </label>
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => switchMode('reset')}
                    className="text-[11.5px] text-[#525252] hover:text-black underline underline-offset-4 cursor-pointer"
                  >
                    Забыли пароль?
                  </button>
                )}
              </div>
              {mode === 'signup' && (
                <span id="auth-password-hint" className="block text-[11px] text-[#737373] mb-1.5">
                  Минимум 6 символов
                </span>
              )}
              <div className="relative">
                <LockKeyholeMinimalisticIcon size={17} className="text-[#737373] absolute left-3.5 top-3 pointer-events-none" aria-hidden="true" />
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
                  className="w-full pl-10 pr-11 py-2.5 min-h-[42px] rounded-[12px] bg-[#F5F5F5] focus:bg-white border border-black/[0.08] focus:border-black text-black text-[13px] focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-[#737373] hover:text-black p-1 rounded-full cursor-pointer"
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
                className="mt-0.5 h-4 w-4 rounded border-black/25 text-black shrink-0 accent-black"
              />
              <label htmlFor="auth-consent-99z" className="text-[11.5px] text-[#525252] leading-snug">
                Я принимаю условия{' '}
                <button
                  type="button"
                  onClick={() => onOpenLegalDoc?.('offer')}
                  className="text-black hover:underline font-semibold cursor-pointer"
                >
                  публичной оферты
                </button>{' '}
                и даю согласие на обработку персональных данных в соответствии с{' '}
                <button
                  type="button"
                  onClick={() => onOpenLegalDoc?.('privacy')}
                  className="text-black hover:underline font-semibold cursor-pointer"
                >
                  Политикой (Закон РБ № 99‑З)
                </button>.
              </label>
            </div>
          )}

          <LoadingSuccessButton
            type="submit"
            status={loading ? 'loading' : infoMessage ? 'success' : 'idle'}
            loadingLabel={
              mode === 'signup'
                ? 'Создаём аккаунт…'
                : mode === 'reset'
                ? 'Отправляем ссылку…'
                : mode === 'confirm_reset'
                ? 'Сохраняем пароль…'
                : 'Выполняем вход…'
            }
            successLabel="Готово"
            idleLabel={
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
            }
            className="w-full h-11 rounded-full bg-black hover:bg-[#171717] text-white font-semibold text-[13px]"
          />
        </form>

        <div className="flex items-center justify-between text-[12.5px] text-[#737373] pt-1">
          <span>
            {mode === 'signup'
              ? 'Уже есть аккаунт?'
              : mode === 'reset' || mode === 'confirm_reset'
              ? 'Вспомнили пароль?'
              : 'Впервые в Voxi?'}
          </span>
          <button
            type="button"
            onClick={() => switchMode(mode === 'signin' ? 'signup' : 'signin')}
            className="text-black hover:underline font-semibold cursor-pointer"
          >
            {mode === 'signin' ? 'Создать аккаунт' : 'Войти по паролю'}
          </button>
        </div>

        <div className="text-center text-[11.5px] text-[#737373] flex items-center justify-center gap-1.5 pt-1 border-t border-black/[0.06]">
          <ShieldCheckIcon size={15} className="text-black" aria-hidden="true" />
          <span>Закон РБ №{'\u00A0'}99‑З · ИП{'\u00A0'}Беляков{'\u00A0'}К.{'\u00A0'}О.</span>
        </div>
      </div>
    </dialog>
  );
};
