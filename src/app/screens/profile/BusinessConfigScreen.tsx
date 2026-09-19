import { useEffect, useState, useCallback } from 'react';
import { ArrowLeft } from 'lucide-react';
import { API_BASE_URL } from '../../api/apiConfig';
import { showAppToast } from '../Toast';
import CategoryPickerModal from './business-config/CategoryPickerModal';
import CategorySelectionCard from './business-config/CategorySelectionCard';
import KeywordsCard from './business-config/KeywordsCard';
import LocalStatusCard from './business-config/LocalStatusCard';
import LocationPrivacyCard from './business-config/LocationPrivacyCard';
import PhysicalAttendanceCard from './business-config/PhysicalAttendanceCard';
import ProductManagerCard from './business-config/ProductManagerCard';
import SaveChangesBar from './business-config/SaveChangesBar';
import ScheduleCard from './business-config/ScheduleCard';
import UnsavedChangesModal from './business-config/UnsavedChangesModal';
import { businessCategories, businessDays, emptySchedule } from './business-config/businessConfigData';
import { parseBusinessId } from './business-config/catalogValidation';
import useCatalogManager from './business-config/useCatalogManager';
import useLocationSuggestions from './business-config/useLocationSuggestions';

export const businessConfigContentPadding = (hasUnsavedChanges: boolean) =>
  hasUnsavedChanges ? 'pb-40' : 'pb-24';

export default function BusinessConfigScreen({
  onBack,
  onSave
}: {
  onBack: () => void;
  onSave: (config: any) => void;
}) {
  const [category, setCategory] = useState('');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState('');
  const [showFullAddress, setShowFullAddress] = useState(false);
  const [fullAddress, setFullAddress] = useState('');
  const [schedule, setSchedule] = useState(emptySchedule);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [hasPhysicalStore, setHasPhysicalStore] = useState(true);
  const [isOpen, setIsOpen] = useState(true);
  const [isTogglingOpen, setIsTogglingOpen] = useState(false);
  const businessId = parseBusinessId(localStorage.getItem('zipco-business-id'));
  const token = localStorage.getItem('zipco-token');
  const catalog = useCatalogManager(businessId, token);
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
    selectLocationSuggestion
  } = useLocationSuggestions(fullAddress);

  const markChanged = useCallback(() => setHasUnsavedChanges(true), []);

  const handleCategoryChange = (val: string) => { setCategory(val); markChanged(); };
  const handleFullAddressChange = (val: string) => { setFullAddress(val); clearCoordinates(); markChanged(); };
  const handleShowFullAddressChange = (val: boolean) => { setShowFullAddress(val); markChanged(); };
  const handleScheduleChange = (val: any) => { setSchedule(val); markChanged(); };
  const handlePhysicalStoreChange = (val: boolean) => { setHasPhysicalStore(val); markChanged(); };

  const addKeyword = (value: string) => {
    const nextKeyword = value.trim();
    if (!nextKeyword) return;
    setKeywords((currentKeywords) => {
      if (currentKeywords.includes(nextKeyword)) return currentKeywords;
      markChanged();
      return [...currentKeywords, nextKeyword];
    });
    setKeywordInput('');
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
    const businessId = localStorage.getItem('zipco-business-id');
    const token = localStorage.getItem('zipco-token');
    if (!businessId || !token) return;

    setIsTogglingOpen(true);
    const newValue = !isOpen;

    try {
      const response = await fetch(`${API_BASE_URL}/businesses/${businessId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ isOpen: newValue })
      });

      if (!response.ok) {
        showAppToast('No se pudo actualizar el estado del local', 'error');
        return;
      }

      setIsOpen(newValue);
      showAppToast(
        newValue ? 'El local vuelve a usar el horario configurado' : 'Local cerrado temporalmente',
        newValue ? 'success' : 'error'
      );
    } catch {
      showAppToast('No se pudo actualizar el estado del local', 'error');
    } finally {
      setIsTogglingOpen(false);
    }
  };

  useEffect(() => {
    const businessId = localStorage.getItem('zipco-business-id');
    const token = localStorage.getItem('zipco-token');

    if (!businessId || !token) return;

    const parseSchedule = (value: any) => {
      if (!value) return emptySchedule;
      try {
        const parsedSchedule = typeof value === 'string' ? JSON.parse(value) : value;
        return {
          ...emptySchedule,
          ...(parsedSchedule && typeof parsedSchedule === 'object' ? parsedSchedule : {})
        };
      } catch (error) {
        return emptySchedule;
      }
    };

    const loadBusinessConfig = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/businesses/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.ok) {
          showAppToast('No se pudo cargar la configuracion del negocio', 'error');
          return;
        }

        const data = await response.json();
        const businesses = Array.isArray(data) ? data : data.businesses ?? data.results ?? [];
        const business = businesses.find((candidate: any) => String(candidate.id ?? candidate._id) === String(businessId));

        if (!business) {
          showAppToast('No se pudo cargar la configuracion del negocio', 'error');
          return;
        }
        const loadedKeywords = business.keywords;

        setCategory(business.category ?? '');
        setKeywords(
          Array.isArray(loadedKeywords)
            ? loadedKeywords.map((keyword) => String(keyword).trim()).filter(Boolean)
            : String(loadedKeywords ?? '').split(',').map((keyword) => keyword.trim()).filter(Boolean)
        );
        setSchedule(parseSchedule(business.schedule));
        setFullAddress(business.address ?? '');
        setCoordinates(
          business.latitude ?? business.lat,
          business.longitude ?? business.lng ?? business.lon
        );
        const savedPhysicalStore = localStorage.getItem(`zipco-business-${businessId}-has-physical-store`);
        setHasPhysicalStore(
          savedPhysicalStore === null
            ? business.hasPhysicalStore ?? business.has_physical_store ?? true
            : savedPhysicalStore === 'true'
        );
        setIsOpen(business.isOpen !== false);
        setHasUnsavedChanges(false);
      } catch (error) {
        showAppToast('No se pudo cargar la configuracion del negocio', 'error');
      }
    };

    loadBusinessConfig();
  }, []);

  const handleSave = async (shouldExitAfterSave = false) => {
    const businessId = localStorage.getItem('zipco-business-id');
    const token = localStorage.getItem('zipco-token');

    if (!businessId || !token) {
      showAppToast('No se pudo guardar la configuracion del negocio', 'error');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/businesses/${businessId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          category,
          keywords: keywords.join(', '),
          schedule: JSON.stringify(schedule),
          address: fullAddress,
          latitude,
          longitude
        })
      });

      if (!response.ok) {
        showAppToast('No se pudo guardar la configuracion del negocio', 'error');
        return;
      }

      onSave({ category, hashtags: keywords, showFullAddress, fullAddress, latitude, longitude, schedule, hasPhysicalStore });
      localStorage.setItem(`zipco-business-${businessId}-has-physical-store`, String(hasPhysicalStore));
      setHasUnsavedChanges(false);
      showAppToast('Configuracion del negocio actualizada correctamente', 'success');
      if (shouldExitAfterSave) {
        onBack();
      }
    } catch (error) {
      showAppToast('No se pudo guardar la configuracion del negocio', 'error');
    }
  };

  return (
    <div className="size-full relative flex flex-col bg-[#F0F4FF]">
      <div
        className="px-4 pb-4 border-b border-white/50"
        style={{ paddingTop: 'max(1.5rem, env(safe-area-inset-top))' }}
      >
        <div className="flex items-center gap-3 mb-3">
          <button onClick={handleBackPress} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h2 className="text-xl font-bold text-gray-900">Configuracion de Negocio</h2>
        </div>

      </div>

      <div className={`min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-4 pt-4 ${businessConfigContentPadding(hasUnsavedChanges)}`}>
        {hasPhysicalStore && (
          <LocalStatusCard isUsingSchedule={isOpen} isLoading={isTogglingOpen} onToggle={handleToggleOpen} />
        )}
        <PhysicalAttendanceCard hasPhysicalStore={hasPhysicalStore} onChange={handlePhysicalStoreChange} />
        <CategorySelectionCard
          category={category}
          categories={businessCategories}
          onOpenCategoryModal={() => setShowCategoryModal(true)}
        />
        <KeywordsCard
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
          setLocationTouched={setLocationTouched}
          setLocationSuggestions={setLocationSuggestions}
          setHasLocationSearched={setHasLocationSearched}
          onSelectLocationSuggestion={selectLocationSuggestion}
        />
        <ScheduleCard days={businessDays} schedule={schedule} setSchedule={handleScheduleChange} />
        <ProductManagerCard catalog={catalog} />
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

      <SaveChangesBar hasUnsavedChanges={hasUnsavedChanges} onSave={() => handleSave(false)} />
    </div>
  );
}
