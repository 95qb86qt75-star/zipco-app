import { useState, useEffect, useRef } from 'react';
import { MapPin, Search, Mic, MapPinned, User, Heart, FileText, Home, Store, Wrench, Calendar, ArrowLeft, Clock, Star, Instagram, Facebook, Plus, Minus, Send, Check, X, Package, Phone, Mail, MapPinIcon, CreditCard, Settings, LogOut, ChevronRight, Camera, Building2, TrendingUp, Tag, Edit2, Eye, EyeOff, Moon, Sun } from 'lucide-react';
import { ImageWithFallback } from './components/figma/ImageWithFallback';
import { motion } from 'motion/react';

type ToastType = 'success' | 'error';

function showAppToast(message: string, type: ToastType = 'success') {
  window.dispatchEvent(new CustomEvent('zipco-toast', { detail: { message, type } }));
}

function Toast({ message, type }: { message: string; type: ToastType }) {
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] w-[calc(100%-2rem)] max-w-md pointer-events-none">
      <div
        className={`rounded-2xl px-5 py-3 text-white text-sm font-semibold shadow-2xl ${
          type === 'success' ? 'bg-[#00BFA5]' : 'bg-[#EF4444]'
        }`}
      >
        {message}
      </div>
    </div>
  );
}

function BusinessConfigScreen({ onBack, onSave }: { onBack: () => void; onSave: (config: any) => void }) {
  const [category, setCategory] = useState('reposteria');
  const [hashtags, setHashtags] = useState('Tortas de cumpleaños personalizadas, Galletas de Navidad artesanales, Pasteles para bodas y eventos, Cupcakes decorados');
  const [showFullAddress, setShowFullAddress] = useState(false);
  const [fullAddress, setFullAddress] = useState('Av. Principal 123, San Bernardo');
  const [schedule, setSchedule] = useState({
    monday: { enabled: true, open: '09:00', close: '18:00' },
    tuesday: { enabled: true, open: '09:00', close: '18:00' },
    wednesday: { enabled: true, open: '09:00', close: '18:00' },
    thursday: { enabled: true, open: '09:00', close: '18:00' },
    friday: { enabled: true, open: '09:00', close: '18:00' },
    saturday: { enabled: true, open: '10:00', close: '14:00' },
    sunday: { enabled: false, open: '00:00', close: '00:00' }
  });

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

  const handleSave = () => {
    onSave({
      category,
      hashtags: hashtags.split(',').map(tag => tag.trim()),
      showFullAddress,
      fullAddress,
      schedule
    });
    onBack();
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

function ProfileScreen({ activeTab, setActiveTab, onBack }: { activeTab: string; setActiveTab: (tab: string) => void; onBack: () => void }) {
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

function RequestsScreen({ activeTab, setActiveTab, onBack }: { activeTab: string; setActiveTab: (tab: string) => void; onBack: () => void }) {
  const [subTab, setSubTab] = useState<'my-orders' | 'my-business'>('my-orders');
  const [businessSubTab, setBusinessSubTab] = useState<'pending' | 'accepted'>('pending');
  const [requests, setRequests] = useState([
    {
      id: 1,
      customerName: 'María José González',
      customerImage: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&q=80',
      date: '26 Abr, 10:30',
      status: 'pending',
      products: [
        { name: 'Pan de Pascua clásico', quantity: 2, price: 12000 },
        { name: 'Galletas artesanales', quantity: 1, price: 6000 }
      ],
      note: 'Sin azúcar por favor, es para diabético',
      distance: '0.7 km',
      deliveryDate: '2026-04-27',
      deliveryTime: '14:00',
      needNow: false
    },
    {
      id: 2,
      customerName: 'Carlos Muñoz',
      customerImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80',
      date: '26 Abr, 9:15',
      status: 'pending',
      products: [
        { name: 'Torta personalizada', quantity: 1, price: 25000 }
      ],
      note: 'Decoración de cumpleaños para niño de 5 años, tema dinosaurios',
      distance: '0.9 km',
      deliveryDate: '2026-04-28',
      deliveryTime: '16:30',
      needNow: false
    },
    {
      id: 3,
      customerName: 'Andrea Pasteles',
      customerImage: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80',
      date: '26 Abr, 8:45',
      status: 'pending',
      products: [
        { name: 'Pan de Pascua frutos secos', quantity: 3, price: 14000 },
        { name: 'Rollitos de canela', quantity: 2, price: 3500 }
      ],
      note: '',
      distance: '1.8 km',
      deliveryDate: '',
      deliveryTime: '',
      needNow: true
    },
    {
      id: 4,
      customerName: 'Roberto Silva',
      customerImage: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&q=80',
      date: '25 Abr, 16:20',
      status: 'accepted',
      products: [
        { name: 'Queque navideño', quantity: 2, price: 8000 }
      ],
      note: 'Excelente servicio, gracias!',
      distance: '1.2 km',
      deliveryDate: '2026-04-26',
      deliveryTime: '10:00',
      needNow: false
    },
    {
      id: 5,
      customerName: 'Patricia Flores',
      customerImage: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&q=80',
      date: '25 Abr, 14:10',
      status: 'accepted',
      products: [
        { name: 'Pan de Pascua clásico', quantity: 1, price: 12000 },
        { name: 'Galletas artesanales', quantity: 2, price: 6000 }
      ],
      note: '',
      distance: '0.5 km',
      deliveryDate: '2026-04-27',
      deliveryTime: '18:00',
      needNow: false
    },
    {
      id: 6,
      customerName: 'Javiera López',
      customerImage: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=80',
      date: '26 Abr, 11:30',
      status: 'pending',
      products: [
        { name: 'Cupcakes decorados', quantity: 12, price: 18000 }
      ],
      note: 'Necesito para una reunión urgente',
      distance: '0.4 km',
      deliveryDate: '',
      deliveryTime: '',
      needNow: true
    },
    {
      id: 7,
      customerName: 'Felipe Rojas',
      customerImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
      date: '26 Abr, 7:20',
      status: 'pending',
      products: [
        { name: 'Torta tres leches', quantity: 1, price: 22000 }
      ],
      note: '',
      distance: '1.1 km',
      deliveryDate: '2026-04-29',
      deliveryTime: '10:00',
      needNow: false
    },
    {
      id: 8,
      customerName: 'Daniela Castro',
      customerImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80',
      date: '26 Abr, 12:00',
      status: 'accepted',
      products: [
        { name: 'Galletas de chocolate', quantity: 2, price: 5000 }
      ],
      note: '',
      distance: '0.8 km',
      deliveryDate: '',
      deliveryTime: '',
      needNow: true
    },
    {
      id: 9,
      customerName: 'Gonzalo Vega',
      customerImage: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&q=80',
      date: '26 Abr, 6:50',
      status: 'accepted',
      products: [
        { name: 'Pan de Pascua con nueces', quantity: 1, price: 13000 }
      ],
      note: 'Excelente atención',
      distance: '1.5 km',
      deliveryDate: '2026-04-27',
      deliveryTime: '11:00',
      needNow: false
    },
    {
      id: 10,
      customerName: 'Lorena Méndez',
      customerImage: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=80',
      date: '26 Abr, 13:15',
      status: 'pending',
      products: [
        { name: 'Empanadas de pino', quantity: 10, price: 15000 }
      ],
      note: 'Para almuerzo familiar',
      distance: '0.6 km',
      deliveryDate: '2026-04-26',
      deliveryTime: '13:00',
      needNow: false
    }
  ]);

  const [myOrders, setMyOrders] = useState([
    {
      id: 1,
      businessName: 'Pastelería Delicias Tere',
      businessImage: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&q=80',
      date: '26 Abr, 11:00',
      status: 'pending',
      products: [
        { name: 'Pan de Pascua clásico', quantity: 2, price: 12000 },
      ],
      note: 'Sin azúcar por favor',
      total: 24000,
      deliveryDate: '27 Abr',
      deliveryTime: '15:00'
    },
    {
      id: 2,
      businessName: 'Confitería San Martín',
      businessImage: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80',
      date: '25 Abr, 15:30',
      status: 'accepted',
      products: [
        { name: 'Torta de chocolate', quantity: 1, price: 18000 },
      ],
      note: '',
      total: 18000
    },
    {
      id: 3,
      businessName: 'Dulce Tentación',
      businessImage: 'https://images.unsplash.com/photo-1562059390-a761a084768e?w=400&q=80',
      date: '24 Abr, 09:20',
      status: 'rejected',
      products: [
        { name: 'Cupcakes', quantity: 6, price: 3000 },
      ],
      note: '',
      total: 18000
    }
  ]);

  const handleAccept = (requestId: number) => {
    setRequests(requests.map(req =>
      req.id === requestId ? { ...req, status: 'accepted' } : req
    ));
  };

  const handleReject = (requestId: number) => {
    setRequests(requests.map(req =>
      req.id === requestId ? { ...req, status: 'rejected' } : req
    ));
  };

  const calculateTotal = (products: any[]) => {
    return products.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const sortByUrgency = (a: any, b: any) => {
    // Primero: "Lo necesito ahora"
    if (a.needNow && !b.needNow) return -1;
    if (!a.needNow && b.needNow) return 1;

    // Después: ordenar por fecha y hora
    if (!a.needNow && !b.needNow) {
      const dateA = new Date(`${a.deliveryDate} ${a.deliveryTime}`);
      const dateB = new Date(`${b.deliveryDate} ${b.deliveryTime}`);
      return dateA.getTime() - dateB.getTime();
    }

    return 0;
  };

  const isToday = (dateString: string) => {
    if (!dateString) return false;
    // Usamos la fecha de hoy (26 Abr 2026)
    const today = new Date('2026-04-26');
    const checkDate = new Date(dateString);
    return today.toDateString() === checkDate.toDateString();
  };

  const formatDate = (dateString: string) => {
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const date = new Date(dateString);
    return `${date.getDate()} ${months[date.getMonth()]}`;
  };

  const groupByDate = (requests: any[]) => {
    const today: any[] = [];
    const upcoming: any[] = [];

    requests.forEach(req => {
      if (req.needNow || isToday(req.deliveryDate)) {
        today.push(req);
      } else {
        upcoming.push(req);
      }
    });

    return { today, upcoming };
  };

  const pendingRequests = requests.filter(req => req.status === 'pending').sort(sortByUrgency);
  const acceptedRequests = requests.filter(req => req.status === 'accepted').sort(sortByUrgency);
  const rejectedRequests = requests.filter(req => req.status === 'rejected');

  const groupedPending = groupByDate(pendingRequests);
  const groupedAccepted = groupByDate(acceptedRequests);

  return (
    <div className="size-full bg-gradient-to-b from-white via-blue-50/30 to-blue-100/40 flex flex-col">
      {/* Header */}
      <div className="px-4 pt-6 pb-4 border-b border-white/50">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={onBack} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900">Solicitudes</h2>
          </div>
        </div>

        {/* Sub Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setSubTab('my-orders')}
            className={`flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition-all ${
              subTab === 'my-orders'
                ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-lg'
                : 'bg-white/60 text-gray-600 hover:bg-white/80'
            }`}
          >
            🛒 Mis Pedidos
          </button>
          <button
            onClick={() => setSubTab('my-business')}
            className={`flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition-all ${
              subTab === 'my-business'
                ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-lg'
                : 'bg-white/60 text-gray-600 hover:bg-white/80'
            }`}
          >
            🏪 Mi Negocio
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-4 pt-4 pb-24">

        {/* MY ORDERS TAB */}
        {subTab === 'my-orders' && (
          <>
            <p className="text-sm text-gray-600 mb-4">
              {myOrders.filter(o => o.status === 'pending').length} {myOrders.filter(o => o.status === 'pending').length === 1 ? 'pedido pendiente' : 'pedidos pendientes'}
            </p>

            {/* Pending Orders */}
            {myOrders.filter(o => o.status === 'pending').length > 0 && (
              <div className="mb-6">
                <h3 className="text-base font-bold text-gray-900 mb-3">Pendientes</h3>
                <div className="space-y-3">
                  {myOrders.filter(o => o.status === 'pending').map((order) => (
                    <div
                      key={order.id}
                      className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border-2 border-amber-200 shadow-md"
                    >
                      <div className="flex items-center gap-3 mb-3 pb-3 border-b border-gray-100">
                        <ImageWithFallback
                          src={order.businessImage}
                          alt={order.businessName}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 text-sm">{order.businessName}</h4>
                          <p className="text-xs text-gray-500">{order.date}</p>
                        </div>
                        <div className="px-2 py-1 bg-amber-100 rounded-full">
                          <span className="text-xs font-semibold text-amber-700">En espera</span>
                        </div>
                      </div>

                      <div className="mb-3">
                        <div className="space-y-1">
                          {order.products.map((product, idx) => (
                            <div key={idx} className="flex justify-between items-center text-sm">
                              <span className="text-gray-700">
                                {product.quantity}x {product.name}
                              </span>
                              <span className="font-semibold text-gray-900">
                                ${(product.price * product.quantity).toLocaleString('es-CL')}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {order.note && (
                        <div className="mb-3 p-3 bg-blue-50 rounded-xl">
                          <p className="text-xs text-gray-600 italic">"{order.note}"</p>
                        </div>
                      )}

                      <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                        <span className="font-bold text-gray-900">Total</span>
                        <span className="text-lg font-bold text-teal-600">
                          ${order.total.toLocaleString('es-CL')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Processed Orders */}
            {myOrders.filter(o => o.status !== 'pending').length > 0 && (
              <div className="mb-6">
                <h3 className="text-base font-bold text-gray-900 mb-3">Historial</h3>
                <div className="space-y-3">
                  {myOrders.filter(o => o.status !== 'pending').map((order) => (
                    <div
                      key={order.id}
                      className={`bg-white/60 backdrop-blur-sm rounded-2xl p-4 border ${
                        order.status === 'accepted' ? 'border-green-200' : 'border-red-200'
                      } shadow-sm`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <ImageWithFallback
                          src={order.businessImage}
                          alt={order.businessName}
                          className="w-10 h-10 rounded-full object-cover opacity-70"
                        />
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-700 text-sm">{order.businessName}</h4>
                          <p className="text-xs text-gray-500">{order.date}</p>
                        </div>
                        <div className={`px-2 py-1 rounded-full ${
                          order.status === 'accepted' ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          <span className={`text-xs font-semibold ${
                            order.status === 'accepted' ? 'text-green-700' : 'text-red-700'
                          }`}>
                            {order.status === 'accepted' ? 'Aceptado' : 'Rechazado'}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">
                        {order.products.length} {order.products.length === 1 ? 'producto' : 'productos'} •
                        <span className="font-semibold text-gray-900 ml-1">
                          ${order.total.toLocaleString('es-CL')}
                        </span>
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {myOrders.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Package className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">No tienes pedidos</h3>
                <p className="text-sm text-gray-600 text-center">
                  Tus pedidos aparecerán aquí
                </p>
              </div>
            )}
          </>
        )}

        {/* MY BUSINESS TAB */}
        {subTab === 'my-business' && (
          <>
            {/* Business Sub Tabs */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setBusinessSubTab('pending')}
                className={`flex-1 py-2.5 px-4 rounded-xl font-semibold text-sm transition-all ${
                  businessSubTab === 'pending'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg'
                    : 'bg-white/60 text-gray-600 hover:bg-white/80'
                }`}
              >
                📋 Pendientes ({pendingRequests.length})
              </button>
              <button
                onClick={() => setBusinessSubTab('accepted')}
                className={`flex-1 py-2.5 px-4 rounded-xl font-semibold text-sm transition-all ${
                  businessSubTab === 'accepted'
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg'
                    : 'bg-white/60 text-gray-600 hover:bg-white/80'
                }`}
              >
                ✅ Aceptadas ({acceptedRequests.length})
              </button>
            </div>

            {/* PENDING SUB-TAB */}
            {businessSubTab === 'pending' && (
              <>
                {pendingRequests.length > 0 ? (
                  <div className="space-y-4">
                    {/* Solicitudes Hoy */}
                    {groupedPending.today.length > 0 && (
                      <div>
                        <h3 className="text-sm font-bold text-gray-700 mb-2 px-1">📍 Solicitudes Hoy</h3>
                        <div className="space-y-2">
                          {groupedPending.today.map((request) => (
                            <div
                              key={request.id}
                              className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border-2 border-amber-200 shadow-sm"
                            >
                              {/* Header compacto */}
                              <div className="flex items-center gap-2 mb-2">
                                <ImageWithFallback
                                  src={request.customerImage}
                                  alt={request.customerName}
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-bold text-gray-900 text-xs truncate">{request.customerName}</h4>
                                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                    <span className="text-xs">{request.distance}</span>
                                    {request.needNow && (
                                      <>
                                        <span>•</span>
                                        <span className="text-orange-600 font-bold">🚀 URGENTE</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                                <div className="px-2 py-0.5 bg-amber-100 rounded-full">
                                  <span className="text-xs font-semibold text-amber-700">Pendiente</span>
                                </div>
                              </div>

                              {/* Productos compactos */}
                              <div className="mb-2 bg-gray-50 rounded-lg p-2">
                                {request.products.map((product: any, idx: number) => (
                                  <div key={idx} className="flex justify-between items-center text-xs">
                                    <span className="text-gray-700">{product.quantity}x {product.name}</span>
                                    <span className="font-semibold text-gray-900">${(product.price * product.quantity).toLocaleString('es-CL')}</span>
                                  </div>
                                ))}
                              </div>

                              {/* Info entrega */}
                              <div className="mb-2 p-2 bg-purple-50 border border-purple-200 rounded-lg">
                                <p className="text-xs text-purple-900">
                                  {request.needNow ? (
                                    <span className="font-bold">⚡ Lo necesita AHORA</span>
                                  ) : (
                                    <span>📅 {formatDate(request.deliveryDate)} • {request.deliveryTime}</span>
                                  )}
                                </p>
                              </div>

                              {/* Nota si existe */}
                              {request.note && (
                                <div className="mb-2 p-2 bg-blue-50 rounded-lg">
                                  <p className="text-xs text-gray-600 italic line-clamp-2">"{request.note}"</p>
                                </div>
                              )}

                              {/* Total y botones */}
                              <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100">
                                <span className="text-sm font-bold text-teal-600">${calculateTotal(request.products).toLocaleString('es-CL')}</span>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleReject(request.id)}
                                    className="flex items-center gap-1 py-1.5 px-3 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-semibold transition-all"
                                  >
                                    <X className="w-3 h-3" />
                                    Rechazar
                                  </button>
                                  <button
                                    onClick={() => handleAccept(request.id)}
                                    className="flex items-center gap-1 py-1.5 px-3 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-lg text-xs font-semibold transition-all"
                                  >
                                    <Check className="w-3 h-3" />
                                    Aceptar
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Solicitudes Próximas */}
                    {groupedPending.upcoming.length > 0 && (
                      <div>
                        <h3 className="text-sm font-bold text-gray-700 mb-2 px-1">📅 Próximas Solicitudes</h3>
                        <div className="space-y-2">
                          {groupedPending.upcoming.map((request) => (
                            <div
                              key={request.id}
                              className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-gray-200 shadow-sm"
                            >
                              {/* Header compacto */}
                              <div className="flex items-center gap-2 mb-2">
                                <ImageWithFallback
                                  src={request.customerImage}
                                  alt={request.customerName}
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-bold text-gray-900 text-xs truncate">{request.customerName}</h4>
                                  <p className="text-xs text-gray-500">{request.distance}</p>
                                </div>
                                <div className="px-2 py-0.5 bg-gray-100 rounded-full">
                                  <span className="text-xs font-semibold text-gray-700">Pendiente</span>
                                </div>
                              </div>

                              {/* Productos compactos */}
                              <div className="mb-2 bg-gray-50 rounded-lg p-2">
                                {request.products.map((product: any, idx: number) => (
                                  <div key={idx} className="flex justify-between items-center text-xs">
                                    <span className="text-gray-700">{product.quantity}x {product.name}</span>
                                    <span className="font-semibold text-gray-900">${(product.price * product.quantity).toLocaleString('es-CL')}</span>
                                  </div>
                                ))}
                              </div>

                              {/* Info entrega */}
                              <div className="mb-2 p-2 bg-purple-50 border border-purple-200 rounded-lg">
                                <p className="text-xs text-purple-900">📅 {formatDate(request.deliveryDate)} • {request.deliveryTime}</p>
                              </div>

                              {/* Nota si existe */}
                              {request.note && (
                                <div className="mb-2 p-2 bg-blue-50 rounded-lg">
                                  <p className="text-xs text-gray-600 italic line-clamp-2">"{request.note}"</p>
                                </div>
                              )}

                              {/* Total y botones */}
                              <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100">
                                <span className="text-sm font-bold text-teal-600">${calculateTotal(request.products).toLocaleString('es-CL')}</span>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleReject(request.id)}
                                    className="flex items-center gap-1 py-1.5 px-3 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-semibold transition-all"
                                  >
                                    <X className="w-3 h-3" />
                                    Rechazar
                                  </button>
                                  <button
                                    onClick={() => handleAccept(request.id)}
                                    className="flex items-center gap-1 py-1.5 px-3 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-lg text-xs font-semibold transition-all"
                                  >
                                    <Check className="w-3 h-3" />
                                    Aceptar
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16">
                    <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                      <FileText className="w-10 h-10 text-amber-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">No hay solicitudes pendientes</h3>
                    <p className="text-sm text-gray-600 text-center">
                      Las nuevas solicitudes aparecerán aquí
                    </p>
                  </div>
                )}
              </>
            )}

            {/* ACCEPTED SUB-TAB */}
            {businessSubTab === 'accepted' && (
              <>
                {acceptedRequests.length > 0 ? (
                  <div className="space-y-4">
                    {/* Aceptadas Hoy */}
                    {groupedAccepted.today.length > 0 && (
                      <div>
                        <h3 className="text-sm font-bold text-gray-700 mb-2 px-1">📍 Para Hoy</h3>
                        <div className="space-y-2">
                          {groupedAccepted.today.map((request) => (
                            <div
                              key={request.id}
                              className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border-2 border-green-200 shadow-sm"
                            >
                              {/* Header compacto */}
                              <div className="flex items-center gap-2 mb-2">
                                <ImageWithFallback
                                  src={request.customerImage}
                                  alt={request.customerName}
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-bold text-gray-900 text-xs truncate">{request.customerName}</h4>
                                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                    <span className="text-xs">{request.distance}</span>
                                    {request.needNow && (
                                      <>
                                        <span>•</span>
                                        <span className="text-orange-600 font-bold">🚀 URGENTE</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                                <div className="px-2 py-0.5 bg-green-100 rounded-full">
                                  <span className="text-xs font-semibold text-green-700">Aceptada</span>
                                </div>
                              </div>

                              {/* Productos compactos */}
                              <div className="mb-2 bg-gray-50 rounded-lg p-2">
                                {request.products.map((product: any, idx: number) => (
                                  <div key={idx} className="flex justify-between items-center text-xs">
                                    <span className="text-gray-700">{product.quantity}x {product.name}</span>
                                    <span className="font-semibold text-gray-900">${(product.price * product.quantity).toLocaleString('es-CL')}</span>
                                  </div>
                                ))}
                              </div>

                              {/* Info entrega */}
                              <div className="mb-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                                <p className="text-xs text-green-900">
                                  {request.needNow ? (
                                    <span className="font-bold">⚡ Urgente - Lo necesita AHORA</span>
                                  ) : (
                                    <span>📅 {formatDate(request.deliveryDate)} • {request.deliveryTime}</span>
                                  )}
                                </p>
                              </div>

                              {/* Total */}
                              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                                <span className="text-xs text-gray-600">Total</span>
                                <span className="text-sm font-bold text-green-600">${calculateTotal(request.products).toLocaleString('es-CL')}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Aceptadas Próximas */}
                    {groupedAccepted.upcoming.length > 0 && (
                      <div>
                        <h3 className="text-sm font-bold text-gray-700 mb-2 px-1">📅 Próximas Entregas</h3>
                        <div className="space-y-2">
                          {groupedAccepted.upcoming.map((request) => (
                            <div
                              key={request.id}
                              className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-green-200 shadow-sm"
                            >
                              {/* Header compacto */}
                              <div className="flex items-center gap-2 mb-2">
                                <ImageWithFallback
                                  src={request.customerImage}
                                  alt={request.customerName}
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-bold text-gray-900 text-xs truncate">{request.customerName}</h4>
                                  <p className="text-xs text-gray-500">{request.distance}</p>
                                </div>
                                <div className="px-2 py-0.5 bg-green-100 rounded-full">
                                  <span className="text-xs font-semibold text-green-700">Aceptada</span>
                                </div>
                              </div>

                              {/* Productos compactos */}
                              <div className="mb-2 bg-gray-50 rounded-lg p-2">
                                {request.products.map((product: any, idx: number) => (
                                  <div key={idx} className="flex justify-between items-center text-xs">
                                    <span className="text-gray-700">{product.quantity}x {product.name}</span>
                                    <span className="font-semibold text-gray-900">${(product.price * product.quantity).toLocaleString('es-CL')}</span>
                                  </div>
                                ))}
                              </div>

                              {/* Info entrega */}
                              <div className="mb-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                                <p className="text-xs text-green-900">📅 {formatDate(request.deliveryDate)} • {request.deliveryTime}</p>
                              </div>

                              {/* Total */}
                              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                                <span className="text-xs text-gray-600">Total</span>
                                <span className="text-sm font-bold text-green-600">${calculateTotal(request.products).toLocaleString('es-CL')}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
                      <Check className="w-10 h-10 text-green-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">No hay solicitudes aceptadas</h3>
                    <p className="text-sm text-gray-600 text-center">
                      Las solicitudes que aceptes aparecerán aquí
                    </p>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function CheckoutScreen({ business, selectedProducts, products, onBack, onOrderComplete }: { business: any; selectedProducts: number[]; products: any[]; onBack: () => void; onOrderComplete: () => void }) {
  const [quantities, setQuantities] = useState<Record<number, number>>(
    selectedProducts.reduce((acc, id) => ({ ...acc, [id]: 1 }), {})
  );
  const [note, setNote] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [needNow, setNeedNow] = useState(false);

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Seleccionar fecha';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return 'Seleccionar hora';
    return timeString;
  };

  const selectedItems = products.filter((p) => selectedProducts.includes(p.id));

  const updateQuantity = (productId: number, delta: number) => {
    setQuantities((prev) => ({
      ...prev,
      [productId]: Math.max(1, (prev[productId] || 1) + delta)
    }));
  };

  const calculateTotal = () => {
    return selectedItems.reduce((total, item) => {
      return total + item.price * (quantities[item.id] || 1);
    }, 0);
  };

  return (
    <div className="size-full bg-gradient-to-b from-white via-blue-50/30 to-blue-100/40 flex flex-col">
      {/* Header */}
      <div className="px-4 pt-6 pb-4 border-b border-white/50">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={onBack} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h2 className="text-xl font-bold text-gray-900">Resumen del pedido</h2>
        </div>
        <div className="flex items-center gap-2">
          <ImageWithFallback
            src={business.image}
            alt={business.name}
            className="w-10 h-10 rounded-full object-cover border-2 border-teal-500"
          />
          <div>
            <p className="font-semibold text-gray-900 text-sm">{business.name}</p>
            <p className="text-xs text-gray-500">{business.type}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-4 pt-4 pb-36">
        <h3 className="text-base font-bold text-gray-900 mb-3">Productos seleccionados</h3>

        {/* Products List */}
        <div className="space-y-3 mb-6">
          {selectedItems.map((product) => (
            <div
              key={product.id}
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-white/50 shadow-md"
            >
              <div className="flex gap-3 mb-3">
                <ImageWithFallback
                  src={product.image}
                  alt={product.name}
                  className="w-16 h-16 rounded-xl object-cover"
                />
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 text-sm mb-1">{product.name}</h4>
                  <p className="text-xs text-gray-600 mb-2 line-clamp-1">{product.description}</p>
                  <span className="text-base font-bold text-gray-900">${product.price.toLocaleString('es-CL')}</span>
                </div>
              </div>

              {/* Quantity Controls */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Cantidad</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => updateQuantity(product.id, -1)}
                    className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                  >
                    <Minus className="w-4 h-4 text-gray-700" />
                  </button>
                  <span className="text-lg font-bold text-gray-900 w-8 text-center">
                    {quantities[product.id] || 1}
                  </span>
                  <button
                    onClick={() => updateQuantity(product.id, 1)}
                    className="w-8 h-8 rounded-full bg-teal-500 hover:bg-teal-600 flex items-center justify-center transition-colors"
                  >
                    <Plus className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>

              {/* Subtotal */}
              <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center">
                <span className="text-sm text-gray-600">Subtotal</span>
                <span className="text-base font-bold text-teal-600">
                  ${((product.price * (quantities[product.id] || 1)).toLocaleString('es-CL'))}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Delivery Date & Time Selection */}
        <div className="mb-6">
          <label className="block text-base font-bold text-gray-900 mb-3">
            ¿Para cuándo lo necesitas?
          </label>

          {/* Need Now Button */}
          <button
            onClick={() => {
              setNeedNow(!needNow);
              if (!needNow) {
                setSelectedDate('');
                setSelectedTime('');
                setShowDatePicker(false);
                setShowTimePicker(false);
              }
            }}
            className={`w-full py-4 px-6 rounded-2xl font-bold text-base transition-all mb-3 ${
              needNow
                ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-xl shadow-orange-500/30'
                : 'bg-white/80 text-gray-700 border-2 border-gray-200 hover:border-orange-500'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl">🚀</span>
              <span>Lo necesito ahora</span>
            </div>
          </button>

          {/* Date and Time Buttons */}
          <div className={`grid grid-cols-2 gap-3 mb-3 transition-opacity ${needNow ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
            {/* Date Button */}
            <button
              onClick={() => {
                setNeedNow(false);
                setShowDatePicker(!showDatePicker);
                setShowTimePicker(false);
              }}
              disabled={needNow}
              className={`py-4 px-4 rounded-2xl font-semibold text-sm transition-all ${
                selectedDate
                  ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-lg'
                  : 'bg-white/80 text-gray-700 border-2 border-gray-200 hover:border-teal-500'
              }`}
            >
              <div className="flex flex-col items-center gap-1">
                <span className="text-2xl">📅</span>
                <span className="text-xs">{formatDate(selectedDate)}</span>
              </div>
            </button>

            {/* Time Button */}
            <button
              onClick={() => {
                setNeedNow(false);
                setShowTimePicker(!showTimePicker);
                setShowDatePicker(false);
              }}
              disabled={needNow}
              className={`py-4 px-4 rounded-2xl font-semibold text-sm transition-all ${
                selectedTime
                  ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-lg'
                  : 'bg-white/80 text-gray-700 border-2 border-gray-200 hover:border-teal-500'
              }`}
            >
              <div className="flex flex-col items-center gap-1">
                <span className="text-2xl">🕐</span>
                <span className="text-xs">{formatTime(selectedTime)}</span>
              </div>
            </button>
          </div>

          {/* Date Picker */}
          {showDatePicker && (
            <div className="bg-white/80 backdrop-blur-sm border border-teal-200 rounded-2xl p-4 mb-3 animate-in">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Selecciona la fecha:
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setShowDatePicker(false);
                }}
                min={getTodayDate()}
                className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
              />
            </div>
          )}

          {/* Time Picker */}
          {showTimePicker && (
            <div className="bg-white/80 backdrop-blur-sm border border-teal-200 rounded-2xl p-4 mb-3 animate-in">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Selecciona la hora:
              </label>
              <input
                type="time"
                value={selectedTime}
                onChange={(e) => {
                  setSelectedTime(e.target.value);
                  setShowTimePicker(false);
                }}
                className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
              />
            </div>
          )}

          {/* Summary Display */}
          {needNow && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-3">
              <p className="text-sm text-orange-800">
                <strong>🚀 Entrega urgente:</strong> Lo más pronto posible
              </p>
            </div>
          )}

          {!needNow && (selectedDate || selectedTime) && (
            <div className="bg-teal-50 border border-teal-200 rounded-xl p-3">
              <p className="text-sm text-teal-800">
                <strong>📦 Entrega programada:</strong>
                {selectedDate && ` ${formatDate(selectedDate)}`}
                {selectedDate && selectedTime && ' a las'}
                {selectedTime && ` ${selectedTime}`}
                {!selectedDate && !selectedTime && ' No especificada'}
              </p>
            </div>
          )}
        </div>

        {/* Personal Note */}
        <div className="mb-6">
          <label className="block text-base font-bold text-gray-900 mb-3">
            Agregar nota personalizada:
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ej: Sin azúcar, decoración personalizada, hora de entrega..."
            className="w-full bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all resize-none"
            rows={4}
          />
        </div>

        {/* Total Summary */}
        <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-2xl p-5 border-2 border-teal-200">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">Total de productos</span>
            <span className="text-sm font-semibold text-gray-900">
              {selectedItems.reduce((sum, item) => sum + (quantities[item.id] || 1), 0)} unidades
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-lg font-bold text-gray-900">Total a pagar</span>
            <span className="text-2xl font-bold text-teal-600">
              ${calculateTotal().toLocaleString('es-CL')}
            </span>
          </div>
        </div>
      </div>

      {/* Order Button */}
      <div className="absolute bottom-20 left-0 right-0 p-4 bg-gradient-to-t from-white via-white to-transparent">
        <button
          onClick={() => setShowConfirmation(true)}
          className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 text-white py-4 px-6 rounded-full font-semibold shadow-xl shadow-teal-500/30 hover:shadow-2xl hover:shadow-teal-500/40 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
        >
          <Send className="w-5 h-5" />
          <span>Realizar pedido</span>
        </button>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl transform scale-100 animate-in">
            <div className="w-16 h-16 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
              ¡Pedido enviado!
            </h3>

            <p className="text-sm text-gray-600 text-center mb-1">
              Tu solicitud ha sido enviada a:
            </p>
            <p className="text-base font-bold text-teal-600 text-center mb-4">
              {business.name}
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6">
              <p className="text-sm text-blue-800 text-center">
                Revisa tu barra en la opción <strong>Solicitudes</strong> para ver el estado de tu pedido
              </p>
            </div>

            <button
              onClick={() => {
                setShowConfirmation(false);
                onOrderComplete();
              }}
              className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 text-white py-3 px-6 rounded-full font-semibold hover:shadow-lg transition-all"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function BusinessProfileScreen({ business, onBack, onCheckout }: { business: any; onBack: () => void; onCheckout: (selectedProducts: number[], products: any[]) => void }) {
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [lastClickTime, setLastClickTime] = useState<{ [key: number]: number }>({});
  const [isScrolled, setIsScrolled] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (scrollContainerRef.current) {
        setIsScrolled(scrollContainerRef.current.scrollTop > 50);
      }
    };

    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  const products = [
    {
      id: 1,
      name: 'Pan de Pascua clásico',
      description: 'Tradicional pan de Pascua con frutos confitados, nueces y almendras',
      price: 12000,
      image: 'https://images.unsplash.com/photo-1607478900766-efe13248b125?w=400&q=80',
      isAvailable: true
    },
    {
      id: 2,
      name: 'Pan de Pascua frutos secos',
      description: 'Pan de Pascua con almendras, nueces y nueces confitadas',
      price: 14000,
      image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&q=80',
      isAvailable: true
    },
    {
      id: 3,
      name: 'Queque navideño',
      description: 'Pan caletas de manjar con nueces y pasas',
      price: 8000,
      image: 'https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?w=400&q=80',
      isAvailable: false
    },
    {
      id: 4,
      name: 'Galletas artesanales',
      description: 'Ricas galletas de jengibre especiadas y decoradas',
      price: 6000,
      image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&q=80',
      isAvailable: true
    },
    {
      id: 5,
      name: 'Rollitos de canela',
      description: 'Rollitos de canela esponjosos con glaseado',
      price: 3500,
      image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80',
      isAvailable: true
    }
  ];

  const toggleProductSelection = (productId: number) => {
    setSelectedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const handleProductClick = (productId: number) => {
    const now = Date.now();
    const lastClick = lastClickTime[productId] || 0;
    const timeDiff = now - lastClick;

    // Doble clic detectado (menos de 300ms entre clics)
    if (timeDiff < 300 && timeDiff > 0) {
      if (!isSelectionMode) {
        setIsSelectionMode(true);
      }
      toggleProductSelection(productId);
      setLastClickTime({ ...lastClickTime, [productId]: 0 }); // Reset para evitar triple clic
    } else if (isSelectionMode) {
      // Si ya está en modo selección, un clic simple selecciona/deselecciona
      toggleProductSelection(productId);
    } else {
      // Primer clic, guardamos el tiempo
      setLastClickTime({ ...lastClickTime, [productId]: now });
    }
  };

  return (
    <div className="size-full bg-gradient-to-b from-white via-blue-50/30 to-blue-100/40 flex flex-col relative">
      {/* Header fijo */}
      <div className="px-4 pt-6 pb-2 border-b border-white/50 bg-white/80 backdrop-blur-sm">
        <button onClick={onBack} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors mb-2">
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>

        {/* Business Card - Version dinámica */}
        <motion.div
          animate={{
            height: isScrolled ? 70 : 'auto',
            padding: isScrolled ? '8px' : '20px'
          }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 overflow-hidden mb-2"
        >
          <div className="flex gap-3 items-center">
            <motion.div
              animate={{
                width: isScrolled ? 50 : 80,
                height: isScrolled ? 50 : 80
              }}
              transition={{ duration: 0.3 }}
            >
              <ImageWithFallback
                src={business.image}
                alt={business.name}
                className="w-full h-full rounded-full object-cover border-2 border-teal-500"
              />
            </motion.div>

            <div className="flex-1 min-w-0">
              <h2 className={`font-bold text-gray-900 truncate ${isScrolled ? 'text-sm' : 'text-xl mb-1'}`}>
                {business.name}
              </h2>

              {!isScrolled && (
                <motion.div
                  initial={{ opacity: 1 }}
                  animate={{ opacity: isScrolled ? 0 : 1 }}
                  className="flex items-center gap-2 mb-2"
                >
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    business.type === 'Negocio'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {business.type}
                  </span>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span className="text-sm font-semibold text-gray-700">4.8</span>
                    <span className="text-xs text-gray-500">(23 reseñas)</span>
                  </div>
                </motion.div>
              )}

              <div className="flex items-center gap-2">
                <button className={`bg-gradient-to-br from-purple-500 to-pink-500 rounded-full hover:scale-110 transition-all ${isScrolled ? 'p-1.5' : 'p-2'}`}>
                  <Instagram className={`text-white ${isScrolled ? 'w-3 h-3' : 'w-4 h-4'}`} />
                </button>
                <button className={`bg-blue-600 rounded-full hover:scale-110 transition-all ${isScrolled ? 'p-1.5' : 'p-2'}`}>
                  <Facebook className={`text-white ${isScrolled ? 'w-3 h-3' : 'w-4 h-4'}`} />
                </button>
              </div>
            </div>
          </div>

          {!isScrolled && (
            <motion.p
              initial={{ opacity: 1, height: 'auto' }}
              animate={{
                opacity: isScrolled ? 0 : 1,
                height: isScrolled ? 0 : 'auto'
              }}
              transition={{ duration: 0.2 }}
              className="text-sm text-gray-600 leading-relaxed mt-4"
            >
              Especialistas en repostería artesanal. Más de 10 años creando momentos dulces para tu familia. Productos frescos elaborados diariamente con ingredientes de primera calidad.
            </motion.p>
          )}
        </motion.div>
      </div>

      {/* Products Section */}
      <div ref={scrollContainerRef} className="flex-1 overflow-auto px-4 pt-4 pb-28">
        <h3 className="text-lg font-bold text-gray-900 mb-2">Productos disponibles</h3>

        {/* Instruction Message */}
        <div className="bg-teal-50 border border-teal-200 rounded-xl p-3 mb-4 flex items-start gap-2">
          <span className="text-2xl">👆</span>
          <p className="text-xs text-teal-800 leading-relaxed">
            Haz <strong>doble clic</strong> en un producto para activar el modo selección
          </p>
        </div>

        {/* Products List */}
        <div className="space-y-3">
          {products.map((product) => {
            const isSelected = selectedProducts.includes(product.id);
            return (
              <div
                key={product.id}
                onClick={() => handleProductClick(product.id)}
                className={`bg-white/80 backdrop-blur-sm rounded-2xl p-4 border-2 transition-all cursor-pointer ${
                  isSelected
                    ? 'border-teal-500 shadow-lg shadow-teal-500/30'
                    : 'border-white/50 shadow-md hover:shadow-lg'
                }`}
              >
                <div className="flex gap-3">
                  <div className="relative">
                    <ImageWithFallback
                      src={product.image}
                      alt={product.name}
                      className="w-20 h-20 rounded-xl object-cover"
                    />
                    {isSelected && (
                      <div className="absolute inset-0 bg-teal-500/30 rounded-xl flex items-center justify-center">
                        <div className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-lg">✓</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 text-sm mb-1">{product.name}</h4>
                    <p className="text-xs text-gray-600 mb-2 line-clamp-2">{product.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-base font-bold text-gray-900">${product.price.toLocaleString('es-CL')}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Order Button */}
      {selectedProducts.length > 0 && (
        <div className="absolute bottom-20 left-0 right-0 p-4 bg-gradient-to-t from-white via-white to-transparent">
          <button
            onClick={() => onCheckout(selectedProducts, products)}
            className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 text-white py-4 px-6 rounded-full font-semibold shadow-xl shadow-teal-500/30 hover:shadow-2xl hover:shadow-teal-500/40 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <span>Realizar pedido ({selectedProducts.length})</span>
          </button>
        </div>
      )}
    </div>
  );
}

function BottomNav({ activeTab, setActiveTab, onNavigate }: { activeTab: string; setActiveTab: (tab: string) => void; onNavigate?: (tab: string) => void }) {
  return (
    <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-3 shadow-lg">
      <div className="flex items-center justify-around">
        {[
          { id: 'home', icon: Home, label: 'Inicio' },
          { id: 'profile', icon: User, label: 'Perfil' },
          { id: 'favorites', icon: Heart, label: 'Favoritos' },
          { id: 'requests', icon: FileText, label: 'Solicitudes' }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                if (onNavigate) onNavigate(tab.id);
              }}
              className={`flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-all ${
                isActive ? 'text-teal-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ServiceCheckoutScreen({ onBack, service, provider, activeTab, setActiveTab }: { onBack: () => void; service: any; provider: any; activeTab: string; setActiveTab: (tab: string) => void }) {
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('');
  const [scheduleOption, setScheduleOption] = useState<'now' | 'schedule' | null>(null);
  const [message, setMessage] = useState('');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [showNotification, setShowNotification] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    setShowNotification(true);
    setTimeout(() => {
      setShowNotification(false);
      onBack();
    }, 3000);
  };

  return (
    <div className="size-full bg-gradient-to-b from-white via-blue-50/30 to-blue-100/40 flex flex-col">
      {/* Header */}
      <div className="px-4 pt-6 pb-4 border-b border-white/50">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h2 className="text-xl font-bold text-gray-900">Resumen del Servicio</h2>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-4 pt-4 pb-28">
        {/* Provider Info */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-white/50 shadow-md mb-4">
          <div className="flex items-center gap-3 mb-3">
            <ImageWithFallback
              src={provider.image}
              alt={provider.name}
              className="w-14 h-14 rounded-full object-cover"
            />
            <div className="flex-1">
              <h3 className="font-bold text-gray-900">{provider.name}</h3>
              <p className="text-xs text-gray-600">{provider.description}</p>
            </div>
          </div>
        </div>

        {/* Service Details */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-white/50 shadow-md mb-4">
          <h4 className="font-bold text-gray-900 mb-3">Servicio solicitado</h4>
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-4">
            <h5 className="font-bold text-purple-900 mb-1">{service.name}</h5>
            <p className="text-sm text-purple-700">{service.description}</p>
          </div>
        </div>

        {/* Schedule Options */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-white/50 shadow-md mb-4">
          <h4 className="font-bold text-gray-900 mb-3">¿Cuándo lo necesitas?</h4>

          {/* Two Options */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <button
              onClick={() => {
                setScheduleOption('now');
                setDeliveryDate('');
                setDeliveryTime('');
              }}
              className={`py-3 px-4 rounded-xl font-semibold text-sm transition-all flex flex-col items-center justify-center gap-2 ${
                scheduleOption === 'now'
                  ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Clock className="w-6 h-6" />
              Lo necesito AHORA
            </button>

            <button
              onClick={() => setScheduleOption('schedule')}
              className={`py-3 px-4 rounded-xl font-semibold text-sm transition-all flex flex-col items-center justify-center gap-2 ${
                scheduleOption === 'schedule'
                  ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Calendar className="w-6 h-6" />
              Agendar
            </button>
          </div>

          {/* Date and Time Pickers - Only show when "Agendar" is selected */}
          {scheduleOption === 'schedule' && (
            <div className="space-y-3 bg-purple-50 border border-purple-200 rounded-xl p-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Fecha</label>
                <input
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Hora</label>
                <input
                  type="time"
                  value={deliveryTime}
                  onChange={(e) => setDeliveryTime(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                />
              </div>
            </div>
          )}
        </div>

        {/* Message Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-white/50 shadow-md mb-4">
          <h4 className="font-bold text-gray-900 mb-3">Mensaje personalizado (opcional)</h4>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Describe detalles adicionales sobre el servicio que necesitas..."
            className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all resize-none"
            rows={4}
          />
        </div>

        {/* Image Upload Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-white/50 shadow-md mb-4">
          <h4 className="font-bold text-gray-900 mb-2">Adjuntar foto (opcional)</h4>
          <p className="text-xs text-gray-500 mb-3">La foto estará disponible por 24 horas</p>

          {uploadedImage ? (
            <div className="relative">
              <img src={uploadedImage} alt="Preview" className="w-full h-48 object-cover rounded-xl" />
              <button
                onClick={() => setUploadedImage(null)}
                className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <label className="w-full border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-purple-500 hover:bg-purple-50/50 transition-all">
              <Camera className="w-10 h-10 text-gray-400 mb-2" />
              <span className="text-sm text-gray-600">Toca para subir una foto</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
          )}
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white py-4 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 mb-4"
        >
          <Send className="w-5 h-5" />
          Solicitar Servicio
        </button>
      </div>

      {/* Success Notification */}
      {showNotification && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl transform animate-in">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full flex items-center justify-center mb-4">
                <Check className="w-8 h-8 text-white" strokeWidth={3} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">¡Solicitud enviada!</h3>
              <p className="text-sm text-gray-600">
                Tu solicitud de servicio ha sido enviada a {provider.name}. Te notificaremos cuando respondan.
              </p>
            </div>
          </div>
        </div>
      )}

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}

function ServiceProfileScreen({ service, onBack, onRequestService, activeTab, setActiveTab }: { service: any; onBack: () => void; onRequestService: (selectedService: any) => void; activeTab: string; setActiveTab: (tab: string) => void }) {
  const [selectedService, setSelectedService] = useState<any>(null);

  return (
    <div className="size-full bg-gradient-to-b from-white via-blue-50/30 to-blue-100/40 flex flex-col">
      {/* Header */}
      <div className="px-4 pt-6 pb-4 border-b border-white/50">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h2 className="text-xl font-bold text-gray-900">Perfil del Servicio</h2>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-4 pt-4 pb-28">
        {/* Profile Card */}
        <div className="bg-gradient-to-br from-purple-500 via-indigo-500 to-blue-500 rounded-3xl overflow-hidden shadow-2xl mb-4 border border-white/20">
          <div className="p-6">
            <div className="flex items-start gap-4 mb-4">
              <ImageWithFallback
                src={service.image}
                alt={service.name}
                className="w-24 h-24 rounded-2xl object-cover border-4 border-white/30 shadow-xl"
              />
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-white mb-1">{service.name}</h3>
                <p className="text-sm text-white/90 mb-2">{service.description}</p>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-semibold text-white">
                    {service.type === 'Negocio' ? 'Empresa' : 'Independiente'}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    service.isOpen ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                  }`}>
                    {service.isOpen ? 'Disponible' : 'No disponible'}
                  </span>
                </div>
              </div>
            </div>

            {/* Social Media */}
            <div className="flex gap-3">
              <a
                href={`https://instagram.com/${service.instagram?.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl py-3 px-4 flex items-center justify-center gap-2 hover:bg-white/30 transition-all"
              >
                <Instagram className="w-5 h-5 text-white" />
                <span className="text-sm font-semibold text-white">Instagram</span>
              </a>
              <a
                href={`https://facebook.com/${service.facebook}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl py-3 px-4 flex items-center justify-center gap-2 hover:bg-white/30 transition-all"
              >
                <Facebook className="w-5 h-5 text-white" />
                <span className="text-sm font-semibold text-white">Facebook</span>
              </a>
            </div>
          </div>
        </div>

        {/* Services List */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-white/50 shadow-md">
          <h4 className="font-bold text-gray-900 mb-2">Servicios disponibles</h4>
          <p className="text-xs text-gray-500 mb-4 italic">Haz doble clic para seleccionar el servicio</p>
          <div className="space-y-3">
            {service.services?.map((item: any) => (
              <div
                key={item.id}
                onDoubleClick={() => {
                  setSelectedService(item);
                  onRequestService(item);
                }}
                className={`w-full bg-gradient-to-br from-purple-50 to-indigo-50 border-2 rounded-xl p-4 hover:shadow-md transition-all cursor-pointer ${
                  selectedService?.id === item.id
                    ? 'border-purple-500 bg-gradient-to-br from-purple-100 to-indigo-100'
                    : 'border-purple-200'
                }`}
              >
                <h5 className="font-bold text-purple-900 mb-1">{item.name}</h5>
                <p className="text-sm text-purple-700">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}

function ServiciosScreen({ onBack, onSelectService, activeTab, setActiveTab }: { onBack: () => void; onSelectService: (service: any) => void; activeTab: string; setActiveTab: (tab: string) => void }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('todos');
  const [maxDistance, setMaxDistance] = useState(10);
  const [showDistanceModal, setShowDistanceModal] = useState(false);

  const filters = [
    { id: 'todos', label: 'Todos' },
    { id: 'negocios', label: 'Empresas' },
    { id: 'particular', label: 'Independientes' },
    { id: 'distance', label: `${maxDistance} km` }
  ];

  const allResults = [
    // GASFITERÍA
    {
      id: 1,
      name: 'Gasfitería Express 24/7',
      description: 'Reparaciones urgentes de gasfitería',
      distance: 0.6,
      type: 'Particular',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&q=80',
      keywords: 'reparación cañerías, destape wc, fuga de agua, instalación grifería, gasfiter urgente',
      instagram: '@gasfiteria_express',
      facebook: 'GasfiteriaExpress24',
      services: [
        { id: 1, name: 'Cambio de cañería', description: 'Reemplazo de cañerías antiguas o dañadas' },
        { id: 2, name: 'Instalación de calefont', description: 'Instalación y conexión de calefont a gas' },
        { id: 3, name: 'Destape de WC y cañerías', description: 'Destape urgente de baños y desagües' },
        { id: 4, name: 'Reparación de fuga de agua', description: 'Detección y reparación de filtraciones' },
        { id: 5, name: 'Instalación de grifería', description: 'Instalación de llaves y grifos' }
      ]
    },
    {
      id: 2,
      name: 'Juan Pérez Gasfiter',
      description: 'Gasfitería a domicilio, presupuesto sin cargo',
      distance: 1.2,
      type: 'Particular',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80',
      keywords: 'gasfiter barato, reparación baños, instalación lavamanos, cambio llaves'
    },

    // ELECTRICIDAD
    {
      id: 3,
      name: 'Electricidad Profesional',
      description: 'Instalaciones eléctricas certificadas',
      distance: 0.8,
      type: 'Negocio',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1473186578172-c141e6798cf4?w=400&q=80',
      keywords: 'electricista certificado, instalación paneles solares, reparación cortocircuitos, instalación enchufes'
    },
    {
      id: 4,
      name: 'Marcos Electricista',
      description: 'Electricista con 10 años de experiencia',
      distance: 1.5,
      type: 'Particular',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
      keywords: 'electricista económico, reparación tableros, instalación luminarias'
    },

    // BELLEZA Y ESTÉTICA
    {
      id: 5,
      name: 'Salón de Belleza Glamour',
      description: 'Peluquería y tratamientos estéticos',
      distance: 0.9,
      type: 'Negocio',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&q=80',
      keywords: 'corte de pelo mujer, tintura cabello, manicure, pedicure, tratamiento keratina'
    },
    {
      id: 6,
      name: 'Estética Carolina',
      description: 'Manicure, pedicure y depilación',
      distance: 1.1,
      type: 'Particular',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&q=80',
      keywords: 'manicure gel, uñas acrílicas, depilación con cera, diseño de uñas'
    },

    // EDUCACIÓN
    {
      id: 7,
      name: 'Academia de Inglés SmartLearn',
      description: 'Clases de inglés para todas las edades',
      distance: 1.3,
      type: 'Negocio',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&q=80',
      keywords: 'clases de inglés para niños, inglés conversacional, preparación TOEFL, inglés empresarial'
    },
    {
      id: 8,
      name: 'Profesora Matemáticas',
      description: 'Reforzamiento escolar matemáticas',
      distance: 0.7,
      type: 'Particular',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80',
      keywords: 'clases particulares matemáticas, reforzamiento PSU, ayuda tareas, preparación pruebas'
    },

    // TECNOLOGÍA
    {
      id: 9,
      name: 'TechRepair - Reparación Celulares',
      description: 'Reparación de smartphones y tablets',
      distance: 1.0,
      type: 'Negocio',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1556656793-08538906a9f8?w=400&q=80',
      keywords: 'reparación pantalla iphone, cambio batería celular, reparación samsung, desbloqueo celular'
    },
    {
      id: 10,
      name: 'Soporte PC a Domicilio',
      description: 'Reparación de computadores',
      distance: 1.8,
      type: 'Particular',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&q=80',
      keywords: 'formateo computador, instalación windows, reparación notebook, limpieza virus'
    },

    // HOGAR Y CONSTRUCCIÓN
    {
      id: 11,
      name: 'Pinturas y Remodelaciones',
      description: 'Pintores profesionales',
      distance: 2.0,
      type: 'Negocio',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=400&q=80',
      keywords: 'pintor casa, pintura fachadas, remodelación baños, instalación porcelanato'
    },
    {
      id: 12,
      name: 'Carpintería El Maestro',
      description: 'Muebles a medida y reparaciones',
      distance: 1.7,
      type: 'Negocio',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=400&q=80',
      keywords: 'muebles a medida, closet empotrado, reparación muebles, carpintero'
    },

    // SALUD Y BIENESTAR
    {
      id: 13,
      name: 'Centro de Masajes Relax',
      description: 'Masajes terapéuticos y relajantes',
      distance: 1.4,
      type: 'Negocio',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&q=80',
      keywords: 'masajes terapéuticos, masajes relajantes, quiromasaje, reflexología'
    },
    {
      id: 14,
      name: 'Nutricionista María Fernanda',
      description: 'Planes nutricionales personalizados',
      distance: 0.9,
      type: 'Particular',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80',
      keywords: 'nutricionista online, plan de alimentación, dieta personalizada, bajar de peso'
    },

    // EVENTOS
    {
      id: 15,
      name: 'DJ Profesional Eventos',
      description: 'Música para fiestas y eventos',
      distance: 2.5,
      type: 'Particular',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80',
      keywords: 'dj para fiestas, animación eventos, música matrimonios, dj cumpleaños'
    },
    {
      id: 16,
      name: 'Fotografía Profesional',
      description: 'Fotografía de eventos y retratos',
      distance: 1.2,
      type: 'Negocio',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=400&q=80',
      keywords: 'fotógrafo matrimonios, sesión fotos, fotografía eventos, book fotográfico'
    },

    // MASCOTAS
    {
      id: 17,
      name: 'Veterinaria PetCare',
      description: 'Atención veterinaria integral',
      distance: 0.8,
      type: 'Negocio',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=400&q=80',
      keywords: 'veterinario urgencias, vacunas perros, esterilización gatos, consulta veterinaria'
    },
    {
      id: 18,
      name: 'Peluquería Canina',
      description: 'Baño y corte para mascotas',
      distance: 1.5,
      type: 'Negocio',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=400&q=80',
      keywords: 'peluquería perros, baño mascotas, corte pelo perros, grooming'
    },

    // LIMPIEZA
    {
      id: 19,
      name: 'Limpieza Express',
      description: 'Servicio de limpieza profesional',
      distance: 1.1,
      type: 'Negocio',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&q=80',
      keywords: 'limpieza profunda casa, aseo oficinas, limpieza mudanza, servicio doméstico'
    },

    // TRANSPORTE
    {
      id: 20,
      name: 'Fletes y Mudanzas Rápido',
      description: 'Servicio de fletes y mudanzas',
      distance: 2.3,
      type: 'Negocio',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1600880292089-90a7e086ee0c?w=400&q=80',
      keywords: 'fletes económicos, mudanzas completas, retiro muebles, flete pequeño'
    },

    // JARDINERÍA
    {
      id: 21,
      name: 'Jardines y Paisajismo Verde',
      description: 'Diseño y mantención de jardines',
      distance: 1.6,
      type: 'Negocio',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&q=80',
      keywords: 'jardinero, mantención jardines, poda de árboles, paisajismo, diseño jardines'
    },
    {
      id: 22,
      name: 'Jardinero Luis Parra',
      description: 'Servicio de jardinería a domicilio',
      distance: 1.0,
      type: 'Particular',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
      keywords: 'jardinero, corte de pasto, limpieza de jardín, poda, jardinero económico'
    },

    // LAVADO DE AUTOS
    {
      id: 23,
      name: 'AutoSpa Premium',
      description: 'Lavado y detailing automotriz',
      distance: 0.9,
      type: 'Negocio',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1601362840469-51e4d8d58785?w=400&q=80',
      keywords: 'carwash, lavado de auto, limpieza de auto, detailing, pulido auto, encerado',
      instagram: '@autospa_premium',
      facebook: 'AutoSpaPremium',
      services: [
        { id: 1, name: 'Lavado Exterior Completo', description: 'Lavado y secado exterior profesional' },
        { id: 2, name: 'Lavado Interior y Exterior', description: 'Lavado completo interior y exterior' },
        { id: 3, name: 'Detailing Premium', description: 'Pulido, encerado y protección de pintura' },
        { id: 4, name: 'Limpieza de Motor', description: 'Lavado y desengrase de motor' },
        { id: 5, name: 'Tratamiento de Tapicería', description: 'Limpieza profunda de asientos y alfombras' }
      ]
    },
    {
      id: 24,
      name: 'Lavado Express El Brillo',
      description: 'Lavado rápido de vehículos',
      distance: 1.3,
      type: 'Negocio',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=400&q=80',
      keywords: 'carwash, lavado auto express, lavado motor, aspirado, limpieza vehículos'
    },
    {
      id: 25,
      name: 'Lavado a Domicilio Carlos',
      description: 'Lavado de autos en tu casa',
      distance: 0.7,
      type: 'Particular',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80',
      keywords: 'lavado de auto a domicilio, carwash móvil, limpieza auto en casa, lavado ecológico'
    },

    // MECÁNICA Y HOJALATERÍA
    {
      id: 26,
      name: 'Taller Mecánico AutoFix',
      description: 'Mecánica y hojalatería',
      distance: 1.5,
      type: 'Negocio',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400&q=80',
      keywords: 'desabolladura, hojalatería, pintura automotriz, mecánica general, reparación autos'
    },
    {
      id: 27,
      name: 'Hojalatería y Pintura Rodríguez',
      description: 'Desabolladura y pintura de vehículos',
      distance: 2.0,
      type: 'Negocio',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1625047509168-a7026f36de04?w=400&q=80',
      keywords: 'desabolladura, hojalatería, pintura de autos, reparación chapa, enderezado'
    },
    {
      id: 28,
      name: 'Taller Multimarca Speed',
      description: 'Mecánica rápida y confiable',
      distance: 1.8,
      type: 'Negocio',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?w=400&q=80',
      keywords: 'mecánica, cambio aceite, alineación, balanceo, scanner automotriz, desabolladura'
    }
  ];

  // Filtrar resultados
  const filteredResults = allResults.filter((result) => {
    // Filtro por búsqueda
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchesName = result.name.toLowerCase().includes(query);
      const matchesDescription = result.description.toLowerCase().includes(query);
      const matchesKeywords = result.keywords?.toLowerCase().includes(query) || false;

      if (!matchesName && !matchesDescription && !matchesKeywords) {
        return false;
      }
    }

    // Filtro por distancia
    if (result.distance > maxDistance) return false;

    // Filtro por tipo
    if (selectedFilter === 'negocios' && result.type !== 'Negocio') return false;
    if (selectedFilter === 'particular' && result.type !== 'Particular') return false;

    return true;
  });

  const formatDistance = (km: number) => {
    if (km < 1) {
      return `${Math.round(km * 1000)} m`;
    }
    return `${km.toFixed(1)} km`;
  };

  return (
    <div className="size-full bg-gradient-to-b from-white via-blue-50/30 to-blue-100/40 flex flex-col">
      {/* Header */}
      <div className="px-4 pt-6 pb-4 border-b border-white/50">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={onBack} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ej: gasfiter, clases, masajes..."
              className="w-full bg-gray-50 border border-gray-200 rounded-full py-2.5 pl-11 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
            />
            <button className="absolute inset-y-0 right-4 flex items-center">
              <Mic className="w-4 h-4 text-gray-400 hover:text-teal-600 transition-colors" />
            </button>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-1 pb-2">
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => {
                if (filter.id === 'distance') {
                  setShowDistanceModal(true);
                } else {
                  setSelectedFilter(filter.id);
                }
              }}
              className={`flex-1 px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                (selectedFilter === filter.id || filter.id === 'distance')
                  ? filter.id === 'distance'
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'bg-teal-500 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-auto px-4 pt-4">
        <p className="text-sm text-gray-600 mb-4">{filteredResults.length} servicios cerca de ti</p>

        <div className="space-y-3 pb-6">
          {filteredResults.map((result) => (
            <div
              key={result.id}
              onClick={() => onSelectService(result)}
              className="bg-white border border-gray-200 rounded-2xl p-4 hover:shadow-md transition-all flex gap-4 cursor-pointer"
            >
              {/* Image */}
              <div className="flex-shrink-0">
                <ImageWithFallback
                  src={result.image}
                  alt={result.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900 text-sm">{result.name}</h3>
                  <span className="text-xs text-gray-500 whitespace-nowrap">{formatDistance(result.distance)}</span>
                </div>
                <p className="text-xs text-gray-600 mb-2 line-clamp-2">{result.description}</p>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    result.type === 'Negocio'
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {result.type === 'Negocio' ? 'Empresa' : 'Independiente'}
                  </span>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span className={`text-xs ${result.isOpen ? 'text-green-600' : 'text-red-600'}`}>
                      {result.isOpen ? 'Disponible' : 'No disponible'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Distance Modal - Same as Negocios */}
      {showDistanceModal && (
        <div className="absolute inset-0 bg-black/50 flex items-end z-50" onClick={() => setShowDistanceModal(false)}>
          <div className="bg-white rounded-t-3xl p-6 w-full" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-6"></div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Ajustar distancia</h3>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-600">Distancia máxima</span>
                <span className="text-2xl font-bold text-teal-600">{maxDistance} km</span>
              </div>

              <div className="relative py-2">
                <input
                  type="range"
                  min="0.5"
                  max="10"
                  step="0.5"
                  value={maxDistance}
                  onChange={(e) => setMaxDistance(parseFloat(e.target.value))}
                  style={{
                    background: `linear-gradient(to right, #14b8a6 0%, #14b8a6 ${((maxDistance - 0.5) / 9.5) * 100}%, #e5e7eb ${((maxDistance - 0.5) / 9.5) * 100}%, #e5e7eb 100%)`
                  }}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer slider-custom"
                />
              </div>

              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>0.5 km</span>
                <span>10 km</span>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 mb-6">
              {[1, 2, 5, 10].map((km) => (
                <button
                  key={km}
                  onClick={() => setMaxDistance(km)}
                  className={`py-2 rounded-full text-sm font-medium transition-all ${
                    maxDistance === km
                      ? 'bg-teal-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {km} km
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowDistanceModal(false)}
              className="w-full bg-teal-500 text-white py-3 rounded-full font-semibold hover:bg-teal-600 transition-colors"
            >
              Aplicar
            </button>
          </div>
        </div>
      )}

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} onNavigate={(tab) => {}} />
    </div>
  );
}

function NegociosScreen({ onBack, onSelectBusiness, activeTab, setActiveTab }: { onBack: () => void; onSelectBusiness: (business: any) => void; activeTab: string; setActiveTab: (tab: string) => void }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('todos');
  const [maxDistance, setMaxDistance] = useState(10);
  const [showDistanceModal, setShowDistanceModal] = useState(false);

  const filters = [
    { id: 'todos', label: 'Todos' },
    { id: 'negocios', label: 'Negocios' },
    { id: 'particular', label: 'Particular' },
    { id: 'distance', label: `${maxDistance} km` }
  ];

  const allResults = [
    // REPOSTERÍA Y ALIMENTOS
    {
      id: 1,
      name: 'Pastelería Delicias Tere',
      description: 'Repostería artesanal y tortas personalizadas',
      distance: 0.85,
      type: 'Negocio',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&q=80',
      keywords: 'tortas de cumpleaños personalizadas, pasteles para bodas, cupcakes decorados, galletas de navidad, postres artesanales'
    },
    {
      id: 2,
      name: 'Tortas del Barrio',
      description: 'Tortas personalizadas para toda ocasión',
      distance: 0.5,
      type: 'Negocio',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=400&q=80',
      keywords: 'tortas personalizadas, diseños únicos, tortas temáticas'
    },
    {
      id: 3,
      name: 'Pizzería Don Giovanni',
      description: 'Pizzas artesanales a leña',
      distance: 0.4,
      type: 'Negocio',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&q=80',
      keywords: 'pizza artesanal, pizza a domicilio, pizza familiar, comida italiana'
    },
    {
      id: 4,
      name: 'Cocina Casera Doña Rosa',
      description: 'Comida casera y saludable',
      distance: 0.6,
      type: 'Particular',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80',
      keywords: 'almuerzo casero, colaciones saludables, comida delivery, menú del día'
    },

    // ARTESANÍA Y MANUALIDADES
    {
      id: 5,
      name: 'Artesanías María',
      description: 'Productos artesanales hechos a mano',
      distance: 0.9,
      type: 'Particular',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=400&q=80',
      keywords: 'artesanía chilena, tejidos a mano, cerámica artesanal, regalos personalizados'
    },
    {
      id: 6,
      name: 'Taller de Manualidades',
      description: 'Decoraciones y regalos hechos a mano',
      distance: 1.2,
      type: 'Negocio',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=400&q=80',
      keywords: 'manualidades personalizadas, decoración eventos, souvenirs, tarjetas artesanales'
    },
    {
      id: 7,
      name: 'Macramé y Tejidos',
      description: 'Productos de macramé y tejido a crochet',
      distance: 1.5,
      type: 'Particular',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1611327073339-2b2ab3d8c4d4?w=400&q=80',
      keywords: 'macramé decorativo, tejidos a crochet, cortinas macramé, tapices artesanales'
    },

    // JOYERÍA Y ACCESORIOS
    {
      id: 8,
      name: 'Joyería Artesanal Luna',
      description: 'Joyería hecha a mano con diseños únicos',
      distance: 1.1,
      type: 'Negocio',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&q=80',
      keywords: 'joyería artesanal, collares personalizados, anillos plata, aretes hechos a mano'
    },
    {
      id: 9,
      name: 'Accesorios Bella',
      description: 'Accesorios de moda y bisutería',
      distance: 0.8,
      type: 'Particular',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400&q=80',
      keywords: 'bisutería, accesorios para el pelo, carteras artesanales, pulseras de moda'
    },

    // FLORES Y PLANTAS
    {
      id: 10,
      name: 'Florería El Jardín',
      description: 'Arreglos florales para toda ocasión',
      distance: 0.7,
      type: 'Negocio',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=400&q=80',
      keywords: 'ramos de flores, arreglos florales, flores para eventos, coronas fúnebres'
    },
    {
      id: 11,
      name: 'Vivero Las Plantas',
      description: 'Plantas de interior y exterior',
      distance: 1.3,
      type: 'Negocio',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1466781783364-36c955e42a7f?w=400&q=80',
      keywords: 'plantas ornamentales, suculentas, cactus, plantas de interior, maceteros'
    },

    // ROPA Y TEXTILES
    {
      id: 12,
      name: 'Boutique Fashion',
      description: 'Ropa de moda para mujer',
      distance: 1.0,
      type: 'Negocio',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=400&q=80',
      keywords: 'ropa mujer, vestidos elegantes, ropa casual, accesorios moda'
    },
    {
      id: 13,
      name: 'Ropa Deportiva FitStyle',
      description: 'Indumentaria deportiva y fitness',
      distance: 1.8,
      type: 'Negocio',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1556906781-9a412961c28c?w=400&q=80',
      keywords: 'ropa deportiva, zapatillas running, yoga wear, gimnasio'
    },

    // LAVANDERÍA (servicio sobre productos)
    {
      id: 14,
      name: 'Lavandería y Tintorería',
      description: 'Lavado y planchado de ropa',
      distance: 0.7,
      type: 'Negocio',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?w=400&q=80',
      keywords: 'lavandería a domicilio, tintorería, planchado ropa, lavado cortinas'
    },

    // LIBRERÍA Y PAPELERÍA
    {
      id: 15,
      name: 'Librería Santillana',
      description: 'Libros, útiles escolares y papelería',
      distance: 0.9,
      type: 'Negocio',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&q=80',
      keywords: 'útiles escolares, libros, cuadernos, material oficina, papelería'
    },

    // PRODUCTOS PARA MASCOTAS
    {
      id: 16,
      name: 'Pet Shop Mi Mascota',
      description: 'Alimentos y accesorios para mascotas',
      distance: 1.2,
      type: 'Negocio',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400&q=80',
      keywords: 'comida para perros, alimento gatos, juguetes mascotas, collares correas'
    },

    // COSMÉTICOS Y BELLEZA (productos)
    {
      id: 17,
      name: 'Cosmética Natural',
      description: 'Productos de belleza naturales y orgánicos',
      distance: 1.4,
      type: 'Negocio',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=400&q=80',
      keywords: 'cosméticos naturales, cremas faciales, productos orgánicos, maquillaje natural'
    },

    // TECNOLOGÍA (productos)
    {
      id: 18,
      name: 'TechStore',
      description: 'Accesorios y productos tecnológicos',
      distance: 1.6,
      type: 'Negocio',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=400&q=80',
      keywords: 'fundas celular, cargadores, audífonos, mouse teclado, accesorios tech'
    },

    // PANADERÍA
    {
      id: 19,
      name: 'Panadería El Horno de Oro',
      description: 'Pan artesanal recién horneado',
      distance: 0.5,
      type: 'Negocio',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80',
      keywords: 'pan artesanal, pan integral, empanadas, masas caseras, marraquetas'
    },

    // PRODUCTOS ORGÁNICOS
    {
      id: 20,
      name: 'Almacén Orgánico Verde',
      description: 'Productos orgánicos y saludables',
      distance: 1.3,
      type: 'Negocio',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80',
      keywords: 'productos orgánicos, frutas verduras orgánicas, alimentos saludables, sin pesticidas'
    },

    // BEBIDAS Y CAFETERÍA
    {
      id: 21,
      name: 'Café Frappé Express',
      description: 'Bebidas frías y calientes, hielo frappé',
      distance: 0.3,
      type: 'Negocio',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&q=80',
      keywords: 'hielo frappé, café frío, frappuccino, bebidas heladas, café express'
    },

    // COMIDA CHILENA
    {
      id: 22,
      name: 'Cocina Casera Doña Elsa',
      description: 'Comida chilena casera y tradicional',
      distance: 0.8,
      type: 'Particular',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80',
      keywords: 'pastel de choclo, empanadas, cazuela, comida casera chilena, menú del día'
    },

    // CALZADO Y ACCESORIOS DEPORTIVOS
    {
      id: 23,
      name: 'Zapatería Sport Plus',
      description: 'Calzado deportivo y accesorios',
      distance: 1.0,
      type: 'Negocio',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80',
      keywords: 'zapatillas nike, zapatillas adidas, calzado deportivo, cordones de zapatillas, zapatillas running'
    },

    // PAPELERÍA
    {
      id: 24,
      name: 'Librería y Papelería Central',
      description: 'Útiles escolares y material de oficina',
      distance: 0.6,
      type: 'Negocio',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&q=80',
      keywords: 'cartulina, papel lustre, útiles escolares, cuadernos, lápices, papelería'
    },

    // FARMACIA
    {
      id: 25,
      name: 'Farmacia Cruz Verde Plus',
      description: 'Medicamentos y productos de salud',
      distance: 0.4,
      type: 'Negocio',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=400&q=80',
      keywords: 'tapsín caliente, tapsin, medicamentos, remedios, vitaminas, farmacia'
    },

    // MINIMARKET
    {
      id: 26,
      name: 'Minimarket Don Luis',
      description: 'Abarrotes y productos de primera necesidad',
      distance: 0.5,
      type: 'Negocio',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=400&q=80',
      keywords: 'hielo, bebidas, abarrotes, despensa, almacén'
    },

    // DEPORTES
    {
      id: 27,
      name: 'Deportes y Más',
      description: 'Implementos y ropa deportiva',
      distance: 1.4,
      type: 'Negocio',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&q=80',
      keywords: 'zapatillas deportivas, ropa fitness, cordones zapatillas, balones, implementos deportivos'
    }
  ];

  // Filtrar resultados
  const filteredResults = allResults.filter((result) => {
    // Filtro por búsqueda (nombre, descripción y keywords)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchesName = result.name.toLowerCase().includes(query);
      const matchesDescription = result.description.toLowerCase().includes(query);
      const matchesKeywords = result.keywords?.toLowerCase().includes(query) || false;

      if (!matchesName && !matchesDescription && !matchesKeywords) {
        return false;
      }
    }

    // Filtro por distancia
    if (result.distance > maxDistance) return false;

    // Filtro por tipo
    if (selectedFilter === 'negocios' && result.type !== 'Negocio') return false;
    if (selectedFilter === 'particular' && result.type !== 'Particular') return false;

    return true;
  });

  const formatDistance = (km: number) => {
    if (km < 1) {
      return `${Math.round(km * 1000)} m`;
    }
    return `${km.toFixed(1)} km`;
  };

  return (
    <div className="size-full bg-gradient-to-b from-white via-blue-50/30 to-blue-100/40 flex flex-col">
      {/* Header */}
      <div className="px-4 pt-6 pb-4 border-b border-white/50">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={onBack} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ej: tortas, gasfiter, clases de inglés..."
              className="w-full bg-gray-50 border border-gray-200 rounded-full py-2.5 pl-11 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
            />
            <button className="absolute inset-y-0 right-4 flex items-center">
              <Mic className="w-4 h-4 text-gray-400 hover:text-teal-600 transition-colors" />
            </button>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => {
                if (filter.id === 'distance') {
                  setShowDistanceModal(true);
                } else {
                  setSelectedFilter(filter.id);
                }
              }}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                (selectedFilter === filter.id || filter.id === 'distance')
                  ? filter.id === 'distance'
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'bg-teal-500 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Distance Modal */}
      {showDistanceModal && (
        <div className="absolute inset-0 bg-black/50 flex items-end z-50" onClick={() => setShowDistanceModal(false)}>
          <div className="bg-white rounded-t-3xl p-6 w-full" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-6"></div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Ajustar distancia</h3>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-600">Distancia máxima</span>
                <span className="text-2xl font-bold text-teal-600">{maxDistance} km</span>
              </div>

              {/* Slider */}
              <div className="relative py-2">
                <input
                  type="range"
                  min="0.5"
                  max="10"
                  step="0.5"
                  value={maxDistance}
                  onChange={(e) => setMaxDistance(parseFloat(e.target.value))}
                  style={{
                    background: `linear-gradient(to right, #14b8a6 0%, #14b8a6 ${((maxDistance - 0.5) / 9.5) * 100}%, #e5e7eb ${((maxDistance - 0.5) / 9.5) * 100}%, #e5e7eb 100%)`
                  }}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer slider-custom"
                />
              </div>

              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>0.5 km</span>
                <span>10 km</span>
              </div>
            </div>

            {/* Quick presets */}
            <div className="grid grid-cols-4 gap-2 mb-6">
              {[1, 2, 5, 10].map((km) => (
                <button
                  key={km}
                  onClick={() => setMaxDistance(km)}
                  className={`py-2 rounded-full text-sm font-medium transition-all ${
                    maxDistance === km
                      ? 'bg-teal-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {km} km
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowDistanceModal(false)}
              className="w-full bg-teal-500 text-white py-3 rounded-full font-semibold hover:bg-teal-600 transition-colors"
            >
              Aplicar
            </button>
          </div>
        </div>
      )}

      {/* Results */}
      <div className="flex-1 overflow-auto px-4 pt-4">
        <p className="text-sm text-gray-600 mb-4">{filteredResults.length} resultados cerca de ti</p>

        <div className="space-y-3 pb-6">
          {filteredResults.map((result) => (
            <div
              key={result.id}
              onClick={() => onSelectBusiness(result)}
              className="bg-white border border-gray-200 rounded-2xl p-4 hover:shadow-md transition-all flex gap-4 cursor-pointer"
            >
              {/* Image */}
              <div className="flex-shrink-0">
                <ImageWithFallback
                  src={result.image}
                  alt={result.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900 text-sm">{result.name}</h3>
                  <span className="text-xs text-gray-500 whitespace-nowrap">{formatDistance(result.distance)}</span>
                </div>
                <p className="text-xs text-gray-600 mb-2 line-clamp-2">{result.description}</p>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    result.type === 'Negocio'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {result.type}
                  </span>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span className={`text-xs ${result.isOpen ? 'text-green-600' : 'text-red-600'}`}>
                      {result.isOpen ? 'Abierto' : 'Cerrado'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}

function GlobalSearchScreen({ onBack, initialQuery, currentLocation, activeTab, setActiveTab }: { onBack: () => void; initialQuery: string; currentLocation: any; activeTab: string; setActiveTab: (tab: string) => void }) {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedFilter, setSelectedFilter] = useState('todos');
  const [typeFilter, setTypeFilter] = useState('todos'); // 'todos', 'negocios', 'servicios'
  const [maxDistance, setMaxDistance] = useState(10);
  const [showDistanceModal, setShowDistanceModal] = useState(false);
  const [backendResults, setBackendResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  const filters = [
    { id: 'todos', label: 'Todos' },
    { id: 'negocios', label: 'Negocios' },
    { id: 'servicios', label: 'Servicios' },
    { id: 'particular', label: 'Particular' },
    { id: 'distance', label: `${maxDistance} km` }
  ];

  // Datos combinados de negocios y servicios
  const allResults = [
    // NEGOCIOS (productos físicos)
    {
      id: 1,
      name: 'Pastelería Delicias Tere',
      description: 'Repostería artesanal y tortas personalizadas',
      distance: 0.85,
      type: 'Negocio',
      category: 'negocios',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&q=80',
      keywords: 'tortas de cumpleaños personalizadas, pasteles para bodas, cupcakes decorados, galletas de navidad, postres artesanales'
    },
    {
      id: 2,
      name: 'Tortas del Barrio',
      description: 'Tortas personalizadas para toda ocasión',
      distance: 0.5,
      type: 'Negocio',
      category: 'negocios',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=400&q=80',
      keywords: 'tortas personalizadas, diseños únicos, tortas temáticas'
    },
    {
      id: 3,
      name: 'Pizzería Don Giovanni',
      description: 'Pizzas artesanales a leña',
      distance: 0.4,
      type: 'Negocio',
      category: 'negocios',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&q=80',
      keywords: 'pizza artesanal, pizza a domicilio, pizza familiar, comida italiana'
    },
    {
      id: 4,
      name: 'Artesanías María',
      description: 'Productos artesanales hechos a mano',
      distance: 0.9,
      type: 'Particular',
      category: 'negocios',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=400&q=80',
      keywords: 'artesanía chilena, tejidos a mano, cerámica artesanal, regalos personalizados'
    },
    {
      id: 5,
      name: 'Florería El Jardín',
      description: 'Arreglos florales para toda ocasión',
      distance: 0.7,
      type: 'Negocio',
      category: 'negocios',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=400&q=80',
      keywords: 'ramos de flores, arreglos florales, flores para eventos, coronas fúnebres'
    },
    {
      id: 6,
      name: 'Joyería Artesanal Luna',
      description: 'Joyería hecha a mano con diseños únicos',
      distance: 1.1,
      type: 'Negocio',
      category: 'negocios',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&q=80',
      keywords: 'joyería artesanal, collares personalizados, anillos plata, aretes hechos a mano'
    },
    {
      id: 7,
      name: 'Café Frappé Express',
      description: 'Bebidas frías y calientes, hielo frappé',
      distance: 0.3,
      type: 'Negocio',
      category: 'negocios',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&q=80',
      keywords: 'hielo frappé, café frío, frappuccino, bebidas heladas, café express'
    },
    {
      id: 8,
      name: 'Cocina Casera Doña Elsa',
      description: 'Comida chilena casera y tradicional',
      distance: 0.8,
      type: 'Particular',
      category: 'negocios',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80',
      keywords: 'pastel de choclo, empanadas, cazuela, comida casera chilena, menú del día'
    },
    {
      id: 9,
      name: 'Zapatería Sport Plus',
      description: 'Calzado deportivo y accesorios',
      distance: 1.0,
      type: 'Negocio',
      category: 'negocios',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80',
      keywords: 'zapatillas nike, zapatillas adidas, calzado deportivo, cordones de zapatillas, zapatillas running'
    },
    {
      id: 10,
      name: 'Librería y Papelería Central',
      description: 'Útiles escolares y material de oficina',
      distance: 0.6,
      type: 'Negocio',
      category: 'negocios',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&q=80',
      keywords: 'cartulina, papel lustre, útiles escolares, cuadernos, lápices, papelería'
    },
    {
      id: 11,
      name: 'Farmacia Cruz Verde Plus',
      description: 'Medicamentos y productos de salud',
      distance: 0.4,
      type: 'Negocio',
      category: 'negocios',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=400&q=80',
      keywords: 'tapsín caliente, tapsin, medicamentos, remedios, vitaminas, farmacia'
    },
    {
      id: 12,
      name: 'Minimarket Don Luis',
      description: 'Abarrotes y productos de primera necesidad',
      distance: 0.5,
      type: 'Negocio',
      category: 'negocios',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=400&q=80',
      keywords: 'hielo, bebidas, abarrotes, despensa, almacén'
    },
    {
      id: 13,
      name: 'Deportes y Más',
      description: 'Implementos y ropa deportiva',
      distance: 1.4,
      type: 'Negocio',
      category: 'negocios',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&q=80',
      keywords: 'zapatillas deportivas, ropa fitness, cordones zapatillas, balones, implementos deportivos'
    },

    // SERVICIOS
    {
      id: 101,
      name: 'Gasfitería Express 24/7',
      description: 'Reparaciones urgentes de gasfitería',
      distance: 0.6,
      type: 'Particular',
      category: 'servicios',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&q=80',
      keywords: 'reparación cañerías, destape wc, fuga de agua, instalación grifería, gasfiter urgente',
      instagram: '@gasfiteria_express',
      facebook: 'GasfiteriaExpress24',
      services: [
        { id: 1, name: 'Cambio de cañería', description: 'Reemplazo de cañerías antiguas o dañadas' },
        { id: 2, name: 'Instalación de calefont', description: 'Instalación y conexión de calefont a gas' },
        { id: 3, name: 'Destape de WC y cañerías', description: 'Destape urgente de baños y desagües' },
        { id: 4, name: 'Reparación de fuga de agua', description: 'Detección y reparación de filtraciones' },
        { id: 5, name: 'Instalación de grifería', description: 'Instalación de llaves y grifos' }
      ]
    },
    {
      id: 102,
      name: 'Juan Pérez Gasfiter',
      description: 'Gasfitería a domicilio, presupuesto sin cargo',
      distance: 1.2,
      type: 'Particular',
      category: 'servicios',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80',
      keywords: 'gasfiter barato, reparación baños, instalación lavamanos, cambio llaves'
    },
    {
      id: 103,
      name: 'Electricidad Profesional',
      description: 'Instalaciones eléctricas certificadas',
      distance: 0.8,
      type: 'Negocio',
      category: 'servicios',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1473186578172-c141e6798cf4?w=400&q=80',
      keywords: 'electricista certificado, instalación paneles solares, reparación cortocircuitos, instalación enchufes'
    },
    {
      id: 104,
      name: 'Salón de Belleza Glamour',
      description: 'Peluquería y tratamientos estéticos',
      distance: 0.9,
      type: 'Negocio',
      category: 'servicios',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&q=80',
      keywords: 'corte de pelo mujer, tintura cabello, manicure, pedicure, tratamiento keratina'
    },
    {
      id: 105,
      name: 'Academia de Inglés SmartLearn',
      description: 'Clases de inglés para todas las edades',
      distance: 1.3,
      type: 'Negocio',
      category: 'servicios',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&q=80',
      keywords: 'clases de inglés para niños, inglés conversacional, preparación TOEFL, inglés empresarial'
    },
    {
      id: 106,
      name: 'Centro de Masajes Relax',
      description: 'Masajes terapéuticos y relajantes',
      distance: 1.4,
      type: 'Negocio',
      category: 'servicios',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&q=80',
      keywords: 'masajes terapéuticos, masajes relajantes, quiromasaje, reflexología'
    },
    {
      id: 107,
      name: 'Veterinaria PetCare',
      description: 'Atención veterinaria integral',
      distance: 0.8,
      type: 'Negocio',
      category: 'servicios',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=400&q=80',
      keywords: 'veterinario urgencias, vacunas perros, esterilización gatos, consulta veterinaria'
    },
    {
      id: 108,
      name: 'Limpieza Express',
      description: 'Servicio de limpieza profesional',
      distance: 1.1,
      type: 'Negocio',
      category: 'servicios',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&q=80',
      keywords: 'limpieza profunda casa, aseo oficinas, limpieza mudanza, servicio doméstico'
    },
    {
      id: 109,
      name: 'Fletes y Mudanzas Rápido',
      description: 'Servicio de fletes y mudanzas',
      distance: 2.3,
      type: 'Negocio',
      category: 'servicios',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1600880292089-90a7e086ee0c?w=400&q=80',
      keywords: 'fletes económicos, mudanzas completas, retiro muebles, flete pequeño'
    },
    {
      id: 110,
      name: 'Jardines y Paisajismo Verde',
      description: 'Diseño y mantención de jardines',
      distance: 1.6,
      type: 'Negocio',
      category: 'servicios',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&q=80',
      keywords: 'jardinero, mantención jardines, poda de árboles, paisajismo, diseño jardines'
    },
    {
      id: 111,
      name: 'Jardinero Luis Parra',
      description: 'Servicio de jardinería a domicilio',
      distance: 1.0,
      type: 'Particular',
      category: 'servicios',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
      keywords: 'jardinero, corte de pasto, limpieza de jardín, poda, jardinero económico'
    },
    {
      id: 112,
      name: 'AutoSpa Premium',
      description: 'Lavado y detailing automotriz',
      distance: 0.9,
      type: 'Negocio',
      category: 'servicios',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1601362840469-51e4d8d58785?w=400&q=80',
      keywords: 'carwash, lavado de auto, limpieza de auto, detailing, pulido auto, encerado',
      instagram: '@autospa_premium',
      facebook: 'AutoSpaPremium',
      services: [
        { id: 1, name: 'Lavado Exterior Completo', description: 'Lavado y secado exterior profesional' },
        { id: 2, name: 'Lavado Interior y Exterior', description: 'Lavado completo interior y exterior' },
        { id: 3, name: 'Detailing Premium', description: 'Pulido, encerado y protección de pintura' },
        { id: 4, name: 'Limpieza de Motor', description: 'Lavado y desengrase de motor' },
        { id: 5, name: 'Tratamiento de Tapicería', description: 'Limpieza profunda de asientos y alfombras' }
      ]
    },
    {
      id: 113,
      name: 'Lavado Express El Brillo',
      description: 'Lavado rápido de vehículos',
      distance: 1.3,
      type: 'Negocio',
      category: 'servicios',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=400&q=80',
      keywords: 'carwash, lavado auto express, lavado motor, aspirado, limpieza vehículos'
    },
    {
      id: 114,
      name: 'Taller Mecánico AutoFix',
      description: 'Mecánica y hojalatería',
      distance: 1.5,
      type: 'Negocio',
      category: 'servicios',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400&q=80',
      keywords: 'desabolladura, hojalatería, pintura automotriz, mecánica general, reparación autos'
    },
    {
      id: 115,
      name: 'Hojalatería y Pintura Rodríguez',
      description: 'Desabolladura y pintura de vehículos',
      distance: 2.0,
      type: 'Negocio',
      category: 'servicios',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1625047509168-a7026f36de04?w=400&q=80',
      keywords: 'desabolladura, hojalatería, pintura de autos, reparación chapa, enderezado'
    },
    {
      id: 116,
      name: 'Lavado a Domicilio Carlos',
      description: 'Lavado de autos en tu casa',
      distance: 0.7,
      type: 'Particular',
      category: 'servicios',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80',
      keywords: 'lavado de auto a domicilio, carwash móvil, limpieza auto en casa, lavado ecológico'
    },
    {
      id: 117,
      name: 'Taller Multimarca Speed',
      description: 'Mecánica rápida y confiable',
      distance: 1.8,
      type: 'Negocio',
      category: 'servicios',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?w=400&q=80',
      keywords: 'mecánica, cambio aceite, alineación, balanceo, scanner automotriz, desabolladura'
    }
  ];

  const normalizeBackendResult = (result: any) => {
    const rawCategory = result.category ?? result.kind ?? result.resultType ?? 'negocios';
    const normalizedCategory = String(rawCategory).toLowerCase().includes('serv') ? 'servicios' : 'negocios';
    const normalizedType = result.type ?? (normalizedCategory === 'servicios' ? 'Servicio' : 'Negocio');

    return {
      ...result,
      id: result.id ?? result._id ?? result.businessId ?? result.name,
      name: result.name ?? result.businessName ?? result.title ?? 'Negocio sin nombre',
      description: result.description ?? result.subtitle ?? result.address ?? 'Sin descripción disponible',
      distance: Number(result.distance ?? result.distanceKm ?? result.distance_km ?? 0),
      type: normalizedType,
      category: normalizedCategory,
      isOpen: result.isOpen ?? result.open ?? true,
      image: result.image ?? result.imageUrl ?? result.logoUrl ?? 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=400&q=80'
    };
  };

  const fetchNearbyBusinesses = async (query = searchQuery, radius = maxDistance) => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;

    setIsSearching(true);
    setSearchError('');

    try {
      const params = new URLSearchParams({
        lat: String(currentLocation.lat),
        lng: String(currentLocation.lng),
        radius: String(radius),
        search: trimmedQuery
      });

      const response = await fetch(`http://localhost:3000/businesses/nearby?${params.toString()}`);

      if (!response.ok) {
        throw new Error('No se pudo conectar con la búsqueda');
      }

      const data = await response.json();
      const rawResults = Array.isArray(data) ? data : data.businesses ?? data.results ?? [];
      setBackendResults(rawResults.map(normalizeBackendResult));
    } catch (error) {
      setBackendResults([]);
      setSearchError(error instanceof Error ? error.message : 'No se pudo realizar la búsqueda');
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    fetchNearbyBusinesses(initialQuery, maxDistance);
  }, [initialQuery]);

  // Filtrar resultados entregados por el backend
  const filteredResults = backendResults.filter((result) => {
    // Filtro por distancia
    if (result.distance > maxDistance) return false;

    // Filtro por tipo (Negocio/Particular)
    if (selectedFilter === 'negocios' && result.type !== 'Negocio') return false;
    if (selectedFilter === 'particular' && result.type !== 'Particular') return false;

    // Filtro por categoría (negocios vs servicios)
    if (typeFilter === 'negocios' && result.category !== 'negocios') return false;
    if (typeFilter === 'servicios' && result.category !== 'servicios') return false;

    return true;
  });

  const formatDistance = (km: number) => {
    if (km < 1) {
      return `${Math.round(km * 1000)} m`;
    }
    return `${km.toFixed(1)} km`;
  };

  return (
    <div className="size-full bg-gradient-to-b from-white via-blue-50/30 to-blue-100/40 flex flex-col">
      {/* Header */}
      <div className="px-4 pt-6 pb-4 border-b border-white/50">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={onBack} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  fetchNearbyBusinesses();
                }
              }}
              placeholder="Ej: tortas, gasfiter, clases de inglés..."
              className="w-full bg-gray-50 border border-gray-200 rounded-full py-2.5 pl-11 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
            />
            <button onClick={() => fetchNearbyBusinesses()} className="absolute inset-y-0 right-4 flex items-center" aria-label="Buscar negocios cercanos">
              <Send className="w-4 h-4 text-gray-400 hover:text-teal-600 transition-colors" />
            </button>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-1 pb-2">
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => {
                if (filter.id === 'distance') {
                  setShowDistanceModal(true);
                } else if (filter.id === 'negocios' || filter.id === 'servicios') {
                  setTypeFilter(filter.id);
                } else if (filter.id === 'todos') {
                  setSelectedFilter('todos');
                  setTypeFilter('todos');
                } else {
                  setSelectedFilter(filter.id);
                }
              }}
              className={`px-2 py-1 rounded-full text-xs font-medium transition-all ${
                (selectedFilter === filter.id || typeFilter === filter.id || filter.id === 'distance')
                  ? filter.id === 'distance'
                    ? 'bg-blue-500 text-white shadow-sm'
                    : filter.id === 'negocios'
                    ? typeFilter === 'negocios'
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    : filter.id === 'servicios'
                    ? typeFilter === 'servicios'
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    : 'bg-teal-500 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Distance Modal */}
      {showDistanceModal && (
        <div className="absolute inset-0 bg-black/50 flex items-end z-50" onClick={() => setShowDistanceModal(false)}>
          <div className="bg-white rounded-t-3xl p-6 w-full" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-6"></div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Ajustar distancia</h3>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-600">Distancia máxima</span>
                <span className="text-2xl font-bold text-teal-600">{maxDistance} km</span>
              </div>

              <div className="relative py-2">
                <input
                  type="range"
                  min="0.5"
                  max="10"
                  step="0.5"
                  value={maxDistance}
                  onChange={(e) => setMaxDistance(parseFloat(e.target.value))}
                  style={{
                    background: `linear-gradient(to right, #14b8a6 0%, #14b8a6 ${((maxDistance - 0.5) / 9.5) * 100}%, #e5e7eb ${((maxDistance - 0.5) / 9.5) * 100}%, #e5e7eb 100%)`
                  }}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer slider-custom"
                />
              </div>

              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>0.5 km</span>
                <span>10 km</span>
              </div>
            </div>

            <button
              onClick={() => {
                setShowDistanceModal(false);
                fetchNearbyBusinesses(searchQuery, maxDistance);
              }}
              className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 text-white py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              Aplicar
            </button>
          </div>
        </div>
      )}

      {/* Results */}
      <div className="flex-1 overflow-auto px-4 pt-4 pb-24">
        <p className="text-sm text-gray-600 mb-4">
          {isSearching
            ? 'Buscando negocios cercanos...'
            : `${filteredResults.length} ${filteredResults.length === 1 ? 'resultado encontrado' : 'resultados encontrados'}`}
        </p>

        {searchError && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm mb-4">
            {searchError}
          </div>
        )}

        <div className="space-y-3">
          {filteredResults.map((result) => {
            const isNegocio = result.category === 'negocios';
            const CardIcon = isNegocio ? Store : Wrench;

            return (
              <div
                key={result.id}
                onClick={() => {
                  if (isNegocio) {
                    onSelectBusiness(result);
                    return;
                  }
                  onSelectService(result);
                }}
                className={`backdrop-blur-sm rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all cursor-pointer border-2 ${
                  isNegocio
                    ? 'bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200'
                    : 'bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200'
                }`}
              >
                <div className="flex items-start gap-3 p-4">
                  <div className="relative">
                    <ImageWithFallback
                      src={result.image}
                      alt={result.name}
                      className="w-20 h-20 rounded-xl object-cover"
                    />
                    <div className={`absolute -top-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center shadow-lg ${
                      isNegocio
                        ? 'bg-gradient-to-br from-amber-500 to-orange-500'
                        : 'bg-gradient-to-br from-indigo-500 to-purple-500'
                    }`}>
                      <CardIcon className="w-4 h-4 text-white" strokeWidth={2.5} />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-bold text-gray-900 text-sm leading-tight">{result.name}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${
                        isNegocio
                          ? 'bg-orange-500 text-white'
                          : 'bg-purple-500 text-white'
                      }`}>
                        {isNegocio ? 'Negocio' : 'Servicio'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mb-2 line-clamp-2">{result.description}</p>
                    <div className="flex items-center gap-2 text-xs flex-wrap">
                      <div className="flex items-center gap-1 text-gray-600">
                        <MapPin className="w-3 h-3" />
                        <span>{formatDistance(result.distance)}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full font-medium ${
                        result.type === 'Negocio'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {result.type}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full font-semibold ${
                        result.isOpen
                          ? 'bg-green-500 text-white'
                          : 'bg-red-500 text-white'
                      }`}>
                        {result.isOpen ? 'Abierto' : 'Cerrado'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {!isSearching && filteredResults.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Search className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">No se encontraron resultados</h3>
            <p className="text-sm text-gray-600 text-center px-8">
              Intenta con otras palabras clave o ajusta los filtros
            </p>
          </div>
        )}
      </div>

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}

function EmptyFavorites({ isDarkMode, onExplore }: { isDarkMode: boolean; onExplore: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="flex-1 flex items-center justify-center px-6"
    >
      <div className="w-full max-w-sm text-center">
        <div className="flex justify-center mb-6">
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3 }}
            className={`w-24 h-24 rounded-3xl flex items-center justify-center shadow-lg ${
              isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-rose-50 border border-rose-100'
            }`}
          >
            <Heart className={`w-12 h-12 ${isDarkMode ? 'text-rose-300' : 'text-rose-500'}`} />
          </motion.div>
        </div>

        <h3 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Aún no tienes favoritos
        </h3>
        <p className={`text-sm mb-8 ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
          Guarda negocios o servicios para encontrarlos rápido aquí
        </p>

        <button
          type="button"
          onClick={onExplore}
          className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 text-white py-3.5 px-5 rounded-2xl font-semibold shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all"
        >
          Explorar ahora
        </button>
      </div>
    </motion.div>
  );
}

function RegistrationFlow({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState<'welcome' | 'phone' | 'verification' | 'name' | 'business' | 'businessDetails'>('welcome');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [error, setError] = useState('');

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '').replace(/^56/, '').replace(/^9?/, '9').slice(0, 9);
    const firstBlock = digits.slice(1, 5);
    const secondBlock = digits.slice(5, 9);
    return `+56 9${firstBlock ? ` ${firstBlock}` : ''}${secondBlock ? ` ${secondBlock}` : ''}`;
  };

  const handlePhoneChange = (value: string) => {
    setError('');
    setPhone(formatPhone(value));
  };

  const handlePhoneSubmit = () => {
    if (phone.replace(/\D/g, '').length !== 11) {
      setError('Ingresa un número celular válido.');
      return;
    }
    setError('');
    setStep('verification');
  };

  const handleVerificationSubmit = () => {
    if (code !== '123456') {
      setError('Código incorrecto. Usa 123456 para esta simulación.');
      return;
    }
    setError('');
    setStep('name');
  };

  const handleNameSubmit = () => {
    if (!name.trim()) {
      setError('Ingresa tu nombre para continuar.');
      return;
    }
    setError('');
    setStep('business');
  };

  const completeRegistration = async () => {
    const cleanPhone = phone.replace(/\D/g, '');
    const password = cleanPhone.slice(0, 8);
    const email = `${cleanPhone}@zipco.cl`;
    const credentials = {
      name: name.trim(),
      phone,
      password,
      email
    };

    const saveAuthData = (data: any) => {
      const token = data.token ?? data.jwt ?? data.accessToken ?? data.access_token;
      const userId = data.user?.id ?? data.user?._id ?? data.id ?? data.userId;

      if (!token || !userId) {
        throw new Error('Invalid auth response');
      }

      localStorage.setItem('zipco-token', token);
      localStorage.setItem('zipco-user-id', String(userId));
      localStorage.setItem('zipco-registration-complete', 'true');
      onComplete();
    };

    try {
      setError('');

      const registerResponse = await fetch('http://localhost:3000/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });

      if (registerResponse.ok) {
        saveAuthData(await registerResponse.json());
        return;
      }

      const loginResponse = await fetch('http://localhost:3000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (loginResponse.ok) {
        saveAuthData(await loginResponse.json());
        return;
      }

      setError('Hubo un problema al crear tu cuenta. Intenta de nuevo');
    } catch (error) {
      setError('Hubo un problema al crear tu cuenta. Intenta de nuevo');
    }
  };

  const progress = {
    welcome: 1,
    phone: 2,
    verification: 3,
    name: 4,
    business: 5,
    businessDetails: 6
  }[step];

  return (
    <div className="size-full bg-gradient-to-br from-teal-50 via-white to-emerald-50 flex items-center justify-center">
      <div className="w-full max-w-md h-full flex flex-col relative overflow-hidden bg-white">
        <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-teal-500/20 to-transparent" />

        <div className="relative z-10 px-6 pt-8">
          <div className="flex items-center justify-center gap-2 mb-8">
            <MapPin className="w-8 h-8 text-teal-600" strokeWidth={2.5} />
            <h1 className="text-3xl font-bold tracking-tight text-teal-700">ZIPCO</h1>
          </div>

          {step !== 'welcome' && (
            <div className="mb-8">
              <div className="flex items-center justify-between text-xs font-semibold text-gray-400 mb-2">
                <span>Paso {progress} de 6</span>
                <span>{Math.round((progress / 6) * 100)}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#00BFA5] rounded-full transition-all duration-300"
                  style={{ width: `${(progress / 6) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="relative z-10 flex-1 px-6 pb-8 flex flex-col justify-center">
          {step === 'welcome' && (
            <div className="text-center">
              <div className="w-24 h-24 bg-[#00BFA5] rounded-3xl mx-auto mb-8 flex items-center justify-center shadow-xl shadow-teal-500/30">
                <MapPin className="w-12 h-12 text-white" strokeWidth={2.5} />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">Bienvenido a ZIPCO</h2>
              <p className="text-gray-600 mb-10 leading-relaxed">
                Encuentra negocios y servicios cerca de ti en segundos.
              </p>
              <button
                type="button"
                onClick={() => setStep('phone')}
                className="w-full bg-[#00BFA5] text-white py-4 px-6 rounded-full font-semibold shadow-lg shadow-teal-500/30 hover:bg-teal-600 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <Phone className="w-5 h-5" />
                Ingresar con número de celular
              </button>
            </div>
          )}

          {step === 'phone' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Ingresa tu celular</h2>
              <p className="text-sm text-gray-600 mb-8">Te enviaremos un código de verificación.</p>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">Número de celular</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="+56 9 XXXX XXXX"
                className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-4 text-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-[#00BFA5] transition-all"
              />
              {error && <p className="text-sm text-red-500 mt-3">{error}</p>}
              <button
                type="button"
                onClick={handlePhoneSubmit}
                className="w-full mt-8 bg-[#00BFA5] text-white py-4 px-6 rounded-full font-semibold shadow-lg shadow-teal-500/30 hover:bg-teal-600 transition-all active:scale-[0.98]"
              >
                Continuar
              </button>
            </div>
          )}

          {step === 'verification' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Verifica tu número</h2>
              <p className="text-sm text-gray-600 mb-8">Ingresa el código de 6 dígitos enviado a {phone}.</p>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">Código de verificación</label>
              <input
                type="text"
                inputMode="numeric"
                value={code}
                onChange={(e) => {
                  setError('');
                  setCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                }}
                placeholder="123456"
                className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-4 text-2xl text-center tracking-[0.35em] focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-[#00BFA5] transition-all"
              />
              <p className="text-xs text-gray-400 mt-3">Código de prueba: 123456</p>
              {error && <p className="text-sm text-red-500 mt-3">{error}</p>}
              <button
                type="button"
                onClick={handleVerificationSubmit}
                className="w-full mt-8 bg-[#00BFA5] text-white py-4 px-6 rounded-full font-semibold shadow-lg shadow-teal-500/30 hover:bg-teal-600 transition-all active:scale-[0.98]"
              >
                Verificar
              </button>
            </div>
          )}

          {step === 'name' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">¿Cómo te llamas?</h2>
              <p className="text-sm text-gray-600 mb-8">Usaremos tu nombre para personalizar tu experiencia.</p>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">Nombre</label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setError('');
                  setName(e.target.value);
                }}
                placeholder="Tu nombre"
                className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-4 text-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-[#00BFA5] transition-all"
              />
              {error && <p className="text-sm text-red-500 mt-3">{error}</p>}
              <button
                type="button"
                onClick={handleNameSubmit}
                className="w-full mt-8 bg-[#00BFA5] text-white py-4 px-6 rounded-full font-semibold shadow-lg shadow-teal-500/30 hover:bg-teal-600 transition-all active:scale-[0.98]"
              >
                Continuar
              </button>
            </div>
          )}

          {step === 'business' && (
            <div className="text-center">
              <div className="w-20 h-20 bg-teal-50 rounded-3xl mx-auto mb-6 flex items-center justify-center">
                <Store className="w-10 h-10 text-[#00BFA5]" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">¿Ofreces un negocio o servicio?</h2>
              <p className="text-sm text-gray-600 mb-8">
                Elige la opcion que mejor describe lo que haras en ZIPCO.
              </p>
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setStep('businessDetails')}
                  className="w-full bg-white border-2 border-teal-100 rounded-2xl p-4 text-left hover:border-[#00BFA5] hover:shadow-lg transition-all active:scale-[0.98]"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-teal-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                      <Store className="w-6 h-6 text-[#00BFA5]" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-1">Tengo un Negocio</h3>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        Vendo productos que los clientes pueden comprar o encargar (tortas, ropa, comida, etc.).
                      </p>
                    </div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setStep('businessDetails')}
                  className="w-full bg-white border-2 border-teal-100 rounded-2xl p-4 text-left hover:border-[#00BFA5] hover:shadow-lg transition-all active:scale-[0.98]"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-teal-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                      <Wrench className="w-6 h-6 text-[#00BFA5]" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-1">Ofrezco un Servicio</h3>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        Realizo trabajos o actividades para los clientes (gasfiter, peluquero, profesor, etc.).
                      </p>
                    </div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={completeRegistration}
                  className="w-full bg-white border-2 border-gray-100 rounded-2xl p-4 text-left hover:border-gray-300 hover:shadow-lg transition-all active:scale-[0.98]"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                      <User className="w-6 h-6 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-1">Solo busco negocios</h3>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        No ofrezco nada, solo quiero encontrar lo que necesito.
                      </p>
                    </div>
                  </div>
                </button>
              </div>
              {error && <p className="text-sm text-red-500 mt-3">{error}</p>}
            </div>
          )}

          {step === 'businessDetails' && (
            <div>
              <div className="w-20 h-20 bg-teal-50 rounded-3xl mx-auto mb-6 flex items-center justify-center">
                <Store className="w-10 h-10 text-[#00BFA5]" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">Nombre del negocio o servicio</h2>
              <p className="text-sm text-gray-600 mb-8 text-center">
                Tu perfil fue creado. Ve a la seccion Perfil para completar tu informacion y publicar tu negocio o servicio.
              </p>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">Nombre del negocio</label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Ej: Pasteleria Delicias"
                className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-4 text-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-[#00BFA5] transition-all"
              />
              {error && <p className="text-sm text-red-500 mt-3">{error}</p>}
              <button
                type="button"
                onClick={completeRegistration}
                className="w-full mt-8 bg-[#00BFA5] text-white py-4 px-6 rounded-full font-semibold shadow-lg shadow-teal-500/30 hover:bg-teal-600 transition-all active:scale-[0.98]"
              >
                Comenzar
              </button>
            </div>
          )}

          {false && step === 'business' && (
            <div className="text-center">
              <div className="w-20 h-20 bg-teal-50 rounded-3xl mx-auto mb-6 flex items-center justify-center">
                <Store className="w-10 h-10 text-[#00BFA5]" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">¿Tienes un negocio o servicio?</h2>
              <p className="text-sm text-gray-600 mb-8">
                Puedes activarlo ahora y configurarlo después desde tu perfil.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={completeRegistration}
                  className="bg-[#00BFA5] text-white py-4 px-5 rounded-2xl font-semibold shadow-lg shadow-teal-500/30 hover:bg-teal-600 transition-all active:scale-[0.98]"
                >
                  Sí
                </button>
                <button
                  type="button"
                  onClick={completeRegistration}
                  className="bg-gray-100 text-gray-800 py-4 px-5 rounded-2xl font-semibold hover:bg-gray-200 transition-all active:scale-[0.98]"
                >
                  No
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [isRegistrationComplete, setIsRegistrationComplete] = useState(() => localStorage.getItem('zipco-registration-complete') === 'true');
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const [currentScreen, setCurrentScreen] = useState('home');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [locationSearch, setLocationSearch] = useState('');
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationSearchError, setLocationSearchError] = useState('');
  const [locationAutocompleteResults, setLocationAutocompleteResults] = useState<any[]>([]);
  const [isLocationAutocompleteLoading, setIsLocationAutocompleteLoading] = useState(false);
  const [hasLocationAutocompleteSearched, setHasLocationAutocompleteSearched] = useState(false);
  const [pendingLocation, setPendingLocation] = useState('');
  const [currentLocation, setCurrentLocation] = useState({ name: 'San Bernardo', lat: -33.5922, lng: -70.6996 });
  const [selectedBusiness, setSelectedBusiness] = useState<any>(null);
  const [checkoutData, setCheckoutData] = useState<{ selectedProducts: number[]; products: any[] } | null>(null);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedServiceItem, setSelectedServiceItem] = useState<any>(null);
  const [favoriteItems] = useState<any[]>([]);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<ToastType>('success');

  // Splash screen timer
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3000); // 3 segundos

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const savedTheme = localStorage.getItem('zipco-theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('zipco-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  useEffect(() => {
    const handleToast = (event: Event) => {
      const { message, type } = (event as CustomEvent<{ message: string; type: ToastType }>).detail;
      setToastMessage(message);
      setToastType(type);
    };

    window.addEventListener('zipco-toast', handleToast);
    return () => window.removeEventListener('zipco-toast', handleToast);
  }, []);

  useEffect(() => {
    if (!toastMessage) return;

    const timer = setTimeout(() => {
      setToastMessage('');
    }, 3000);

    return () => clearTimeout(timer);
  }, [toastMessage]);

  const renderWithToast = (content: any) => (
    <>
      {toastMessage && <Toast message={toastMessage} type={toastType} />}
      {content}
    </>
  );

  useEffect(() => {
    const query = locationSearch.trim();

    if (!showLocationModal || query.length < 3) {
      setLocationAutocompleteResults([]);
      setIsLocationAutocompleteLoading(false);
      setHasLocationAutocompleteSearched(false);
      return;
    }

    setIsLocationAutocompleteLoading(true);
    setHasLocationAutocompleteSearched(false);

    const timeout = setTimeout(async () => {
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}+Chile&format=json&limit=5&countrycodes=cl&addressdetails=1`);
        const data = await response.json();
        setLocationAutocompleteResults(Array.isArray(data) ? data : []);
      } catch (error) {
        setLocationAutocompleteResults([]);
      } finally {
        setIsLocationAutocompleteLoading(false);
        setHasLocationAutocompleteSearched(true);
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [locationSearch, showLocationModal]);

  const categories = [
    {
      id: 'negocios',
      name: 'Negocios',
      icon: Store,
      gradient: 'bg-gradient-to-br from-amber-400 via-orange-500 to-red-500',
      iconColor: 'text-white',
      textColor: 'text-white'
    },
    {
      id: 'servicios',
      name: 'Servicios',
      icon: Wrench,
      gradient: 'bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500',
      iconColor: 'text-white',
      textColor: 'text-white'
    }
  ];

  const chileLocationBase = [
    { name: 'San Bernardo', lat: -33.5922, lng: -70.6996 },
    { name: 'Santiago', lat: -33.4489, lng: -70.6693 },
    { name: 'Maipú', lat: -33.5110, lng: -70.7567 },
    { name: 'Coronel', lat: -37.0333, lng: -73.1333 },
    { name: 'Concepción', lat: -36.8270, lng: -73.0503 },
    { name: 'Chiguayante', lat: -36.9256, lng: -73.0286 },
    { name: 'Valparaíso', lat: -33.0472, lng: -71.6127 },
    { name: 'Viña del Mar', lat: -33.0153, lng: -71.5500 },
    { name: 'Talcahuano', lat: -36.7248, lng: -73.1169 },
    { name: 'Las Condes', lat: -33.4088, lng: -70.5674 },
    { name: 'Providencia', lat: -33.4263, lng: -70.6171 },
    { name: 'Ñuñoa', lat: -33.4569, lng: -70.5975 }
  ];

  const locationSuggestions = chileLocationBase.filter((city) =>
    city.name.toLowerCase().includes(locationSearch.toLowerCase().trim())
  );

  const getLocationNameFromResult = (result: any, fallback: string) =>
    String(result.display_name ?? fallback).split(',').slice(0, 2).map((part) => part.trim()).join(', ');

  const getLocationSuggestionLabel = (result: any) => {
    const parts = String(result.display_name ?? '').split(',').map((part) => part.trim()).filter(Boolean);
    if (parts[parts.length - 1]?.toLowerCase() === 'chile') {
      parts.pop();
    }
    return parts.join(', ');
  };

  const selectLocationResult = (result: any, fallback: string) => {
    setCurrentLocation({
      name: getLocationNameFromResult(result, fallback),
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon)
    });
    setShowLocationModal(false);
    setLocationSearch('');
    setLocationSearchError('');
    setLocationAutocompleteResults([]);
    setHasLocationAutocompleteSearched(false);
  };

  const updateCurrentLocationFromGeolocation = () => {
    if (!navigator.geolocation) {
      showAppToast('La geolocalización no está disponible en este navegador.', 'error');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        let locationName = 'Ubicación actual';

        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
          const data = await response.json();
          locationName = data.address?.city || data.address?.town || data.address?.suburb || locationName;
        } catch (error) {
          console.error('No se pudo obtener el nombre de la ubicación', error);
        }

        setCurrentLocation({ name: locationName, lat, lng });
      },
      () => {
        showAppToast('No se pudo obtener tu ubicación. Revisa los permisos del navegador.', 'error');
      }
    );
  };

  const searchLocationByText = async () => {
    const query = locationSearch.trim();
    if (!query) return;

    setLocationSearchError('');

    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}+Chile&format=json&limit=1`);
      const data = await response.json();

      if (!Array.isArray(data) || data.length === 0) {
        setLocationSearchError('No se encontró esa ubicación, intenta con otra');
        return;
      }

      selectLocationResult(data[0], query);
    } catch (error) {
      setLocationSearchError('No se encontró esa ubicación, intenta con otra');
    }
  };

  // Splash Screen
  if (showSplash) {
    return renderWithToast(
      <div className="size-full bg-gradient-to-br from-teal-500 via-blue-600 to-purple-700 flex items-center justify-center overflow-hidden">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            duration: 0.8,
            ease: "easeOut"
          }}
          className="flex flex-col items-center"
        >
          {/* Logo Icon with Pulse */}
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="mb-6"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-white/30 rounded-full blur-3xl"></div>
              <MapPin className="w-32 h-32 text-white drop-shadow-2xl relative z-10" strokeWidth={2} />
            </div>
          </motion.div>

          {/* App Name */}
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-6xl font-bold text-white tracking-tight mb-3 drop-shadow-lg"
          >
            ZIPCCO
          </motion.h1>

          {/* Tagline */}
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="text-white/90 text-lg font-medium tracking-wide"
          >
            Descubre lo cercano
          </motion.p>

          {/* Loading dots */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.4 }}
            className="flex gap-2 mt-12"
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.3, 1, 0.3]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.2
                }}
                className="w-3 h-3 bg-white rounded-full"
              />
            ))}
          </motion.div>
        </motion.div>
      </div>
    );
  }

  if (!isRegistrationComplete) {
    return renderWithToast(<RegistrationFlow onComplete={() => setIsRegistrationComplete(true)} />);
  }

  if (activeTab === 'profile') {
    return renderWithToast(
      <div className="size-full bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center">
        <div className="w-full max-w-md h-full relative">
          <ProfileScreen
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onBack={() => {
              setActiveTab('home');
              setCurrentScreen('home');
            }}
          />
          <BottomNav
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onNavigate={(tab) => {
              if (tab === 'home') {
                setCurrentScreen('home');
              }
            }}
          />
        </div>
      </div>
    );
  }

  if (activeTab === 'requests') {
    return renderWithToast(
      <div className="size-full bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center">
        <div className="w-full max-w-md h-full relative">
          <RequestsScreen
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onBack={() => {
              setActiveTab('home');
              setCurrentScreen('home');
            }}
          />
          <BottomNav
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onNavigate={(tab) => {
              if (tab === 'home') {
                setCurrentScreen('home');
              }
            }}
          />
        </div>
      </div>
    );
  }

  if (activeTab === 'favorites') {
    return renderWithToast(
      <div className="size-full bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center">
        <div className={`w-full max-w-md h-full relative overflow-hidden ${
          isDarkMode ? 'bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800' : 'bg-gradient-to-b from-white via-blue-50/30 to-blue-100/40'
        }`}>
          <div className="px-6 pt-8 pb-4">
            <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Favoritos</h2>
            <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
              Tus negocios y servicios guardados
            </p>
          </div>

          <div className="flex-1 pb-24 h-[calc(100%-88px)] overflow-auto">
            {favoriteItems.length === 0 ? (
              <EmptyFavorites
                isDarkMode={isDarkMode}
                onExplore={() => {
                  setActiveTab('home');
                  setCurrentScreen('home');
                }}
              />
            ) : (
              <div className="px-6 space-y-3">
                {favoriteItems.map((item, index) => (
                  <div
                    key={`${item.id ?? item.name ?? 'favorite'}-${index}`}
                    className={`rounded-2xl p-4 border ${
                      isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-white border-gray-100 text-gray-900'
                    }`}
                  >
                    {item.name ?? 'Favorito'}
                  </div>
                ))}
              </div>
            )}
          </div>

          <BottomNav
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onNavigate={(tab) => {
              if (tab === 'home') {
                setCurrentScreen('home');
              }
            }}
          />
        </div>
      </div>
    );
  }

  if (currentScreen === 'checkout' && selectedBusiness && checkoutData) {
    return renderWithToast(
      <div className="size-full bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center">
        <div className="w-full max-w-md h-full relative">
          <CheckoutScreen
            business={selectedBusiness}
            selectedProducts={checkoutData.selectedProducts}
            products={checkoutData.products}
            onBack={() => setCurrentScreen('profile')}
            onOrderComplete={() => {
              setCurrentScreen('home');
              setActiveTab('requests');
            }}
          />
          <BottomNav
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onNavigate={(tab) => {
              if (tab === 'home') {
                setCurrentScreen('home');
              }
            }}
          />
        </div>
      </div>
    );
  }

  if (currentScreen === 'profile' && selectedBusiness) {
    return renderWithToast(
      <div className="size-full bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center">
        <div className="w-full max-w-md h-full relative">
          <BusinessProfileScreen
            business={selectedBusiness}
            onBack={() => setCurrentScreen('negocios')}
            onCheckout={(selectedProducts, products) => {
              setCheckoutData({ selectedProducts, products });
              setCurrentScreen('checkout');
            }}
          />
          <BottomNav
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onNavigate={(tab) => {
              if (tab === 'home') {
                setCurrentScreen('home');
              }
            }}
          />
        </div>
      </div>
    );
  }

  if (currentScreen === 'negocios') {
    return renderWithToast(
      <div className="size-full bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center">
        <div className="w-full max-w-md h-full relative">
          <NegociosScreen
            onBack={() => setCurrentScreen('home')}
            onSelectBusiness={(business) => {
              setSelectedBusiness(business);
              setCurrentScreen('profile');
            }}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
        </div>
      </div>
    );
  }

  if (currentScreen === 'servicios') {
    return renderWithToast(
      <div className="size-full bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center">
        <div className="w-full max-w-md h-full relative">
          <ServiciosScreen
            onBack={() => setCurrentScreen('home')}
            onSelectService={(service) => {
              setSelectedService(service);
              setCurrentScreen('service-profile');
            }}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
        </div>
      </div>
    );
  }

  if (currentScreen === 'service-profile') {
    return renderWithToast(
      <div className="size-full bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center">
        <div className="w-full max-w-md h-full relative">
          <ServiceProfileScreen
            service={selectedService}
            onBack={() => setCurrentScreen('servicios')}
            onRequestService={(serviceItem) => {
              setSelectedServiceItem(serviceItem);
              setCurrentScreen('service-checkout');
            }}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
        </div>
      </div>
    );
  }

  if (currentScreen === 'service-checkout') {
    return renderWithToast(
      <div className="size-full bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center">
        <div className="w-full max-w-md h-full relative">
          <ServiceCheckoutScreen
            service={selectedServiceItem}
            provider={selectedService}
            onBack={() => setCurrentScreen('service-profile')}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
        </div>
      </div>
    );
  }

  if (currentScreen === 'search') {
    return renderWithToast(
      <div className="size-full bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center">
        <div className="w-full max-w-md h-full relative">
          <GlobalSearchScreen
            onBack={() => {
              setCurrentScreen('home');
              setGlobalSearchQuery('');
            }}
            initialQuery={globalSearchQuery}
            currentLocation={currentLocation}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onSelectBusiness={(business) => {
              setSelectedBusiness(business);
              setCurrentScreen('profile');
            }}
            onSelectService={(service) => {
              setSelectedService(service);
              setCurrentScreen('service-profile');
            }}
          />
        </div>
      </div>
    );
  }

  return renderWithToast(
    <div className="size-full bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center">
      {/* Mobile Frame */}
      <div className={`w-full max-w-md h-full flex flex-col relative overflow-hidden backdrop-blur-sm transition-colors ${
        isDarkMode
          ? 'bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800'
          : 'bg-gradient-to-b from-white via-blue-50/30 to-blue-100/40'
      }`}>

        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className={`absolute top-6 right-6 z-20 p-2.5 rounded-full border transition-all shadow-md ${
            isDarkMode
              ? 'bg-slate-800 border-slate-700 text-amber-300 hover:bg-slate-700'
              : 'bg-white/90 border-white text-slate-700 hover:bg-white'
          }`}
          aria-label={isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        >
          {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Header */}
        <div className="px-6 pt-8 pb-6">
          {/* Logo */}
          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center gap-2">
              <MapPin className="w-8 h-8 text-teal-600" strokeWidth={2.5} />
              <h1 className={`text-3xl tracking-tight ${isDarkMode ? 'text-teal-400' : 'text-teal-700'}`}>ZIPCCO</h1>
            </div>
          </div>

          {/* Primary Action Button */}
          <button
            onClick={updateCurrentLocationFromGeolocation}
            className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 text-white py-3.5 px-6 rounded-full flex items-center justify-center gap-2 shadow-lg shadow-teal-500/30 hover:shadow-xl hover:shadow-teal-500/40 transition-all active:scale-[0.98]"
          >
            <MapPinned className="w-5 h-5" />
            <span className="font-medium">Localízame</span>
          </button>

          {/* Search Bar */}
          <div className="mt-4 relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={globalSearchQuery}
              onChange={(e) => setGlobalSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && globalSearchQuery.trim()) {
                  setCurrentScreen('search');
                }
              }}
              placeholder="Qué buscas? ej: torta, gásfiter, hielo"
              className={`w-full border rounded-full py-3 pl-11 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all shadow-sm ${
                isDarkMode
                  ? 'bg-slate-800/80 border-slate-700 text-slate-100 placeholder:text-slate-400'
                  : 'bg-white border-gray-200 placeholder:text-gray-400'
              }`}
            />
            <button
              onClick={() => {
                if (globalSearchQuery.trim()) {
                  setCurrentScreen('search');
                }
              }}
              className="absolute inset-y-0 right-4 flex items-center"
            >
              <Send className="w-4 h-4 text-gray-400 hover:text-teal-600 transition-colors" />
            </button>
          </div>

          {/* Location Indicator */}
          <div className="mt-4 flex items-center justify-center gap-2 text-sm">
            <MapPin className="w-4 h-4 text-teal-600" />
            <span className={isDarkMode ? 'text-slate-300' : 'text-gray-600'}>Ubicación actual:</span>
            <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{currentLocation.name}</span>
            {!showLocationModal && (
            <button
              onClick={() => {
                setLocationSearch('');
                setLocationSearchError('');
                setLocationAutocompleteResults([]);
                setHasLocationAutocompleteSearched(false);
                setShowLocationModal(true);
              }}
              className="text-teal-600 hover:text-teal-700 underline underline-offset-2 transition-colors"
            >
              Cambiar
            </button>
            )}
          </div>

          {showLocationModal && (
            <div className="mt-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={locationSearch}
                  onChange={(e) => {
                    setLocationSearch(e.target.value);
                    setLocationSearchError('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      searchLocationByText();
                    }
                  }}
                  placeholder="Escribe una ciudad o comuna..."
                  className={`flex-1 border rounded-full py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-[#00BFA5] transition-all shadow-sm ${
                    isDarkMode
                      ? 'bg-slate-800/80 border-slate-700 text-slate-100 placeholder:text-slate-400'
                      : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400'
                  }`}
                />
                <button
                  type="button"
                  onClick={searchLocationByText}
                  className="bg-[#00BFA5] text-white py-3 px-5 rounded-full text-sm font-semibold shadow-lg shadow-teal-500/25 hover:bg-teal-600 transition-all active:scale-[0.98]"
                >
                  Buscar
                </button>
              </div>
              {locationSearch.trim().length >= 3 && (
                <div className={`mt-2 max-h-56 overflow-auto rounded-2xl border shadow-lg ${
                  isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-100'
                }`}>
                  {isLocationAutocompleteLoading ? (
                    <p className={`px-4 py-3 text-sm ${isDarkMode ? 'text-slate-300' : 'text-gray-500'}`}>
                      Buscando...
                    </p>
                  ) : locationAutocompleteResults.length > 0 ? (
                    locationAutocompleteResults.map((result, index) => (
                      <button
                        key={`${result.place_id ?? result.osm_id ?? 'location'}-${index}`}
                        type="button"
                        onClick={() => selectLocationResult(result, locationSearch.trim())}
                        className={`w-full text-left px-4 py-3 text-sm border-b last:border-b-0 transition-colors ${
                          isDarkMode
                            ? 'border-slate-700 text-slate-100 hover:bg-slate-800'
                            : 'border-gray-100 text-gray-700 hover:bg-teal-50'
                        }`}
                      >
                        {getLocationSuggestionLabel(result)}
                      </button>
                    ))
                  ) : hasLocationAutocompleteSearched ? (
                    <p className={`px-4 py-3 text-sm ${isDarkMode ? 'text-slate-300' : 'text-gray-500'}`}>
                      No se encontraron resultados
                    </p>
                  ) : null}
                </div>
              )}
              {locationSearchError && (
                <p className="mt-2 text-xs text-red-500 text-center">{locationSearchError}</p>
              )}
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 px-6 pb-24 overflow-auto flex flex-col justify-center pt-8">
          <div className="w-full max-w-sm mx-auto">
            <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-600 via-blue-600 to-purple-600 mb-12 text-center tracking-tight animate-gradient" style={{ fontFamily: 'system-ui, -apple-system, sans-serif', letterSpacing: '-0.03em' }}>
              ¿Qué necesitas hoy?
            </h2>

            {/* Category Cards */}
            <div className="grid grid-cols-2 gap-6">
              {categories.map((category) => {
                const Icon = category.icon;
                return (
                  <button
                    key={category.id}
                    onClick={() => {
                      if (category.id === 'negocios') setCurrentScreen('negocios');
                      if (category.id === 'servicios') setCurrentScreen('servicios');
                    }}
                    className={`${category.gradient} rounded-3xl p-12 flex flex-col items-center justify-center gap-6 shadow-2xl hover:shadow-3xl transition-all active:scale-[0.95] border border-white/20 backdrop-blur-sm relative overflow-hidden group min-h-[200px]`}
                  >
                    {/* Shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/30 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                    <Icon className={`w-20 h-20 ${category.iconColor} relative z-10 drop-shadow-2xl`} strokeWidth={2.5} />
                    <span className={`text-lg font-bold ${category.textColor} relative z-10 drop-shadow-lg tracking-wide`}>
                      {category.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Navigation */}
        <BottomNav
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onNavigate={(tab) => {
            if (tab === 'home') {
              setCurrentScreen('home');
            }
          }}
        />

        {false && showLocationModal && (
          <div className="absolute inset-0 z-40 bg-black/40 flex items-end" onClick={() => setShowLocationModal(false)}>
            <div
              onClick={(e) => e.stopPropagation()}
              className={`w-full rounded-t-3xl p-5 shadow-2xl border-t ${
                isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'
              }`}
            >
              <div className={`w-12 h-1.5 rounded-full mx-auto mb-4 ${isDarkMode ? 'bg-slate-600' : 'bg-gray-300'}`}></div>
              <h3 className={`text-lg font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Cambiar ubicación</h3>
              <p className={`text-xs mb-3 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                Simulación tipo Google Maps: escribe una comuna/ciudad y selecciona una sugerencia.
              </p>

              <div className="relative mb-3">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <Search className={`w-4 h-4 ${isDarkMode ? 'text-slate-400' : 'text-gray-400'}`} />
                </div>
                <input
                  type="text"
                  value={locationSearch}
                  onChange={(e) => {
                    setLocationSearch(e.target.value);
                    setPendingLocation(e.target.value);
                  }}
                  placeholder="Ej: Coronel, Santiago, Providencia..."
                  className={`w-full rounded-xl border py-3 pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 ${
                    isDarkMode
                      ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-400'
                      : 'bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400'
                  }`}
                />
              </div>

              <div className="max-h-44 overflow-auto space-y-2 mb-4">
                {locationSuggestions.length !== 0 ? (
                  locationSuggestions.map((city) => (
                    <button
                      key={city.name}
                      type="button"
                      onClick={() => {
                        setPendingLocation(city.name);
                        setLocationSearch(city.name);
                      }}
                      className={`w-full text-left px-4 py-3 rounded-xl transition-all ${
                        pendingLocation === city.name
                          ? isDarkMode
                            ? 'bg-teal-700 text-white'
                            : 'bg-teal-100 text-teal-900'
                          : isDarkMode
                          ? 'bg-slate-800 text-slate-100 hover:bg-slate-700'
                          : 'bg-blue-50 text-gray-800 hover:bg-blue-100'
                      }`}
                    >
                      {city.name}
                    </button>
                  ))
                ) : (
                  <p className={`text-sm text-center py-4 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                    Sin coincidencias. Prueba otra comuna o ciudad.
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  if (pendingLocation.trim()) {
                    const selectedCity = chileLocationBase.find((city) => city.name.toLowerCase() === pendingLocation.trim().toLowerCase());
                    setCurrentLocation(selectedCity ?? { name: pendingLocation.trim(), lat: currentLocation.lat, lng: currentLocation.lng });
                  }
                  setShowLocationModal(false);
                }}
                className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 text-white py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                Guardar ubicación
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
