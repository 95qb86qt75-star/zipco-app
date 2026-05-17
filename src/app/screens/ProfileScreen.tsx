import { useEffect, useState } from 'react';
import { ArrowLeft, Camera, Check, ChevronRight, Clock, Eye, EyeOff, Facebook, Instagram, LogOut, MapPinIcon, Phone, Settings, Store, Tag, TrendingUp, User } from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { showAppToast } from './Toast';

function BusinessConfigScreen({ onBack, onSave }: { onBack: () => void; onSave: (config: any) => void }) {
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
  const [hashtags, setHashtags] = useState('');
  const [showFullAddress, setShowFullAddress] = useState(false);
  const [fullAddress, setFullAddress] = useState('Av. Principal 123, San Bernardo');
  const [schedule, setSchedule] = useState(emptySchedule);

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
        setHashtags(Array.isArray(loadedKeywords) ? loadedKeywords.join(', ') : loadedKeywords ?? '');
        setSchedule(parseSchedule(business.schedule));
      } catch (error) {
        showAppToast('No se pudo cargar la configuración del negocio', 'error');
      }
    };

    loadBusinessConfig();
  }, []);

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
          keywords: hashtags,
          schedule: JSON.stringify(schedule)
        })
      });

      if (!response.ok) {
        showAppToast('No se pudo guardar la configuración del negocio', 'error');
        return;
      }

      onSave({
        category,
        hashtags: hashtags.split(',').map(tag => tag.trim()).filter(Boolean),
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
    <div className={`size-full flex flex-col ${profileTab === 'negocio' ? 'bg-[#F0F4FF]' : 'bg-white'}`}>
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
          <div className="grid grid-cols-2 gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`p-3 rounded-xl text-left transition-all ${
                  category === cat.id
                    ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-lg'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">{cat.icon}</span>
                  <span className="text-xs font-semibold">{cat.name}</span>
                </div>
              </button>
            ))}
          </div>
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
          <textarea
            value={hashtags}
            onChange={(e) => setHashtags(e.target.value)}
            placeholder="Ej: Tortas de cumpleaños personalizadas, Galletas de Navidad artesanales, Pasteles para bodas y eventos, Cupcakes decorados con fondant"
            className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all resize-none"
            rows={4}
          />
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
            <input
              type="text"
              value={fullAddress}
              onChange={(e) => setFullAddress(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
            />
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

export default function ProfileScreen({ activeTab, setActiveTab, onBack }: { activeTab: string; setActiveTab: (tab: string) => void; onBack: () => void }) {
  const [businessMode, setBusinessMode] = useState(false);
  const [profileTab, setProfileTab] = useState<'personal' | 'negocio'>('personal');
  const [showBusinessConfig, setShowBusinessConfig] = useState(false);
  const [showBusinessRegistrationForm, setShowBusinessRegistrationForm] = useState(false);
  const [businessRegistrationForm, setBusinessRegistrationForm] = useState({
    name: '',
    type: 'Negocio'
  });
  const [businessConfig, setBusinessConfig] = useState({
    category: 'reposteria',
    hashtags: ['tortas', 'pasteles', 'cumpleaños'],
    showFullAddress: false,
    fullAddress: 'Av. Principal 123, San Bernardo',
    schedule: {}
  });
  const [userInfo, setUserInfo] = useState({
    name: 'María González',
    email: 'maria.gonzalez@email.com',
    phone: '+56 9 1234 5678',
    address: 'San Bernardo, Región Metropolitana',
    profileImage: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&q=80'
  });

  useEffect(() => {
    const userId = localStorage.getItem('zipco-user-id');
    const token = localStorage.getItem('zipco-token');

    if (!userId || !token) return;

    const loadUserInfo = async () => {
      try {
        const response = await fetch(`http://localhost:3000/users/${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!response.ok) return;

        const data = await response.json();
        setUserInfo((currentUserInfo) => ({
          ...currentUserInfo,
          name: data.name ?? currentUserInfo.name,
          email: data.email ?? currentUserInfo.email,
          phone: data.phone ?? currentUserInfo.phone,
          address: data.location ?? data.address ?? currentUserInfo.address
        }));
      } catch (error) {
        // Mantener datos locales si el backend no responde.
      }
    };

    loadUserInfo();
  }, []);

  const [isEditingPersonalInfo, setIsEditingPersonalInfo] = useState(false);
  const [personalInfoForm, setPersonalInfoForm] = useState({
    name: '',
    phone: '',
    location: ''
  });
  const [personalLocationSuggestions, setPersonalLocationSuggestions] = useState<any[]>([]);
  const [isPersonalLocationLoading, setIsPersonalLocationLoading] = useState(false);
  const [hasPersonalLocationSearched, setHasPersonalLocationSearched] = useState(false);
  const [personalLocationTouched, setPersonalLocationTouched] = useState(false);

  useEffect(() => {
    const query = personalInfoForm.location.trim();

    if (!isEditingPersonalInfo || !personalLocationTouched || query.length < 3) {
      setPersonalLocationSuggestions([]);
      setIsPersonalLocationLoading(false);
      setHasPersonalLocationSearched(false);
      return;
    }

    setIsPersonalLocationLoading(true);
    setHasPersonalLocationSearched(false);

    const timeout = setTimeout(async () => {
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}+Chile&format=json&limit=5&countrycodes=cl`);
        const data = await response.json();
        setPersonalLocationSuggestions(Array.isArray(data) ? data : []);
      } catch (error) {
        setPersonalLocationSuggestions([]);
      } finally {
        setIsPersonalLocationLoading(false);
        setHasPersonalLocationSearched(true);
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [personalInfoForm.location, isEditingPersonalInfo, personalLocationTouched]);

  const [businessInfo, setBusinessInfo] = useState({
    name: '',
    description: '',
    address: '',
    phone: '',
    instagram: '',
    facebook: '',
    image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&q=80'
  });
  const [businessId, setBusinessId] = useState<string | number | null>(() => localStorage.getItem('zipco-business-id'));
  const [hasRegisteredBusiness, setHasRegisteredBusiness] = useState(() => Boolean(localStorage.getItem('zipco-business-id')));
  const [isEditingBusinessInfo, setIsEditingBusinessInfo] = useState(false);
  const [businessSocialForm, setBusinessSocialForm] = useState({
    name: '',
    description: '',
    address: '',
    instagram: '',
    facebook: ''
  });
  const [businessAddressSuggestions, setBusinessAddressSuggestions] = useState<any[]>([]);
  const [isBusinessAddressLoading, setIsBusinessAddressLoading] = useState(false);
  const [hasBusinessAddressSearched, setHasBusinessAddressSearched] = useState(false);

  const getBusinessAddressLabel = (result: any) =>
    String(result.display_name ?? '').split(',').slice(0, 2).map((part) => part.trim()).join(', ');

  useEffect(() => {
    const userId = localStorage.getItem('zipco-user-id');
    const token = localStorage.getItem('zipco-token');

    if (!userId || !token) return;

    const loadUserBusiness = async () => {
      try {
        const response = await fetch('http://localhost:3000/businesses', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!response.ok) return;

        const data = await response.json();
        const businesses = Array.isArray(data) ? data : data.businesses ?? data.results ?? [];
        const currentUserBusiness = businesses.find((business: any) => {
          const ownerId = business.userId ?? business.user_id ?? business.ownerId ?? business.owner_id ?? business.user?.id ?? business.user?._id ?? business.user ?? business.owner?.id ?? business.owner?._id ?? business.owner;
          return String(ownerId) === String(userId);
        });

        if (!currentUserBusiness) {
          setHasRegisteredBusiness(false);
          setBusinessId(null);
          localStorage.removeItem('zipco-business-id');
          return;
        }

        const currentBusinessId = currentUserBusiness.id ?? currentUserBusiness._id;
        setBusinessId(currentBusinessId);
        if (currentBusinessId) {
          localStorage.setItem('zipco-business-id', String(currentBusinessId));
        }
        setHasRegisteredBusiness(true);
        setBusinessInfo((currentBusinessInfo) => ({
          ...currentBusinessInfo,
          name: currentUserBusiness.name ?? '',
          description: currentUserBusiness.description ?? '',
          address: currentUserBusiness.address ?? currentUserBusiness.location ?? '',
          instagram: currentUserBusiness.instagram ?? '',
          facebook: currentUserBusiness.facebook ?? '',
          image: currentUserBusiness.image ?? currentUserBusiness.imageUrl ?? currentBusinessInfo.image
        }));
      } catch (error) {
        setHasRegisteredBusiness(false);
      }
    };

    loadUserBusiness();
  }, []);

  useEffect(() => {
    const query = businessSocialForm.address.trim();

    if (!isEditingBusinessInfo || query.length < 3) {
      setBusinessAddressSuggestions([]);
      setIsBusinessAddressLoading(false);
      setHasBusinessAddressSearched(false);
      return;
    }

    setIsBusinessAddressLoading(true);
    setHasBusinessAddressSearched(false);

    const timeout = setTimeout(async () => {
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}+Chile&format=json&limit=5&countrycodes=cl`);
        const data = await response.json();
        setBusinessAddressSuggestions(Array.isArray(data) ? data : []);
      } catch (error) {
        setBusinessAddressSuggestions([]);
      } finally {
        setIsBusinessAddressLoading(false);
        setHasBusinessAddressSearched(true);
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [businessSocialForm.address, isEditingBusinessInfo]);

  const missingBusinessFields = [
    !businessInfo.name?.trim() ? 'Nombre del negocio' : '',
    !businessConfig.category?.trim() ? 'Categoría' : '',
    !businessInfo.description?.trim() ? 'Descripción' : '',
    !businessInfo.address?.trim() ? 'Dirección' : '',
    !businessInfo.phone?.trim() ? 'Teléfono' : '',
    !businessConfig.schedule || Object.keys(businessConfig.schedule).length === 0 ? 'Horarios de atención' : '',
    !businessConfig.hashtags || businessConfig.hashtags.length === 0 ? 'Palabras clave' : ''
  ].filter(Boolean);

  const isBusinessFieldMissing = (field: string) => missingBusinessFields.includes(field);
  const isBusinessReadyToPublish = missingBusinessFields.length === 0;

  const handlePublishBusiness = () => {
    if (!isBusinessReadyToPublish) {
      showAppToast(`Faltan completar estos campos:\n${missingBusinessFields.join('\n')}`, 'error');
      return;
    }

    showAppToast('¡Tu negocio está listo para publicarse! Será revisado por nuestro equipo antes de aparecer en los resultados', 'success');
  };

  const handleStartEditingBusinessInfo = () => {
    setBusinessSocialForm({
      name: businessInfo.name,
      description: businessInfo.description,
      address: businessInfo.address,
      instagram: businessInfo.instagram,
      facebook: businessInfo.facebook
    });
    setIsEditingBusinessInfo(true);
  };

  const handleSaveBusinessInfo = async () => {
    const token = localStorage.getItem('zipco-token');

    if (!businessId || !token) {
      showAppToast('No se pudo guardar el negocio', 'error');
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
          name: businessSocialForm.name,
          description: businessSocialForm.description,
          address: businessSocialForm.address,
          instagram: businessSocialForm.instagram,
          facebook: businessSocialForm.facebook
        })
      });

      if (!response.ok) {
        showAppToast('No se pudo guardar el negocio', 'error');
        return;
      }

      setBusinessInfo((currentBusinessInfo) => ({
        ...currentBusinessInfo,
        name: businessSocialForm.name,
        description: businessSocialForm.description,
        address: businessSocialForm.address,
        instagram: businessSocialForm.instagram,
        facebook: businessSocialForm.facebook
      }));
      setIsEditingBusinessInfo(false);
      setBusinessAddressSuggestions([]);
      setHasBusinessAddressSearched(false);
      showAppToast('Datos del negocio actualizados correctamente', 'success');
    } catch (error) {
      showAppToast('No se pudo guardar el negocio', 'error');
    }
  };

  const handleRegisterBusiness = async () => {
    const token = localStorage.getItem('zipco-token');
    const businessName = businessRegistrationForm.name.trim();

    if (!token || !businessName) {
      showAppToast('No se pudo registrar el negocio', 'error');
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/businesses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: businessName,
          type: businessRegistrationForm.type,
          status: 'pending',
          categoryId: 1,
          address: '',
          latitude: 0,
          longitude: 0
        })
      });

      if (!response.ok) {
        showAppToast('No se pudo registrar el negocio', 'error');
        return;
      }

      const data = await response.json();
      const newBusiness = data.business ?? data;
      const newBusinessId = newBusiness.id ?? newBusiness._id ?? data.businessId;

      if (newBusinessId) {
        localStorage.setItem('zipco-business-id', String(newBusinessId));
      }

      setBusinessId(newBusinessId ?? null);
      setBusinessInfo((currentBusinessInfo) => ({
        ...currentBusinessInfo,
        name: businessName,
        description: newBusiness.description ?? '',
        address: newBusiness.address ?? '',
        instagram: newBusiness.instagram ?? '',
        facebook: newBusiness.facebook ?? '',
        image: newBusiness.image ?? newBusiness.imageUrl ?? currentBusinessInfo.image
      }));
      setHasRegisteredBusiness(true);
      setShowBusinessRegistrationForm(false);
      setBusinessRegistrationForm({ name: '', type: 'Negocio' });
      showAppToast('¡Tu negocio fue registrado! Completa tu información en la sección de negocio', 'success');
    } catch (error) {
      showAppToast('No se pudo registrar el negocio', 'error');
    }
  };

  const handleStartEditingPersonalInfo = () => {
    setPersonalInfoForm({
      name: userInfo.name,
      phone: userInfo.phone,
      location: userInfo.address
    });
    setPersonalLocationTouched(false);
    setIsEditingPersonalInfo(true);
  };

  const handleCancelEditingPersonalInfo = () => {
    setIsEditingPersonalInfo(false);
    setPersonalInfoForm({
      name: '',
      phone: '',
      location: ''
    });
    setPersonalLocationSuggestions([]);
    setHasPersonalLocationSearched(false);
    setPersonalLocationTouched(false);
  };

  const getPersonalLocationLabel = (result: any) => {
    const parts = String(result.display_name ?? '').split(',').map((part) => part.trim()).filter(Boolean);
    if (parts[parts.length - 1]?.toLowerCase() === 'chile') {
      parts.pop();
    }
    return parts.join(', ');
  };

  const handleSavePersonalInfo = async () => {
    const userId = localStorage.getItem('zipco-user-id');
    const token = localStorage.getItem('zipco-token');

    if (!userId || !token) return;

    try {
      const response = await fetch(`http://localhost:3000/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: personalInfoForm.name,
          phone: personalInfoForm.phone,
          location: personalInfoForm.location
        })
      });

      if (!response.ok) return;

      setUserInfo((currentUserInfo) => ({
        ...currentUserInfo,
        name: personalInfoForm.name,
        phone: personalInfoForm.phone,
        address: personalInfoForm.location
      }));
      setIsEditingPersonalInfo(false);
      setPersonalLocationTouched(false);
      showAppToast('Datos actualizados correctamente', 'success');
    } catch (error) {
      // Mantener datos locales si el backend no responde.
    }
  };

  if (showBusinessConfig) {
    return (
      <BusinessConfigScreen
        onBack={() => setShowBusinessConfig(false)}
        onSave={(config) => setBusinessConfig(config)}
      />
    );
  }

  const isBusinessProfileTab = profileTab === 'negocio';
  const profileCardClass = isBusinessProfileTab
    ? 'bg-white/10 backdrop-blur-sm border-white/20'
    : 'bg-white/80 backdrop-blur-sm border-white/50';
  const businessTextClass = isBusinessProfileTab ? 'text-white' : 'text-gray-900';
  const businessSubtextClass = isBusinessProfileTab ? 'text-white/70' : 'text-gray-600';

  return (
    <div className={`size-full flex flex-col ${isBusinessProfileTab ? 'bg-gradient-to-b from-[#0F172A] via-[#1E3A5F] to-[#0F172A]' : 'bg-white'}`}>
      {/* Header */}
      <div className="px-4 pt-6 pb-4 border-b border-white/50">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={onBack} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div className="flex-1">
            <h2 className={`text-xl font-bold ${isBusinessProfileTab ? 'text-white' : 'text-gray-900'}`}>Mi Perfil</h2>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-4 pt-4 pb-24">

        {/* Profile Header */}
        <div className={`${profileCardClass} rounded-2xl p-6 border shadow-lg mb-4`}>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative">
              <ImageWithFallback
                src={userInfo.profileImage}
                alt={userInfo.name}
                className="w-20 h-20 rounded-full object-cover border-4 border-teal-500"
              />
              <button className="absolute bottom-0 right-0 w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center shadow-lg hover:bg-teal-600 transition-colors">
                <Camera className="w-4 h-4 text-white" />
              </button>
            </div>
            <div className="flex-1">
              <h3 className={`text-xl font-bold ${isBusinessProfileTab ? 'text-white' : 'text-gray-900'}`}>{userInfo.name}</h3>
            </div>
          </div>
          <div className={`grid grid-cols-2 gap-1 rounded-full p-1 ${isBusinessProfileTab ? 'bg-white/20' : 'bg-[#F3F4F6]'}`}>
            {[
              { id: 'personal', label: 'Personal' },
              { id: 'negocio', label: 'Negocio' }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setProfileTab(tab.id as 'personal' | 'negocio')}
                className={`py-2 px-4 rounded-full text-sm font-semibold transition-all ${
                  profileTab === tab.id
                    ? `bg-white ${tab.id === 'negocio' ? 'text-[#1E3A5F]' : 'text-[#00BFA5]'} shadow-sm`
                    : isBusinessProfileTab ? 'bg-transparent text-white/70' : 'bg-transparent text-gray-500'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Business Mode Toggle */}
        {false && (
        <div className="bg-gradient-to-r from-teal-50 to-emerald-50 border-2 border-teal-200 rounded-2xl p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-teal-500 rounded-full flex items-center justify-center">
                <Store className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900">Modo Negocio</h4>
                <p className="text-xs text-gray-600">Vender productos y servicios</p>
              </div>
            </div>
            <button
              onClick={() => setBusinessMode(!businessMode)}
              className={`relative w-14 h-8 rounded-full transition-all ${
                businessMode ? 'bg-teal-500' : 'bg-gray-300'
              }`}
            >
              <div
                className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${
                  businessMode ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
        )}

        {/* Business Info (visible when business mode is ON) */}
        {profileTab === 'negocio' && hasRegisteredBusiness && (
          <>
            {!hasRegisteredBusiness ? (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-md mb-4 text-center">
                <Store className="w-12 h-12 text-teal-500 mx-auto mb-3" />
                <h4 className="font-bold text-gray-900 mb-2">Aún no has registrado tu negocio</h4>
                <button
                  type="button"
                  onClick={() => setShowBusinessConfig(true)}
                  className="mt-3 bg-[#00BFA5] text-white py-3 px-5 rounded-xl font-semibold hover:bg-teal-600 transition-all"
                >
                  Registrar negocio ahora
                </button>
              </div>
            ) : (
            <>
            <div className={`${profileCardClass} rounded-2xl p-5 border shadow-md mb-4 ${
              ['Nombre del negocio', 'Descripción', 'Dirección', 'Teléfono'].some(isBusinessFieldMissing) ? 'border-[#EF4444]' : isBusinessProfileTab ? 'border-white/20' : 'border-white/50'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <h4 className={`font-bold ${businessTextClass}`}>🏪 Datos del Negocio</h4>
                <button
                  type="button"
                  onClick={isEditingBusinessInfo ? handleSaveBusinessInfo : handleStartEditingBusinessInfo}
                  className="text-teal-600 text-sm font-semibold hover:text-teal-700"
                >
                  {isEditingBusinessInfo ? 'Guardar' : 'Editar'}
                </button>
              </div>
              <div className="flex items-center gap-3 mb-3">
                <ImageWithFallback
                  src={businessInfo.image}
                  alt={businessInfo.name}
                  className="w-16 h-16 rounded-xl object-cover"
                />
                <div className="flex-1">
                  <h5 className={`font-semibold ${businessTextClass}`}>{businessInfo.name}</h5>
                  {isBusinessFieldMissing('Nombre del negocio') && (
                    <p className="text-xs text-[#EF4444] mt-1">Campo requerido para publicar</p>
                  )}
                  <p className={`text-xs ${businessSubtextClass}`}>{businessInfo.description}</p>
                  {isBusinessFieldMissing('Descripción') && (
                    <p className="text-xs text-[#EF4444] mt-1">Campo requerido para publicar</p>
                  )}
                </div>
                {isEditingBusinessInfo ? (
                  <div className="space-y-3 pt-2">
                    <div>
                      <label className={`text-xs mb-1 block ${isBusinessProfileTab ? 'text-white/70' : 'text-gray-500'}`}>Nombre</label>
                      <input
                        type="text"
                        value={businessSocialForm.name}
                        onChange={(e) => setBusinessSocialForm({ ...businessSocialForm, name: e.target.value })}
                        className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                      />
                    </div>
                    <div>
                      <label className={`text-xs mb-1 block ${isBusinessProfileTab ? 'text-white/70' : 'text-gray-500'}`}>Descripción</label>
                      <textarea
                        value={businessSocialForm.description}
                        onChange={(e) => setBusinessSocialForm({ ...businessSocialForm, description: e.target.value })}
                        className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all resize-none"
                        rows={3}
                      />
                    </div>
                    <div>
                      <label className={`text-xs mb-1 block ${isBusinessProfileTab ? 'text-white/70' : 'text-gray-500'}`}>Dirección</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={businessSocialForm.address}
                          onChange={(e) => setBusinessSocialForm({ ...businessSocialForm, address: e.target.value })}
                          className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                        />
                        {businessSocialForm.address.trim().length >= 3 && (
                          <div className="absolute left-0 right-0 top-full mt-2 z-30 max-h-52 overflow-auto rounded-2xl border border-gray-100 bg-white shadow-xl">
                            {isBusinessAddressLoading ? (
                              <p className="px-4 py-3 text-sm text-gray-500">Buscando...</p>
                            ) : businessAddressSuggestions.length > 0 ? (
                              businessAddressSuggestions.map((result, index) => {
                                const label = getBusinessAddressLabel(result);
                                return (
                                  <button
                                    key={`${result.place_id ?? result.osm_id ?? 'business-address'}-${index}`}
                                    type="button"
                                    onClick={() => {
                                      setBusinessSocialForm({ ...businessSocialForm, address: label });
                                      setBusinessAddressSuggestions([]);
                                      setHasBusinessAddressSearched(false);
                                    }}
                                    className="w-full text-left px-4 py-3 text-sm text-gray-700 border-b border-gray-100 last:border-b-0 hover:bg-teal-50 transition-colors"
                                  >
                                    {label}
                                  </button>
                                );
                              })
                            ) : hasBusinessAddressSearched ? (
                              <p className="px-4 py-3 text-sm text-gray-500">No se encontraron resultados</p>
                            ) : null}
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className={`text-xs mb-1 flex items-center gap-1 ${isBusinessProfileTab ? 'text-white/70' : 'text-gray-500'}`}>
                        <Instagram className="w-4 h-4 text-pink-500" />
                        Instagram
                      </label>
                      <input
                        type="text"
                        value={businessSocialForm.instagram}
                        onChange={(e) => setBusinessSocialForm({ ...businessSocialForm, instagram: e.target.value })}
                        placeholder="@tu_negocio"
                        className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                      />
                    </div>
                    <div>
                      <label className={`text-xs mb-1 flex items-center gap-1 ${isBusinessProfileTab ? 'text-white/70' : 'text-gray-500'}`}>
                        <Facebook className="w-4 h-4 text-blue-600" />
                        Facebook
                      </label>
                      <input
                        type="text"
                        value={businessSocialForm.facebook}
                        onChange={(e) => setBusinessSocialForm({ ...businessSocialForm, facebook: e.target.value })}
                        placeholder="facebook.com/tu_negocio"
                        className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 pt-1">
                    {businessInfo.instagram && (
                      <div className="flex items-center gap-2 text-sm">
                        <Instagram className="w-4 h-4 text-pink-500" />
                        <span className={isBusinessProfileTab ? 'text-white' : 'text-gray-700'}>{businessInfo.instagram}</span>
                      </div>
                    )}
                    {businessInfo.facebook && (
                      <div className="flex items-center gap-2 text-sm">
                        <Facebook className="w-4 h-4 text-blue-600" />
                        <span className={isBusinessProfileTab ? 'text-white' : 'text-gray-700'}>{businessInfo.facebook}</span>
                      </div>
                    )}
                    {!businessInfo.instagram && !businessInfo.facebook && (
                      <div className={`border rounded-xl p-3 text-xs ${
                        isBusinessProfileTab ? 'bg-white/10 border-white/20 text-white' : 'bg-yellow-50 border-yellow-200 text-yellow-800'
                      }`}>
                        Agrega tus redes sociales para generar más confianza en tus clientes
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <MapPinIcon className="w-4 h-4 text-gray-400" />
                  <span className={isBusinessProfileTab ? 'text-white' : 'text-gray-700'}>{businessInfo.address}</span>
                </div>
                {isBusinessFieldMissing('Dirección') && (
                  <p className="text-xs text-[#EF4444] pl-6">Campo requerido para publicar</p>
                )}
                <div className="hidden">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700">{businessInfo.phone}</span>
                </div>
                {false && isBusinessFieldMissing('Teléfono') && (
                  <p className="text-xs text-[#EF4444] pl-6">Campo requerido para publicar</p>
                )}
              </div>
            </div>

            {/* Business Configuration Button */}
            <button
              onClick={() => setShowBusinessConfig(true)}
              className={`w-full ${profileCardClass} border rounded-2xl p-4 mb-4 hover:shadow-md transition-all ${
                ['Categoría', 'Horarios de atención', 'Palabras clave'].some(isBusinessFieldMissing) ? 'border-[#EF4444]' : isBusinessProfileTab ? 'border-white/20' : 'border-teal-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-teal-500 rounded-full flex items-center justify-center">
                    <Settings className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <h4 className={`font-bold ${businessTextClass}`}>Configurar Negocio</h4>
                    <p className={`text-xs ${businessSubtextClass}`}>Categoría, hashtags, horarios</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
              {['Categoría', 'Horarios de atención', 'Palabras clave'].filter(isBusinessFieldMissing).map((field) => (
                <div key={field} className="text-left mt-2">
                  <p className="text-xs font-semibold text-[#EF4444]">{field}</p>
                  <p className="text-xs text-[#EF4444]">Campo requerido para publicar</p>
                </div>
              ))}
            </button>

            <button
              type="button"
              onClick={handlePublishBusiness}
              aria-disabled={!isBusinessReadyToPublish}
              className={`w-full py-4 px-6 rounded-2xl font-semibold shadow-lg transition-all active:scale-[0.98] mb-4 ${
                isBusinessReadyToPublish
                  ? 'bg-[#00BFA5] text-white hover:bg-teal-600 shadow-teal-500/30'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-gray-300/30'
              }`}
            >
              Publicar negocio
            </button>
            </>
            )}
          </>
        )}

        {/* Personal Information */}
        {profileTab === 'personal' && (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-white/50 shadow-md mb-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold text-gray-900">Informacion Personal</h4>
            {!isEditingPersonalInfo && (
              <button
                type="button"
                onClick={handleStartEditingPersonalInfo}
                className="text-teal-600 text-sm font-semibold hover:text-teal-700"
              >
                Editar
              </button>
            )}
          </div>
          {isEditingPersonalInfo ? (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Nombre</label>
                <input
                  type="text"
                  value={personalInfoForm.name}
                  onChange={(e) => setPersonalInfoForm({ ...personalInfoForm, name: e.target.value })}
                  className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Telefono</label>
                <input
                  type="tel"
                  value={personalInfoForm.phone}
                  onChange={(e) => setPersonalInfoForm({ ...personalInfoForm, phone: e.target.value })}
                  className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Ubicacion</label>
                <div className="relative">
                  <input
                    type="text"
                    value={personalInfoForm.location}
                    onChange={(e) => {
                      setPersonalLocationTouched(true);
                      setPersonalInfoForm({ ...personalInfoForm, location: e.target.value });
                    }}
                    className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                  />
                  {personalLocationTouched && personalInfoForm.location.trim().length >= 3 && (
                    <div className="absolute left-0 right-0 top-full mt-2 z-30 max-h-52 overflow-auto rounded-2xl border border-gray-100 bg-white shadow-xl">
                      {isPersonalLocationLoading ? (
                        <p className="px-4 py-3 text-sm text-gray-500">Buscando...</p>
                      ) : personalLocationSuggestions.length > 0 ? (
                        personalLocationSuggestions.map((result, index) => {
                          const label = getPersonalLocationLabel(result);
                          return (
                            <button
                              key={`${result.place_id ?? result.osm_id ?? 'personal-location'}-${index}`}
                              type="button"
                              onClick={() => {
                                setPersonalInfoForm({ ...personalInfoForm, location: label });
                                setPersonalLocationSuggestions([]);
                                setHasPersonalLocationSearched(false);
                                setPersonalLocationTouched(false);
                              }}
                              className="w-full text-left px-4 py-3 text-sm text-gray-700 border-b border-gray-100 last:border-b-0 hover:bg-teal-50 transition-colors"
                            >
                              {label}
                            </button>
                          );
                        })
                      ) : hasPersonalLocationSearched ? (
                        <p className="px-4 py-3 text-sm text-gray-500">No se encontraron resultados</p>
                      ) : null}
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCancelEditingPersonalInfo}
                  className="bg-gray-100 text-gray-800 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSavePersonalInfo}
                  className="bg-[#00BFA5] text-white py-3 rounded-xl font-semibold hover:bg-teal-600 transition-all"
                >
                  Guardar
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <button className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-gray-400" />
                  <div className="text-left">
                    <p className="text-xs text-gray-500">Nombre</p>
                    <p className="text-sm font-semibold text-gray-900">{userInfo.name}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
              <button className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors">
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <div className="text-left">
                    <p className="text-xs text-gray-500">Telefono</p>
                    <p className="text-sm font-semibold text-gray-900">{userInfo.phone}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
              <button className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors">
                <div className="flex items-center gap-3">
                  <MapPinIcon className="w-5 h-5 text-gray-400" />
                  <div className="text-left">
                    <p className="text-xs text-gray-500">Ubicacion</p>
                    <p className="text-sm font-semibold text-gray-900">{userInfo.address}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          )}
        </div>
        )}
        {false && (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-white/50 shadow-md mb-4">
          <h4 className="font-bold text-gray-900 mb-4">📱 Información Personal</h4>
          <div className="space-y-3">
            <button className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors">
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-gray-400" />
                <div className="text-left">
                  <p className="text-xs text-gray-500">Teléfono</p>
                  <p className="text-sm font-semibold text-gray-900">{userInfo.phone}</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
            <button className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <div className="text-left">
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-sm font-semibold text-gray-900">{userInfo.email}</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
            <button className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors">
              <div className="flex items-center gap-3">
                <MapPinIcon className="w-5 h-5 text-gray-400" />
                <div className="text-left">
                  <p className="text-xs text-gray-500">Ubicación</p>
                  <p className="text-sm font-semibold text-gray-900">{userInfo.address}</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        )}

        {/* Quick Actions */}
        {profileTab === 'personal' && (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-white/50 shadow-md mb-4">
          <h4 className="font-bold text-gray-900 mb-4">⚡ Acciones Rápidas</h4>
          <div className="space-y-2">
            <button className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-teal-600" />
                <span className="text-sm font-semibold text-gray-900">Historial de pedidos</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
            <button className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors">
              <div className="flex items-center gap-3">
                <LogOut className="w-5 h-5 text-red-600" />
                <span className="text-sm font-semibold text-red-600">Cerrar sesión</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>
        )}

        {profileTab === 'negocio' && !hasRegisteredBusiness && (
          <div className={`${profileCardClass} rounded-2xl p-5 border shadow-md mb-4`}>
            {showBusinessRegistrationForm ? (
              <div className="space-y-4">
                <div>
                  <label className={`text-xs mb-1 block ${isBusinessProfileTab ? 'text-white/70' : 'text-gray-500'}`}>Nombre del negocio/servicio</label>
                  <input
                    type="text"
                    value={businessRegistrationForm.name}
                    onChange={(e) => setBusinessRegistrationForm({ ...businessRegistrationForm, name: e.target.value })}
                    className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                    placeholder="Ej: Pasteleria, gasfiteria, peluqueria"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {['Negocio', 'Servicio'].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setBusinessRegistrationForm({ ...businessRegistrationForm, type })}
                      className={`py-3 px-3 rounded-xl text-sm font-semibold border transition-all ${
                        businessRegistrationForm.type === type
                          ? 'bg-[#00BFA5] text-white border-[#00BFA5]'
                          : isBusinessProfileTab ? 'bg-white/10 text-white border-white/20' : 'bg-white text-gray-700 border-gray-200'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowBusinessRegistrationForm(false)}
                    className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold ${
                      isBusinessProfileTab ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleRegisterBusiness}
                    className="flex-1 py-3 px-4 rounded-xl text-sm font-semibold bg-[#00BFA5] text-white hover:bg-teal-600 transition-all"
                  >
                    Confirmar
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowBusinessRegistrationForm(true)}
                className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-colors ${
                  isBusinessProfileTab ? 'text-white hover:bg-white/10' : 'text-[#00BFA5] hover:bg-teal-50'
                }`}
              >
                <Store className={`w-5 h-5 ${isBusinessProfileTab ? 'text-white' : 'text-[#00BFA5]'}`} />
                ¿Tienes un negocio o servicio? Regístralo aquí
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

