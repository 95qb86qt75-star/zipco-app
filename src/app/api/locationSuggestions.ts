import { API_BASE_URL } from "./apiConfig";

export type LocationSuggestion = {
  place_id: string;
  display_name: string;
  lat: string;
  lon: string;
  address?: Record<string, string>;
};

export async function fetchLocationSuggestions(
  query: string,
  signal?: AbortSignal,
): Promise<LocationSuggestion[]> {
  const normalizedQuery = query.trim();
  if (normalizedQuery.length < 3) return [];

  const params = new URLSearchParams({ q: normalizedQuery });
  const response = await fetch(
    `${API_BASE_URL}/locations/suggestions?${params.toString()}`,
    {
      signal,
    },
  );

  if (!response.ok) {
    throw new Error("No se pudieron obtener sugerencias de ubicación");
  }

  const data = await response.json();
  return Array.isArray(data) ? data : [];
}
