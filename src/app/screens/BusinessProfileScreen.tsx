import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Clock, Eye, Facebook, Instagram, MapPin, ShoppingCart, Store, X } from 'lucide-react';
import { motion } from 'motion/react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

const mockProducts = [
  {
    id: 1,
    name: 'Pan de Pascua clásico',
    description: 'Tradicional pan de Pascua con frutos confitados, nueces y almendras',
    price: 12000,
    image: 'https://images.unsplash.com/photo-1607478900766-efe13248b125?w=400&q=80',
    mode: 'order',
    isAvailable: true
  },
  {
    id: 2,
    name: 'Pan de Pascua frutos secos',
    description: 'Pan de Pascua con almendras, nueces y nueces confitadas',
    price: 14000,
    image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&q=80',
    mode: 'order',
    isAvailable: true
  },
  {
    id: 3,
    name: 'Queque navideño',
    description: 'Pan caletas de manjar con nueces y pasas',
    price: 8000,
    image: 'https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?w=400&q=80',
    mode: 'view',
    isAvailable: false
  },
  {
    id: 4,
    name: 'Galletas artesanales',
    description: 'Ricas galletas de jengibre especiadas y decoradas',
    price: 6000,
    image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&q=80',
    mode: 'order',
    isAvailable: true
  },
  {
    id: 5,
    name: 'Rollitos de canela',
    description: 'Rollitos de canela esponjosos con glaseado',
    price: 3500,
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80',
    mode: 'order',
    isAvailable: true
  }
];

function parseProducts(raw: any): any[] {
  if (!raw) return [];
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!Array.isArray(parsed)) return [];
    return parsed.map((p: any, i: number) => ({
      id: p.id ?? i + 1,
      name: p.name ?? '',
      description: p.description ?? '',
      price: parseInt(p.price ?? '0'),
      image: p.imageUrl ?? p.image ?? '',
      mode: p.mode ?? (p.isAvailable === false ? 'view' : 'order'),
      isAvailable: p.isAvailable ?? true
    }));
  } catch {
    return [];
  }
}

function getCoordinate(...values: any[]) {
  for (const value of values) {
    const coordinate = Number(value);
    if (Number.isFinite(coordinate)) return coordinate;
  }

  return null;
}

function calculateDistanceKm(fromLat: any, fromLng: any, toLat: any, toLng: any) {
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
}

function formatDistance(km: any) {
  const distance = Number(km);
  if (!Number.isFinite(distance) || distance <= 0) return '';
  if (distance < 1) return `A ${Math.round(distance * 1000)} m de ti`;
  return `A ${distance.toFixed(1)} km de ti`;
}

function formatBusinessType(value: any) {
  const label = String(value ?? '').trim();
  if (!label) return 'Negocio';

  const normalized = label.toLowerCase();
  if (normalized === 'negocios' || normalized === 'negocio') return 'Negocio';
  if (normalized === 'servicios' || normalized === 'servicio') return 'Servicio';
  if (normalized === 'particular') return 'Particular';

  return label.charAt(0).toUpperCase() + label.slice(1);
}

export default function BusinessProfileScreen({
  business,
  currentLocation,
  onBack,
  onCheckout
}: {
  business: any;
  currentLocation?: { lat: number | null; lng: number | null };
  onBack: () => void;
  onCheckout: (selectedProducts: any[], products: any[]) => void;
}) {
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  const [previewProduct, setPreviewProduct] = useState<any | null>(null);
  const [showRemoveTooltip, setShowRemoveTooltip] = useState(false);
  const [hasShownRemoveTooltip, setHasShownRemoveTooltip] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isScrolledRef = useRef(false);
  const lastScrollTopRef = useRef(0);
  const touchStartYRef = useRef<number | null>(null);

  const setHeaderScrolled = (nextValue: boolean) => {
    if (nextValue === isScrolledRef.current) return;

    isScrolledRef.current = nextValue;
    setIsScrolled(nextValue);
  };

  const canExpandHeader = () => !scrollContainerRef.current || scrollContainerRef.current.scrollTop <= 0;

  const handleProfileWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    if (event.deltaY > 2) {
      setHeaderScrolled(true);
      return;
    }

    if (event.deltaY < -2 && canExpandHeader()) {
      setHeaderScrolled(false);
    }
  };

  const handleProfileTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    touchStartYRef.current = event.touches[0]?.clientY ?? null;
  };

  const handleProfileTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    const touchStartY = touchStartYRef.current;
    if (touchStartY === null) return;

    const deltaY = touchStartY - event.touches[0].clientY;
    if (deltaY > 8) {
      setHeaderScrolled(true);
    } else if (deltaY < -8 && canExpandHeader()) {
      setHeaderScrolled(false);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      if (scrollContainerRef.current) {
        const scrollTop = scrollContainerRef.current.scrollTop;
        const shouldBeScrolled = scrollTop > lastScrollTopRef.current || scrollTop > 4;

        lastScrollTopRef.current = scrollTop;

        if (shouldBeScrolled) setHeaderScrolled(true);
      }
    };
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  useEffect(() => {
    if (!showRemoveTooltip) return;

    const timeout = setTimeout(() => {
      setShowRemoveTooltip(false);
    }, 4000);

    return () => clearTimeout(timeout);
  }, [showRemoveTooltip]);

  const realProducts = parseProducts(business.products);
  const products = realProducts.length > 0 ? realProducts : mockProducts;
  const isRealBusiness = realProducts.length > 0;
  const businessImage = business.photo || business.imageUrl || business.image;
  const businessType = formatBusinessType(business.type || business.category || business.categoryName);
  const isBusinessOpen = business.isOpen ?? business.open ?? true;
  const closingTime = business.closesAt || business.closeTime || business.closingTime;
  const calculatedDistanceKm = calculateDistanceKm(
    currentLocation?.lat,
    currentLocation?.lng,
    business.latitude ?? business.lat,
    business.longitude ?? business.lng ?? business.lon
  );
  const distanceLabel = formatDistance(calculatedDistanceKm);

  const handleOrderToggle = (productId: any) => {
    const isSelected = selectedProducts.includes(productId);

    setSelectedProducts((prev) => (
      isSelected
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    ));

    if (!isSelected && !hasShownRemoveTooltip) {
      setShowRemoveTooltip(true);
      setHasShownRemoveTooltip(true);
    }
  };

  return (
    <div
      className="size-full bg-gradient-to-b from-white via-blue-50/30 to-blue-100/40 flex flex-col relative"
      onWheel={handleProfileWheel}
      onTouchStart={handleProfileTouchStart}
      onTouchMove={handleProfileTouchMove}
    >
      <div className="px-4 pt-4 pb-1 border-b border-white/50 bg-white/80 backdrop-blur-sm">
        <button onClick={onBack} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors mb-1">
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>

        <motion.div
          animate={{ height: isScrolled ? 78 : 'auto', padding: isScrolled ? '8px' : '24px' }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="bg-white rounded-[28px] shadow-[0_20px_54px_rgba(15,23,42,0.11),0_10px_34px_rgba(167,139,250,0.10),0_3px_14px_rgba(15,23,42,0.05)] border border-white/80 overflow-hidden mb-2"
        >
          <div className="flex gap-4 items-center">
            <motion.div
              animate={{ width: isScrolled ? 50 : 148, height: isScrolled ? 50 : 148 }}
              transition={{ duration: 0.3 }}
              className="relative shrink-0"
            >
              {!isScrolled && (
                <div className="absolute -inset-4 rounded-full bg-[#B9A7FF]/30 blur-3xl" />
              )}
              {businessImage ? (
                <ImageWithFallback
                  src={businessImage}
                  alt={business.name}
                  className="relative w-full h-full rounded-full object-cover border-4 border-white shadow-[0_12px_30px_rgba(124,92,255,0.14)]"
                />
              ) : (
                <div className="relative w-full h-full rounded-full border-4 border-white bg-[#B9A7FF]/15 shadow-[0_12px_30px_rgba(124,92,255,0.14)] flex items-center justify-center">
                  <Store className="w-10 h-10 text-[#14C8B8]" />
                </div>
              )}
            </motion.div>

            <div className="flex-1 min-w-0">
              {isScrolled ? (
                <div className="flex min-w-0 items-center justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate text-base font-bold text-slate-950">
                      {business.name}
                    </h2>
                    <span className={`mt-0.5 inline-flex items-center gap-1.5 text-[11px] font-bold ${isBusinessOpen ? 'text-[#0F8F86]' : 'text-red-500'}`}>
                      <span className={`h-2 w-2 rounded-full ${isBusinessOpen ? 'bg-[#14C8B8]' : 'bg-red-500'}`} />
                      {isBusinessOpen ? 'Abierto' : 'Cerrado'}
                    </span>
                  </div>
                  {distanceLabel && (
                    <span className="hidden min-[390px]:inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#14C8B8]/10 px-2.5 py-1 text-[11px] font-bold text-[#0F8F86]">
                      <MapPin className="h-3 w-3 text-[#14C8B8]" />
                      {distanceLabel}
                    </span>
                  )}
                </div>
              ) : (
                <h2 className="mb-2 truncate text-2xl font-bold text-slate-950">
                  {business.name}
                </h2>
              )}

              {!isScrolled && (
                <motion.div initial={{ opacity: 1 }} animate={{ opacity: isScrolled ? 0 : 1 }} className="space-y-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#14C8B8]/10 px-2 py-0.5 text-[11px] font-bold text-[#0F8F86]">
                      <Store className="w-3 h-3 text-[#14C8B8]" />
                      {businessType}
                    </span>
                    {distanceLabel && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#14C8B8]/10 px-2 py-0.5 text-[11px] font-bold text-[#0F8F86]">
                        <MapPin className="w-3 h-3 text-[#14C8B8] fill-[#14C8B8]/15" />
                        {distanceLabel}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className={`inline-flex items-center gap-2 text-[15px] font-bold ${isBusinessOpen ? 'text-emerald-600' : 'text-red-500'}`}>
                      <span className={`h-2.5 w-2.5 rounded-full shadow-sm ${isBusinessOpen ? 'bg-emerald-500 shadow-emerald-500/30' : 'bg-red-500 shadow-red-500/30'}`} />
                      {isBusinessOpen ? 'Abierto ahora' : 'Cerrado'}
                    </span>
                    {isBusinessOpen && closingTime && (
                      <>
                        <span className="h-5 w-px bg-slate-200" />
                        <span className="inline-flex items-center gap-1.5 text-slate-500">
                          <Clock className="w-4 h-4" />
                          Cierra a las {closingTime}
                        </span>
                      </>
                    )}
                  </div>

                  <div className="inline-flex w-fit items-center gap-3 rounded-2xl bg-white px-3.5 py-2.5 shadow-[0_8px_22px_rgba(15,23,42,0.08)] ring-1 ring-slate-100">
                    <span className="text-sm font-bold text-slate-600">Síguenos</span>
                    <span className="h-5 w-px bg-slate-200" />
                    <button
                      type="button"
                      className={`rounded-full p-2 transition-all ${
                        business.instagram
                          ? 'bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 hover:scale-105'
                          : 'bg-slate-200'
                      }`}
                      aria-label="Instagram"
                    >
                      <Instagram className={`w-4 h-4 ${business.instagram ? 'text-white' : 'text-slate-400'}`} />
                    </button>
                    <button
                      type="button"
                      className={`rounded-full p-2 transition-all ${
                        business.facebook ? 'bg-blue-600 hover:scale-105' : 'bg-slate-200'
                      }`}
                      aria-label="Facebook"
                    >
                      <Facebook className={`w-4 h-4 ${business.facebook ? 'text-white' : 'text-slate-400'}`} />
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          {!isScrolled && (
            <motion.div
              initial={{ opacity: 1, height: 'auto' }}
              animate={{ opacity: isScrolled ? 0 : 1, height: isScrolled ? 0 : 'auto' }}
              transition={{ duration: 0.2 }}
            >
              <div className="mt-3 border-t border-slate-100 pt-3">
                <p className="text-sm text-slate-600 leading-relaxed">
                  {business.description || 'Especialistas en repostería artesanal. Más de 10 años creando momentos dulces para tu familia.'}
                </p>
              </div>
            </motion.div>
          )}
        </motion.div>

      </div>

      <div ref={scrollContainerRef} className="flex-1 overflow-auto px-4 pt-3 pb-28">
        <h3 className="text-base font-bold text-gray-900 mb-1.5">
          {isRealBusiness ? 'Productos y servicios' : 'Productos disponibles'}
        </h3>

        <div className="bg-white/80 backdrop-blur-sm border border-teal-100 rounded-2xl p-2 mb-3 shadow-sm">
          <div className="flex items-center justify-center gap-2">
            <div className="flex items-center gap-1.5 rounded-full bg-teal-50 px-2.5 py-1.5 text-teal-700">
              <span className="text-sm">🛒</span>
              <span className="text-[12px] font-bold">Se puede pedir</span>
            </div>
            <div className="h-6 w-px bg-gray-200" />
            <div className="flex items-center gap-1.5 rounded-full bg-teal-50 px-2.5 py-1.5 text-teal-700">
              <span className="text-sm">👁</span>
              <span className="text-[12px] font-bold">Solo para ver</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          {products.map((product) => {
            const isSelected = selectedProducts.includes(product.id);
            const canOrder = product.mode === 'order';
            return (
              <div
                key={product.id}
                onClick={() => {
                  if (!canOrder) setPreviewProduct(product);
                }}
                className={`relative overflow-hidden backdrop-blur-sm rounded-xl p-2.5 border-2 transition-all ${
                  canOrder
                    ? isSelected
                      ? 'bg-emerald-50/90 border-teal-500 shadow-lg shadow-teal-500/20'
                      : 'bg-white/80 border-teal-100 shadow-md hover:shadow-lg'
                    : 'bg-blue-50/80 border-blue-100 shadow-md hover:shadow-lg cursor-pointer'
                }`}
              >
                <div className={`absolute left-0 top-0 h-full w-1 ${canOrder ? 'bg-[#14C8B8]' : 'bg-[#7C3AED]'}`} />
                <div className="flex gap-2.5 items-center">
                  <div className="relative">
                    <ImageWithFallback
                      src={product.image}
                      alt={product.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    <div className={`absolute -left-1.5 -top-1.5 w-7 h-7 rounded-full shadow-lg flex items-center justify-center ${
                      canOrder
                        ? 'bg-gradient-to-br from-teal-400 to-emerald-500 shadow-teal-500/30'
                        : 'bg-white border border-violet-100 shadow-violet-500/20'
                    }`}>
                      {canOrder ? (
                        <ShoppingCart className="w-4 h-4 text-white" />
                      ) : (
                        <Eye className="w-4 h-4 text-[#7C3AED]" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 self-center pr-24">
                    <h4 className="font-semibold text-gray-900 text-[13px] mb-0.5">{product.name}</h4>
                    <p className="text-[11px] text-gray-600 mb-1 line-clamp-2">{product.description}</p>
                    <div className="absolute right-2.5 top-2.5 bottom-2.5 flex flex-col items-end justify-between">
                      <span className="text-[15px] font-extrabold text-gray-950 leading-none">
                        ${Number(product.price).toLocaleString('es-CL')}
                      </span>
                      {canOrder && (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleOrderToggle(product.id);
                          }}
                          className={`shrink-0 rounded-lg border px-3 py-1.5 text-[11px] font-bold transition-all inline-flex items-center gap-1.5 ${
                            isSelected
                              ? 'border-green-500 bg-white text-green-600 shadow-sm'
                              : 'border-teal-500 bg-[#14C8B8] text-white shadow-sm shadow-teal-500/20 hover:bg-[#0FB5A7]'
                          }`}
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          {isSelected ? 'Agregado ✓' : 'Agregar'}
                        </button>
                      )}
                      {!canOrder && (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setPreviewProduct(product);
                          }}
                          className="shrink-0 rounded-lg border border-[#7C3AED] bg-white px-3 py-1.5 text-[11px] font-bold text-[#7C3AED] transition-all hover:bg-violet-50 inline-flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Ver
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selectedProducts.length > 0 && (
        <div className="absolute bottom-20 left-0 right-0 px-4 py-3 bg-gradient-to-t from-white via-white/95 to-transparent">
          <button
            onClick={() => onCheckout(selectedProducts, products)}
            className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 text-white py-4 px-6 rounded-full font-semibold shadow-xl shadow-teal-500/30 hover:shadow-2xl hover:shadow-teal-500/40 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <ShoppingCart className="w-5 h-5" />
            <span>Realizar pedido ({selectedProducts.length})</span>
          </button>
        </div>
      )}

      {showRemoveTooltip && (
        <div className="absolute bottom-36 left-6 right-6 bg-white/95 backdrop-blur-sm border border-teal-100 rounded-2xl px-3 py-2.5 shadow-lg shadow-slate-900/10">
          <button
            type="button"
            onClick={() => setShowRemoveTooltip(false)}
            className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          <div className="flex items-center gap-2 pr-5">
            <div className="shrink-0 w-7 h-7 rounded-full bg-teal-500 flex items-center justify-center text-white text-xs">ℹ️</div>
            <p className="text-xs text-gray-700 leading-snug">
              <strong className="text-gray-900">Para quitarlo:</strong> toca <strong className="text-green-600">Agregado</strong> y volverá a <strong className="text-teal-600">Agregar</strong>
            </p>
          </div>
        </div>
      )}

      {previewProduct && (
        <div className="absolute inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-sm rounded-3xl bg-white p-3 shadow-2xl">
            <button
              type="button"
              onClick={() => setPreviewProduct(null)}
              className="absolute right-4 top-4 z-10 w-9 h-9 rounded-full bg-white/90 shadow-md flex items-center justify-center text-gray-700 hover:bg-white"
            >
              <X className="w-5 h-5" />
            </button>
            <ImageWithFallback
              src={previewProduct.image}
              alt={previewProduct.name}
              className="w-full max-h-[70vh] rounded-2xl object-cover"
            />
            <div className="px-2 pt-3">
              <h4 className="font-bold text-gray-900">{previewProduct.name}</h4>
              <p className="text-sm text-gray-600">{previewProduct.description}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
