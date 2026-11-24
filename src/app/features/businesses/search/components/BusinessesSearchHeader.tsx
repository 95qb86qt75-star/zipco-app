import * as React from 'react';

import { ArrowLeft, Mic, Search } from 'lucide-react';



import { isSearchFilterActive } from "../../../search/domain/searchConsistency";
import type { NegociosScreenModel } from "../application/useNegociosScreenController";
/** Canonical visual section; data and commands come from its screen controller. */
export default function BusinessesSearchHeader({model}:{model:Pick<NegociosScreenModel,"filters"|"maxDistance"|"onBack"|"onFilterChange"|"onQueryChange"|"searchQuery"|"selectedFilter"|"setSearchQuery"|"setSelectedFilter"|"setShowDistanceModal">}){
const {filters,maxDistance,onBack,onFilterChange,onQueryChange,searchQuery,selectedFilter,setSearchQuery,setSelectedFilter,setShowDistanceModal}=model;
return (<div
        className="px-4 pb-0 border-b border-white/50"
        style={{ paddingTop: 'max(1.5rem, env(safe-area-inset-top))' }}
      >
        <div className="flex items-center gap-3 mb-4">
          <button onClick={onBack} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                onQueryChange(e.target.value);
              }}
              placeholder="Ej: tortas, gasfiter, clases de inglés..."
              className="w-full bg-gray-50 border border-gray-200 rounded-full py-2.5 pl-11 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
            />
            <button className="absolute inset-y-0 right-4 flex items-center">
              <Mic className="w-4 h-4 text-gray-400 hover:text-teal-600 transition-colors" />
            </button>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-1 pb-1">
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => {
                if (filter.id === 'distance') {
                  setShowDistanceModal(true);
                } else {
                  setSelectedFilter(filter.id);
                  onFilterChange(filter.id);
                }
              }}
              className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                isSearchFilterActive(filter.id, selectedFilter, maxDistance)
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 ring-1 ring-gray-200 shadow-sm hover:bg-gray-200'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>);
}
