import { describe, expect, it } from "vitest";
import {
  countStatusViews,
  filterByStatusView,
  statusViewFor,
} from "./requestStatusGrouping";

describe("request status grouping", () => {
  it("groups the real order statuses", () => {
    expect(statusViewFor("orders", "pending")).toBe("pending");
    expect(statusViewFor("orders", "alternative_proposed")).toBe("waiting");
    expect(statusViewFor("orders", "accepted")).toBe("active");
    expect(statusViewFor("orders", "ready")).toBe("active");
    expect(statusViewFor("orders", "completed")).toBe("history");
  });

  it("groups the real quote statuses", () => {
    expect(statusViewFor("quotes", "requested")).toBe("pending");
    expect(statusViewFor("quotes", "quoted")).toBe("waiting");
    expect(statusViewFor("quotes", "accepted")).toBe("active");
    expect(statusViewFor("quotes", "alternative_proposed")).toBe("waiting");
    expect(statusViewFor("quotes", "ready")).toBe("active");
    expect(statusViewFor("quotes", "completed")).toBe("history");
    expect(statusViewFor("quotes", "declined")).toBe("history");
  });

  it("filters rejected quotes using the declined backend status", () => {
    const records = [
      { status: "declined", id: 1 },
      { status: "cancelled", id: 2 },
      { status: "accepted", id: 3 },
    ];
    expect(
      filterByStatusView(records, "quotes", "history", "rejected"),
    ).toEqual([{ status: "declined", id: 1 }]);
  });

  it("counts each visual group independently", () => {
    expect(
      countStatusViews(
        [
          { status: "pending" },
          { status: "accepted" },
          { status: "ready" },
          { status: "cancelled" },
        ],
        "orders",
      ),
    ).toEqual({ pending: 1, waiting: 0, active: 2, history: 1 });
  });

  it("keeps archived requests out of normal history and exposes them in Eliminados", () => {
    const records = [
      { status: "completed", id: 1, archivedAt: null },
      { status: "rejected", id: 2, archivedAt: "2026-09-30T12:00:00.000Z" },
    ];
    expect(filterByStatusView(records, "orders", "history", "all")).toEqual([
      records[0],
    ]);
    expect(filterByStatusView(records, "orders", "history", "deleted")).toEqual(
      [records[1]],
    );
  });
});
