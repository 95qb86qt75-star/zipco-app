import { useState } from 'react';
import { MapPin } from 'lucide-react';
import { API_BASE_URL } from '../api/apiConfig';
import {
  AuthSmsError,
  completeSmsRegistration
} from '../api/authSms';
import BusinessChoiceStep from './registration/BusinessChoiceStep';
import BusinessDetailsStep from './registration/BusinessDetailsStep';
import NameStep from './registration/NameStep';
import PhoneStep from './registration/PhoneStep';
import SmsCodeStep from './registration/SmsCodeStep';
import WelcomeStep from './registration/WelcomeStep';
import type { RegistrationStep } from './registration/registrationTypes';
import useSmsRegistration from './registration/useSmsRegistration';

export default function RegistrationFlow({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState<RegistrationStep>('welcome');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [error, setError] = useState('');
  const [isCompletingRegistration, setIsCompletingRegistration] = useState(false);

  const displayPhone = phone;
  const apiPhone = phone.replace(/\D/g, '');

  const sms = useSmsRegistration({ setError });

  const handlePhoneChange = (value: string) => {
    setError('');
    setPhone(value);
  };

  const saveAuthData = async (data: any, shouldCreateBusiness = false) => {
    const token = data.token ?? data.jwt ?? data.accessToken ?? data.access_token;
    const userId = data.user?.id ?? data.user?._id ?? data.id ?? data.userId;

    if (!token || !userId) {
      throw new Error('Invalid auth response');
    }

    localStorage.setItem('zipco-token', token);
    localStorage.setItem('zipco-user-id', String(userId));
    localStorage.setItem('zipco-user-phone', phone);
    localStorage.removeItem('zipco-business-id');

    if (shouldCreateBusiness && businessName.trim()) {
      try {
        const businessResponse = await fetch(`${API_BASE_URL}/businesses`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            name: businessName.trim(),
            type: 'Negocio',
            status: 'pending',
            categoryId: 1,
            address: '',
            latitude: null,
            longitude: null
          })
        });

        if (businessResponse.ok) {
          const businessData = await businessResponse.json();
          const business = businessData.business ?? businessData;
          const businessId = business.id ?? business._id ?? businessData.businessId;

          if (businessId) {
            localStorage.setItem('zipco-business-id', String(businessId));
          }
        }
      } catch (error) {
        // El usuario ya quedo autenticado; podra completar el negocio desde Perfil.
      }
    }

    localStorage.setItem('zipco-registration-complete', 'true');
    onComplete();
  };

  const handlePhoneSubmit = async () => {
    if (apiPhone.length !== 11) {
      setError('Ingresa un número celular válido.');
      return;
    }
    setError('');

    const requested = await sms.requestInitialCode(
      apiPhone,
      isCompletingRegistration
    );

    if (requested) {
      setStep('code');
    }
  };

  const handleChangePhone = () => {
    if (
      sms.isRequestingCode ||
      sms.isCodeActionPending ||
      isCompletingRegistration ||
      sms.feedbackState !== 'idle'
    ) {
      return;
    }

    sms.resetSmsState();
    setStep('phone');
  };


  const handleNameSubmit = () => {
    if (!name.trim()) {
      setError('Ingresa tu nombre para continuar.');
      return;
    }
    setError('');
    setStep('business');
  };

  const completeRegistration = async () => {
    if (isCompletingRegistration) return;

    if (step === 'businessDetails' && !businessName.trim()) {
      setError('Ingresa el nombre de tu negocio o servicio.');
      return;
    }

    setIsCompletingRegistration(true);

    try {
      setError('');

      const data = await completeSmsRegistration(apiPhone, sms.code, name.trim());
      await saveAuthData(data, step === 'businessDetails');
    } catch (registrationError) {
      setError(
        registrationError instanceof AuthSmsError
          ? registrationError.message
          : 'Hubo un problema al crear tu cuenta. Intenta de nuevo'
      );
    } finally {
      setIsCompletingRegistration(false);
    }
  };

  const activeSteps: RegistrationStep[] = [
    'welcome',
    'phone',
    'code',
    'name',
    'business',
    'businessDetails'
  ];

  const progress = activeSteps.indexOf(step) + 1;
  const totalSteps = activeSteps.length;

  const renderStep = () => {
    switch (step) {
      case 'welcome':
        return <WelcomeStep onContinue={() => setStep('phone')} />;

      case 'phone':
        return (
          <PhoneStep
            phone={phone}
            error={error}
            isRequestingCode={sms.isRequestingCode}
            onPhoneChange={handlePhoneChange}
            onContinue={handlePhoneSubmit}
          />
        );

      case 'code':
        return (
          <SmsCodeStep
            code={sms.code}
            displayPhone={displayPhone}
            error={error}
            feedbackState={sms.feedbackState}
            focusRequestKey={sms.focusRequestKey}
            isVerifying={sms.isVerifyingCode}
            isResending={sms.isResendingCode}
            resendSeconds={sms.resendSeconds}
            onCodeChange={sms.handleCodeChange}
            onSubmit={() => {
              void sms.handleCodeSubmit({
                apiPhone,
                isCompletingRegistration,
                onAuthenticated: (data) => saveAuthData(data, false),
                onRegistrationRequired: () => setStep('name')
              });
            }}
            onResend={() => {
              void sms.handleResendCode(apiPhone, isCompletingRegistration);
            }}
            onChangePhone={handleChangePhone}
          />
        );

      case 'name':
        return (
          <NameStep
            name={name}
            error={error}
            onNameChange={(value) => {
              setError('');
              setName(value);
            }}
            onContinue={handleNameSubmit}
          />
        );

      case 'business':
        return (
          <BusinessChoiceStep
            error={error}
            isCompletingRegistration={isCompletingRegistration}
            onChooseBusiness={() => setStep('businessDetails')}
            onChooseService={() => setStep('businessDetails')}
            onSearchOnly={completeRegistration}
          />
        );

      case 'businessDetails':
        return (
          <BusinessDetailsStep
            businessName={businessName}
            error={error}
            isCompletingRegistration={isCompletingRegistration}
            onBusinessNameChange={setBusinessName}
            onComplete={completeRegistration}
          />
        );
    }
  };

  return (
    <div className="size-full bg-gradient-to-br from-teal-50 via-white to-emerald-50 flex items-center justify-center">
      <div className="w-full max-w-md h-full flex flex-col relative overflow-hidden bg-white">
        <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-teal-500/20 to-transparent" />

        <div className="relative z-10 px-6 pt-8">
          <div className="flex items-center justify-center gap-2 mb-8">
            <MapPin className="w-8 h-8 text-teal-600" strokeWidth={2.5} />
            <h1 className="text-3xl font-bold tracking-tight text-teal-700">ZIPCO</h1>
          </div>

          {step !== 'welcome' && (
            <div className="mb-8">
              <div className="flex items-center justify-between text-xs font-semibold text-gray-400 mb-2">
                <span>Paso {progress} de {totalSteps}</span>
                <span>{Math.round((progress / totalSteps) * 100)}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#00BFA5] rounded-full transition-all duration-300"
                  style={{ width: `${(progress / totalSteps) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="relative z-10 flex-1 px-6 pb-8 flex flex-col justify-center">
          {renderStep()}
        </div>
      </div>
    </div>
  );
}
