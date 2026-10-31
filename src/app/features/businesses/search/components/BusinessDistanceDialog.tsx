import * as React from 'react';






import type { NegociosScreenModel } from "../application/useNegociosScreenController";
/** Canonical visual section; data and commands come from its screen controller. */
export default function BusinessDistanceDialog({model}:{model:Pick<NegociosScreenModel,"maxDistance"|"onMaxDistanceChange"|"setMaxDistance"|"setShowDistanceModal">}){
const {maxDistance,onMaxDistanceChange,setMaxDistance,setShowDistanceModal}=model;
return (<div className="absolute inset-0 bg-black/50 flex items-end z-50" onClick={() => setShowDistanceModal(false)}>
          <div className="bg-white rounded-t-3xl p-6 w-full" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-6"></div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Ajustar distancia</h3>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-600">Distancia máxima</span>
                <span className="text-2xl font-bold text-teal-600">{maxDistance} km</span>
              </div>

              {/* Slider */}
              <div className="relative py-2">
                <input
                  type="range"
                  min="0.5"
                  max="10"
                  step="0.5"
                  value={maxDistance}
                  onChange={(e) => {
                    const distance = parseFloat(e.target.value);
                    setMaxDistance(distance);
                    onMaxDistanceChange(distance);
                  }}
                  style={{
                    background: `linear-gradient(to right, #14b8a6 0%, #14b8a6 ${((maxDistance - 0.5) / 9.5) * 100}%, #e5e7eb ${((maxDistance - 0.5) / 9.5) * 100}%, #e5e7eb 100%)`
                  }}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer slider-custom"
                />
              </div>

              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>0.5 km</span>
                <span>10 km</span>
              </div>
            </div>

            {/* Quick presets */}
            <div className="grid grid-cols-4 gap-2 mb-6">
              {[1, 2, 5, 10].map((km) => (
                <button
                  key={km}
                  onClick={() => {
                    setMaxDistance(km);
                    onMaxDistanceChange(km);
                  }}
                  className={`py-2 rounded-full text-sm font-medium transition-all ${
                    maxDistance === km
                      ? 'bg-teal-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {km} km
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowDistanceModal(false)}
              className="w-full bg-teal-500 text-white py-3 rounded-full font-semibold hover:bg-teal-600 transition-colors"
            >
              Aplicar
            </button>
          </div>
        </div>);
}
