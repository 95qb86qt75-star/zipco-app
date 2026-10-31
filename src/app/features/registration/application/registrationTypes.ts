export type RegistrationStep =
  | 'welcome'
  | 'phone'
  | 'code'
  | 'name'
  | 'business'
  | 'businessDetails';

export type SmsCodeFeedbackState =
  | 'idle'
  | 'success'
  | 'error';
