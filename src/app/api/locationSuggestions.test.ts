import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchLocationSuggestions } from "./locationSuggestions";

describe("fetchLocationSuggestions", () => {
  afterEach(() => vi.restoreAllMocks());

  it("does not request queries shorter than three characters", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");
    await expect(fetchLocationSuggestions("Co")).resolves.toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("requests the ZIPCO suggestions endpoint with the partial query", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => [{ display_name: "Coronel, Región del Biobío, Chile" }],
    } as Response);

    const result = await fetchLocationSuggestions(" Coro ");

    expect(result).toHaveLength(1);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/locations/suggestions?q=Coro"),
      expect.objectContaining({ signal: undefined }),
    );
  });
});
