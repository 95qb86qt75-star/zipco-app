import { describe, expect, it } from "vitest";
import { LOCATION_SUGGESTIONS_PANEL_CLASS } from "./locationSuggestionLayout";

describe("location suggestion layout", () => {
  it("keeps suggestions in the form flow so they cannot cover action buttons", () => {
    expect(LOCATION_SUGGESTIONS_PANEL_CLASS).toContain("mt-2");
    expect(LOCATION_SUGGESTIONS_PANEL_CLASS).not.toContain("absolute");
    expect(LOCATION_SUGGESTIONS_PANEL_CLASS).not.toContain("top-full");
  });
});
