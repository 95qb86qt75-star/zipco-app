export const SERVICE_HOURS_CONTRACT = 'service-hours-advisory-v1';
export const SERVICE_HOURS_HEADERS = { 'X-Service-Hours-Contract': SERVICE_HOURS_CONTRACT };
export const definitiveHoursRejection = (status: number, code: string) => status === 409 &&
  ['SERVICE_HOURS_CONTRACT_REQUIRED', 'ADVISORY_RESERVATION_HOURS_DISABLED'].includes(code);
