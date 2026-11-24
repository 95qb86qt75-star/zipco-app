import { useEffect, useState, useCallback } from "react";

import { API_BASE_URL } from "../../../../../api/apiConfig";
import { showAppToast } from "../../../../../shared/notifications/Toast";












import { emptySchedule } from "../../domain/businessConfigData";
import { parseBusinessId } from "../../catalog/catalogValidation";
import useCatalogManager from "../../catalog/useCatalogManager";
import useLocationSuggestions from "../../location/useLocationSuggestions";
export const businessConfigContentPadding = (hasUnsavedChanges: boolean) =>
  hasUnsavedChanges ? "pb-40" : "pb-24";
export function useBusinessConfigScreenController({
  onBack,
  onSave,
  providerType,
}: {
  onBack: () => void;
  onSave: (config: any) => void;
  providerType?: "Negocio" | "Servicio";
}){

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


return {addKeyword,businessConfigContentPadding,catalog,category,fullAddress,handleBackPress,handleCategoryChange,handleFullAddressChange,handleOffersAtCustomerLocationChange,handleOffersOnSiteChange,handlePhysicalStoreChange,handleSave,handleScheduleChange,handleShowFullAddressChange,handleToggleOpen,hasLocationSearched,hasPhysicalStore,hasUnsavedChanges,isLocationLoading,isOpen,isTogglingOpen,keywordInput,keywords,latitude,locationSuggestions,locationTouched,longitude,offersAtCustomerLocation,offersOnSite,onBack,providerType,removeKeyword,schedule,selectLocationSuggestion,setHasLocationSearched,setKeywordInput,setLocationSuggestions,setLocationTouched,setShowCategoryModal,setShowScheduleEditor,setShowUnsavedModal,showCategoryModal,showFullAddress,showScheduleEditor,showUnsavedModal};
}
export type BusinessConfigScreenModel=ReturnType<typeof useBusinessConfigScreenController>;
