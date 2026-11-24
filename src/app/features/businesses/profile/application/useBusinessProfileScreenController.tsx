import { useEffect, useRef, useState } from "react";

import { useReducedMotion } from "motion/react";

import { isOwnBusiness, selectionAfterBusinessContextChange } from "../../domain/businessOwnership";

import { getCatalogPricingCounts, selectionAfterCatalogChange, toggleCatalogSelection } from "../../../catalog/domain/catalogItemPresentation";
import { getPublicCatalog } from "../../../profile/business-config/catalog/catalogApi";
import { parseBusinessId } from "../../../profile/business-config/catalog/catalogValidation";
import type { CatalogItem } from "../../../profile/business-config/domain/types";

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
export function useBusinessProfileScreenController({
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
}){

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
  const businessDescription =
    business.description ||
    "Especialistas en repostería artesanal. Más de 10 años creando momentos dulces para tu familia.";
  const hasExtendedDescription = businessDescription.trim().length > 72;
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


return {business,businessDescription,businessImage,businessType,catalogError,catalogFilter,catalogPricingCounts,closingTime,distanceLabel,expanded,handleCollapsedHeaderClick,handleOrderToggle,handleProfileTouchMove,handleProfileTouchStart,handleProfileWheel,hasExtendedDescription,isBusinessOpen,isCatalogLoading,isFavorite,isOwnBusinessProfile,isScrolled,loadCatalog,onBack,onCheckout,onQuoteCreated,onSessionExpired,onToggleFavorite,openSocialProfile,previewProduct,products,quoteItem,reduceMotion,scrollContainerRef,selectedProducts,selectedTotal,setCatalogFilter,setExpanded,setPreviewProduct,setQuoteItem,setShowRemoveTooltip,showRemoveTooltip,socialNotice,visibleProducts};
}
export type BusinessProfileScreenModel=ReturnType<typeof useBusinessProfileScreenController>;
