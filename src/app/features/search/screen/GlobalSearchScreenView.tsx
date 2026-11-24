import * as React from 'react';
import SearchHeader from './components/SearchHeader';
import SearchDistanceDialog from './components/SearchDistanceDialog';
import SearchResults from './components/SearchResults';




import BottomNav from "../../../shared/navigation/BottomNav";




import type {GlobalSearchScreenModel} from './application/useGlobalSearchScreenController';
export default function GlobalSearchScreenView({model}:{model:GlobalSearchScreenModel}){
const {activeTab,fetchNearbyBusinesses,filteredResults,filters,formatDistance,isSearching,maxDistance,onBack,onFilterChange,onMaxDistanceChange,onQueryChange,onSelectBusiness,onSelectService,searchError,searchQuery,searchQueryRef,selectedFilter,setActiveTab,setMaxDistance,setSearchQuery,setSelectedFilter,setShowDistanceModal,showDistanceModal}=model;
return (
    <div className="zipco-theme-surface size-full bg-gradient-to-b from-white via-blue-50/30 to-blue-100/40 flex flex-col">
      {/* Header */}
      <SearchHeader model={{fetchNearbyBusinesses,filters,maxDistance,onBack,onFilterChange,onQueryChange,searchQuery,searchQueryRef,selectedFilter,setSearchQuery,setSelectedFilter,setShowDistanceModal}}/>

      {/* Distance Modal */}
      {showDistanceModal && (
        <SearchDistanceDialog model={{fetchNearbyBusinesses,maxDistance,onMaxDistanceChange,searchQuery,setMaxDistance,setShowDistanceModal}}/>
      )}

      {/* Results */}
      <SearchResults model={{filteredResults,formatDistance,isSearching,onSelectBusiness,onSelectService,searchError,searchQuery}}/>

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );

}
