import * as React from 'react';
import { lazy, useState } from 'react';

import { API_BASE_URL } from "../../../../api/apiConfig";
import { AuthSmsError, completeSmsRegistration } from "../../../../api/authSms";
import BusinessChoiceStep from "../../steps/BusinessChoiceStep";
import BusinessDetailsStep from "../../steps/BusinessDetailsStep";
import NameStep from "../../steps/NameStep";
import PhoneStep from "../../steps/PhoneStep";
import SmsCodeStep from "../../steps/SmsCodeStep";
import WelcomeStep from "../../steps/WelcomeStep";
import type { RegistrationStep } from "../../application/registrationTypes";
import useSmsRegistration from "../../application/useSmsRegistration";
const DevAccessPanel = import.meta.env.DEV
  ? lazy(() => import("../../../../dev/DevAccessPanel"))
  : null;
const QaAccessPanel = import.meta.env.PROD && import.meta.env.VITE_ENABLE_QA_AUTH === 'true'
  ? lazy(() => import("../../../../qa/QaAccessPanel"))
  : null;
export const previousRegistrationStep = (step: RegistrationStep): RegistrationStep => {
  const previousStep: Partial<Record<RegistrationStep, RegistrationStep>> = {
    phone: 'welcome',
    code: 'phone',
    name: 'code',
    business: 'name',
    businessDetails: 'business'
  };
  return previousStep[step] ?? 'welcome';
};
export function useRegistrationFlowController({ onComplete }: { onComplete: () => void }){

  const [step, setStep] = useState<RegistrationStep>('welcome');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [providerType, setProviderType] = useState<'Negocio' | 'Servicio'>('Negocio');
  const [error, setError] = useState('');
  const [isCompletingRegistration, setIsCompletingRegistration] = useState(false);

  const displayPhone = phone.length === 8 ? `+56 9 ${phone.slice(0, 4)} ${phone.slice(4)}` : '+56 9';
  const apiPhone = `569${phone}`;

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
    localStorage.setItem('zipco-user-phone', apiPhone);
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
            type: providerType,
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
            localStorage.setItem('zipco-provider-type', providerType);
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
    if (phone.length !== 8) {
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

  const handleBack = () => {
    if (step === 'code') {
      handleChangePhone();
      return;
    }
    setError('');
    setStep(previousRegistrationStep(step));
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
            qaCode={sms.qaCode}
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
            onChooseBusiness={() => { setProviderType('Negocio'); setStep('businessDetails'); }}
            onChooseService={() => { setProviderType('Servicio'); setStep('businessDetails'); }}
            onSearchOnly={completeRegistration}
          />
        );

      case 'businessDetails':
        return (
          <BusinessDetailsStep
            businessName={businessName}
            providerType={providerType}
            error={error}
            isCompletingRegistration={isCompletingRegistration}
            onBusinessNameChange={setBusinessName}
            onComplete={completeRegistration}
          />
        );
    }
  };


return {DevAccessPanel,QaAccessPanel,handleBack,onComplete,progress,renderStep,step,totalSteps};
}
export type RegistrationFlowModel=ReturnType<typeof useRegistrationFlowController>;
