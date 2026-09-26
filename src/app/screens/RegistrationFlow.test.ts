import { describe, expect, it } from 'vitest';
import { previousRegistrationStep } from './RegistrationFlow';

describe('previousRegistrationStep', () => {
  it.each([
    ['phone', 'welcome'],
    ['code', 'phone'],
    ['name', 'code'],
    ['business', 'name'],
    ['businessDetails', 'business']
  ] as const)('returns from %s to %s', (current, expected) => {
    expect(previousRegistrationStep(current)).toBe(expected);
  });
});
