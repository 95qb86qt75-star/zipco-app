import * as React from 'react';
import { MapPin, Store } from 'lucide-react';
import { ImageWithFallback } from "../../../../components/figma/ImageWithFallback";
import DistanceInfo from "../../../../shared/location/DistanceInfo";
import type { NegociosScreenModel } from "../application/useNegociosScreenController";
/** Canonical visual section; data and commands come from its screen controller. */
/** Complete visual card; preserves the list's commands and data. */
export default function BusinessResultCard({model,result}:{model:Pick<NegociosScreenModel,"formatDistance"|"onSelectBusiness">;result:NegociosScreenModel["filteredResults"][number]}){
const {formatDistance,onSelectBusiness}=model;
return (<div
              key={result.id}
              onClick={() => onSelectBusiness(result)}
              className="cursor-pointer overflow-hidden rounded-2xl border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 shadow-lg transition-all hover:shadow-xl"
            >
              <div className="flex items-start gap-3 p-4">
                <div className="relative shrink-0">
                  <ImageWithFallback
                    src={result.image}
                    alt={result.name}
                    className="h-20 w-20 rounded-xl object-cover"
                  />
                  <div className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg">
                    <Store className="h-4 w-4 text-white" strokeWidth={2.5} />
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-start justify-between gap-2">
                    <h3 className="text-sm font-bold leading-tight text-gray-900">{result.name}</h3>
                    <span className="whitespace-nowrap rounded-full bg-orange-500 px-2 py-0.5 text-xs font-semibold text-white">
                      Negocio
                    </span>
                  </div>
                  <p className="mb-2 line-clamp-2 text-xs text-gray-600">{result.description}</p>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <div className="flex items-center gap-1 text-gray-600">
                      <MapPin className="h-3 w-3" />
                      <span>{formatDistance(result.distance)}</span>
                      <DistanceInfo />
                    </div>
                    <span className={`rounded-full px-2 py-0.5 font-medium ${
                      result.type === 'Negocio' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {result.type}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 font-semibold text-white ${result.isOpen ? 'bg-green-500' : 'bg-red-500'}`}>
                      {result.isOpen ? 'Abierto' : 'Cerrado'}
                    </span>
                  </div>
                </div>
              </div>
            </div>);
}
