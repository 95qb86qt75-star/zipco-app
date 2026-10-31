import * as React from 'react';
import { MapPin, Store, Wrench } from "lucide-react";
import { ImageWithFallback } from "../../../components/figma/ImageWithFallback";
import DistanceInfo from "../../../shared/location/DistanceInfo";

import type { GlobalSearchScreenModel } from "../screen/application/useGlobalSearchScreenController";
/** Canonical visual section; data and commands come from its screen controller. */
/** Complete visual card; preserves the list's commands and data. */
export default function SearchResultCard({model,result}:{model:Pick<GlobalSearchScreenModel,"formatDistance"|"onSelectBusiness"|"onSelectService">;result:GlobalSearchScreenModel["filteredResults"][number]}){
const {formatDistance,onSelectBusiness,onSelectService}=model;

            const isNegocio = result.category === "negocios";
            const CardIcon = isNegocio ? Store : Wrench;

            return (
              <div
                key={result.id}
                onClick={() => {
                  if (isNegocio) {
                    onSelectBusiness(result);
                    return;
                  }
                  onSelectService(result);
                }}
                className={`backdrop-blur-sm rounded-2xl overflow-hidden shadow-[0_8px_24px_rgba(15,23,42,0.08)] hover:shadow-xl transition-all cursor-pointer border ${
                  isNegocio
                    ? "bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200"
                    : "bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200"
                }`}
              >
                <div className="flex items-start gap-3 p-4">
                  <div className="relative">
                    <ImageWithFallback
                      src={result.image}
                      alt={result.name}
                      className="w-20 h-20 rounded-xl object-cover"
                    />
                    <div
                      className={`absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center shadow-md ${
                        isNegocio
                          ? "bg-gradient-to-br from-amber-500 to-orange-500"
                          : "bg-gradient-to-br from-indigo-500 to-purple-500"
                      }`}
                    >
                      <CardIcon
                        className="w-3.5 h-3.5 text-white"
                        strokeWidth={2.5}
                      />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-bold text-gray-900 text-sm leading-tight">
                        {result.name}
                      </h3>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${
                          isNegocio
                            ? "bg-orange-500 text-white"
                            : "bg-purple-500 text-white"
                        }`}
                      >
                        {isNegocio ? "Negocio" : "Servicio"}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                      {result.description}
                    </p>
                    <div className="flex items-center gap-2 text-xs flex-wrap">
                      <div className="flex items-center gap-1 text-gray-600">
                        <MapPin className="w-3 h-3" />
                        <span>{formatDistance(result.distance)}</span>
                        <DistanceInfo />
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full font-medium ${
                          result.type === "Negocio"
                            ? "bg-sky-600 text-white"
                            : "bg-emerald-600 text-white"
                        }`}
                      >
                        {result.type}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full font-semibold ${
                          result.isOpen
                            ? "bg-green-500 text-white"
                            : "bg-red-500 text-white"
                        }`}
                      >
                        {result.isOpen ? "Abierto" : "Cerrado"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );

}
