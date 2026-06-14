import { useState } from 'react';
import { ArrowLeft, Clock, Mic, Search } from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import BottomNav from './BottomNav';

export default function ServiciosScreen({ onBack, onSelectService, activeTab, setActiveTab }: { onBack: () => void; onSelectService: (service: any) => void; activeTab: string; setActiveTab: (tab: string) => void }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('todos');
  const [maxDistance, setMaxDistance] = useState(10);
  const [showDistanceModal, setShowDistanceModal] = useState(false);

  const normalize = (str: string) =>
    str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

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
      const query = normalize(searchQuery);
      const matchesName = normalize(result.name).includes(query);
      const matchesDescription = normalize(result.description).includes(query);
      const matchesKeywords = result.keywords ? normalize(result.keywords).includes(query) : false;

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

