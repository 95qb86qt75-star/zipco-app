import { useState, useEffect, useRef } from 'react';
import { MapPin, Search, Mic, MapPinned, User, Heart, FileText, Store, Wrench, Calendar, ArrowLeft, Clock, Star, Instagram, Facebook, Plus, Minus, Send, Check, X, Package, Phone, Mail, MapPinIcon, CreditCard, Settings, LogOut, ChevronRight, Camera, Building2, TrendingUp, Tag, Edit2, Eye, EyeOff, Moon, Sun } from 'lucide-react';
import { ImageWithFallback } from './components/figma/ImageWithFallback';
import { motion } from 'motion/react';
import BottomNav from './screens/BottomNav';
import RegistrationFlow from './screens/RegistrationFlow';
import RequestsScreen from './screens/RequestsScreen';
import CheckoutScreen from './screens/CheckoutScreen';
import BusinessProfileScreen from './screens/BusinessProfileScreen';
import ServiceProfileScreen from './screens/ServiceProfileScreen';
import ServiceCheckoutScreen from './screens/ServiceCheckoutScreen';
import ServiciosScreen from './screens/ServiciosScreen';
import NegociosScreen from './screens/NegociosScreen';
import GlobalSearchScreen from './screens/GlobalSearchScreen';
import ProfileScreen from './screens/ProfileScreen';
import EmptyFavorites from './screens/EmptyFavorites';
import Toast, { showAppToast, type ToastType } from './screens/Toast';
import SplashScreen from './screens/SplashScreen';

const hasStoredSession = () =>
  Boolean(localStorage.getItem('zipco-token') && localStorage.getItem('zipco-user-id'));

const getStoredLocation = () => {
  try {
    const savedLocation = localStorage.getItem('zipco-location');
    if (!savedLocation) return { name: '', lat: null, lng: null };

    const parsedLocation = JSON.parse(savedLocation);
    return {
      name: String(parsedLocation.name ?? ''),
      lat: typeof parsedLocation.lat === 'number' ? parsedLocation.lat : null,
      lng: typeof parsedLocation.lng === 'number' ? parsedLocation.lng : null
    };
  } catch (error) {
    return { name: '', lat: null, lng: null };
  }
};

export default function App() {
  const [isRegistrationComplete, setIsRegistrationComplete] = useState(
    () => localStorage.getItem('zipco-registration-complete') === 'true' || hasStoredSession()
  );
  const [showSplash, setShowSplash] = useState(() => sessionStorage.getItem('zipco-splash-seen') !== 'true');
  const [activeTab, setActiveTab] = useState('home');
  const [currentScreen, setCurrentScreen] = useState('home');
  const [previousScreen, setPreviousScreen] = useState<string>('negocios');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [locationSearch, setLocationSearch] = useState('');
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationSearchError, setLocationSearchError] = useState('');
  const [locationAutocompleteResults, setLocationAutocompleteResults] = useState<any[]>([]);
  const [isLocationAutocompleteLoading, setIsLocationAutocompleteLoading] = useState(false);
  const [hasLocationAutocompleteSearched, setHasLocationAutocompleteSearched] = useState(false);
  const [pendingLocation, setPendingLocation] = useState('');
  const [currentLocation, setCurrentLocation] = useState<{ name: string; lat: number | null; lng: number | null }>(getStoredLocation);
  const [selectedBusiness, setSelectedBusiness] = useState<any>(null);
  const [checkoutData, setCheckoutData] = useState<{ selectedProducts: number[]; products: any[] } | null>(null);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedServiceItem, setSelectedServiceItem] = useState<any>(null);
  const [favoriteItems] = useState<any[]>([]);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<ToastType>('success');

  useEffect(() => {
    if (hasStoredSession()) {
      localStorage.setItem('zipco-registration-complete', 'true');
      setIsRegistrationComplete(true);
    }
  }, []);

  useEffect(() => {
    if (!currentLocation.name.trim()) return;

    localStorage.setItem('zipco-location', JSON.stringify(currentLocation));
  }, [currentLocation]);

  useEffect(() => {
    const savedTheme = localStorage.getItem('zipco-theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('zipco-token');
    localStorage.removeItem('zipco-user-id');
    localStorage.removeItem('zipco-registration-complete');
    localStorage.removeItem('zipco-business-id');
    setCurrentScreen('home');
    setActiveTab('home');
    setIsRegistrationComplete(false);
  };

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
      <SplashScreen
        onComplete={() => {
          sessionStorage.setItem('zipco-splash-seen', 'true');
          setShowSplash(false);
        }}
      />
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
            onLogout={handleLogout}
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
            currentLocation={currentLocation}
            onBack={() => setCurrentScreen(previousScreen)}
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
              setPreviousScreen('negocios');
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
              setPreviousScreen('search');
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
          className={`absolute right-6 z-20 p-2.5 rounded-full border transition-all shadow-md ${
            isDarkMode
              ? 'bg-slate-800 border-slate-700 text-amber-300 hover:bg-slate-700'
              : 'bg-white/90 border-white text-slate-700 hover:bg-white'
          }`}
          style={{ top: 'max(1.5rem, env(safe-area-inset-top))' }}
          aria-label={isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        >
          {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Header */}
        <div
          className="px-6 pb-6"
          style={{ paddingTop: 'max(2rem, env(safe-area-inset-top))' }}
        >
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
            <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{currentLocation.name || 'Sin ubicación'}</span>
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
