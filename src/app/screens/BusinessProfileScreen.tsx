import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  Clock,
  Eye,
  Facebook,
  Heart,
  Instagram,
  MapPin,
  MessageCircle,
  ShoppingCart,
  Sparkles,
  Store,
  X,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import {
  isOwnBusiness,
  selectionAfterBusinessContextChange,
} from "./businessOwnership";
import DistanceInfo from "./DistanceInfo";
import {
  getCatalogItemAction,
  getCatalogPricingCounts,
  getPublicCatalogPriceLabel,
  selectionAfterCatalogChange,
  toggleCatalogSelection,
} from "./catalogItemPresentation";
import { getPublicCatalog } from "./profile/business-config/catalogApi";
import { parseBusinessId } from "./profile/business-config/catalogValidation";
import type { CatalogItem } from "./profile/business-config/types";
import QuoteRequestModal from "./quotes/QuoteRequestModal";

function getCoordinate(...values: any[]) {
  for (const value of values) {
    if (value === null || value === undefined || value === "") continue;
    const coordinate = Number(value);
    if (Number.isFinite(coordinate)) return coordinate;
  }

  return null;
}

function calculateDistanceKm(
  fromLat: any,
  fromLng: any,
  toLat: any,
  toLng: any,
) {
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
}

function formatDistance(km: any) {
  const distance = Number(km);
  if (!Number.isFinite(distance) || distance <= 0) return "";
  if (distance < 1) return `A ${Math.round(distance * 1000)} m de ti`;
  return `A ${distance.toFixed(1)} km de ti`;
}

function formatBusinessType(value: any) {
  const label = String(value ?? "").trim();
  if (!label) return "Negocio";

  const normalized = label.toLowerCase();
  if (normalized === "negocios" || normalized === "negocio") return "Negocio";
  if (normalized === "servicios" || normalized === "servicio")
    return "Servicio";
  if (normalized === "particular") return "Particular";

  return label.charAt(0).toUpperCase() + label.slice(1);
}

export default function BusinessProfileScreen({
  business,
  currentUserId,
  currentLocation,
  isFavorite,
  onToggleFavorite,
  onBack,
  onCheckout,
  onQuoteCreated,
  onSessionExpired,
}: {
  business: any;
  currentUserId: unknown;
  currentLocation?: { lat: number | null; lng: number | null };
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  onBack: () => void;
  onCheckout: (selectedProducts: number[], products: CatalogItem[]) => void;
  onQuoteCreated?: () => void;
  onSessionExpired?: () => void;
}) {
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [previewProduct, setPreviewProduct] = useState<CatalogItem | null>(
    null,
  );
  const [products, setProducts] = useState<CatalogItem[]>([]);
  const [isCatalogLoading, setIsCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState("");
  const [showRemoveTooltip, setShowRemoveTooltip] = useState(false);
  const [hasShownRemoveTooltip, setHasShownRemoveTooltip] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [quoteItem, setQuoteItem] = useState<CatalogItem | null>(null);
  const [socialNotice, setSocialNotice] = useState("");
  const [catalogFilter, setCatalogFilter] = useState<
    "all" | "fixed_price" | "quote" | "view"
  >("all");
  const reduceMotion = useReducedMotion();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isScrolledRef = useRef(false);
  const touchStartYRef = useRef<number | null>(null);

  const setHeaderScrolled = (nextValue: boolean) => {
    if (nextValue === isScrolledRef.current) return;

    isScrolledRef.current = nextValue;
    setIsScrolled(nextValue);
  };

  const handleCollapsedHeaderClick = (
    event: React.MouseEvent<HTMLDivElement>,
  ) => {
    if (!isScrolled) return;

    const target = event.target as HTMLElement;
    if (target.closest('button, a, input, select, textarea, [role="button"]'))
      return;

    setHeaderScrolled(false);
  };

  const handleProfileWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    if (event.deltaY > 2) {
      setHeaderScrolled(true);
    } else if (
      event.deltaY < -2 &&
      (scrollContainerRef.current?.scrollTop ?? 0) <= 4
    ) {
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
    } else if (
      deltaY < -8 &&
      (scrollContainerRef.current?.scrollTop ?? 0) <= 4
    ) {
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
      container.addEventListener("scroll", handleScroll);
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, []);

  useEffect(() => {
    if (!showRemoveTooltip) return;

    const timeout = setTimeout(() => {
      setShowRemoveTooltip(false);
    }, 2200);

    return () => clearTimeout(timeout);
  }, [showRemoveTooltip]);

  useEffect(() => {
    if (!socialNotice) return;
    const timeout = setTimeout(() => setSocialNotice(""), 3000);
    return () => clearTimeout(timeout);
  }, [socialNotice]);

  const openSocialProfile = (
    network: "Instagram" | "Facebook",
    value: unknown,
  ) => {
    const profile = String(value ?? "").trim();
    if (!profile) {
      setSocialNotice(`${business.name} no ha proporcionado ${network}.`);
      return;
    }
    const url = /^https?:\/\//i.test(profile)
      ? profile
      : network === "Instagram"
        ? `https://instagram.com/${profile.replace(/^@/, "")}`
        : `https://facebook.com/${profile.replace(/^@/, "")}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const isOwnBusinessProfile = isOwnBusiness(business.userId, currentUserId);
  const businessImage = business.photo || business.imageUrl || business.image;
  const businessType = formatBusinessType(
    business.type || business.category || business.categoryName,
  );
  const isBusinessOpen = business.isOpen ?? business.open ?? true;
  const closingTime =
    business.closesAt || business.closeTime || business.closingTime;
  const calculatedDistanceKm = calculateDistanceKm(
    currentLocation?.lat,
    currentLocation?.lng,
    business.latitude ?? business.lat,
    business.longitude ?? business.lng ?? business.lon,
  );
  const backendDistanceKm = getCoordinate(
    business.distanceKm,
    business.distance_km,
    business.distance,
  );
  const distanceLabel = formatDistance(
    calculatedDistanceKm ?? backendDistanceKm,
  );
  const catalogPricingCounts = getCatalogPricingCounts(products);
  const visibleProducts =
    catalogFilter === "all"
      ? products
      : products.filter((product) => product.pricingMode === catalogFilter);
  const selectedTotal = products
    .filter((product) => selectedProducts.includes(product.id))
    .reduce((total, product) => total + (product.priceClp ?? 0), 0);

  const loadCatalog = async () => {
    const businessId = parseBusinessId(business.id);
    if (businessId === null) {
      setProducts([]);
      setCatalogError("No se pudo cargar el catálogo.");
      setIsCatalogLoading(false);
      return;
    }
    setIsCatalogLoading(true);
    setCatalogError("");
    try {
      setProducts(await getPublicCatalog(businessId));
    } catch {
      setProducts([]);
      setCatalogError("No se pudo cargar el catálogo. Intenta nuevamente.");
    } finally {
      setIsCatalogLoading(false);
    }
  };

  useEffect(() => {
    void loadCatalog();
  }, [business.id]);

  useEffect(() => {
    setSelectedProducts((selection) =>
      isOwnBusinessProfile
        ? selectionAfterBusinessContextChange(selection, true)
        : selectionAfterCatalogChange(selection, products),
    );
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
      className="zipco-theme-surface size-full bg-gradient-to-b from-white via-blue-50/30 to-blue-100/40 flex flex-col relative"
      onWheel={handleProfileWheel}
      onTouchStart={handleProfileTouchStart}
      onTouchMove={handleProfileTouchMove}
    >
      <div className="zipco-safe-header border-b border-slate-200/60 bg-white/80 px-4 pb-1 backdrop-blur-sm">
        <div className="mb-1 flex items-center justify-between">
          <button
            onClick={onBack}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Volver"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <button
            type="button"
            onClick={onToggleFavorite}
            className="rounded-full bg-white p-2 shadow-sm ring-1 ring-slate-100"
            aria-label={
              isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"
            }
          >
            <Heart
              className={`h-5 w-5 ${isFavorite ? "fill-rose-500 text-rose-500" : "text-slate-500"}`}
            />
          </button>
        </div>

        <motion.div
          layout
          onClick={handleCollapsedHeaderClick}
          animate={{ padding: isScrolled ? "8px" : "14px" }}
          transition={{
            layout: { duration: 0.32, ease: "easeInOut" },
            padding: { duration: 0.32, ease: "easeInOut" },
          }}
          className="bg-white rounded-[28px] shadow-[0_20px_54px_rgba(15,23,42,0.11),0_10px_34px_rgba(167,139,250,0.10),0_3px_14px_rgba(15,23,42,0.05)] border border-white/80 overflow-hidden mb-2"
        >
          <motion.div layout className="flex gap-4 items-center">
            <motion.div
              layout
              animate={{
                width: isScrolled ? 48 : 116,
                height: isScrolled ? 48 : 116,
              }}
              transition={{ duration: 0.32, ease: "easeInOut" }}
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
                  <motion.div
                    key="compact-header"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.18 }}
                    className="flex min-w-0 items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <h2 className="line-clamp-2 text-base font-bold leading-tight text-slate-950">
                        {business.name}
                      </h2>
                      <span
                        className={`mt-0.5 inline-flex items-center gap-1.5 text-[11px] font-bold ${isBusinessOpen ? "text-[#0F8F86]" : "text-red-500"}`}
                      >
                        <span
                          className={`h-2 w-2 rounded-full ${isBusinessOpen ? "bg-[#14C8B8]" : "bg-red-500"}`}
                        />
                        {isBusinessOpen ? "Abierto" : "Cerrado"}
                      </span>
                    </div>
                    {distanceLabel && (
                      <span className="hidden min-[390px]:inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#14C8B8]/10 px-2.5 py-1 text-[11px] font-bold text-[#0F8F86]">
                        <MapPin className="h-3 w-3 text-[#14C8B8]" />
                        {distanceLabel}
                        <span className="zipco-distance-orbit">
                          <DistanceInfo />
                        </span>
                      </span>
                    )}
                  </motion.div>
                ) : (
                  <motion.h2
                    key="expanded-title"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    className="mb-2 line-clamp-2 text-2xl font-bold leading-tight text-slate-950"
                  >
                    {business.name}
                  </motion.h2>
                )}
              </AnimatePresence>

              <AnimatePresence initial={false}>
                {!isScrolled && (
                  <motion.div
                    key="expanded-details"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.24, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#14C8B8]/10 px-2 py-0.5 text-[11px] font-bold text-[#0F8F86]">
                          <Store className="w-3 h-3 text-[#14C8B8]" />
                          {businessType}
                        </span>
                        {distanceLabel && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#14C8B8]/10 px-2 py-0.5 text-[11px] font-bold text-[#0F8F86]">
                            <MapPin className="w-3 h-3 text-[#14C8B8] fill-[#14C8B8]/15" />
                            {distanceLabel}
                            <span className="zipco-distance-orbit">
                              <DistanceInfo />
                            </span>
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        <span
                          className={`inline-flex items-center gap-2 text-[15px] font-bold ${isBusinessOpen ? "text-emerald-600" : "text-red-500"}`}
                        >
                          <span
                            className={`h-2.5 w-2.5 rounded-full shadow-sm ${isBusinessOpen ? "zipco-online-dot bg-emerald-500 shadow-emerald-500/30" : "bg-red-500 shadow-red-500/30"}`}
                          />
                          {isBusinessOpen ? "Abierto ahora" : "Cerrado"}
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

                      <div className="inline-flex max-w-full items-center gap-2 rounded-full bg-white px-2.5 py-1.5 shadow-[0_8px_22px_rgba(15,23,42,0.08)] ring-1 ring-slate-100">
                        <span className="text-sm font-bold text-slate-600">
                          Síguenos
                        </span>
                        <span className="h-5 w-px bg-slate-200 max-[390px]:hidden" />
                        <button
                          type="button"
                          onClick={() =>
                            openSocialProfile("Instagram", business.instagram)
                          }
                          className={`rounded-full p-2 transition-all ${
                            business.instagram
                              ? "bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 hover:scale-105"
                              : "bg-slate-200"
                          }`}
                          aria-label="Instagram"
                        >
                          <Instagram
                            className={`w-4 h-4 ${business.instagram ? "text-white" : "text-slate-400"}`}
                          />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            openSocialProfile("Facebook", business.facebook)
                          }
                          className={`rounded-full p-2 transition-all ${
                            business.facebook
                              ? "bg-blue-600 hover:scale-105"
                              : "bg-slate-200"
                          }`}
                          aria-label="Facebook"
                        >
                          <Facebook
                            className={`w-4 h-4 ${business.facebook ? "text-white" : "text-slate-400"}`}
                          />
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
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.24, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="mt-3 border-t border-slate-100 pt-3">
                  <p
                    className="text-sm text-slate-600 leading-relaxed"
                    style={
                      expanded
                        ? undefined
                        : {
                            display: "-webkit-box",
                            WebkitBoxOrient: "vertical",
                            WebkitLineClamp: 1,
                            overflow: "hidden",
                          }
                    }
                  >
                    {business.description ||
                      "Especialistas en repostería artesanal. Más de 10 años creando momentos dulces para tu familia."}
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      setExpanded((currentExpanded) => !currentExpanded)
                    }
                    className="zipco-description-link mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-[#0F8F86]"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    {expanded
                      ? "Ocultar descripción"
                      : "Ver descripción del negocio"}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-auto px-4 pt-3 pb-40"
      >
        <h3 className="text-base font-bold text-gray-900 mb-1.5">
          Productos y servicios
        </h3>

        {isOwnBusinessProfile && (
          <div className="mb-3 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-800">
            Este es tu negocio. Puedes revisar el catálogo, pero no realizar
            pedidos aquí.
          </div>
        )}

        {isCatalogLoading ? (
          <div className="rounded-2xl bg-white p-5 text-center text-sm text-slate-500">
            Cargando catálogo...
          </div>
        ) : catalogError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-center text-sm text-red-700">
            <p>{catalogError}</p>
            <button
              type="button"
              onClick={() => {
                void loadCatalog();
              }}
              className="mt-2 font-semibold text-teal-700"
            >
              Intentar nuevamente
            </button>
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white/80 px-5 py-8 text-center shadow-sm">
            <Store className="mx-auto mb-3 h-9 w-9 text-slate-300" />
            <p className="text-sm font-semibold text-slate-600">
              Este negocio todavía no cargó su catálogo.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-3 rounded-2xl border border-slate-200 bg-white/80 p-1.5 shadow-sm backdrop-blur-sm">
              <div className="flex gap-1 overflow-x-auto">
                {(
                  [
                    ["all", "Todos", products.length],
                    [
                      "fixed_price",
                      "Precio fijo",
                      catalogPricingCounts.fixed_price,
                    ],
                    ["quote", "Cotizar", catalogPricingCounts.quote],
                    ["view", "Solo ver", catalogPricingCounts.view],
                  ] as const
                )
                  .filter(([, , count]) => count > 0)
                  .map(([id, label, count]) => (
                    <motion.button
                      key={id}
                      type="button"
                      onClick={() => setCatalogFilter(id)}
                      whileTap={reduceMotion ? undefined : { scale: 0.96 }}
                      className={`shrink-0 rounded-full px-3 py-2 text-[11px] font-bold transition-all ${catalogFilter === id ? "bg-gradient-to-r from-teal-600 to-emerald-500 text-white shadow-sm" : "bg-slate-100 text-slate-600"}`}
                    >
                      {label} ({count})
                    </motion.button>
                  ))}
              </div>
            </div>

            <motion.div layout className="space-y-2">
              <AnimatePresence mode="popLayout" initial={false}>
                {visibleProducts.map((product, index) => {
                  const isSelected = selectedProducts.includes(product.id);
                  const action = getCatalogItemAction(product);
                  const canOrder = action === "order";
                  const priceLabel = getPublicCatalogPriceLabel(product);
                  return (
                    <motion.div
                      key={product.id}
                      layout
                      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={
                        reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }
                      }
                      transition={{
                        duration: 0.22,
                        delay: reduceMotion ? 0 : index * 0.045,
                      }}
                      onClick={() => {
                        setPreviewProduct(product);
                      }}
                      className={`zipco-catalog-card relative min-h-[88px] overflow-hidden rounded-xl border-2 p-3 shadow-md transition-all ${
                        canOrder
                          ? isSelected
                            ? "border-teal-400 bg-emerald-50 ring-1 ring-teal-200"
                            : "border-teal-200 bg-gradient-to-br from-white to-teal-50 hover:shadow-md"
                          : product.pricingMode === "quote"
                            ? "cursor-pointer border-violet-200 bg-gradient-to-br from-white to-violet-50 hover:shadow-md"
                            : "cursor-pointer border-slate-200 bg-gradient-to-br from-white to-slate-50 hover:shadow-md"
                      }`}
                    >
                      <div className="grid grid-cols-[56px_minmax(0,1fr)_96px] items-center gap-2.5 min-[430px]:grid-cols-[64px_minmax(0,1fr)_105px]">
                        <div className="relative">
                          <ImageWithFallback
                            src={product.imageUrl}
                            alt={product.name}
                            className="h-14 w-14 rounded-lg object-cover min-[430px]:h-16 min-[430px]:w-16"
                          />
                          <div
                            className={`absolute -left-1.5 -top-1.5 flex h-7 w-7 items-center justify-center rounded-full border border-white shadow-lg ${
                              canOrder
                                ? "bg-gradient-to-br from-teal-400 to-emerald-500 shadow-teal-500/30"
                                : "bg-gradient-to-br from-violet-500 to-purple-600 shadow-violet-500/30"
                            }`}
                          >
                            {canOrder ? (
                              <ShoppingCart className="h-4 w-4 text-white" />
                            ) : (
                              <Eye className="h-4 w-4 text-white" />
                            )}
                          </div>
                        </div>
                        <div className="min-w-0 self-center">
                          <h4 className="mb-0.5 line-clamp-2 text-[12px] font-bold leading-4 text-slate-950 min-[430px]:text-[13px]">
                            {product.name}
                          </h4>
                          <p className="line-clamp-2 text-[10px] leading-[14px] text-slate-500 min-[430px]:text-[11px]">
                            {product.description}
                          </p>
                        </div>
                        <div className="flex h-full min-h-14 min-w-0 flex-col items-end justify-between">
                          {priceLabel && product.pricingMode === "quote" ? (
                            <span className="text-right text-violet-600">
                              {priceLabel.startsWith("Desde ") && (
                                <small className="block text-[9px] font-semibold leading-none text-slate-500">
                                  Desde
                                </small>
                              )}
                              <strong className="text-[15px] font-black leading-none min-[430px]:text-[16px]">
                                {priceLabel.replace(/^Desde /, "")}
                              </strong>
                            </span>
                          ) : priceLabel ? (
                            <span className="text-right text-[14px] font-extrabold leading-none text-slate-950 min-[430px]:text-[15px]">
                              {priceLabel}
                            </span>
                          ) : null}
                          {canOrder && !isOwnBusinessProfile && (
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleOrderToggle(product);
                              }}
                              className={`relative inline-flex h-9 w-auto items-center justify-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1 text-[11px] font-bold shadow-sm transition-all after:absolute after:-inset-y-1.5 after:inset-x-0 ${
                                isSelected
                                  ? "border-green-500 bg-white text-green-600 shadow-sm"
                                  : "border-teal-500 bg-[#14C8B8] text-white shadow-sm shadow-teal-500/20 hover:bg-[#0FB5A7]"
                              }`}
                            >
                              {isSelected ? (
                                <Check className="h-4 w-4" />
                              ) : (
                                <ShoppingCart className="h-4 w-4" />
                              )}
                              {isSelected ? "Agregado" : "Agregar"}
                            </button>
                          )}
                          {action === "view" || isOwnBusinessProfile ? (
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                setPreviewProduct(product);
                              }}
                              className="relative inline-flex min-h-8 w-auto items-center justify-center gap-1.5 rounded-lg border border-violet-500 bg-white px-3 py-1 text-[11px] font-bold text-violet-600 shadow-sm transition-all after:absolute after:-inset-y-1.5 after:inset-x-0 hover:bg-violet-50"
                            >
                              <Eye className="h-4 w-4" />
                              Ver detalle
                            </button>
                          ) : action === "quote-soon" ? (
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                setQuoteItem(product);
                              }}
                              className="relative inline-flex min-h-8 w-auto items-center gap-1 rounded-lg bg-gradient-to-r from-violet-600 to-purple-500 px-3 py-1 text-[11px] font-bold text-white shadow-sm after:absolute after:-inset-y-1.5 after:inset-x-0"
                            >
                              <MessageCircle className="h-3.5 w-3.5" />
                              Cotizar
                            </button>
                          ) : !canOrder ? (
                            <button
                              type="button"
                              className="relative min-h-8 w-auto rounded-lg border border-violet-400 bg-white px-3 py-1 text-[10px] font-bold leading-3 text-violet-600 shadow-sm after:absolute after:-inset-y-1.5 after:inset-x-0"
                            >
                              Solicitar servicio
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          </>
        )}
      </div>

      {!isOwnBusinessProfile &&
        products.length > 0 &&
        selectedProducts.length > 0 && (
          <div className="zipco-sticky-fade absolute bottom-24 left-0 right-0 z-40 bg-gradient-to-t from-white via-white/95 to-transparent px-4 py-2">
            <button
              onClick={() => onCheckout(selectedProducts, products)}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 px-6 py-3 font-semibold text-white shadow-xl shadow-teal-500/30 transition-all hover:shadow-2xl hover:shadow-teal-500/40 active:scale-[0.98]"
            >
              <ShoppingCart className="w-5 h-5" />
              <span className="flex flex-1 items-center justify-between gap-3">
                <span>
                  {selectedProducts.length}{" "}
                  {selectedProducts.length === 1 ? "producto" : "productos"} · $
                  {selectedTotal.toLocaleString("es-CL")}
                </span>
                <span>Continuar →</span>
              </span>
            </button>
          </div>
        )}

      {showRemoveTooltip && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-40 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 items-center gap-2 rounded-full border border-emerald-400/40 bg-slate-950/95 px-4 py-2.5 text-white shadow-xl backdrop-blur-md"
        >
          <button
            type="button"
            onClick={() => setShowRemoveTooltip(false)}
            className="order-3 ml-auto shrink-0 text-slate-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          <Check className="h-5 w-5 shrink-0 rounded-full bg-emerald-500 p-0.5 text-white" />
          <p className="min-w-0 flex-1 text-xs font-semibold">
            Producto agregado
          </p>
        </motion.div>
      )}

      <AnimatePresence>
        {socialNotice && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="absolute left-1/2 top-24 z-[60] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-2xl border border-amber-300/40 bg-slate-950/95 px-4 py-3 text-center text-xs font-semibold text-white shadow-2xl backdrop-blur-md"
          >
            {socialNotice}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {previewProduct && (
          <motion.div
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPreviewProduct(null)}
          >
            <motion.div
              initial={
                reduceMotion ? false : { opacity: 0, scale: 0.92, y: 22 }
              }
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={
                reduceMotion
                  ? { opacity: 0 }
                  : { opacity: 0, scale: 0.94, y: 18 }
              }
              transition={{ type: "spring", stiffness: 310, damping: 28 }}
              drag={reduceMotion ? false : "y"}
              dragConstraints={{ top: 0, bottom: 150 }}
              dragElastic={0.18}
              onDragEnd={(_, info) => {
                if (info.offset.y > 90) setPreviewProduct(null);
              }}
              onClick={(event) => event.stopPropagation()}
              className="zipco-product-viewer relative w-full max-w-md overflow-hidden rounded-3xl border border-white/15 bg-slate-950 shadow-2xl"
            >
              <button
                type="button"
                onClick={() => setPreviewProduct(null)}
                className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-white/30 bg-slate-950/75 text-white shadow-lg backdrop-blur-md transition-transform active:scale-90"
                aria-label="Cerrar detalle"
              >
                <X className="w-5 h-5" />
              </button>
              <ImageWithFallback
                src={previewProduct.imageUrl}
                alt={previewProduct.name}
                className="h-[42vh] min-h-64 w-full bg-black/40 object-contain"
              />
              <div className="space-y-2 bg-gradient-to-b from-slate-900 to-slate-950 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-[0.18em] text-teal-300">
                      {previewProduct.pricingMode === "quote"
                        ? "Cotización"
                        : previewProduct.pricingMode === "view"
                          ? "Solo información"
                          : "Precio fijo"}
                    </span>
                    <h4 className="mt-1 text-lg font-black text-white">
                      {previewProduct.name}
                    </h4>
                  </div>
                  {getPublicCatalogPriceLabel(previewProduct) && (
                    <strong className="shrink-0 text-lg font-black text-teal-300">
                      {getPublicCatalogPriceLabel(previewProduct)}
                    </strong>
                  )}
                </div>
                <p className="max-h-24 overflow-y-auto text-sm leading-relaxed text-slate-300">
                  {previewProduct.description}
                </p>
                {!isOwnBusinessProfile &&
                  getCatalogItemAction(previewProduct) === "order" && (
                    <button
                      type="button"
                      onClick={() => {
                        handleOrderToggle(previewProduct);
                        setPreviewProduct(null);
                      }}
                      className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 py-3 text-sm font-black text-white shadow-lg shadow-teal-500/20"
                    >
                      <ShoppingCart className="h-4 w-4" />
                      {selectedProducts.includes(previewProduct.id)
                        ? "Quitar del pedido"
                        : "Agregar al pedido"}
                    </button>
                  )}
                {!isOwnBusinessProfile &&
                  getCatalogItemAction(previewProduct) === "quote-soon" && (
                    <button
                      type="button"
                      onClick={() => {
                        setQuoteItem(previewProduct);
                        setPreviewProduct(null);
                      }}
                      className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-500 py-3 text-sm font-black text-white shadow-lg shadow-violet-500/20"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Solicitar cotización
                    </button>
                  )}
                <p className="text-center text-[10px] font-semibold text-slate-500">
                  Desliza hacia abajo para cerrar
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {quoteItem && parseBusinessId(business.id) !== null && (
        <QuoteRequestModal
          businessId={parseBusinessId(business.id) as number}
          item={quoteItem}
          onClose={() => setQuoteItem(null)}
          onCreated={() => onQuoteCreated?.()}
          onSessionExpired={onSessionExpired}
        />
      )}
    </div>
  );
}
