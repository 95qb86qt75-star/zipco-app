import SearchResultCard from '../../cards/SearchResultCard';
import * as React from 'react';

import { Search } from "lucide-react";






import { canRunSearch } from "../../domain/searchConsistency";
import type { GlobalSearchScreenModel } from "../application/useGlobalSearchScreenController";
/** Canonical visual section; data and commands come from its screen controller. */
export default function SearchResults({model}:{model:Pick<GlobalSearchScreenModel,"filteredResults"|"formatDistance"|"isSearching"|"onSelectBusiness"|"onSelectService"|"searchError"|"searchQuery">}){
const {filteredResults,formatDistance,isSearching,onSelectBusiness,onSelectService,searchError,searchQuery}=model;
return (<div className="flex-1 overflow-auto px-4 pt-4 pb-24">
        <p className="text-sm text-gray-600 mb-4">
          {isSearching
            ? "Buscando negocios cercanos..."
            : !canRunSearch(searchQuery)
              ? "Escribe al menos 3 caracteres para buscar"
              : `${filteredResults.length} ${filteredResults.length === 1 ? "resultado encontrado" : "resultados encontrados"}`}
        </p>

        {searchError && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm mb-4">
            {searchError}
          </div>
        )}

        <div className="space-y-3">
          {filteredResults.map((result)=><SearchResultCard key={result.id} result={result} model={{formatDistance,onSelectBusiness,onSelectService}}/>)}
        </div>

        {!isSearching && filteredResults.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Search className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              No se encontraron resultados
            </h3>
            <p className="text-sm text-gray-600 text-center px-8">
              Intenta con otras palabras clave o ajusta los filtros
            </p>
          </div>
        )}
      </div>);
}
