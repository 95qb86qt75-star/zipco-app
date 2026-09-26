import { describe, expect, it } from "vitest";
import {
  MINIMUM_SEARCH_LENGTH,
  canRunSearch,
  isCurrentSearchResponse,
  isSearchFilterActive,
  nextCategoryFilter,
  normalizeSearchQuery,
} from "./searchConsistency";

describe("search consistency", () => {
  it("requires three meaningful characters before searching", () => {
    expect(MINIMUM_SEARCH_LENGTH).toBe(3);
    expect(canRunSearch("Ev")).toBe(false);
    expect(canRunSearch("  Ev  ")).toBe(false);
    expect(canRunSearch("Eve")).toBe(true);
    expect(normalizeSearchQuery("  tortas  ")).toBe("tortas");
  });

  it("rejects an older response after the user changed the query", () => {
    expect(
      isCurrentSearchResponse({
        requestId: 1,
        latestRequestId: 2,
        requestedQuery: "Ece",
        currentQuery: "Eve",
      }),
    ).toBe(false);
  });

  it("accepts only the latest response for the current query", () => {
    expect(
      isCurrentSearchResponse({
        requestId: 2,
        latestRequestId: 2,
        requestedQuery: " Eve ",
        currentQuery: "Eve",
      }),
    ).toBe(true);
  });

  it("keeps category and distance as independent active filters", () => {
    expect(nextCategoryFilter("negocios", "distance")).toBe("negocios");
    expect(isSearchFilterActive("negocios", "negocios", 2)).toBe(true);
    expect(isSearchFilterActive("distance", "negocios", 2)).toBe(true);
    expect(isSearchFilterActive("servicios", "negocios", 2)).toBe(false);
  });
});
