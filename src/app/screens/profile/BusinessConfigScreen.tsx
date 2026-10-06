import { useEffect, useState, useCallback } from "react";
import { ArrowLeft } from "lucide-react";
import { API_BASE_URL } from "../../api/apiConfig";
import { showAppToast } from "../Toast";
import CategoryPickerModal from "./business-config/CategoryPickerModal";
import CategorySelectionCard from "./business-config/CategorySelectionCard";
import KeywordsCard from "./business-config/KeywordsCard";
import LocalStatusCard from "./business-config/LocalStatusCard";
import LocationPrivacyCard from "./business-config/LocationPrivacyCard";
import PhysicalAttendanceCard from "./business-config/PhysicalAttendanceCard";
import ProductManagerCard from "./business-config/ProductManagerCard";
import SaveChangesBar from "./business-config/SaveChangesBar";
import ScheduleEditorScreen from "./business-config/ScheduleEditorScreen";
import ScheduleSummaryCard from "./business-config/ScheduleSummaryCard";
import ServiceAttendanceCard from "./business-config/ServiceAttendanceCard";
import UnsavedChangesModal from "./business-config/UnsavedChangesModal";
import {
  businessCategories,
  businessDays,
  emptySchedule,
} from "./business-config/businessConfigData";
import { parseBusinessId } from "./business-config/catalogValidation";
import useCatalogManager from "./business-config/useCatalogManager";
import useLocationSuggestions from "./business-config/useLocationSuggestions";

export const businessConfigContentPadding = (hasUnsavedChanges: boolean) =>
  hasUnsavedChanges ? "pb-40" : "pb-24";

export default function BusinessConfigScreen({
  onBack,
  onSave,
  providerType,
}: {
  onBack: () => void;
  onSave: (config: any) => void;
  providerType?: "Negocio" | "Servicio";
}) {
  const [category, setCategory] = useState("");
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState("");
  const [showFullAddress, setShowFullAddress] = useState(false);
  const [fullAddress, setFullAddress] = useState("");
  const [schedule, setSchedule] = useState(emptySchedule);
  const [showScheduleEditor, setShowScheduleEditor] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [hasPhysicalStore, setHasPhysicalStore] = useState(true);
  const [offersOnSite, setOffersOnSite] = useState<boolean | null>(null);
  const [offersAtCustomerLocation, setOffersAtCustomerLocation] = useState<
    boolean | null
  >(null);
  const [isOpen, setIsOpen] = useState(true);
  const [isTogglingOpen, setIsTogglingOpen] = useState(false);
  const businessId = parseBusinessId(localStorage.getItem("zipco-business-id"));
  const token = localStorage.getItem("zipco-token");
  const catalog = useCatalogManager(businessId, token);
  const providerLabel = providerType === "Servicio" ? "servicio" : "negocio";
  const {
    locationSuggestions,
    isLocationLoading,
    hasLocationSearched,
    locationTouched,
    latitude,
    longitude,
    setLocationTouched,
    setLocationSuggestions,
    setHasLocationSearched,
    setCoordinates,
    clearCoordinates,
    selectLocationSuggestion,
  } = useLocationSuggestions(fullAddress);

  const markChanged = useCallback(() => setHasUnsavedChanges(true), []);

  const handleCategoryChange = (val: string) => {
    setCategory(val);
    markChanged();
  };
  const handleFullAddressChange = (val: string) => {
    setFullAddress(val);
    clearCoordinates();
    markChanged();
  };
  const handleShowFullAddressChange = (val: boolean) => {
    setShowFullAddress(val);
    markChanged();
  };
  const handleScheduleChange = (val: any) => {
    setSchedule(val);
    markChanged();
  };
  const handlePhysicalStoreChange = (val: boolean) => {
    setHasPhysicalStore(val);
    markChanged();
  };
  const handleOffersOnSiteChange = (val: boolean) => {
    setOffersOnSite(val);
    markChanged();
  };
  const handleOffersAtCustomerLocationChange = (val: boolean) => {
    setOffersAtCustomerLocation(val);
    markChanged();
  };

  const addKeyword = (value: string) => {
    const nextKeyword = value.trim();
    if (!nextKeyword) return;
    setKeywords((currentKeywords) => {
      if (currentKeywords.includes(nextKeyword)) return currentKeywords;
      markChanged();
      return [...currentKeywords, nextKeyword];
    });
    setKeywordInput("");
  };

  const removeKeyword = (keywordToRemove: string) => {
    setKeywords((currentKeywords) => {
      markChanged();
      return currentKeywords.filter((keyword) => keyword !== keywordToRemove);
    });
  };

  const handleBackPress = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedModal(true);
    } else {
      onBack();
    }
  };

  const handleToggleOpen = async () => {
    const businessId = localStorage.getItem("zipco-business-id");
    const token = localStorage.getItem("zipco-token");
    if (!businessId || !token) return;

    setIsTogglingOpen(true);
    const newValue = !isOpen;

    try {
      const response = await fetch(`${API_BASE_URL}/businesses/${businessId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isOpen: newValue }),
      });

      if (!response.ok) {
        showAppToast("No se pudo actualizar el estado del local", "error");
        return;
      }

      setIsOpen(newValue);
      showAppToast(
        newValue
          ? "El local vuelve a usar el horario configurado"
          : "Local cerrado temporalmente",
        newValue ? "success" : "error",
      );
    } catch {
      showAppToast("No se pudo actualizar el estado del local", "error");
    } finally {
      setIsTogglingOpen(false);
    }
  };

  useEffect(() => {
    const businessId = localStorage.getItem("zipco-business-id");
    const token = localStorage.getItem("zipco-token");

    if (!businessId || !token) return;

    const parseSchedule = (value: any) => {
      if (!value) return emptySchedule;
      try {
        const parsedSchedule =
          typeof value === "string" ? JSON.parse(value) : value;
        return {
          ...emptySchedule,
          ...(parsedSchedule && typeof parsedSchedule === "object"
            ? parsedSchedule
            : {}),
        };
      } catch (error) {
        return emptySchedule;
      }
    };

    const loadBusinessConfig = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/businesses/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          showAppToast(
            `No se pudo cargar la configuración del ${providerLabel}`,
            "error",
          );
          return;
        }

        const data = await response.json();
        const businesses = Array.isArray(data)
          ? data
          : (data.businesses ?? data.results ?? []);
        const business = businesses.find(
          (candidate: any) =>
            String(candidate.id ?? candidate._id) === String(businessId),
        );

        if (!business) {
          showAppToast(
            `No se pudo cargar la configuración del ${providerLabel}`,
            "error",
          );
          return;
        }
        const loadedKeywords = business.keywords;

        setCategory(business.category ?? "");
        setKeywords(
          Array.isArray(loadedKeywords)
            ? loadedKeywords
                .map((keyword) => String(keyword).trim())
                .filter(Boolean)
            : String(loadedKeywords ?? "")
                .split(",")
                .map((keyword) => keyword.trim())
                .filter(Boolean),
        );
        setSchedule(parseSchedule(business.schedule));
        setFullAddress(business.address ?? "");
        setCoordinates(
          business.latitude ?? business.lat,
          business.longitude ?? business.lng ?? business.lon,
        );
        const savedPhysicalStore = localStorage.getItem(
          `zipco-business-${businessId}-has-physical-store`,
        );
        setHasPhysicalStore(
          savedPhysicalStore === null
            ? (business.hasPhysicalStore ?? business.has_physical_store ?? true)
            : savedPhysicalStore === "true",
        );
        setIsOpen(business.isOpen !== false);
        setOffersOnSite(
          typeof business.offersOnSite === "boolean"
            ? business.offersOnSite
            : null,
        );
        setOffersAtCustomerLocation(
          typeof business.offersAtCustomerLocation === "boolean"
            ? business.offersAtCustomerLocation
            : null,
        );
        setHasUnsavedChanges(false);
      } catch (error) {
        showAppToast(
          `No se pudo cargar la configuración del ${providerLabel}`,
          "error",
        );
      }
    };

    loadBusinessConfig();
  }, []);

  const handleSave = async (shouldExitAfterSave = false) => {
    const businessId = localStorage.getItem("zipco-business-id");
    const token = localStorage.getItem("zipco-token");

    if (!businessId || !token) {
      showAppToast(
        `No se pudo guardar la configuración del ${providerLabel}`,
        "error",
      );
      return;
    }

    if (
      providerType === "Servicio" &&
      (offersOnSite === null || offersAtCustomerLocation === null)
    ) {
      showAppToast(
        "Confirma si ofreces atención presencial y servicio a domicilio.",
        "error",
      );
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/businesses/${businessId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          category,
          keywords: keywords.join(", "),
          schedule: JSON.stringify(schedule),
          address: fullAddress,
          latitude,
          longitude,
          offersOnSite,
          offersAtCustomerLocation,
        }),
      });

      if (!response.ok) {
        showAppToast(
          `No se pudo guardar la configuración del ${providerLabel}`,
          "error",
        );
        return;
      }

      onSave({
        category,
        hashtags: keywords,
        showFullAddress,
        fullAddress,
        latitude,
        longitude,
        schedule,
        hasPhysicalStore,
        offersOnSite,
        offersAtCustomerLocation,
      });
      localStorage.setItem(
        `zipco-business-${businessId}-has-physical-store`,
        String(hasPhysicalStore),
      );
      setHasUnsavedChanges(false);
      showAppToast(
        `Configuración del ${providerLabel} actualizada correctamente`,
        "success",
      );
      if (shouldExitAfterSave) {
        onBack();
      }
    } catch (error) {
      showAppToast(
        `No se pudo guardar la configuración del ${providerLabel}`,
        "error",
      );
    }
  };

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
