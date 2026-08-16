import {
  useEffect,
  useRef,
  useState
} from 'react';
import {
  AuthSmsError,
  isAuthenticatedResponse,
  isRegistrationRequiredResponse,
  requestSmsCode,
  verifySmsCode,
  type AuthenticatedResponse
} from '../../api/authSms';
import type {
  SmsCodeFeedbackState
} from './registrationTypes';

type UseSmsRegistrationOptions = {
  setError: (message: string) => void;
};

type HandleCodeSubmitOptions = {
  apiPhone: string;
  isCompletingRegistration: boolean;
  onAuthenticated: (
    data: AuthenticatedResponse
  ) => Promise<void> | void;
  onRegistrationRequired: () => void;
};

export default function useSmsRegistration({
  setError
}: UseSmsRegistrationOptions) {
  const [code, setCode] = useState('');
  const [feedbackState, setFeedbackState] =
    useState<SmsCodeFeedbackState>('idle');
  const [focusRequestKey, setFocusRequestKey] = useState(0);
  const [resendSeconds, setResendSeconds] = useState(0);
  const [isRequestingCode, setIsRequestingCode] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [isResendingCode, setIsResendingCode] = useState(false);
  const feedbackTimerRef = useRef<number | null>(null);

  const isCodeActionPending = isVerifyingCode || isResendingCode;

  useEffect(() => {
    if (resendSeconds <= 0) return;

    const timer = window.setTimeout(() => {
      setResendSeconds((seconds) => Math.max(0, seconds - 1));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [resendSeconds]);

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current !== null) {
        window.clearTimeout(feedbackTimerRef.current);
      }
    };
  }, []);

  const clearFeedbackTimer = () => {
    if (feedbackTimerRef.current !== null) {
      window.clearTimeout(feedbackTimerRef.current);
      feedbackTimerRef.current = null;
    }
  };

  const showFeedback = (state: Exclude<SmsCodeFeedbackState, 'idle'>) =>
    new Promise<void>((resolve) => {
      clearFeedbackTimer();
      setFeedbackState(state);

      feedbackTimerRef.current = window.setTimeout(() => {
        feedbackTimerRef.current = null;
        setFeedbackState('idle');
        resolve();
      }, 900);
    });

  const handleCodeChange = (value: string) => {
    if (feedbackState !== 'idle') return;

    setCode(value);
    setError('');
  };

  const requestInitialCode = async (
    apiPhone: string,
    isCompletingRegistration: boolean
  ): Promise<boolean> => {
    if (
      isRequestingCode ||
      isCodeActionPending ||
      isCompletingRegistration
    ) {
      return false;
    }

    setIsRequestingCode(true);

    try {
      await requestSmsCode(apiPhone);
      setCode('');
      setError('');
      setFeedbackState('idle');
      setResendSeconds(30);
      return true;
    } catch (requestError) {
      setError(
        requestError instanceof AuthSmsError
          ? requestError.message
          : 'No pudimos enviar el código. Intenta nuevamente.'
      );
      return false;
    } finally {
      setIsRequestingCode(false);
    }
  };

  const handleCodeSubmit = async ({
    apiPhone,
    isCompletingRegistration,
    onAuthenticated,
    onRegistrationRequired
  }: HandleCodeSubmitOptions) => {
    if (
      !/^\d{6}$/.test(code) ||
      isRequestingCode ||
      isCodeActionPending ||
      isCompletingRegistration ||
      feedbackState !== 'idle'
    ) {
      if (!/^\d{6}$/.test(code)) {
        setError('Ingresa el código de 6 dígitos.');
      }
      return;
    }

    setError('');
    setIsVerifyingCode(true);

    try {
      const data = await verifySmsCode(apiPhone, code);

      if (isAuthenticatedResponse(data)) {
        await showFeedback('success');
        await onAuthenticated(data);
        return;
      }

      if (isRegistrationRequiredResponse(data)) {
        await showFeedback('success');
        setError('');
        onRegistrationRequired();
        return;
      }

      throw new Error('Unexpected verify-code response');
    } catch (verifyError) {
      setError(
        verifyError instanceof AuthSmsError
          ? verifyError.message
          : 'No pudimos verificar el código. Intenta nuevamente.'
      );
      await showFeedback('error');
    } finally {
      setIsVerifyingCode(false);
    }
  };

  const handleResendCode = async (
    apiPhone: string,
    isCompletingRegistration: boolean
  ) => {
    if (
      resendSeconds > 0 ||
      isRequestingCode ||
      isCodeActionPending ||
      isCompletingRegistration ||
      feedbackState !== 'idle'
    ) {
      return;
    }

    setError('');
    setIsResendingCode(true);

    try {
      await requestSmsCode(apiPhone);
      setCode('');
      setError('');
      setResendSeconds(30);
      setFocusRequestKey((key) => key + 1);
    } catch (resendError) {
      if (
        resendError instanceof AuthSmsError &&
        resendError.status === 429 &&
        resendError.retryAfterSeconds !== null
      ) {
        setResendSeconds(resendError.retryAfterSeconds);
      }

      setError(
        resendError instanceof AuthSmsError
          ? resendError.message
          : 'No pudimos reenviar el código. Intenta nuevamente.'
      );
    } finally {
      setIsResendingCode(false);
    }
  };

  const resetSmsState = () => {
    clearFeedbackTimer();
    setCode('');
    setError('');
    setFeedbackState('idle');
    setResendSeconds(0);
  };

  return {
    code,
    feedbackState,
    focusRequestKey,
    resendSeconds,
    isRequestingCode,
    isVerifyingCode,
    isResendingCode,
    isCodeActionPending,
    handleCodeChange,
    handleCodeSubmit,
    handleResendCode,
    requestInitialCode,
    resetSmsState
  };
}
