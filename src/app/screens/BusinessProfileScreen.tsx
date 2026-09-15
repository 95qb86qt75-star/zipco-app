import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Clock, Eye, Facebook, Instagram, MapPin, ShoppingCart, Store, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { showAppToast } from './Toast';
import { isOwnBusiness, selectionAfterBusinessContextChange } from './businessOwnership';
import DistanceInfo from './DistanceInfo';
import { getCatalogItemAction, getCatalogPricingCounts, getPublicCatalogPriceLabel, selectionAfterCatalogChange, toggleCatalogSelection } from './catalogItemPresentation';
import { getPublicCatalog } from './profile/business-config/catalogApi';
import { parseBusinessId } from './profile/business-config/catalogValidation';
import type { CatalogItem } from './profile/business-config/types';

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
  currentUserId,
  currentLocation,
  onBack,
  onCheckout
}: {
  business: any;
  currentUserId: unknown;
  currentLocation?: { lat: number | null; lng: number | null };
  onBack: () => void;
  onCheckout: (selectedProducts: number[], products: CatalogItem[]) => void;
}) {
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [previewProduct, setPreviewProduct] = useState<CatalogItem | null>(null);
  const [products, setProducts] = useState<CatalogItem[]>([]);
  const [isCatalogLoading, setIsCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState('');
  const [showRemoveTooltip, setShowRemoveTooltip] = useState(false);
  const [hasShownRemoveTooltip, setHasShownRemoveTooltip] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isScrolledRef = useRef(false);
  const touchStartYRef = useRef<number | null>(null);

  const setHeaderScrolled = (nextValue: boolean) => {
    if (nextValue === isScrolledRef.current) return;

    isScrolledRef.current = nextValue;
    setIsScrolled(nextValue);
  };

  const handleCollapsedHeaderClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isScrolled) return;

    const target = event.target as HTMLElement;
    if (target.closest('button, a, input, select, textarea, [role="button"]')) return;

    setHeaderScrolled(false);
  };

  const handleProfileWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    if (event.deltaY > 2) {
      setHeaderScrolled(true);
    } else if (event.deltaY < -2 && (scrollContainerRef.current?.scrollTop ?? 0) <= 4) {
      setHeaderScrolled(false);
    }
  };

  const handleProfileTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    touchStartYRef.current = event.touches[0]?.clientY ?? null;
  };

  const handleProfileTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    const currentY = event.touches[0]?.clientY;
    const previousY = touchStartYRef.current;
    if (currentY === undefined || previousY === null) return;

    const deltaY = previousY - currentY;
    if (deltaY > 8) {
      setHeaderScrolled(true);
      touchStartYRef.current = currentY;
    } else if (deltaY < -8 && (scrollContainerRef.current?.scrollTop ?? 0) <= 4) {
      setHeaderScrolled(false);
      touchStartYRef.current = currentY;
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      if (scrollContainerRef.current) {
        const scrollTop = scrollContainerRef.current.scrollTop;
        if (scrollTop >= 24) {
          setHeaderScrolled(true);
        }
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

  const isOwnBusinessProfile = isOwnBusiness(business.userId, currentUserId);
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
  const catalogPricingCounts = getCatalogPricingCounts(products);

  const loadCatalog = async () => {
    const businessId = parseBusinessId(business.id);
    if (businessId === null) { setProducts([]); setCatalogError('No se pudo cargar el catálogo.'); setIsCatalogLoading(false); return; }
    setIsCatalogLoading(true); setCatalogError('');
    try { setProducts(await getPublicCatalog(businessId)); }
    catch { setProducts([]); setCatalogError('No se pudo cargar el catálogo. Intenta nuevamente.'); }
    finally { setIsCatalogLoading(false); }
  };

  useEffect(() => { void loadCatalog(); }, [business.id]);

  useEffect(() => {
    setSelectedProducts((selection) => isOwnBusinessProfile ? selectionAfterBusinessContextChange(selection, true) : selectionAfterCatalogChange(selection, products));
    setPreviewProduct(null);
    setShowRemoveTooltip(false);
    setHasShownRemoveTooltip(false);
  }, [business.id, products, isOwnBusinessProfile]);

  const handleOrderToggle = (product: CatalogItem) => {
    if (isOwnBusinessProfile) return;
    const isSelected = selectedProducts.includes(product.id);
    setSelectedProducts((prev) => toggleCatalogSelection(prev, product));

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
          layout
          onClick={handleCollapsedHeaderClick}
          animate={{ padding: isScrolled ? '8px' : '24px' }}
          transition={{ layout: { duration: 0.32, ease: 'easeInOut' }, padding: { duration: 0.32, ease: 'easeInOut' } }}
          className="bg-white rounded-[28px] shadow-[0_20px_54px_rgba(15,23,42,0.11),0_10px_34px_rgba(167,139,250,0.10),0_3px_14px_rgba(15,23,42,0.05)] border border-white/80 overflow-hidden mb-2"
        >
          <motion.div layout className="flex gap-4 items-center">
            <motion.div
              layout
              animate={{ width: isScrolled ? 50 : 148, height: isScrolled ? 50 : 148 }}
              transition={{ duration: 0.32, ease: 'easeInOut' }}
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
              <AnimatePresence initial={false} mode="popLayout">
              {isScrolled ? (
                <motion.div key="compact-header" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.18 }} className="flex min-w-0 items-center justify-between gap-3">
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
                      <DistanceInfo />
                    </span>
                  )}
                </motion.div>
              ) : (
                <motion.h2 key="expanded-title" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} className="mb-2 truncate text-2xl font-bold text-slate-950">
                  {business.name}
                </motion.h2>
              )}
              </AnimatePresence>

              <AnimatePresence initial={false}>
              {!isScrolled && (
                <motion.div key="expanded-details" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.24, ease: 'easeInOut' }} className="overflow-hidden">
                <div className="space-y-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#14C8B8]/10 px-2 py-0.5 text-[11px] font-bold text-[#0F8F86]">
                      <Store className="w-3 h-3 text-[#14C8B8]" />
                      {businessType}
                    </span>
                    {distanceLabel && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#14C8B8]/10 px-2 py-0.5 text-[11px] font-bold text-[#0F8F86]">
                        <MapPin className="w-3 h-3 text-[#14C8B8] fill-[#14C8B8]/15" />
                        {distanceLabel}
                        <DistanceInfo />
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

                  <div className="inline-flex max-w-full flex-wrap items-center gap-3 rounded-2xl bg-white px-3.5 py-2.5 shadow-[0_8px_22px_rgba(15,23,42,0.08)] ring-1 ring-slate-100 max-[390px]:gap-2 max-[390px]:px-2.5">
                    <span className="text-sm font-bold text-slate-600">Síguenos</span>
                    <span className="h-5 w-px bg-slate-200 max-[390px]:hidden" />
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
                </div>
                </motion.div>
              )}
              </AnimatePresence>
            </div>
          </motion.div>

          <AnimatePresence initial={false}>
          {!isScrolled && (
            <motion.div
              key="expanded-description"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.24, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="mt-3 border-t border-slate-100 pt-3">
                <p
                  className="text-sm text-slate-600 leading-relaxed"
                  style={
                    expanded
                      ? undefined
                      : {
                          display: '-webkit-box',
                          WebkitBoxOrient: 'vertical',
                          WebkitLineClamp: 3,
                          overflow: 'hidden'
                        }
                  }
                >
                  {business.description || 'Especialistas en repostería artesanal. Más de 10 años creando momentos dulces para tu familia.'}
                </p>
                <button
                  type="button"
                  onClick={() => setExpanded((currentExpanded) => !currentExpanded)}
                  className="mt-1 text-sm font-semibold text-[#0F8F86]"
                >
                  {expanded ? 'ver menos' : 'ver más'}
                </button>
              </div>
            </motion.div>
          )}
          </AnimatePresence>
        </motion.div>

      </div>

      <div ref={scrollContainerRef} className="flex-1 overflow-auto px-4 pt-3 pb-28">
        <h3 className="text-base font-bold text-gray-900 mb-1.5">Productos y servicios</h3>

        {isOwnBusinessProfile && (
          <div className="mb-3 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-800">
            Este es tu negocio. Puedes revisar el catálogo, pero no realizar pedidos aquí.
          </div>
        )}

        {isCatalogLoading ? <div className="rounded-2xl bg-white p-5 text-center text-sm text-slate-500">Cargando catálogo...</div> : catalogError ? <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-center text-sm text-red-700"><p>{catalogError}</p><button type="button" onClick={() => { void loadCatalog(); }} className="mt-2 font-semibold text-teal-700">Intentar nuevamente</button></div> : products.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white/80 px-5 py-8 text-center shadow-sm">
            <Store className="mx-auto mb-3 h-9 w-9 text-slate-300" />
            <p className="text-sm font-semibold text-slate-600">
              Este negocio todavía no cargó su catálogo.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-3 rounded-2xl border border-teal-100 bg-white/80 p-2 shadow-sm backdrop-blur-sm">
              <div className="grid grid-cols-3 items-stretch gap-1">
                <div className="flex min-w-0 items-center justify-center gap-1 rounded-full bg-teal-50 px-1.5 py-1.5 text-teal-700">
                  <span className="truncate text-[10px] font-bold min-[390px]:text-[11px]">Precio fijo <span className="text-slate-400">({catalogPricingCounts.fixed_price})</span></span>
                </div>
                <div className="flex min-w-0 items-center justify-center gap-1 rounded-full bg-violet-50 px-1.5 py-1.5 text-violet-700">
                  <span className="truncate text-[10px] font-bold min-[390px]:text-[11px]">Cotizar <span className="text-slate-400">({catalogPricingCounts.quote})</span></span>
                </div>
                <div className="flex min-w-0 items-center justify-center gap-1 rounded-full bg-slate-50 px-1.5 py-1.5 text-slate-700">
                  <span className="truncate text-[10px] font-bold min-[390px]:text-[11px]">Solo ver <span className="text-slate-400">({catalogPricingCounts.view})</span></span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {products.map((product) => {
            const isSelected = selectedProducts.includes(product.id);
            const action = getCatalogItemAction(product);
            const canOrder = action === 'order';
            const priceLabel = getPublicCatalogPriceLabel(product);
            return (
              <div
                key={product.id}
                onClick={() => {
                  if (!canOrder) setPreviewProduct(product);
                }}
                className={`relative overflow-hidden rounded-xl border-2 p-3 shadow-md transition-all ${
                  canOrder
                    ? isSelected
                      ? 'border-teal-400 bg-emerald-50 ring-1 ring-teal-200'
                      : 'border-teal-100 bg-white hover:shadow-md'
                    : 'cursor-pointer border-violet-100 bg-white hover:shadow-md'
                }`}
              >
                <div className="grid grid-cols-[56px_minmax(0,1fr)_96px] items-center gap-2.5 min-[430px]:grid-cols-[64px_minmax(0,1fr)_105px]">
                  <div className="relative">
                    <ImageWithFallback
                      src={product.imageUrl}
                      alt={product.name}
                      className="h-14 w-14 rounded-lg object-cover min-[430px]:h-16 min-[430px]:w-16"
                    />
                    <div className={`absolute -left-1.5 -top-1.5 flex h-7 w-7 items-center justify-center rounded-full border border-white shadow-lg ${
                      canOrder
                        ? 'bg-gradient-to-br from-teal-400 to-emerald-500 shadow-teal-500/30'
                        : 'bg-gradient-to-br from-violet-500 to-purple-600 shadow-violet-500/30'
                    }`}>
                      {canOrder ? (
                        <ShoppingCart className="h-4 w-4 text-white" />
                      ) : (
                        <Eye className="h-4 w-4 text-white" />
                      )}
                    </div>
                  </div>
                  <div className="min-w-0 self-center">
                    <h4 className="mb-0.5 line-clamp-2 text-[12px] font-bold leading-4 text-slate-950 min-[430px]:text-[13px]">{product.name}</h4>
                    <p className="line-clamp-2 text-[10px] leading-[14px] text-slate-500 min-[430px]:text-[11px]">{product.description}</p>
                  </div>
                    <div className="flex h-full min-h-14 min-w-0 flex-col items-end justify-between">
                      {priceLabel && product.pricingMode === 'quote' ? (
                        <span className="text-right text-violet-600">
                          {priceLabel.startsWith('Desde ') && <small className="block text-[9px] font-semibold leading-none text-slate-500">Desde</small>}
                          <strong className="text-[15px] font-black leading-none min-[430px]:text-[16px]">{priceLabel.replace(/^Desde /, '')}</strong>
                        </span>
                      ) : priceLabel ? (
                        <span className="text-right text-[14px] font-extrabold leading-none text-slate-950 min-[430px]:text-[15px]">{priceLabel}</span>
                      ) : null}
                      {canOrder && !isOwnBusinessProfile && (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleOrderToggle(product);
                          }}
                          className={`relative inline-flex min-h-8 w-auto items-center justify-center gap-1.5 rounded-lg border px-3 py-1 text-[11px] font-bold shadow-sm transition-all after:absolute after:-inset-y-1.5 after:inset-x-0 ${
                            isSelected
                              ? 'border-green-500 bg-white text-green-600 shadow-sm'
                              : 'border-teal-500 bg-[#14C8B8] text-white shadow-sm shadow-teal-500/20 hover:bg-[#0FB5A7]'
                          }`}
                        >
                          <ShoppingCart className="h-4 w-4" />
                          {isSelected ? 'Agregado ✓' : 'Agregar'}
                        </button>
                      )}
                      {action === 'view' || isOwnBusinessProfile ? (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setPreviewProduct(product);
                          }}
                          className="relative inline-flex min-h-8 w-auto items-center justify-center gap-1.5 rounded-lg border border-violet-500 bg-white px-3 py-1 text-[11px] font-bold text-violet-600 shadow-sm transition-all after:absolute after:-inset-y-1.5 after:inset-x-0 hover:bg-violet-50"
                        >
                          <Eye className="h-4 w-4" />
                          Ver
                        </button>
                      ) : action === 'quote-soon' ? (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            showAppToast('', 'success', {
                              title: 'Cotizaciones: próximamente',
                              description: 'Pronto podrás solicitar cotizaciones desde ZIPCO.',
                              dedupeKey: 'catalog-quotes-coming-soon',
                              icon: 'bell'
                            });
                          }}
                          className="relative min-h-8 w-auto rounded-lg border border-violet-400 bg-white px-3 py-1 text-[11px] font-bold text-violet-600 shadow-sm after:absolute after:-inset-y-1.5 after:inset-x-0"
                        >
                          Cotizar
                        </button>
                      ) : !canOrder ? (
                        <button type="button" className="relative min-h-8 w-auto rounded-lg border border-violet-400 bg-white px-3 py-1 text-[10px] font-bold leading-3 text-violet-600 shadow-sm after:absolute after:-inset-y-1.5 after:inset-x-0">Solicitar servicio</button>
                      ) : null}
                    </div>
                  </div>
                </div>
            );
              })}
            </div>
          </>
        )}
      </div>

      {!isOwnBusinessProfile && products.length > 0 && selectedProducts.length > 0 && (
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
              src={previewProduct.imageUrl}
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
