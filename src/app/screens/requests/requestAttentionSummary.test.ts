import { describe, expect, it } from "vitest";
import { getCustomerAttentionItems } from "./requestAttentionSummary";

describe("getCustomerAttentionItems", () => {
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
