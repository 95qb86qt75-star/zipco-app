import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, MapPin, Search, Send, Store, Wrench } from 'lucide-react';
import { API_BASE_URL } from '../api/apiConfig';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import BottomNav from './BottomNav';
import DistanceInfo from './DistanceInfo';

const getCoordinate = (value: any) => {
  const coordinate = Number(value);
  return Number.isFinite(coordinate) ? coordinate : null;
};

const calculateDistanceKm = (fromLat: any, fromLng: any, toLat: any, toLng: any) => {
  const startLat = getCoordinate(fromLat);
  const startLng = getCoordinate(fromLng);
  const endLat = getCoordinate(toLat);
  const endLng = getCoordinate(toLng);

  if (startLat === null || startLng === null || endLat === null || endLng === null) return null;

  const toRadians = (value: number) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const deltaLat = toRadians(endLat - startLat);
  const deltaLng = toRadians(endLng - startLng);
  const lat1 = toRadians(startLat);
  const lat2 = toRadians(endLat);
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export default function GlobalSearchScreen({ onBack, initialQuery, currentLocation, activeTab, setActiveTab, onSelectBusiness, onSelectService }: { onBack: () => void; initialQuery: string; currentLocation: any; activeTab: string; setActiveTab: (tab: string) => void; onSelectBusiness: (business: any) => void; onSelectService: (service: any) => void }) {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedFilter, setSelectedFilter] = useState('todos');
  const [maxDistance, setMaxDistance] = useState(10);
  const [showDistanceModal, setShowDistanceModal] = useState(false);
  const [backendResults, setBackendResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const hasMountedSearchEffect = useRef(false);

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
    const calculatedDistance = calculateDistanceKm(
      currentLocation?.lat,
      currentLocation?.lng,
      result.latitude ?? result.lat,
      result.longitude ?? result.lng ?? result.lon
    );
    const backendDistance = getCoordinate(result.distance ?? result.distanceKm ?? result.distance_km);

    return {
      ...result,
      id: result.id ?? result._id ?? result.businessId ?? result.name,
      name: result.name ?? result.businessName ?? result.title ?? 'Negocio sin nombre',
      description: result.description ?? result.subtitle ?? result.address ?? 'Sin descripción disponible',
      distance: calculatedDistance ?? backendDistance,
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

      const response = await fetch(`${API_BASE_URL}/businesses/nearby?${params.toString()}`);

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

  useEffect(() => {
    if (!hasMountedSearchEffect.current) {
      hasMountedSearchEffect.current = true;
      return;
    }

    const trimmedQuery = searchQuery.trim();
    if (trimmedQuery.length < 2) return;

    const searchTimeout = window.setTimeout(() => {
      fetchNearbyBusinesses(trimmedQuery, maxDistance);
    }, 500);

    return () => window.clearTimeout(searchTimeout);
  }, [searchQuery]);

  // Filtrar resultados entregados por el backend
  const filteredResults = backendResults.filter((result) => {
    // Filtro por distancia
    if (result.distance !== null && result.distance > maxDistance) return false;

    // Filtro por chip seleccionado
    if (selectedFilter === 'negocios' && result.category !== 'negocios') return false;
    if (selectedFilter === 'servicios' && result.category !== 'servicios') return false;
    if (selectedFilter === 'particular' && result.type !== 'Particular') return false;

    return true;
  });

  const formatDistance = (km: number | null) => {
    if (km === null || !Number.isFinite(km)) return 'Distancia no disponible';
    if (km < 1) {
      return `${Math.round(km * 1000)} m`;
    }
    return `${km.toFixed(1)} km`;
  };

  return (
    <div className="size-full bg-gradient-to-b from-white via-blue-50/30 to-blue-100/40 flex flex-col">
      {/* Header */}
      <div
        className="px-4 pb-4 border-b border-white/50"
        style={{ paddingTop: 'max(1.5rem, env(safe-area-inset-top))' }}
      >
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
                setSelectedFilter(filter.id);
                if (filter.id === 'distance') {
                  setShowDistanceModal(true);
                }
              }}
              className={`px-2 py-1 rounded-full text-xs font-medium transition-all ${
                selectedFilter === filter.id
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm'
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
                        <DistanceInfo />
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

