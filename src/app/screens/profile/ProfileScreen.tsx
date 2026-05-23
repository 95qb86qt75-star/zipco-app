import { useEffect, useState } from 'react';
import { ArrowLeft, Camera, Store } from 'lucide-react';
import { ImageWithFallback } from '../../components/figma/ImageWithFallback';
import { showAppToast } from '../Toast';
import BusinessConfigScreen from './BusinessConfigScreen';
import BusinessInfoSection from './BusinessInfoSection';
import PersonalInfoSection from './PersonalInfoSection';
import QuickActionsCard from './QuickActionsCard';
import BusinessRegistrationCard from './BusinessRegistrationCard';

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
        const response = await fetch(`https://zipco-backend-production.up.railway.app/users/${userId}`, {
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
        const response = await fetch('https://zipco-backend-production.up.railway.app/businesses', {
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
      const response = await fetch(`https://zipco-backend-production.up.railway.app/businesses/${businessId}`, {
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
      const response = await fetch('https://zipco-backend-production.up.railway.app/businesses', {
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
      const response = await fetch(`https://zipco-backend-production.up.railway.app/users/${userId}`, {
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

        <BusinessInfoSection
          profileTab={profileTab}
          hasRegisteredBusiness={hasRegisteredBusiness}
          profileCardClass={profileCardClass}
          isBusinessProfileTab={isBusinessProfileTab}
          isBusinessFieldMissing={isBusinessFieldMissing}
          businessTextClass={businessTextClass}
          isEditingBusinessInfo={isEditingBusinessInfo}
          handleSaveBusinessInfo={handleSaveBusinessInfo}
          handleStartEditingBusinessInfo={handleStartEditingBusinessInfo}
          businessInfo={businessInfo}
          businessSubtextClass={businessSubtextClass}
          businessSocialForm={businessSocialForm}
          setBusinessSocialForm={setBusinessSocialForm}
          businessAddressSuggestions={businessAddressSuggestions}
          isBusinessAddressLoading={isBusinessAddressLoading}
          getBusinessAddressLabel={getBusinessAddressLabel}
          setBusinessAddressSuggestions={setBusinessAddressSuggestions}
          setHasBusinessAddressSearched={setHasBusinessAddressSearched}
          hasBusinessAddressSearched={hasBusinessAddressSearched}
          setShowBusinessConfig={setShowBusinessConfig}
          isBusinessReadyToPublish={isBusinessReadyToPublish}
          handlePublishBusiness={handlePublishBusiness}
        />
        <PersonalInfoSection
          profileTab={profileTab}
          isEditingPersonalInfo={isEditingPersonalInfo}
          handleStartEditingPersonalInfo={handleStartEditingPersonalInfo}
          personalInfoForm={personalInfoForm}
          setPersonalInfoForm={setPersonalInfoForm}
          setPersonalLocationTouched={setPersonalLocationTouched}
          personalLocationTouched={personalLocationTouched}
          personalLocationSuggestions={personalLocationSuggestions}
          isPersonalLocationLoading={isPersonalLocationLoading}
          hasPersonalLocationSearched={hasPersonalLocationSearched}
          getPersonalLocationLabel={getPersonalLocationLabel}
          setPersonalLocationSuggestions={setPersonalLocationSuggestions}
          setHasPersonalLocationSearched={setHasPersonalLocationSearched}
          handleCancelEditingPersonalInfo={handleCancelEditingPersonalInfo}
          handleSavePersonalInfo={handleSavePersonalInfo}
          userInfo={userInfo}
        />
        <QuickActionsCard profileTab={profileTab} />

        <BusinessRegistrationCard
          profileTab={profileTab}
          hasRegisteredBusiness={hasRegisteredBusiness}
          profileCardClass={profileCardClass}
          showBusinessRegistrationForm={showBusinessRegistrationForm}
          businessRegistrationForm={businessRegistrationForm}
          setBusinessRegistrationForm={setBusinessRegistrationForm}
          isBusinessProfileTab={isBusinessProfileTab}
          setShowBusinessRegistrationForm={setShowBusinessRegistrationForm}
          handleRegisterBusiness={handleRegisterBusiness}
        />
      </div>
    </div>
  );
}

