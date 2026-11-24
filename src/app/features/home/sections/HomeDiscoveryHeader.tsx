import * as React from 'react';

import { MapPin, Search, MapPinned, Send } from "lucide-react";


























import { canRunSearch } from "../../search/domain/searchConsistency";


import type { AppModel } from "../../../shell/application/useAppController";
/** Canonical visual section; data and commands come from its screen controller. */
export default function HomeDiscoveryHeader({model}:{model:Pick<AppModel,"currentLocation"|"getLocationSuggestionLabel"|"globalSearchQuery"|"hasLocationAutocompleteSearched"|"isDarkMode"|"isLocationAutocompleteLoading"|"locationAutocompleteResults"|"locationSearch"|"locationSearchError"|"searchLocationByText"|"selectLocationResult"|"setCurrentScreen"|"setGlobalSearchQuery"|"setHasLocationAutocompleteSearched"|"setLocationAutocompleteResults"|"setLocationSearch"|"setLocationSearchError"|"setShowLocationModal"|"showLocationModal"|"updateCurrentLocationFromGeolocation">}){
const {currentLocation,getLocationSuggestionLabel,globalSearchQuery,hasLocationAutocompleteSearched,isDarkMode,isLocationAutocompleteLoading,locationAutocompleteResults,locationSearch,locationSearchError,searchLocationByText,selectLocationResult,setCurrentScreen,setGlobalSearchQuery,setHasLocationAutocompleteSearched,setLocationAutocompleteResults,setLocationSearch,setLocationSearchError,setShowLocationModal,showLocationModal,updateCurrentLocationFromGeolocation}=model;
return (<div
          className="px-6 pb-6"
          style={{ paddingTop: "max(2rem, env(safe-area-inset-top))" }}
        >
          {/* Logo */}
          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center gap-2">
              <MapPin className="w-8 h-8 text-teal-600" strokeWidth={2.5} />
              <h1
                className={`text-3xl tracking-tight ${isDarkMode ? "text-teal-400" : "text-teal-700"}`}
              >
                ZIPCCO
              </h1>
            </div>
          </div>

          {/* Primary Action Button */}
          <button
            onClick={updateCurrentLocationFromGeolocation}
            className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 text-white py-3.5 px-6 rounded-full flex items-center justify-center gap-2 shadow-lg shadow-teal-500/30 hover:shadow-xl hover:shadow-teal-500/40 transition-all active:scale-[0.98]"
          >
            <MapPinned className="w-5 h-5" />
            <span className="font-medium">Localízame</span>
          </button>

          {/* Search Bar */}
          <div className="mt-4 relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={globalSearchQuery}
              onChange={(e) => setGlobalSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && canRunSearch(globalSearchQuery)) {
                  setCurrentScreen("search");
                }
              }}
              placeholder="Qué buscas? ej: torta, gásfiter, hielo"
              className={`w-full border rounded-full py-3 pl-11 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all shadow-sm ${
                isDarkMode
                  ? "bg-slate-800/80 border-slate-700 text-slate-100 placeholder:text-slate-400"
                  : "bg-white border-gray-200 placeholder:text-gray-400"
              }`}
            />
            <button
              onClick={() => {
                if (canRunSearch(globalSearchQuery)) {
                  setCurrentScreen("search");
                }
              }}
              className="absolute inset-y-0 right-4 flex items-center"
            >
              <Send className="w-4 h-4 text-gray-400 hover:text-teal-600 transition-colors" />
            </button>
          </div>

          {/* Location Indicator */}
          <div className="mt-4 flex items-center justify-center gap-2 text-sm">
            <MapPin className="w-4 h-4 text-teal-600" />
            <span className={isDarkMode ? "text-slate-300" : "text-gray-600"}>
              Ubicación actual:
            </span>
            <span
              className={`font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}
            >
              {currentLocation.name || "Sin ubicación"}
            </span>
            {!showLocationModal && (
              <button
                onClick={() => {
                  setLocationSearch("");
                  setLocationSearchError("");
                  setLocationAutocompleteResults([]);
                  setHasLocationAutocompleteSearched(false);
                  setShowLocationModal(true);
                }}
                className="text-teal-600 hover:text-teal-700 underline underline-offset-2 transition-colors"
              >
                Cambiar
              </button>
            )}
          </div>

          {showLocationModal && (
            <div className="mt-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={locationSearch}
                  onChange={(e) => {
                    setLocationSearch(e.target.value);
                    setLocationSearchError("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      searchLocationByText();
                    }
                  }}
                  placeholder="Escribe una ciudad o comuna..."
                  className={`flex-1 border rounded-full py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-[#00BFA5] transition-all shadow-sm ${
                    isDarkMode
                      ? "bg-slate-800/80 border-slate-700 text-slate-100 placeholder:text-slate-400"
                      : "bg-white border-gray-200 text-gray-900 placeholder:text-gray-400"
                  }`}
                />
                <button
                  type="button"
                  onClick={searchLocationByText}
                  className="bg-[#00BFA5] text-white py-3 px-5 rounded-full text-sm font-semibold shadow-lg shadow-teal-500/25 hover:bg-teal-600 transition-all active:scale-[0.98]"
                >
                  Buscar
                </button>
              </div>
              {locationSearch.trim().length >= 3 && (
                <div
                  className={`mt-2 max-h-56 overflow-auto rounded-2xl border shadow-lg ${
                    isDarkMode
                      ? "bg-slate-900 border-slate-700"
                      : "bg-white border-gray-100"
                  }`}
                >
                  {isLocationAutocompleteLoading ? (
                    <p
                      className={`px-4 py-3 text-sm ${isDarkMode ? "text-slate-300" : "text-gray-500"}`}
                    >
                      Buscando...
                    </p>
                  ) : locationAutocompleteResults.length > 0 ? (
                    locationAutocompleteResults.map((result, index) => (
                      <button
                        key={`${result.place_id ?? result.osm_id ?? "location"}-${index}`}
                        type="button"
                        onClick={() =>
                          selectLocationResult(result, locationSearch.trim())
                        }
                        className={`w-full text-left px-4 py-3 text-sm border-b last:border-b-0 transition-colors ${
                          isDarkMode
                            ? "border-slate-700 text-slate-100 hover:bg-slate-800"
                            : "border-gray-100 text-gray-700 hover:bg-teal-50"
                        }`}
                      >
                        {getLocationSuggestionLabel(result)}
                      </button>
                    ))
                  ) : hasLocationAutocompleteSearched ? (
                    <p
                      className={`px-4 py-3 text-sm ${isDarkMode ? "text-slate-300" : "text-gray-500"}`}
                    >
                      No se encontraron resultados
                    </p>
                  ) : null}
                </div>
              )}
              {locationSearchError && (
                <p className="mt-2 text-xs text-red-500 text-center">
                  {locationSearchError}
                </p>
              )}
            </div>
          )}
        </div>);
}
