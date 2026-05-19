import { useEffect, useState } from 'react';
import { ArrowLeft, Check, Clock, Eye, EyeOff, MapPinIcon, Store, Tag } from 'lucide-react';
import { showAppToast } from '../Toast';

export default function BusinessConfigScreen({ onBack, onSave }: { onBack: () => void; onSave: (config: any) => void }) {
  const emptySchedule = {
    monday: { enabled: false, open: '', close: '' },
    tuesday: { enabled: false, open: '', close: '' },
    wednesday: { enabled: false, open: '', close: '' },
    thursday: { enabled: false, open: '', close: '' },
    friday: { enabled: false, open: '', close: '' },
    saturday: { enabled: false, open: '', close: '' },
    sunday: { enabled: false, open: '', close: '' }
  };
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

  const categories = [
    { id: 'reposteria', name: 'Repostería y Pastelería', icon: '🎂' },
    { id: 'comida', name: 'Comida y Restaurantes', icon: '🍽️' },
    { id: 'servicios', name: 'Servicios Profesionales', icon: '🔧' },
    { id: 'belleza', name: 'Belleza y Estética', icon: '💅' },
    { id: 'hogar', name: 'Hogar y Construcción', icon: '🏠' },
    { id: 'salud', name: 'Salud y Bienestar', icon: '💊' },
    { id: 'educacion', name: 'Educación', icon: '📚' },
    { id: 'tecnologia', name: 'Tecnología', icon: '💻' },
    { id: 'eventos', name: 'Eventos y Entretenimiento', icon: '🎉' },
    { id: 'otros', name: 'Otros', icon: '📦' }
  ];

  const days = [
    { id: 'monday', name: 'Lunes' },
    { id: 'tuesday', name: 'Martes' },
    { id: 'wednesday', name: 'Miércoles' },
    { id: 'thursday', name: 'Jueves' },
    { id: 'friday', name: 'Viernes' },
    { id: 'saturday', name: 'Sábado' },
    { id: 'sunday', name: 'Domingo' }
  ];

  const addKeyword = (value: string) => {
    const nextKeyword = value.trim();
    if (!nextKeyword) return;

    setKeywords((currentKeywords) =>
      currentKeywords.includes(nextKeyword) ? currentKeywords : [...currentKeywords, nextKeyword]
    );
    setKeywordInput('');
  };

  const removeKeyword = (keywordToRemove: string) => {
    setKeywords((currentKeywords) => currentKeywords.filter((keyword) => keyword !== keywordToRemove));
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
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!response.ok) {
          showAppToast('No se pudo cargar la configuración del negocio', 'error');
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
      } catch (error) {
        showAppToast('No se pudo cargar la configuración del negocio', 'error');
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

  const handleSave = async () => {
    const businessId = localStorage.getItem('zipco-business-id');
    const token = localStorage.getItem('zipco-token');

    if (!businessId || !token) {
      showAppToast('No se pudo guardar la configuración del negocio', 'error');
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
        showAppToast('No se pudo guardar la configuración del negocio', 'error');
        return;
      }

      onSave({
        category,
        hashtags: keywords,
        showFullAddress,
        fullAddress,
        schedule
      });
      showAppToast('Configuración del negocio actualizada correctamente', 'success');
      onBack();
    } catch (error) {
      showAppToast('No se pudo guardar la configuración del negocio', 'error');
    }
  };

  return (
    <div className="size-full relative flex flex-col bg-[#F0F4FF]">
      {/* Header */}
      <div className="px-4 pt-6 pb-4 border-b border-white/50">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={onBack} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h2 className="text-xl font-bold text-gray-900">Configuración de Negocio</h2>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-4 pt-4 pb-28">

        {/* Category Selection */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-white/50 shadow-md mb-4">
          <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Store className="w-5 h-5 text-teal-600" />
            Categoría del Negocio
          </h4>
          {!category ? (
            <button
              type="button"
              onClick={() => setShowCategoryModal(true)}
              className="w-full rounded-xl bg-gray-100 px-4 py-3 text-left text-sm font-semibold text-gray-700 hover:bg-gray-200 transition-all"
            >
              Indica tu categoría →
            </button>
          ) : (
            (() => {
              const selectedCategory = categories.find((cat) => cat.id === category);

              return (
                <div className="flex items-center gap-2">
                  <div className="flex-1 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 p-3 text-white shadow-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{selectedCategory?.icon}</span>
                      <span className="text-xs font-semibold">{selectedCategory?.name ?? category}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCategoryModal(true)}
                    className="rounded-full bg-teal-50 px-3 py-2 text-xs font-semibold text-teal-700 hover:bg-teal-100 transition-all"
                  >
                    Cambiar
                  </button>
                </div>
              );
            })()
          )}
        </div>

        {/* Hashtags */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-white/50 shadow-md mb-4">
          <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
            <Tag className="w-5 h-5 text-teal-600" />
            Palabras clave de búsqueda
          </h4>
          <p className="text-xs text-gray-500 mb-3">
            Describe exactamente lo que vendes. Los clientes encontrarán tu negocio cuando busquen estas palabras. No se muestran públicamente.
          </p>
          <div className="flex flex-wrap gap-2 rounded-xl border border-gray-200 bg-white p-3 focus-within:ring-2 focus-within:ring-teal-500/20 focus-within:border-teal-500 transition-all">
            {keywords.map((keyword) => (
              <span
                key={keyword}
                className="bg-teal-100 text-teal-800 rounded-full px-3 py-1 text-sm flex items-center gap-1"
              >
                {keyword}
                <button
                  type="button"
                  onClick={() => removeKeyword(keyword)}
                  className="font-bold leading-none text-teal-700 hover:text-teal-900"
                  aria-label={`Eliminar ${keyword}`}
                >
                  X
                </button>
              </span>
            ))}
            <input
              type="text"
              value={keywordInput}
              onChange={(e) => {
                const value = e.target.value;
                if (value.includes(',')) {
                  value.split(',').forEach(addKeyword);
                  return;
                }
                setKeywordInput(value);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ',') {
                  e.preventDefault();
                  addKeyword(keywordInput);
                }
              }}
              placeholder="Escribe una palabra clave y presiona Enter"
              className="min-w-[12rem] flex-1 border-0 bg-transparent text-sm focus:outline-none"
            />
          </div>
          <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs font-semibold text-blue-900 mb-1">💡 Ejemplos útiles:</p>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Tortas de cumpleaños personalizadas</li>
              <li>• Galletas de Navidad artesanales</li>
              <li>• Reparación de gasfitería 24/7</li>
              <li>• Clases de inglés para niños</li>
            </ul>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Separa cada frase con comas. Sé específico para mejores resultados.
          </p>
        </div>

        {/* Location Privacy */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-white/50 shadow-md mb-4">
          <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <MapPinIcon className="w-5 h-5 text-teal-600" />
            Privacidad de Ubicación
          </h4>

          <div className="mb-4">
            <label className="text-sm text-gray-700 mb-2 block">Dirección completa</label>
            <div className="relative">
              <input
                type="text"
                value={fullAddress}
                onChange={(e) => {
                  setLocationTouched(true);
                  setFullAddress(e.target.value);
                }}
                placeholder="Escribe tu dirección..."
                className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
              />
              {locationTouched && fullAddress.trim().length >= 3 && (
                <div className="absolute left-0 right-0 top-full mt-2 z-30 max-h-52 overflow-auto rounded-2xl border border-gray-100 bg-white shadow-xl">
                  {isLocationLoading ? (
                    <p className="px-4 py-3 text-sm text-gray-500">Buscando...</p>
                  ) : locationSuggestions.length > 0 ? (
                    locationSuggestions.map((result, index) => {
                      const parts = String(result.display_name ?? '').split(',').map((p: string) => p.trim());
                      const streetName = parts[1] ?? parts[0] ?? '';
                      const streetNumber = parts[0] ?? '';
                      const city = parts[2] ?? '';
                      const isNumber = /^\d+$/.test(streetNumber);
                      const label = isNumber
                        ? `${streetName} ${streetNumber}, ${city}`.trim()
                        : `${streetNumber}, ${city}`.trim();
                      return (
                        <button
                          key={`${result.place_id ?? index}`}
                          type="button"
                          onClick={() => {
                            setFullAddress(label);
                            setLocationSuggestions([]);
                            setHasLocationSearched(false);
                            setLocationTouched(false);
                          }}
                          className="w-full text-left px-4 py-3 text-sm text-gray-700 border-b border-gray-100 last:border-b-0 hover:bg-teal-50 transition-colors"
                        >
                          {label}
                        </button>
                      );
                    })
                  ) : hasLocationSearched ? (
                    <p className="px-4 py-3 text-sm text-gray-500">No se encontraron resultados</p>
                  ) : null}
                </div>
              )}
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {showFullAddress ? (
                  <Eye className="w-5 h-5 text-blue-600" />
                ) : (
                  <EyeOff className="w-5 h-5 text-gray-600" />
                )}
                <span className="font-semibold text-gray-900 text-sm">
                  {showFullAddress ? 'Mostrar dirección completa' : 'Mostrar solo distancia'}
                </span>
              </div>
              <button
                onClick={() => setShowFullAddress(!showFullAddress)}
                className={`relative w-14 h-8 rounded-full transition-all ${
                  showFullAddress ? 'bg-blue-500' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${
                    showFullAddress ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            <p className="text-xs text-gray-600">
              {showFullAddress
                ? 'Los clientes verán tu dirección exacta'
                : 'Los clientes solo verán la distancia en km'}
            </p>
          </div>
        </div>

        {/* Schedule */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-white/50 shadow-md mb-4">
          <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Clock className="w-5 h-5 text-teal-600" />
            Horarios de Atención
          </h4>
          <div className="space-y-3">
            {days.map((day) => {
              const daySchedule = schedule[day.id as keyof typeof schedule];
              return (
                <div key={day.id} className="flex items-center gap-3">
                  <button
                    onClick={() => setSchedule({
                      ...schedule,
                      [day.id]: { ...daySchedule, enabled: !daySchedule.enabled }
                    })}
                    className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                      daySchedule.enabled
                        ? 'bg-teal-500 border-teal-500'
                        : 'bg-white border-gray-300'
                    }`}
                  >
                    {daySchedule.enabled && <Check className="w-4 h-4 text-white" />}
                  </button>
                  <span className="text-sm font-medium text-gray-700 w-24">{day.name}</span>
                  {daySchedule.enabled ? (
                    <div className="flex-1 flex items-center gap-2">
                      <input
                        type="time"
                        value={daySchedule.open}
                        onChange={(e) => setSchedule({
                          ...schedule,
                          [day.id]: { ...daySchedule, open: e.target.value }
                        })}
                        className="flex-1 bg-white border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                      />
                      <span className="text-gray-400">-</span>
                      <input
                        type="time"
                        value={daySchedule.close}
                        onChange={(e) => setSchedule({
                          ...schedule,
                          [day.id]: { ...daySchedule, close: e.target.value }
                        })}
                        className="flex-1 bg-white border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                      />
                    </div>
                  ) : (
                    <span className="flex-1 text-sm text-gray-400">Cerrado</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {showCategoryModal && (
        <div className="absolute inset-0 bg-black/50 z-50 flex items-end" onClick={() => setShowCategoryModal(false)}>
          <div className="w-full bg-white rounded-t-3xl p-5 max-h-[75vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-gray-900 text-lg mb-4 text-center">Elige tu categoría</h3>
            <div className="overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => { setCategory(cat.id); setShowCategoryModal(false); }}
                    className={`p-3 rounded-xl text-left transition-all ${category === cat.id ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-lg' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{cat.icon}</span>
                      <span className="text-xs font-semibold">{cat.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <button onClick={() => setShowCategoryModal(false)} className="mt-4 w-full py-3 bg-gray-100 rounded-xl font-semibold text-gray-700">Cancelar</button>
          </div>
        </div>
      )}

      {/* Save Button */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white via-white to-transparent">
        <button
          onClick={handleSave}
          className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 text-white py-4 px-6 rounded-full font-semibold shadow-xl shadow-teal-500/30 hover:shadow-2xl hover:shadow-teal-500/40 transition-all active:scale-[0.98]"
        >
          Guardar Configuración
        </button>
      </div>
    </div>
  );
}
