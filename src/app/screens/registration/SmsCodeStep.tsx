import {
  useEffect,
  useRef,
  type FormEvent
} from 'react';
import {
  ArrowLeft,
  LoaderCircle,
  RotateCcw
} from 'lucide-react';
import { REGEXP_ONLY_DIGITS } from 'input-otp';

import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot
} from '../../components/ui/input-otp';
import type {
  SmsCodeFeedbackState
} from './registrationTypes';

type SmsCodeStepProps = {
  code: string;
  displayPhone: string;
  error: string;
  feedbackState: SmsCodeFeedbackState;
  focusRequestKey: number;
  isVerifying: boolean;
  isResending: boolean;
  resendSeconds: number;
  onCodeChange: (value: string) => void;
  onSubmit: () => void;
  onResend: () => void;
  onChangePhone: () => void;
};

export default function SmsCodeStep({
  code,
  displayPhone,
  error,
  feedbackState,
  focusRequestKey,
  isVerifying,
  isResending,
  resendSeconds,
  onCodeChange,
  onSubmit,
  onResend,
  onChangePhone
}: SmsCodeStepProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const isCodeActionPending =
    isVerifying || isResending;

  const isCodeComplete = code.length === 6;

  useEffect(() => {
    inputRef.current?.focus();
  }, [focusRequestKey]);

  const handleCodeChange = (value: string) => {
    if (feedbackState !== 'idle') return;
    onCodeChange(value);
  };

  const handleSubmit = (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (
      !isCodeComplete ||
      isCodeActionPending ||
      feedbackState !== 'idle'
    ) {
      return;
    }

    onSubmit();
  };

  const getSlotClasses = () => {
    const baseClasses = [
      'h-12 w-11 rounded-xl border bg-white',
      'text-xl font-bold text-gray-900',
      'transition-all duration-300',
      'data-[active=true]:z-10',
      'data-[active=true]:ring-[3px]'
    ].join(' ');

    if (feedbackState === 'success') {
      return [
        baseClasses,
        'border-emerald-500 bg-emerald-50',
        'text-emerald-700',
        'ring-2 ring-emerald-500/25',
        'shadow-md shadow-emerald-500/20'
      ].join(' ');
    }

    if (feedbackState === 'error') {
      return [
        baseClasses,
        'border-red-400 bg-red-50',
        'text-red-600',
        'ring-2 ring-red-500/20'
      ].join(' ');
    }

    return [
      baseClasses,
      'border-gray-200',
      'data-[active=true]:border-[#00BFA5]',
      'data-[active=true]:ring-teal-500/20',
      'data-[active=true]:shadow-md',
      'data-[active=true]:shadow-teal-500/10'
    ].join(' ');
  };

  return (
    <form onSubmit={handleSubmit}>
      <button
        type="button"
        onClick={onChangePhone}
        disabled={isCodeActionPending}
        className="
          mb-6 inline-flex items-center gap-1.5
          text-sm font-semibold text-teal-700
          transition-colors hover:text-teal-800
          disabled:cursor-not-allowed disabled:opacity-50
        "
      >
        <ArrowLeft className="h-4 w-4" />
        Cambiar número
      </button>

      <h2 className="mb-2 text-2xl font-bold text-gray-900">
        Ingresa el código
      </h2>

      <p className="mb-8 text-sm leading-relaxed text-gray-600">
        Enviamos un código de 6 dígitos por SMS a{' '}
        <span className="font-semibold text-gray-900">
          {displayPhone}
        </span>
      </p>

      <div className="flex justify-center">
        <InputOTP
          ref={inputRef}
          maxLength={6}
          value={code}
          onChange={handleCodeChange}
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern={REGEXP_ONLY_DIGITS}
          disabled={
            isCodeActionPending ||
            feedbackState === 'success'
          }
          aria-label="Código de verificación de 6 dígitos"
          containerClassName="justify-center gap-0"
        >
          <InputOTPGroup className="gap-2">
            {Array.from({ length: 6 }, (_, index) => (
              <InputOTPSlot
                key={index}
                index={index}
                className={getSlotClasses()}
              />
            ))}
          </InputOTPGroup>
        </InputOTP>
      </div>

      <div
        className="mt-4 min-h-5 text-center"
        aria-live="polite"
        aria-atomic="true"
      >
        {feedbackState === 'success' ? (
          <p className="text-sm font-semibold text-emerald-600">
            Código verificado correctamente
          </p>
        ) : error ? (
          <p className="text-sm text-red-500">
            {error}
          </p>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={
          !isCodeComplete ||
          isCodeActionPending ||
          feedbackState !== 'idle'
        }
        className="
          mt-5 flex w-full items-center justify-center gap-2
          rounded-full bg-[#00BFA5] px-6 py-4
          font-semibold text-white
          shadow-lg shadow-teal-500/30
          transition-all
          hover:bg-teal-600
          active:scale-[0.98]
          disabled:cursor-not-allowed
          disabled:opacity-50
          disabled:shadow-none
          disabled:active:scale-100
        "
      >
        {isVerifying ? (
          <>
            <LoaderCircle className="h-5 w-5 animate-spin" />
            Verificando...
          </>
        ) : (
          'Verificar código'
        )}
      </button>

      <div className="mt-6 text-center">
        {resendSeconds > 0 ? (
          <p className="text-sm text-gray-500">
            Podrás reenviar el código en{' '}
            <span className="font-semibold text-gray-700">
              {resendSeconds}s
            </span>
          </p>
        ) : (
          <button
            type="button"
            onClick={onResend}
            disabled={isCodeActionPending}
            className="
              inline-flex items-center justify-center gap-1.5
              text-sm font-semibold text-teal-700
              transition-colors hover:text-teal-800
              disabled:cursor-not-allowed disabled:opacity-50
            "
          >
            {isResending ? (
              <>
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Reenviando...
              </>
            ) : (
              <>
                <RotateCcw className="h-4 w-4" />
                Reenviar código
              </>
            )}
          </button>
        )}
      </div>
    </form>
  );
}
