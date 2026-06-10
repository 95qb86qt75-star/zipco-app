import { Eye, EyeOff, MapPinIcon } from 'lucide-react';

type LocationPrivacyCardProps = {
  fullAddress: string;
  setFullAddress: (value: string) => void;
  showFullAddress: boolean;
  setShowFullAddress: (value: boolean) => void;
  locationSuggestions: any[];
  isLocationLoading: boolean;
  hasLocationSearched: boolean;
  locationTouched: boolean;
  setLocationTouched: (value: boolean) => void;
  setLocationSuggestions: (suggestions: any[]) => void;
  setHasLocationSearched: (value: boolean) => void;
  onSelectLocationSuggestion: (suggestion: any) => void;
};

const getLocationLabel = (result: any) => {
  const address = result.address ?? {};
  const streetName = address.road ?? address.pedestrian ?? address.residential ?? address.street ?? '';
  const streetNumber = address.house_number ?? '';
  const city = address.city ?? address.town ?? address.suburb ?? address.village ?? address.municipality ?? '';
  const streetAddress = [streetName, streetNumber].filter(Boolean).join(' ');

  if (streetAddress) {
    return [streetAddress, city].filter(Boolean).join(', ');
  }

  const parts = String(result.display_name ?? '').split(',').map((part: string) => part.trim()).filter(Boolean);
  if (parts[parts.length - 1]?.toLowerCase() === 'chile') parts.pop();
  return parts.join(', ');
};

export default function LocationPrivacyCard({
  fullAddress,
  setFullAddress,
  showFullAddress,
  setShowFullAddress,
  locationSuggestions,
  isLocationLoading,
  hasLocationSearched,
  locationTouched,
  setLocationTouched,
  setLocationSuggestions,
  setHasLocationSearched,
  onSelectLocationSuggestion
}: LocationPrivacyCardProps) {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-white/50 shadow-md mb-2">
      <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
        <MapPinIcon className="w-5 h-5 text-teal-600" />
        Privacidad de Ubicacion
      </h4>

      <div className="mb-4">
        <label className="text-sm text-gray-700 mb-2 block">Direccion completa</label>
        <div className="relative">
          <input
            type="text"
            value={fullAddress}
            onChange={(e) => {
              setLocationTouched(true);
              setFullAddress(e.target.value);
            }}
            placeholder="Escribe tu direccion..."
            className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
          />
          {locationTouched && fullAddress.trim().length >= 3 && (
            <div className="absolute left-0 right-0 top-full mt-2 z-30 max-h-52 overflow-auto rounded-2xl border border-gray-100 bg-white shadow-xl">
              {isLocationLoading ? (
                <p className="px-4 py-3 text-sm text-gray-500">Buscando...</p>
              ) : locationSuggestions.length > 0 ? (
                locationSuggestions.map((result, index) => {
                  const label = getLocationLabel(result);
                  return (
                    <button
                      key={`${result.place_id ?? index}`}
                      type="button"
                      onClick={() => {
                        setFullAddress(label);
                        onSelectLocationSuggestion(result);
                        setLocationSuggestions([]);
                        setHasLocationSearched(false);
                        setLocationTouched(false);
                      }}
                      className="w-full text-left px-4 py-3 text-sm text-gray-700 border-b border-gray-100 last:border-b-0 hover:bg-teal-50 transition-colors"
                    >
                      {label}
                    </button>
                  );
                })
              ) : hasLocationSearched ? (
                <p className="px-4 py-3 text-sm text-gray-500">No se encontraron resultados</p>
              ) : null}
            </div>
          )}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {showFullAddress ? <Eye className="w-5 h-5 text-blue-600" /> : <EyeOff className="w-5 h-5 text-gray-600" />}
            <span className="font-semibold text-gray-900 text-sm">
              {showFullAddress ? 'Mostrar direccion completa' : 'Mostrar solo distancia'}
            </span>
          </div>
          <button
            onClick={() => setShowFullAddress(!showFullAddress)}
            className={`relative w-14 h-8 rounded-full transition-all ${showFullAddress ? 'bg-blue-500' : 'bg-gray-300'}`}
          >
            <div
              className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${
                showFullAddress ? 'translate-x-7' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
        <p className="text-xs text-gray-600">
          {showFullAddress ? 'Los clientes veran tu direccion exacta' : 'Los clientes solo veran la distancia en km'}
        </p>
      </div>
    </div>
  );
}
