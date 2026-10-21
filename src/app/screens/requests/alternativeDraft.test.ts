import { describe, expect, it } from 'vitest';
import { normalizeBusinessOrdersPayload } from './orderNormalization';
import { normalizeRequestProcess } from './requestProcess';
import { rawOrder, pendingProcess } from './requestProcessFixtures';
import { ALTERNATIVE_RELEASE, alternativeSource, alternativeSourceCurrent, canPrepareAlternative, canSubmitAlternative, newAlternativeDraft, reviewAlternative, santiagoDraftTime } from './alternativeDraft';

const order = () => normalizeBusinessOrdersPayload([{ ...rawOrder, orderType: 'product', needNow: true, requestProcess: pendingProcess }])[0];
const now = Date.parse('2026-10-20T12:00:00Z');
const prepared = () => {
  const source = alternativeSource(order()), draft = newAlternativeDraft(source);
  draft.message = 'Cambio de precio por nueva preparación.'; draft.lines[0].selected.add('price'); draft.lines[0].price = '1500';
  return { source, draft };
};

describe('alternative first-block release interlock and compatibility', () => {
  it('allows preparation for a currently actionable business request, never grants submission', () => {
    const o = order(); expect(canPrepareAlternative(o, true)).toBe(true); expect(canPrepareAlternative(o, false)).toBe(false);
    expect(canPrepareAlternative({ ...o, requestProcess: { ...pendingProcess, allowedActions: [] } }, true)).toBe(false);
    expect(canPrepareAlternative({ ...o, requestProcess: { ...pendingProcess, state: 'COORDINATION_PENDING' } }, true)).toBe(false);
    const process = normalizeRequestProcess({ ...pendingProcess, allowedActions: ['PROPOSE_ALTERNATIVE'] }); expect(process).not.toBeNull();
    expect(canPrepareAlternative({ ...o, requestProcess: process }, true)).toBe(true);
    expect(canSubmitAlternative()).toBe(false);
    expect(ALTERNATIVE_RELEASE).toEqual({ processContract: 'alternatives-v1', backendQaConfirmed: true, customerDecisionsReady: true, sendingEnabled: true });
    expect(canSubmitAlternative(true)).toBe(true);
    expect(Object.isFrozen(ALTERNATIVE_RELEASE)).toBe(true);
    expect(normalizeRequestProcess({ ...pendingProcess, allowedActions: ['UNKNOWN'] })).toBeNull();
  });
  it('rejects stale versions/proposals and preserves the source order when editing', () => {
    const o = order(), source = alternativeSource(o), draft = newAlternativeDraft(source);
    draft.lines[0].price = '5000'; draft.lines[0].name = 'Nueva opción';
    expect(o.products).toEqual({ state: 'available', items: [{ name: 'Producto de prueba', quantity: 2, price: 1000 }] });
    expect(alternativeSourceCurrent(source, o, true)).toBe(true);
    expect(alternativeSourceCurrent(source, { ...o, requestProcess: { ...pendingProcess, version: 2 } }, true)).toBe(false);
    expect(alternativeSourceCurrent(source, { ...o, requestProcess: { ...pendingProcess, currentProposalId: 124 } }, true)).toBe(false);
  });
});

describe('local alternative review matching the new proposal conditions', () => {
  it('retains original lines and current version/proposal without manufacturing a saved/confirmed receipt', () => {
    const { source, draft } = prepared(); const result = reviewAlternative(source, draft, now);
    expect(result.error).toBe(''); expect(result.review).toEqual({ expectedVersion: 1, proposalId: 123,
      lineChanges: [{ originalLineIndex: 0, unitPriceClp: 1500 }], totalPriceClp: 3000, message: draft.message });
    expect(result.review).not.toHaveProperty('confirmationAccepted'); expect(result.review).not.toHaveProperty('requestProcess');
  });
  it.each(['', '  ', 'ab', 'x'.repeat(1001)])('requires a 3–1000 character explanation for price and all other changes', message => {
    const { source, draft } = prepared(); draft.message = message;
    expect(reviewAlternative(source, draft, now).review).toBeNull();
  });
  it.each(['1.5', '-1', '1e3', '0', '50000001', '15,000'])('does not round or silently sanitize invalid money %s', price => {
    const { source, draft } = prepared(); draft.lines[0].price = price;
    expect(reviewAlternative(source, draft, now).review).toBeNull();
  });
  it('represents CUSTOM with an explicit whole-line total, not a divided unit price or fake catalog id', () => {
    const { source, draft } = prepared(); const line = draft.lines[0];
    line.selected = new Set(['item', 'price', 'quantity']); line.name = ' Conjunto de tres '; line.description = ' Descripción '; line.quantity = '3'; line.price = '10000';
    const result = reviewAlternative(source, draft, now).review!;
    expect(result.totalPriceClp).toBe(10000);
    expect(result.lineChanges).toEqual([{ originalLineIndex: 0, quantity: 3,
      replacement: { source: 'CUSTOM', name: 'Conjunto de tres', description: 'Descripción', lineTotalPriceClp: 10000 } }]);
    expect(JSON.stringify(result)).not.toContain('catalogItemId'); expect(JSON.stringify(result)).not.toContain('unitPriceClp');
  });
  it.each([['', ''], ['x'.repeat(121), ''], ['válido', 'x'.repeat(501)]])('bounds custom name and description', (name, description) => {
    const { source, draft } = prepared(); draft.lines[0].selected.add('item'); draft.lines[0].name = name; draft.lines[0].description = description;
    expect(reviewAlternative(source, draft, now).review).toBeNull();
  });
  it('keeps other lines untouched, uses stable original indices, and caps total and quantities', () => {
    const o = order(); o.products = { state: 'available', items: [{ name: 'A', quantity: 1, price: 1000 }, { name: 'B', quantity: 2, price: 500 }] };
    const source = alternativeSource(o), draft = newAlternativeDraft(source); draft.message = 'Propongo nueva cantidad.';
    draft.lines[1].selected.add('quantity'); draft.lines[1].quantity = '3';
    expect(reviewAlternative(source, draft, now).review).toMatchObject({ lineChanges: [{ originalLineIndex: 1, quantity: 3 }], totalPriceClp: 2500 });
    draft.lines[1].quantity = '100'; expect(reviewAlternative(source, draft, now).review).toBeNull();
    const large = prepared(); large.draft.lines[0].price = '50000000'; expect(reviewAlternative(large.source, large.draft, now).review).toBeNull();
  });
  it('retains service type and quantity 1 without inferring a missing type', () => {
    const o = order(); o.orderType = 'service'; o.products = { state: 'available', items: [{ name: 'Servicio', quantity: 1, price: 2000 }] };
    const source = alternativeSource(o), draft = newAlternativeDraft(source); draft.message = 'Propongo nueva cantidad.';
    draft.lines[0].selected.add('quantity'); draft.lines[0].quantity = '2'; expect(reviewAlternative(source, draft, now).review).toBeNull();
    expect(normalizeBusinessOrdersPayload([{ ...rawOrder, orderType: 'service' }])[0].orderType).toBe('service');
    expect(normalizeBusinessOrdersPayload([rawOrder])[0].orderType).toBeNull();
  });
  it('requires a material change, not just text/photo or toggled unchanged fields', () => {
    const { source, draft } = prepared(); draft.lines[0].price = '1000';
    expect(reviewAlternative(source, draft, now).review).toBeNull();
  });
  it('uses Chile civil time, rejects past, impossible and ambiguous times, and permits a future schedule', () => {
    expect(santiagoDraftTime('2026-09-06', '00:30')).toBeNull();
    expect(santiagoDraftTime('2026-04-04', '23:30')).toBeNull();
    expect(santiagoDraftTime('2026-02-30', '15:00')).toBeNull();
    const { source, draft } = prepared(); draft.scheduleChanged = true; draft.immediate = false;
    draft.date = '2026-10-19'; draft.time = '16:30'; expect(reviewAlternative(source, draft, now).review).toBeNull();
    draft.date = '2099-11-10';
    expect(reviewAlternative(source, draft, now).review?.schedule).toEqual({ mode: 'SCHEDULED', date: '2099-11-10', time: '16:30' });
    draft.immediate = true; expect(reviewAlternative(source, draft, now).review).not.toHaveProperty('schedule');
  });
  it('requires replacing an expired original schedule even if only the price changes', () => {
    const { source, draft } = prepared(); source.needNow = false; source.date = '2020-01-01'; source.time = '12:00';
    expect(reviewAlternative(source, draft, now).review).toBeNull();
    draft.scheduleChanged = true; draft.immediate = true;
    expect(reviewAlternative(source, draft, now).review?.schedule).toEqual({ mode: 'IMMEDIATE' });
  });
});
