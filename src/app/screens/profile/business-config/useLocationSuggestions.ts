import { useEffect, useState } from 'react';
import { fetchLocationSuggestions } from '../../../api/locationSuggestions';

export default function useLocationSuggestions(fullAddress: string) {
  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([]);
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const [hasLocationSearched, setHasLocationSearched] = useState(false);
  const [locationTouched, setLocationTouched] = useState(false);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  const setCoordinates = (latValue: any, lngValue: any) => {
    const nextLatitude = Number.parseFloat(String(latValue ?? ''));
    const nextLongitude = Number.parseFloat(String(lngValue ?? ''));

    setLatitude(Number.isFinite(nextLatitude) ? nextLatitude : null);
    setLongitude(Number.isFinite(nextLongitude) ? nextLongitude : null);
  };

  const clearCoordinates = () => {
    setLatitude(null);
    setLongitude(null);
  };

  const selectLocationSuggestion = (result: any) => {
    setCoordinates(result?.lat, result?.lon ?? result?.lng);
    setLocationSuggestions([]);
    setHasLocationSearched(false);
    setLocationTouched(false);
  };

  useEffect(() => {
    const query = fullAddress.trim();
    if (!locationTouched || query.length < 3) {
      setLocationSuggestions([]);
      setIsLocationLoading(false);
      setHasLocationSearched(false);
      return;
    }

    setIsLocationLoading(true);
    setHasLocationSearched(false);
    let isActive = true;
    const controller = new AbortController();

    const timeout = setTimeout(async () => {
      try {
        const data = await fetchLocationSuggestions(query, controller.signal);
        if (isActive) {
          setLocationSuggestions(Array.isArray(data) ? data : []);
        }
      } catch {
        if (isActive) {
          setLocationSuggestions([]);
        }
      } finally {
        if (isActive) {
          setIsLocationLoading(false);
          setHasLocationSearched(true);
        }
      }
    }, 400);

    return () => {
      isActive = false;
      clearTimeout(timeout);
      controller.abort();
    };
  }, [fullAddress, locationTouched]);

  return {
    locationSuggestions,
    isLocationLoading,
    hasLocationSearched,
    locationTouched,
    latitude,
    longitude,
    setLocationTouched,
    setLocationSuggestions,
    setHasLocationSearched,
    setCoordinates,
    clearCoordinates,
    selectLocationSuggestion
  };
}
