import BusinessResultCard from '../cards/BusinessResultCard';
import * as React from 'react';






import type { NegociosScreenModel } from "../application/useNegociosScreenController";
/** Canonical visual section; data and commands come from its screen controller. */
export default function BusinessResultsSection({model}:{model:Pick<NegociosScreenModel,"filteredResults"|"formatDistance"|"onScrollTopChange"|"onSelectBusiness"|"resultsRef">}){
const {filteredResults,formatDistance,onScrollTopChange,onSelectBusiness,resultsRef}=model;
return (<div ref={resultsRef} onScroll={(event) => onScrollTopChange(event.currentTarget.scrollTop)} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-2">
        <p className="text-sm text-gray-600 mb-4">{filteredResults.length} resultados cerca de ti</p>

        <div className="space-y-3 pb-6">
          {filteredResults.map((result)=><BusinessResultCard key={result.id} result={result} model={{formatDistance,onSelectBusiness}}/>)}
        </div>
      </div>);
}
