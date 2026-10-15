import { describe, expect, it } from 'vitest';
import { normalizeAgreement } from './agreement';
import { agreementFixture } from './requestProcessFixtures';

describe('agreement orderType is an exact string enum', () => {
  it.each(['product', 'service'])('accepts the string %s', (orderType) => {
    const agreement = normalizeAgreement({ ...agreementFixture, subjectSnapshot: { ...agreementFixture.subjectSnapshot, orderType } });
    expect(agreement?.subjectSnapshot.orderType).toBe(orderType);
  });
  it.each([
    ['product'], ['service'], [], {}, 0, 1, null, undefined, true,
    'Product', 'product ', ' service', '', 'unknown',
    { toString: () => 'product' }, { toString: () => 'service' },
  ].map((value) => ({ value })))('rejects a non-enum value without coercion: $value', ({ value: orderType }) => {
    expect(normalizeAgreement({ ...agreementFixture, subjectSnapshot: { ...agreementFixture.subjectSnapshot, orderType } })).toBeNull();
  });
});
