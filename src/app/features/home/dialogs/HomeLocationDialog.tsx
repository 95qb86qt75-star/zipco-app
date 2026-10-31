import * as React from 'react';

import { Search } from "lucide-react";





























import type { AppModel } from "../../../shell/application/useAppController";
/** Canonical visual section; data and commands come from its screen controller. */
export default function HomeLocationDialog({model}:{model:Pick<AppModel,"chileLocationBase"|"currentLocation"|"isDarkMode"|"locationSearch"|"locationSuggestions"|"pendingLocation"|"setCurrentLocation"|"setLocationSearch"|"setPendingLocation"|"setShowLocationModal">}){
const {chileLocationBase,currentLocation,isDarkMode,locationSearch,locationSuggestions,pendingLocation,setCurrentLocation,setLocationSearch,setPendingLocation,setShowLocationModal}=model;
return (<div
            className="absolute inset-0 z-40 bg-black/40 flex items-end"
            onClick={() => setShowLocationModal(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className={`w-full rounded-t-3xl p-5 shadow-2xl border-t ${
                isDarkMode
                  ? "bg-slate-900 border-slate-700"
                  : "bg-white border-gray-200"
              }`}
            >
              <div
                className={`w-12 h-1.5 rounded-full mx-auto mb-4 ${isDarkMode ? "bg-slate-600" : "bg-gray-300"}`}
              ></div>
              <h3
                className={`text-lg font-bold mb-3 ${isDarkMode ? "text-white" : "text-gray-900"}`}
              >
                Cambiar ubicación
              </h3>
              <p
                className={`text-xs mb-3 ${isDarkMode ? "text-slate-400" : "text-gray-500"}`}
              >
                Simulación tipo Google Maps: escribe una comuna/ciudad y
                selecciona una sugerencia.
              </p>

              <div className="relative mb-3">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <Search
                    className={`w-4 h-4 ${isDarkMode ? "text-slate-400" : "text-gray-400"}`}
                  />
                </div>
                <input
                  type="text"
                  value={locationSearch}
                  onChange={(e) => {
                    setLocationSearch(e.target.value);
                    setPendingLocation(e.target.value);
                  }}
                  placeholder="Ej: Coronel, Santiago, Providencia..."
                  className={`w-full rounded-xl border py-3 pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 ${
                    isDarkMode
                      ? "bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-400"
                      : "bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400"
                  }`}
                />
              </div>

              <div className="max-h-44 overflow-auto space-y-2 mb-4">
                {locationSuggestions.length !== 0 ? (
                  locationSuggestions.map((city) => (
                    <button
                      key={city.name}
                      type="button"
                      onClick={() => {
                        setPendingLocation(city.name);
                        setLocationSearch(city.name);
                      }}
                      className={`w-full text-left px-4 py-3 rounded-xl transition-all ${
                        pendingLocation === city.name
                          ? isDarkMode
                            ? "bg-teal-700 text-white"
                            : "bg-teal-100 text-teal-900"
                          : isDarkMode
                            ? "bg-slate-800 text-slate-100 hover:bg-slate-700"
                            : "bg-blue-50 text-gray-800 hover:bg-blue-100"
                      }`}
                    >
                      {city.name}
                    </button>
                  ))
                ) : (
                  <p
                    className={`text-sm text-center py-4 ${isDarkMode ? "text-slate-400" : "text-gray-500"}`}
                  >
                    Sin coincidencias. Prueba otra comuna o ciudad.
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  if (pendingLocation.trim()) {
                    const selectedCity = chileLocationBase.find(
                      (city) =>
                        city.name.toLowerCase() ===
                        pendingLocation.trim().toLowerCase(),
                    );
                    setCurrentLocation(
                      selectedCity ?? {
                        name: pendingLocation.trim(),
                        lat: currentLocation.lat,
                        lng: currentLocation.lng,
                      },
                    );
                  }
                  setShowLocationModal(false);
                }}
                className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 text-white py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                Guardar ubicación
              </button>
            </div>
          </div>);
}
