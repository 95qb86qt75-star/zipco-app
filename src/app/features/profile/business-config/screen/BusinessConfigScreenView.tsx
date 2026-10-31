import * as React from 'react';

import { ArrowLeft } from "lucide-react";

import { showAppToast } from "../../../../shared/notifications/Toast";
import CategoryPickerModal from "../classification/CategoryPickerModal";
import CategorySelectionCard from "../classification/CategorySelectionCard";
import KeywordsCard from "../classification/KeywordsCard";
import LocalStatusCard from "../attendance/LocalStatusCard";
import LocationPrivacyCard from "../location/LocationPrivacyCard";
import PhysicalAttendanceCard from "../attendance/PhysicalAttendanceCard";
import ProductManagerCard from "../catalog/ProductManagerCard";
import SaveChangesBar from "../shared/SaveChangesBar";
import ScheduleEditorScreen from "../schedule/ScheduleEditorScreen";
import ScheduleSummaryCard from "../schedule/ScheduleSummaryCard";
import ServiceAttendanceCard from "../attendance/ServiceAttendanceCard";
import UnsavedChangesModal from "../shared/UnsavedChangesModal";
import { businessCategories, businessDays } from "../domain/businessConfigData";



import type {BusinessConfigScreenModel} from './application/useBusinessConfigScreenController';
export default function BusinessConfigScreenView({model}:{model:BusinessConfigScreenModel}){
const {addKeyword,businessConfigContentPadding,catalog,category,fullAddress,handleBackPress,handleCategoryChange,handleFullAddressChange,handleOffersAtCustomerLocationChange,handleOffersOnSiteChange,handlePhysicalStoreChange,handleSave,handleScheduleChange,handleShowFullAddressChange,handleToggleOpen,hasLocationSearched,hasPhysicalStore,hasUnsavedChanges,isLocationLoading,isOpen,isTogglingOpen,keywordInput,keywords,latitude,locationSuggestions,locationTouched,longitude,offersAtCustomerLocation,offersOnSite,onBack,providerType,removeKeyword,schedule,selectLocationSuggestion,setHasLocationSearched,setKeywordInput,setLocationSuggestions,setLocationTouched,setShowCategoryModal,setShowScheduleEditor,setShowUnsavedModal,showCategoryModal,showFullAddress,showScheduleEditor,showUnsavedModal}=model;
if (showScheduleEditor) {
    return (
      <ScheduleEditorScreen
        days={businessDays}
        initialSchedule={schedule}
        onCancel={() => setShowScheduleEditor(false)}
        onApply={(nextSchedule) => {
          handleScheduleChange(nextSchedule);
          setShowScheduleEditor(false);
          showAppToast(
            "Horarios preparados. Guarda los cambios para confirmar.",
            "success",
          );
        }}
      />
    );
  }

  return (
    <div className="relative flex size-full flex-col bg-[#F0F4FF] dark:bg-slate-950">
      <div
        className="border-b border-white/50 bg-white/65 px-4 pb-4 backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/95"
        style={{ paddingTop: "max(1.5rem, env(safe-area-inset-top))" }}
      >
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={handleBackPress}
            className="-ml-2 rounded-full p-2 transition-colors hover:bg-gray-100 dark:hover:bg-slate-800"
          >
            <ArrowLeft className="h-5 w-5 text-gray-700 dark:text-slate-100" />
          </button>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Configuración de{" "}
            {providerType === "Servicio" ? "Servicio" : "Negocio"}
          </h2>
        </div>
      </div>

      <div
        className={`min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-4 pt-4 ${businessConfigContentPadding(hasUnsavedChanges)}`}
      >
        {providerType !== "Servicio" && hasPhysicalStore && (
          <LocalStatusCard
            isUsingSchedule={isOpen}
            isLoading={isTogglingOpen}
            onToggle={handleToggleOpen}
          />
        )}
        {providerType === "Servicio" ? (
          <>
            <ServiceAttendanceCard
              kind="on-site"
              value={offersOnSite}
              onChange={handleOffersOnSiteChange}
            />
            <ServiceAttendanceCard
              kind="at-customer-location"
              value={offersAtCustomerLocation}
              onChange={handleOffersAtCustomerLocationChange}
            />
            {offersOnSite === false && offersAtCustomerLocation === false && (
              <p className="mb-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-medium text-amber-700">
                Tu servicio no tiene una modalidad de atención disponible.
                Activa al menos una para poder publicarlo.
              </p>
            )}
          </>
        ) : (
          <PhysicalAttendanceCard
            hasPhysicalStore={hasPhysicalStore}
            onChange={handlePhysicalStoreChange}
          />
        )}
        <CategorySelectionCard
          providerType={providerType === "Servicio" ? "Servicio" : "Negocio"}
          category={category}
          categories={businessCategories}
          onOpenCategoryModal={() => setShowCategoryModal(true)}
        />
        <KeywordsCard
          providerType={providerType === "Servicio" ? "Servicio" : "Negocio"}
          keywords={keywords}
          keywordInput={keywordInput}
          setKeywordInput={setKeywordInput}
          addKeyword={addKeyword}
          removeKeyword={removeKeyword}
        />
        <LocationPrivacyCard
          fullAddress={fullAddress}
          setFullAddress={handleFullAddressChange}
          showFullAddress={showFullAddress}
          setShowFullAddress={handleShowFullAddressChange}
          locationSuggestions={locationSuggestions}
          isLocationLoading={isLocationLoading}
          hasLocationSearched={hasLocationSearched}
          locationTouched={locationTouched}
          isLocationConfirmed={Boolean(
            fullAddress.trim() && latitude !== null && longitude !== null,
          )}
          setLocationTouched={setLocationTouched}
          setLocationSuggestions={setLocationSuggestions}
          setHasLocationSearched={setHasLocationSearched}
          onSelectLocationSuggestion={selectLocationSuggestion}
        />
        <ScheduleSummaryCard
          days={businessDays}
          schedule={schedule}
          onEdit={() => setShowScheduleEditor(true)}
        />
        <ProductManagerCard
          catalog={catalog}
          providerType={providerType === "Servicio" ? "Servicio" : "Negocio"}
        />
      </div>

      {/* Modal cambios sin guardar */}
      {showUnsavedModal && (
        <UnsavedChangesModal
          onSaveAndExit={() => handleSave(true)}
          onExitWithoutSaving={onBack}
          onContinueEditing={() => setShowUnsavedModal(false)}
        />
      )}
      {showCategoryModal && (
        <CategoryPickerModal
          category={category}
          categories={businessCategories}
          onSelectCategory={(selectedCategory) => {
            handleCategoryChange(selectedCategory);
            setShowCategoryModal(false);
          }}
          onClose={() => setShowCategoryModal(false)}
        />
      )}

      <SaveChangesBar
        hasUnsavedChanges={hasUnsavedChanges}
        onSave={() => handleSave(false)}
      />
    </div>
  );

}
