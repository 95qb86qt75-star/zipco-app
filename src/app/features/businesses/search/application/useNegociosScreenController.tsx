import { useEffect, useRef, useState } from 'react';






export function useNegociosScreenController({ onBack, onSelectBusiness, activeTab, setActiveTab, initialQuery, onQueryChange, initialFilter, onFilterChange, initialMaxDistance, onMaxDistanceChange, initialScrollTop, onScrollTopChange }: { onBack: () => void; onSelectBusiness: (business: any) => void; activeTab: string; setActiveTab: (tab: string) => void; initialQuery: string; onQueryChange: (query: string) => void; initialFilter: string; onFilterChange: (filter: string) => void; initialMaxDistance: number; onMaxDistanceChange: (distance: number) => void; initialScrollTop: number; onScrollTopChange: (scrollTop: number) => void }){

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedFilter, setSelectedFilter] = useState(initialFilter);
  const [maxDistance, setMaxDistance] = useState(initialMaxDistance);
  const [showDistanceModal, setShowDistanceModal] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (resultsRef.current) resultsRef.current.scrollTop = initialScrollTop;
  }, []);

  const normalize = (str: string) =>
    str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

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


return {activeTab,filteredResults,filters,formatDistance,maxDistance,onBack,onFilterChange,onMaxDistanceChange,onQueryChange,onScrollTopChange,onSelectBusiness,resultsRef,searchQuery,selectedFilter,setActiveTab,setMaxDistance,setSearchQuery,setSelectedFilter,setShowDistanceModal,showDistanceModal};
}
export type NegociosScreenModel=ReturnType<typeof useNegociosScreenController>;
