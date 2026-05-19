import { useEffect, useState, useCallback } from 'react';
import { ArrowLeft } from 'lucide-react';
import { showAppToast } from '../Toast';
import CategoryPickerModal from './business-config/CategoryPickerModal';
import CategorySelectionCard from './business-config/CategorySelectionCard';
import KeywordsCard from './business-config/KeywordsCard';
import LocationPrivacyCard from './business-config/LocationPrivacyCard';
import ScheduleCard from './business-config/ScheduleCard';
import { businessCategories, businessDays, emptySchedule } from './business-config/businessConfigData';

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
  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([]);
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const [hasLocationSearched, setHasLocationSearched] = useState(false);
  const [locationTouched, setLocationTouched] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);

  const markChanged = useCallback(() => setHasUnsavedChanges(true), []);

  const handleCategoryChange = (val: string) => { setCategory(val); markChanged(); };
  const handleFullAddressChange = (val: string) => { setFullAddress(val); markChanged(); };
  const handleShowFullAddressChange = (val: boolean) => { setShowFullAddress(val); markChanged(); };
  const handleScheduleChange = (val: any) => { setSchedule(val); markChanged(); };

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
        const response = await fetch(`http://localhost:3000/businesses/${businessId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.ok) {
          showAppToast('No se pudo cargar la configuracion del negocio', 'error');
          return;
        }

        const data = await response.json();
        const business = data.business ?? data;
        const loadedKeywords = business.keywords;

        setCategory(business.category ?? '');
        setKeywords(
          Array.isArray(loadedKeywords)
            ? loadedKeywords.map((keyword) => String(keyword).trim()).filter(Boolean)
            : String(loadedKeywords ?? '').split(',').map((keyword) => keyword.trim()).filter(Boolean)
        );
        setSchedule(parseSchedule(business.schedule));
        setFullAddress(business.address ?? '');
        setHasUnsavedChanges(false);
      } catch (error) {
        showAppToast('No se pudo cargar la configuracion del negocio', 'error');
      }
    };

    loadBusinessConfig();
  }, []);

  useEffect(() => {
    const query = fullAddress.trim();
    if (!locationTouched || query.length < 3) {
      setLocationSuggestions([]);
      setIsLocationLoading(false);
      setHasLocationSearched(false);
      return;
    }

    setIsLocationLoading(true);
    setHasLocationSearched(false);

    const timeout = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}+Chile&format=json&limit=5&countrycodes=cl`
        );
        const data = await response.json();
        setLocationSuggestions(Array.isArray(data) ? data : []);
      } catch {
        setLocationSuggestions([]);
      } finally {
        setIsLocationLoading(false);
        setHasLocationSearched(true);
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [fullAddress, locationTouched]);

  const handleSave = async (shouldExitAfterSave = false) => {
    const businessId = localStorage.getItem('zipco-business-id');
    const token = localStorage.getItem('zipco-token');

    if (!businessId || !token) {
      showAppToast('No se pudo guardar la configuracion del negocio', 'error');
      return;
    }

    try {
      const response = await fetch(`http://localhost:3000/businesses/${businessId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          category,
          keywords: keywords.join(', '),
          schedule: JSON.stringify(schedule),
          address: fullAddress
        })
      });

      if (!response.ok) {
        showAppToast('No se pudo guardar la configuracion del negocio', 'error');
        return;
      }

      onSave({ category, hashtags: keywords, showFullAddress, fullAddress, schedule });
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
      {/* Header */}
      <div className="px-4 pt-6 pb-4 border-b border-white/50">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={handleBackPress} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h2 className="text-xl font-bold text-gray-900">Configuracion de Negocio</h2>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-4 pt-4 pb-40">
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
        />
        <ScheduleCard days={businessDays} schedule={schedule} setSchedule={handleScheduleChange} />
      </div>

      {/* Modal cambios sin guardar */}
      {showUnsavedModal && (
        <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center px-6">
          <div className="bg-white rounded-2xl p-6 w-full shadow-xl">
            <h3 className="font-bold text-gray-900 text-lg mb-2">¿Salir sin guardar?</h3>
            <p className="text-sm text-gray-500 mb-5">Tienes cambios sin guardar. Si sales ahora se perderán.</p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => handleSave(true)}
                className="w-full py-3 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-xl font-semibold text-white transition-all"
              >
                Guardar y salir
              </button>
              <button
                onClick={onBack}
                className="w-full py-3 bg-red-50 rounded-xl font-semibold text-red-500 transition-all"
              >
                Salir sin guardar
              </button>
              <button
                onClick={() => setShowUnsavedModal(false)}
                className="w-full py-3 bg-gray-100 rounded-xl font-semibold text-gray-700 transition-all"
              >
                Seguir editando
              </button>
            </div>
          </div>
        </div>
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

      {/* Botón guardar */}
      <div className="absolute bottom-24 left-0 right-0 z-40 p-4 bg-gradient-to-t from-white via-white to-transparent">
        <button
          onClick={handleSave}
          disabled={!hasUnsavedChanges}
          className={`w-full py-4 px-6 rounded-full font-semibold shadow-xl transition-all active:scale-[0.98] ${
            hasUnsavedChanges
              ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-teal-500/30 hover:shadow-2xl hover:shadow-teal-500/40'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
          }`}
        >
          {hasUnsavedChanges ? 'Guardar Cambios' : 'Sin cambios pendientes'}
        </button>
      </div>
    </div>
  );
}
