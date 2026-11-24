import * as React from 'react';
import BusinessesSearchHeader from './components/BusinessesSearchHeader';
import BusinessDistanceDialog from './components/BusinessDistanceDialog';
import BusinessResultsSection from './components/BusinessResultsSection';



import BottomNav from "../../../shared/navigation/BottomNav";


import type {NegociosScreenModel} from './application/useNegociosScreenController';
export default function NegociosScreenView({model}:{model:NegociosScreenModel}){
const {activeTab,filteredResults,filters,formatDistance,maxDistance,onBack,onFilterChange,onMaxDistanceChange,onQueryChange,onScrollTopChange,onSelectBusiness,resultsRef,searchQuery,selectedFilter,setActiveTab,setMaxDistance,setSearchQuery,setSelectedFilter,setShowDistanceModal,showDistanceModal}=model;
return (
    <div className="zipco-theme-surface size-full min-h-0 bg-gradient-to-b from-white via-blue-50/30 to-blue-100/40 flex flex-col overflow-hidden">
      {/* Header */}
      <BusinessesSearchHeader model={{filters,maxDistance,onBack,onFilterChange,onQueryChange,searchQuery,selectedFilter,setSearchQuery,setSelectedFilter,setShowDistanceModal}}/>

      {/* Distance Modal */}
      {showDistanceModal && (
        <BusinessDistanceDialog model={{maxDistance,onMaxDistanceChange,setMaxDistance,setShowDistanceModal}}/>
      )}

      {/* Results */}
      <BusinessResultsSection model={{filteredResults,formatDistance,onScrollTopChange,onSelectBusiness,resultsRef}}/>

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );

}
