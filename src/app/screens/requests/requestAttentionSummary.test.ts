import { describe, expect, it } from "vitest";
import { getCustomerAttentionItems, getCustomerCoordinationItems } from "./requestAttentionSummary";
import { coordinationProcess } from './requestProcessFixtures';

describe('persistent customer coordination summary', () => {
  it('counts pending and ongoing coordination regardless of consent or unread alerts', () => {
    const records = [false, true].map((customerContactAuthorized, index) => ({ id: index + 1, status: 'accepted',
      requestProcess: { ...coordinationProcess, state: index ? 'COORDINATING' : 'COORDINATION_PENDING',
        coordination: { customerContactAuthorized, businessContactAuthorized: false } } }));
    expect(getCustomerCoordinationItems(records)).toEqual(records);
    expect(getCustomerAttentionItems(records, 'orders', new Set()).responses).toEqual([]);
    expect(getCustomerCoordinationItems(records)).toHaveLength(2);
  });
  it('excludes legacy, unavailable, malformed and processes outside coordination', () => {
    const states = ['AWAITING_BUSINESS_RESPONSE', 'IN_PROGRESS', 'READY', 'COMPLETED', 'COORDINATION_CANCELLED', 'UNKNOWN'];
    const records = states.map((state, index) => ({ id: index + 1, status: 'accepted', requestProcess: { ...coordinationProcess, state } }));
    expect(getCustomerCoordinationItems([...records, { id: 100, status: 'accepted', requestProcess: null },
      { id: 101, status: 'accepted', requestProcessInvalid: true },
      { id: 102, status: 'accepted', recordState: 'unavailable', requestProcess: coordinationProcess },
      { id: 103, status: 'completed', requestProcess: coordinationProcess }])).toEqual([]);
  });
});

describe("getCustomerAttentionItems", () => {
  it('includes READY processes in customer attention without requiring a push or treating them as completed', () => {
    const requestProcess = { ...coordinationProcess, state: 'READY' };
    const result = getCustomerAttentionItems([{ id: 20, status: 'ready', requestProcess }], 'orders', new Set());
    expect(result.ready).toEqual([{ kind: 'orders', id: 20, status: 'ready', requestProcess }]);
    expect(result.responses).toEqual([]); expect(result.count).toBe(1);
  });
  it("counts only order cards that require customer attention", () => {
    const result = getCustomerAttentionItems(
      [
        { id: 1, status: "pending", recordState: "available" },
        { id: 2, status: "alternative_proposed", recordState: "available" },
        { id: 3, status: "accepted", recordState: "available" },
        { id: 4, status: "accepted", recordState: "available" },
        { id: 5, status: "ready", recordState: "available" },
        { id: 6, status: "ready", recordState: "unavailable" },
      ],
      "orders",
      new Set(["order:3"]),
    );
    expect(result.responses.map((item) => item.id)).toEqual([2, 3]);
    expect(result.ready.map((item) => item.id)).toEqual([5]);
    expect(result.count).toBe(3);
  });

  it("counts quote proposals and ready services without passive states", () => {
    const result = getCustomerAttentionItems(
      [
        { id: 10, status: "requested" },
        { id: 11, status: "quoted" },
        { id: 12, status: "alternative_proposed" },
        { id: 13, status: "accepted" },
        { id: 14, status: "ready" },
        { id: 15, status: "completed" },
      ],
      "quotes",
      new Set(),
    );
    expect(result.responses.map((item) => item.id)).toEqual([11, 12]);
    expect(result.ready.map((item) => item.id)).toEqual([14]);
    expect(result.count).toBe(3);
  });
});
