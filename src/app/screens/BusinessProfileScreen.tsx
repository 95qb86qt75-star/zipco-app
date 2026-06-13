import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Clock, Eye, Facebook, Instagram, MapPin, ShoppingCart, Star, Store, X } from 'lucide-react';
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

function formatDistance(km: any) {
  const distance = Number(km ?? 0);
  if (!Number.isFinite(distance) || distance <= 0) return 'Cerca de ti';
  if (distance < 1) return `${Math.round(distance * 1000)} m de ti`;
  return `${distance.toFixed(1)} km de ti`;
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

export default function BusinessProfileScreen({ business, onBack, onCheckout }: { business: any; onBack: () => void; onCheckout: (selectedProducts: any[], products: any[]) => void }) {
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  const [previewProduct, setPreviewProduct] = useState<any | null>(null);
  const [showRemoveTooltip, setShowRemoveTooltip] = useState(false);
  const [hasShownRemoveTooltip, setHasShownRemoveTooltip] = useState(false);
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
  const businessImage = business.image || business.photo || business.imageUrl;
  const businessType = formatBusinessType(business.type || business.category || business.categoryName);
  const isBusinessOpen = business.isOpen ?? business.open ?? true;
  const closingTime = business.closesAt || business.closeTime || business.closingTime;
  const distanceLabel = formatDistance(business.distance ?? business.distanceKm ?? business.distance_km);

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
    <div className="size-full bg-gradient-to-b from-white via-blue-50/30 to-blue-100/40 flex flex-col relative">
      <div className="px-4 pt-6 pb-2 border-b border-white/50 bg-white/80 backdrop-blur-sm">
        <button onClick={onBack} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors mb-2">
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>

        <motion.div
          animate={{ height: isScrolled ? 70 : 'auto', padding: isScrolled ? '8px' : '22px' }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="bg-white rounded-[28px] shadow-xl shadow-slate-900/10 border border-white/80 overflow-hidden mb-2"
        >
          <div className="flex gap-4 items-center">
            <motion.div
              animate={{ width: isScrolled ? 50 : 104, height: isScrolled ? 50 : 104 }}
              transition={{ duration: 0.3 }}
              className="relative shrink-0"
            >
              {!isScrolled && (
                <div className="absolute -inset-4 rounded-full bg-gradient-to-br from-violet-300/45 via-teal-200/45 to-sky-300/35 blur-xl" />
              )}
              <ImageWithFallback
                src={businessImage}
                alt={business.name}
                className="relative w-full h-full rounded-full object-cover border-4 border-white shadow-lg shadow-teal-500/20"
              />
            </motion.div>

            <div className="flex-1 min-w-0">
              <h2 className={`font-bold text-slate-950 truncate ${isScrolled ? 'text-sm' : 'text-2xl mb-2'}`}>
                {business.name}
              </h2>

              {!isScrolled && (
                <motion.div initial={{ opacity: 1 }} animate={{ opacity: isScrolled ? 0 : 1 }} className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700">
                      <Store className="w-4 h-4 text-teal-600" />
                      {businessType}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-3 py-1.5 text-xs font-bold text-teal-700">
                      <MapPin className="w-4 h-4 text-teal-600 fill-teal-500/15" />
                      {distanceLabel}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className={`inline-flex items-center gap-2 font-bold ${isBusinessOpen ? 'text-emerald-600' : 'text-red-500'}`}>
                      <span className={`h-2.5 w-2.5 rounded-full ${isBusinessOpen ? 'bg-emerald-500' : 'bg-red-500'}`} />
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
              <div className="mt-5 border-t border-slate-100 pt-4">
                <p className="text-sm text-slate-600 leading-relaxed">
                  {business.description || 'Especialistas en reposteria artesanal. Mas de 10 anos creando momentos dulces para tu familia.'}
                </p>
              </div>

              <div className="mt-5 inline-flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 shadow-sm ring-1 ring-slate-100">
                <span className="text-sm font-bold text-slate-600">Siguenos</span>
                <span className="h-6 w-px bg-slate-200" />
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
        </motion.div>

        {false && (
        <motion.div
          animate={{ height: isScrolled ? 70 : 'auto', padding: isScrolled ? '8px' : '20px' }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 overflow-hidden mb-2"
        >
          <div className="flex gap-3 items-center">
            <motion.div animate={{ width: isScrolled ? 50 : 80, height: isScrolled ? 50 : 80 }} transition={{ duration: 0.3 }}>
              <ImageWithFallback
                src={business.image || business.photo}
                alt={business.name}
                className="w-full h-full rounded-full object-cover border-2 border-teal-500"
              />
            </motion.div>

            <div className="flex-1 min-w-0">
              <h2 className={`font-bold text-gray-900 truncate ${isScrolled ? 'text-sm' : 'text-xl mb-1'}`}>
                {business.name}
              </h2>

              {!isScrolled && (
                <motion.div initial={{ opacity: 1 }} animate={{ opacity: isScrolled ? 0 : 1 }} className="flex items-center gap-2 mb-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${business.type === 'Negocio' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
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
                {business.instagram && (
                  <button className={`bg-gradient-to-br from-purple-500 to-pink-500 rounded-full hover:scale-110 transition-all ${isScrolled ? 'p-1.5' : 'p-2'}`}>
                    <Instagram className={`text-white ${isScrolled ? 'w-3 h-3' : 'w-4 h-4'}`} />
                  </button>
                )}
                {business.facebook && (
                  <button className={`bg-blue-600 rounded-full hover:scale-110 transition-all ${isScrolled ? 'p-1.5' : 'p-2'}`}>
                    <Facebook className={`text-white ${isScrolled ? 'w-3 h-3' : 'w-4 h-4'}`} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {!isScrolled && (
            <motion.p
              initial={{ opacity: 1, height: 'auto' }}
              animate={{ opacity: isScrolled ? 0 : 1, height: isScrolled ? 0 : 'auto' }}
              transition={{ duration: 0.2 }}
              className="text-sm text-gray-600 leading-relaxed mt-4"
            >
              {business.description || 'Especialistas en repostería artesanal. Más de 10 años creando momentos dulces para tu familia.'}
            </motion.p>
          )}
        </motion.div>
        )}
      </div>

      <div ref={scrollContainerRef} className="flex-1 overflow-auto px-4 pt-4 pb-28">
        <h3 className="text-lg font-bold text-gray-900 mb-2">
          {isRealBusiness ? 'Productos y servicios' : 'Productos disponibles'}
        </h3>

        <div className="bg-white/80 backdrop-blur-sm border border-teal-100 rounded-2xl p-3 mb-4 shadow-sm">
          <div className="flex items-center justify-center gap-4">
            <div className="flex items-center gap-2 rounded-full bg-teal-50 px-3 py-2 text-teal-700">
              <span className="text-base">🛒</span>
              <span className="text-xs font-bold">Se puede pedir</span>
            </div>
            <div className="h-8 w-px bg-gray-200" />
            <div className="flex items-center gap-2 rounded-full bg-teal-50 px-3 py-2 text-teal-700">
              <span className="text-base">👁</span>
              <span className="text-xs font-bold">Solo para ver</span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {products.map((product) => {
            const isSelected = selectedProducts.includes(product.id);
            const canOrder = product.mode === 'order';
            return (
              <div
                key={product.id}
                onClick={() => {
                  if (!canOrder) setPreviewProduct(product);
                }}
                className={`backdrop-blur-sm rounded-2xl p-4 border-2 transition-all ${
                  canOrder
                    ? isSelected
                      ? 'bg-emerald-50/90 border-teal-500 shadow-lg shadow-teal-500/20'
                      : 'bg-white/80 border-teal-100 shadow-md hover:shadow-lg'
                    : 'bg-blue-50/80 border-blue-100 shadow-md hover:shadow-lg cursor-pointer'
                }`}
              >
                <div className="flex gap-3 items-center">
                  <div className="relative">
                    <ImageWithFallback
                      src={product.image}
                      alt={product.name}
                      className="w-20 h-20 rounded-xl object-cover"
                    />
                    <div className="absolute -left-2 -top-2 w-9 h-9 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 shadow-lg shadow-teal-500/30 flex items-center justify-center">
                      {canOrder ? (
                        <ShoppingCart className="w-5 h-5 text-white" />
                      ) : (
                        <Eye className="w-5 h-5 text-white" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 text-sm mb-1">{product.name}</h4>
                    <p className="text-xs text-gray-600 mb-2 line-clamp-2">{product.description}</p>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-base font-bold text-gray-900">
                        ${Number(product.price).toLocaleString('es-CL')}
                      </span>
                      {canOrder && (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleOrderToggle(product.id);
                          }}
                          className={`shrink-0 rounded-xl border px-4 py-2 text-xs font-bold transition-all ${
                            isSelected
                              ? 'border-green-500 bg-white text-green-600 shadow-sm'
                              : 'border-teal-500 bg-white text-teal-600 hover:bg-teal-50'
                          }`}
                        >
                          {isSelected ? 'Agregado ✓' : 'Agregar'}
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
