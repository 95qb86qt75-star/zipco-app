import { useEffect, useRef, useState } from "react";

import { API_BASE_URL } from "../../../../api/apiConfig";


import { getBusinessResultImage } from "../../domain/searchResultPresentation";
import { parsePositiveIntegerId } from "../../../businesses/domain/businessOwnership";

import { canRunSearch, isCurrentSearchResponse, normalizeSearchQuery } from "../../domain/searchConsistency";
const getCoordinate = (value: any) => {
  const coordinate = Number(value);
  return Number.isFinite(coordinate) ? coordinate : null;
};
const calculateDistanceKm = (
  fromLat: any,
  fromLng: any,
  toLat: any,
  toLng: any,
) => {
  const startLat = getCoordinate(fromLat);
  const startLng = getCoordinate(fromLng);
  const endLat = getCoordinate(toLat);
  const endLng = getCoordinate(toLng);

  if (
    startLat === null ||
    startLng === null ||
    endLat === null ||
    endLng === null
  )
    return null;

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
export function useGlobalSearchScreenController({
  onBack,
  initialQuery,
  onQueryChange,
  initialFilter,
  onFilterChange,
  initialMaxDistance,
  onMaxDistanceChange,
  currentLocation,
  activeTab,
  setActiveTab,
  onSelectBusiness,
  onSelectService,
}: {
  onBack: () => void;
  initialQuery: string;
  onQueryChange: (query: string) => void;
  initialFilter: string;
  onFilterChange: (filter: string) => void;
  initialMaxDistance: number;
  onMaxDistanceChange: (distance: number) => void;
  currentLocation: any;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onSelectBusiness: (business: any) => void;
  onSelectService: (service: any) => void;
}){

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedFilter, setSelectedFilter] = useState(initialFilter);
  const [maxDistance, setMaxDistance] = useState(initialMaxDistance);
  const [showDistanceModal, setShowDistanceModal] = useState(false);
  const [backendResults, setBackendResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const hasMountedSearchEffect = useRef(false);
  const searchQueryRef = useRef(initialQuery);
  const latestRequestId = useRef(0);
  const activeSearchController = useRef<AbortController | null>(null);

  const filters = [
    { id: "todos", label: "Todos" },
    { id: "negocios", label: "Negocios" },
    { id: "servicios", label: "Servicios" },
    { id: "particular", label: "Particular" },
    { id: "distance", label: `${maxDistance} km` },
  ];

  // Datos combinados de negocios y servicios
  const allResults = [
    // NEGOCIOS (productos físicos)
    {
      id: 1,
      name: "Pastelería Delicias Tere",
      description: "Repostería artesanal y tortas personalizadas",
      distance: 0.85,
      type: "Negocio",
      category: "negocios",
      isOpen: true,
      image:
        "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&q=80",
      keywords:
        "tortas de cumpleaños personalizadas, pasteles para bodas, cupcakes decorados, galletas de navidad, postres artesanales",
    },
    {
      id: 2,
      name: "Tortas del Barrio",
      description: "Tortas personalizadas para toda ocasión",
      distance: 0.5,
      type: "Negocio",
      category: "negocios",
      isOpen: true,
      image:
        "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=400&q=80",
      keywords: "tortas personalizadas, diseños únicos, tortas temáticas",
    },
    {
      id: 3,
      name: "Pizzería Don Giovanni",
      description: "Pizzas artesanales a leña",
      distance: 0.4,
      type: "Negocio",
      category: "negocios",
      isOpen: true,
      image:
        "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&q=80",
      keywords:
        "pizza artesanal, pizza a domicilio, pizza familiar, comida italiana",
    },
    {
      id: 4,
      name: "Artesanías María",
      description: "Productos artesanales hechos a mano",
      distance: 0.9,
      type: "Particular",
      category: "negocios",
      isOpen: true,
      image:
        "https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=400&q=80",
      keywords:
        "artesanía chilena, tejidos a mano, cerámica artesanal, regalos personalizados",
    },
    {
      id: 5,
      name: "Florería El Jardín",
      description: "Arreglos florales para toda ocasión",
      distance: 0.7,
      type: "Negocio",
      category: "negocios",
      isOpen: true,
      image:
        "https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=400&q=80",
      keywords:
        "ramos de flores, arreglos florales, flores para eventos, coronas fúnebres",
    },
    {
      id: 6,
      name: "Joyería Artesanal Luna",
      description: "Joyería hecha a mano con diseños únicos",
      distance: 1.1,
      type: "Negocio",
      category: "negocios",
      isOpen: true,
      image:
        "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&q=80",
      keywords:
        "joyería artesanal, collares personalizados, anillos plata, aretes hechos a mano",
    },
    {
      id: 7,
      name: "Café Frappé Express",
      description: "Bebidas frías y calientes, hielo frappé",
      distance: 0.3,
      type: "Negocio",
      category: "negocios",
      isOpen: true,
      image:
        "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&q=80",
      keywords:
        "hielo frappé, café frío, frappuccino, bebidas heladas, café express",
    },
    {
      id: 8,
      name: "Cocina Casera Doña Elsa",
      description: "Comida chilena casera y tradicional",
      distance: 0.8,
      type: "Particular",
      category: "negocios",
      isOpen: true,
      image:
        "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80",
      keywords:
        "pastel de choclo, empanadas, cazuela, comida casera chilena, menú del día",
    },
    {
      id: 9,
      name: "Zapatería Sport Plus",
      description: "Calzado deportivo y accesorios",
      distance: 1.0,
      type: "Negocio",
      category: "negocios",
      isOpen: true,
      image:
        "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80",
      keywords:
        "zapatillas nike, zapatillas adidas, calzado deportivo, cordones de zapatillas, zapatillas running",
    },
    {
      id: 10,
      name: "Librería y Papelería Central",
      description: "Útiles escolares y material de oficina",
      distance: 0.6,
      type: "Negocio",
      category: "negocios",
      isOpen: true,
      image:
        "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&q=80",
      keywords:
        "cartulina, papel lustre, útiles escolares, cuadernos, lápices, papelería",
    },
    {
      id: 11,
      name: "Farmacia Cruz Verde Plus",
      description: "Medicamentos y productos de salud",
      distance: 0.4,
      type: "Negocio",
      category: "negocios",
      isOpen: true,
      image:
        "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=400&q=80",
      keywords:
        "tapsín caliente, tapsin, medicamentos, remedios, vitaminas, farmacia",
    },
    {
      id: 12,
      name: "Minimarket Don Luis",
      description: "Abarrotes y productos de primera necesidad",
      distance: 0.5,
      type: "Negocio",
      category: "negocios",
      isOpen: true,
      image:
        "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=400&q=80",
      keywords: "hielo, bebidas, abarrotes, despensa, almacén",
    },
    {
      id: 13,
      name: "Deportes y Más",
      description: "Implementos y ropa deportiva",
      distance: 1.4,
      type: "Negocio",
      category: "negocios",
      isOpen: true,
      image:
        "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&q=80",
      keywords:
        "zapatillas deportivas, ropa fitness, cordones zapatillas, balones, implementos deportivos",
    },

    // SERVICIOS
    {
      id: 101,
      name: "Gasfitería Express 24/7",
      description: "Reparaciones urgentes de gasfitería",
      distance: 0.6,
      type: "Particular",
      category: "servicios",
      isOpen: true,
      image:
        "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&q=80",
      keywords:
        "reparación cañerías, destape wc, fuga de agua, instalación grifería, gasfiter urgente",
      instagram: "@gasfiteria_express",
      facebook: "GasfiteriaExpress24",
      services: [
        {
          id: 1,
          name: "Cambio de cañería",
          description: "Reemplazo de cañerías antiguas o dañadas",
        },
        {
          id: 2,
          name: "Instalación de calefont",
          description: "Instalación y conexión de calefont a gas",
        },
        {
          id: 3,
          name: "Destape de WC y cañerías",
          description: "Destape urgente de baños y desagües",
        },
        {
          id: 4,
          name: "Reparación de fuga de agua",
          description: "Detección y reparación de filtraciones",
        },
        {
          id: 5,
          name: "Instalación de grifería",
          description: "Instalación de llaves y grifos",
        },
      ],
    },
    {
      id: 102,
      name: "Juan Pérez Gasfiter",
      description: "Gasfitería a domicilio, presupuesto sin cargo",
      distance: 1.2,
      type: "Particular",
      category: "servicios",
      isOpen: true,
      image:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80",
      keywords:
        "gasfiter barato, reparación baños, instalación lavamanos, cambio llaves",
    },
    {
      id: 103,
      name: "Electricidad Profesional",
      description: "Instalaciones eléctricas certificadas",
      distance: 0.8,
      type: "Negocio",
      category: "servicios",
      isOpen: true,
      image:
        "https://images.unsplash.com/photo-1473186578172-c141e6798cf4?w=400&q=80",
      keywords:
        "electricista certificado, instalación paneles solares, reparación cortocircuitos, instalación enchufes",
    },
    {
      id: 104,
      name: "Salón de Belleza Glamour",
      description: "Peluquería y tratamientos estéticos",
      distance: 0.9,
      type: "Negocio",
      category: "servicios",
      isOpen: true,
      image:
        "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&q=80",
      keywords:
        "corte de pelo mujer, tintura cabello, manicure, pedicure, tratamiento keratina",
    },
    {
      id: 105,
      name: "Academia de Inglés SmartLearn",
      description: "Clases de inglés para todas las edades",
      distance: 1.3,
      type: "Negocio",
      category: "servicios",
      isOpen: true,
      image:
        "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&q=80",
      keywords:
        "clases de inglés para niños, inglés conversacional, preparación TOEFL, inglés empresarial",
    },
    {
      id: 106,
      name: "Centro de Masajes Relax",
      description: "Masajes terapéuticos y relajantes",
      distance: 1.4,
      type: "Negocio",
      category: "servicios",
      isOpen: true,
      image:
        "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&q=80",
      keywords:
        "masajes terapéuticos, masajes relajantes, quiromasaje, reflexología",
    },
    {
      id: 107,
      name: "Veterinaria PetCare",
      description: "Atención veterinaria integral",
      distance: 0.8,
      type: "Negocio",
      category: "servicios",
      isOpen: true,
      image:
        "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=400&q=80",
      keywords:
        "veterinario urgencias, vacunas perros, esterilización gatos, consulta veterinaria",
    },
    {
      id: 108,
      name: "Limpieza Express",
      description: "Servicio de limpieza profesional",
      distance: 1.1,
      type: "Negocio",
      category: "servicios",
      isOpen: true,
      image:
        "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&q=80",
      keywords:
        "limpieza profunda casa, aseo oficinas, limpieza mudanza, servicio doméstico",
    },
    {
      id: 109,
      name: "Fletes y Mudanzas Rápido",
      description: "Servicio de fletes y mudanzas",
      distance: 2.3,
      type: "Negocio",
      category: "servicios",
      isOpen: true,
      image:
        "https://images.unsplash.com/photo-1600880292089-90a7e086ee0c?w=400&q=80",
      keywords:
        "fletes económicos, mudanzas completas, retiro muebles, flete pequeño",
    },
    {
      id: 110,
      name: "Jardines y Paisajismo Verde",
      description: "Diseño y mantención de jardines",
      distance: 1.6,
      type: "Negocio",
      category: "servicios",
      isOpen: true,
      image:
        "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&q=80",
      keywords:
        "jardinero, mantención jardines, poda de árboles, paisajismo, diseño jardines",
    },
    {
      id: 111,
      name: "Jardinero Luis Parra",
      description: "Servicio de jardinería a domicilio",
      distance: 1.0,
      type: "Particular",
      category: "servicios",
      isOpen: true,
      image:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
      keywords:
        "jardinero, corte de pasto, limpieza de jardín, poda, jardinero económico",
    },
    {
      id: 112,
      name: "AutoSpa Premium",
      description: "Lavado y detailing automotriz",
      distance: 0.9,
      type: "Negocio",
      category: "servicios",
      isOpen: true,
      image:
        "https://images.unsplash.com/photo-1601362840469-51e4d8d58785?w=400&q=80",
      keywords:
        "carwash, lavado de auto, limpieza de auto, detailing, pulido auto, encerado",
      instagram: "@autospa_premium",
      facebook: "AutoSpaPremium",
      services: [
        {
          id: 1,
          name: "Lavado Exterior Completo",
          description: "Lavado y secado exterior profesional",
        },
        {
          id: 2,
          name: "Lavado Interior y Exterior",
          description: "Lavado completo interior y exterior",
        },
        {
          id: 3,
          name: "Detailing Premium",
          description: "Pulido, encerado y protección de pintura",
        },
        {
          id: 4,
          name: "Limpieza de Motor",
          description: "Lavado y desengrase de motor",
        },
        {
          id: 5,
          name: "Tratamiento de Tapicería",
          description: "Limpieza profunda de asientos y alfombras",
        },
      ],
    },
    {
      id: 113,
      name: "Lavado Express El Brillo",
      description: "Lavado rápido de vehículos",
      distance: 1.3,
      type: "Negocio",
      category: "servicios",
      isOpen: true,
      image:
        "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=400&q=80",
      keywords:
        "carwash, lavado auto express, lavado motor, aspirado, limpieza vehículos",
    },
    {
      id: 114,
      name: "Taller Mecánico AutoFix",
      description: "Mecánica y hojalatería",
      distance: 1.5,
      type: "Negocio",
      category: "servicios",
      isOpen: true,
      image:
        "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400&q=80",
      keywords:
        "desabolladura, hojalatería, pintura automotriz, mecánica general, reparación autos",
    },
    {
      id: 115,
      name: "Hojalatería y Pintura Rodríguez",
      description: "Desabolladura y pintura de vehículos",
      distance: 2.0,
      type: "Negocio",
      category: "servicios",
      isOpen: true,
      image:
        "https://images.unsplash.com/photo-1625047509168-a7026f36de04?w=400&q=80",
      keywords:
        "desabolladura, hojalatería, pintura de autos, reparación chapa, enderezado",
    },
    {
      id: 116,
      name: "Lavado a Domicilio Carlos",
      description: "Lavado de autos en tu casa",
      distance: 0.7,
      type: "Particular",
      category: "servicios",
      isOpen: true,
      image:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80",
      keywords:
        "lavado de auto a domicilio, carwash móvil, limpieza auto en casa, lavado ecológico",
    },
    {
      id: 117,
      name: "Taller Multimarca Speed",
      description: "Mecánica rápida y confiable",
      distance: 1.8,
      type: "Negocio",
      category: "servicios",
      isOpen: true,
      image:
        "https://images.unsplash.com/photo-1487754180451-c456f719a1fc?w=400&q=80",
      keywords:
        "mecánica, cambio aceite, alineación, balanceo, scanner automotriz, desabolladura",
    },
  ];

  const normalizeBackendResult = (result: any) => {
    const rawCategory =
      result.category ?? result.kind ?? result.resultType ?? "negocios";
    const normalizedCategory = String(rawCategory)
      .toLowerCase()
      .includes("serv")
      ? "servicios"
      : "negocios";
    const normalizedType =
      result.type ??
      (normalizedCategory === "servicios" ? "Servicio" : "Negocio");
    const calculatedDistance = calculateDistanceKm(
      currentLocation?.lat,
      currentLocation?.lng,
      result.latitude ?? result.lat,
      result.longitude ?? result.lng ?? result.lon,
    );
    const backendDistance = getCoordinate(
      result.distance ?? result.distanceKm ?? result.distance_km,
    );

    return {
      ...result,
      id: result.id ?? result._id ?? result.businessId ?? result.name,
      userId: parsePositiveIntegerId(result.userId),
      name:
        result.name ??
        result.businessName ??
        result.title ??
        "Negocio sin nombre",
      description:
        result.description ??
        result.subtitle ??
        result.address ??
        "Sin descripción disponible",
      distance: calculatedDistance ?? backendDistance,
      type: normalizedType,
      category: normalizedCategory,
      isOpen: result.isOpen ?? result.open ?? true,
      image: getBusinessResultImage(result),
    };
  };

  const fetchNearbyBusinesses = async (
    query = searchQuery,
    radius = maxDistance,
  ) => {
    const trimmedQuery = normalizeSearchQuery(query);
    if (!canRunSearch(trimmedQuery)) {
      activeSearchController.current?.abort();
      latestRequestId.current += 1;
      setBackendResults([]);
      setIsSearching(false);
      setSearchError("");
      return;
    }

    activeSearchController.current?.abort();
    const controller = new AbortController();
    activeSearchController.current = controller;
    const requestId = ++latestRequestId.current;

    setIsSearching(true);
    setSearchError("");

    try {
      const params = new URLSearchParams({
        lat: String(currentLocation.lat),
        lng: String(currentLocation.lng),
        radius: String(radius),
        search: trimmedQuery,
      });

      const response = await fetch(
        `${API_BASE_URL}/businesses/nearby?${params.toString()}`,
        {
          signal: controller.signal,
        },
      );

      if (!response.ok) {
        throw new Error("No se pudo conectar con la búsqueda");
      }

      const data = await response.json();
      if (
        !isCurrentSearchResponse({
          requestId,
          latestRequestId: latestRequestId.current,
          requestedQuery: trimmedQuery,
          currentQuery: searchQueryRef.current,
        })
      )
        return;
      const rawResults = Array.isArray(data)
        ? data
        : (data.businesses ?? data.results ?? []);
      setBackendResults(rawResults.map(normalizeBackendResult));
    } catch (error) {
      if (controller.signal.aborted || requestId !== latestRequestId.current)
        return;
      setBackendResults([]);
      setSearchError(
        error instanceof Error
          ? error.message
          : "No se pudo realizar la búsqueda",
      );
    } finally {
      if (requestId === latestRequestId.current) setIsSearching(false);
    }
  };

  useEffect(() => {
    fetchNearbyBusinesses(initialQuery, maxDistance);
  }, []);

  useEffect(() => {
    if (!hasMountedSearchEffect.current) {
      hasMountedSearchEffect.current = true;
      return;
    }

    const trimmedQuery = normalizeSearchQuery(searchQuery);
    activeSearchController.current?.abort();
    latestRequestId.current += 1;
    setBackendResults([]);
    setSearchError("");
    setIsSearching(false);
    if (!canRunSearch(trimmedQuery)) return;

    const searchTimeout = window.setTimeout(() => {
      fetchNearbyBusinesses(trimmedQuery, maxDistance);
    }, 500);

    return () => window.clearTimeout(searchTimeout);
  }, [searchQuery]);

  useEffect(() => () => activeSearchController.current?.abort(), []);

  // Filtrar resultados entregados por el backend
  const filteredResults = backendResults.filter((result) => {
    // Filtro por distancia
    if (result.distance !== null && result.distance > maxDistance) return false;

    // Filtro por chip seleccionado
    if (selectedFilter === "negocios" && result.category !== "negocios")
      return false;
    if (selectedFilter === "servicios" && result.category !== "servicios")
      return false;
    if (selectedFilter === "particular" && result.type !== "Particular")
      return false;

    return true;
  });

  const formatDistance = (km: number | null) => {
    if (km === null || !Number.isFinite(km)) return "Distancia no disponible";
    if (km < 1) {
      return `${Math.round(km * 1000)} m`;
    }
    return `${km.toFixed(1)} km`;
  };


return {activeTab,fetchNearbyBusinesses,filteredResults,filters,formatDistance,isSearching,maxDistance,onBack,onFilterChange,onMaxDistanceChange,onQueryChange,onSelectBusiness,onSelectService,searchError,searchQuery,searchQueryRef,selectedFilter,setActiveTab,setMaxDistance,setSearchQuery,setSelectedFilter,setShowDistanceModal,showDistanceModal};
}
export type GlobalSearchScreenModel=ReturnType<typeof useGlobalSearchScreenController>;
