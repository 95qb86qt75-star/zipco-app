
import { useState, useEffect, useRef, useCallback } from "react";
import { Store, Wrench } from "lucide-react";







import { notifyCoordinationSessionChange } from "../../features/requests/application/intents/coordinationSession";









import { mergeToastNotification, showAppToast, type ToastNotification } from "../../shared/notifications/Toast";

import type { CatalogItem } from "../../features/profile/business-config/domain/types";

import { createNotificationNavigation, parseNotificationTarget } from "../../notifications/notificationNavigation";
import { traceNotificationClick } from "../../notifications/notificationClickTrace";
import { createQaPushObservationAcks } from "../../notifications/qaPushObservationAcks";
import { rememberOpenedPresentation, noticeMatchesPresentation, noticeWasPresented, deliverUnpresentedNotice } from "../../notifications/notificationDelivery";
import { disablePushNotifications, enablePushNotifications, getExistingPushSubscription, getPushSupport } from "../../notifications/pushNotifications";

import { fetchLocationSuggestions } from "../../api/locationSuggestions";
import { addFavorite, loadFavorites, removeFavorite } from "../../api/favoritesApi";
const hasStoredSession = () =>
  Boolean(
    localStorage.getItem("zipco-token") &&
    localStorage.getItem("zipco-user-id"),
  );
const acknowledgeNotificationTarget = (url: string) => {
  const message = { type: 'ZIPCO_NOTIFICATION_NAVIGATED', url };
  navigator.serviceWorker?.controller?.postMessage(message);
  void navigator.serviceWorker?.ready.then((registration) => registration.active?.postMessage(message));
};
type FavoriteEntry = { key: string; kind: "business" | "service"; item: any };
const favoriteKey = (kind: FavoriteEntry["kind"], item: any) =>
  `${kind}:${String(item?.id ?? item?.name ?? "")}`;
const getStoredFavorites = (): FavoriteEntry[] => {
  try {
    const parsed = JSON.parse(localStorage.getItem("zipco-favorites") ?? "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};
const getStoredLocation = () => {
  try {
    const savedLocation = localStorage.getItem("zipco-location");
    if (!savedLocation) return { name: "", lat: null, lng: null };

    const parsedLocation = JSON.parse(savedLocation);
    return {
      name: String(parsedLocation.name ?? ""),
      lat: typeof parsedLocation.lat === "number" ? parsedLocation.lat : null,
      lng: typeof parsedLocation.lng === "number" ? parsedLocation.lng : null,
    };
  } catch (error) {
    return { name: "", lat: null, lng: null };
  }
};
export function useAppController(){

  const [isRegistrationComplete, setIsRegistrationComplete] = useState(
    () =>
      localStorage.getItem("zipco-registration-complete") === "true" ||
      hasStoredSession(),
  );
  const [showSplash, setShowSplash] = useState(
    () =>
      !hasStoredSession() &&
      sessionStorage.getItem("zipco-splash-seen") !== "true",
  );
  const [activeTab, setActiveTab] = useState(() =>
    new URLSearchParams(window.location.search)
      .get("open")
      ?.startsWith("requests-")
      ? "requests"
      : "home",
  );
  const [currentScreen, setCurrentScreen] = useState("home");
  const [previousScreen, setPreviousScreen] = useState<string>("negocios");
  const [previousServiceScreen, setPreviousServiceScreen] = useState<
    "servicios" | "search" | "favorites"
  >("servicios");
  const [isDarkMode, setIsDarkMode] = useState(
    () => localStorage.getItem("zipco-theme") === "dark",
  );
  const [locationSearch, setLocationSearch] = useState("");
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationSearchError, setLocationSearchError] = useState("");
  const [locationAutocompleteResults, setLocationAutocompleteResults] =
    useState<any[]>([]);
  const [isLocationAutocompleteLoading, setIsLocationAutocompleteLoading] =
    useState(false);
  const [hasLocationAutocompleteSearched, setHasLocationAutocompleteSearched] =
    useState(false);
  const [pendingLocation, setPendingLocation] = useState("");
  const [currentLocation, setCurrentLocation] = useState<{
    name: string;
    lat: number | null;
    lng: number | null;
  }>(getStoredLocation);
  const [selectedBusiness, setSelectedBusiness] = useState<any>(null);
  const [checkoutData, setCheckoutData] = useState<{
    selectedProducts: number[];
    products: CatalogItem[];
  } | null>(null);
  const [globalSearchQuery, setGlobalSearchQuery] = useState("");
  const [globalSearchFilter, setGlobalSearchFilter] = useState("todos");
  const [globalSearchDistance, setGlobalSearchDistance] = useState(10);
  const [servicesSearchQuery, setServicesSearchQuery] = useState("");
  const [servicesSearchFilter, setServicesSearchFilter] = useState("todos");
  const [servicesSearchDistance, setServicesSearchDistance] = useState(10);
  const servicesScrollTopRef = useRef(0);
  const [businessesSearchQuery, setBusinessesSearchQuery] = useState("");
  const [businessesSearchFilter, setBusinessesSearchFilter] = useState("todos");
  const [businessesSearchDistance, setBusinessesSearchDistance] = useState(10);
  const businessesScrollTopRef = useRef(0);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedServiceItem, setSelectedServiceItem] = useState<any>(null);
  const [favoriteItems, setFavoriteItems] =
    useState<FavoriteEntry[]>(getStoredFavorites);
  const [toast, setToast] = useState<ToastNotification | null>(null);
  const [requestsNavigationKey, setRequestsNavigationKey] = useState(0);
  const requestsRoute = useRef(activeTab === 'requests');
  requestsRoute.current = activeTab === 'requests';
  const notificationNavigation = useRef<ReturnType<typeof createNotificationNavigation> | null>(null);
  const observationAcks = useRef<ReturnType<typeof createQaPushObservationAcks> | null>(null);
  if (import.meta.env.QA_NOTIFICATION_TRACE && !observationAcks.current) observationAcks.current = createQaPushObservationAcks(window.location.origin);
  if (!notificationNavigation.current) {
    notificationNavigation.current = createNotificationNavigation(window.location.origin);
    notificationNavigation.current.receive(window.location.href);
    rememberOpenedPresentation(notificationNavigation.current.pending?.eventKey ?? null);
  }
  const [pushEnabled, setPushEnabled] = useState<boolean | null>(null);
  const [isChangingPush, setIsChangingPush] = useState(false);
  const closeToast = useCallback(() => setToast(null), []);

  const openNotificationTarget = useCallback((targetValue: string) => {
    const opened = parseNotificationTarget(targetValue, window.location.origin);
    if (import.meta.env.QA_NOTIFICATION_TRACE) traceNotificationClick('app-target-received', { hasTarget: !!opened, hasEvent: !!opened?.eventKey, hasSession: hasStoredSession() });
    if (opened?.eventKey) {
      rememberOpenedPresentation(opened.eventKey);
      setToast((current) => noticeMatchesPresentation(current, opened.eventKey) ? null : current);
    }
    let target = notificationNavigation.current!.receive(targetValue);
    // A suspended route may resume at Inicio while the same target is pending.
    // Reapply that route without treating worker retries as another click.
    if (!target && !requestsRoute.current && opened?.identity === notificationNavigation.current!.pending?.identity) {
      target = notificationNavigation.current!.pending;
    }
    if (!target) {
      if (import.meta.env.QA_NOTIFICATION_TRACE) traceNotificationClick('app-target-ignored', { hasTarget: !!notificationNavigation.current?.pending });
      const completed = notificationNavigation.current!.completedTarget(targetValue);
      if (completed) acknowledgeNotificationTarget(completed.url);
      return;
    }
    rememberOpenedPresentation(target.eventKey);
    // Notification launches can use a dedicated pathname on iOS to force
    // WebKit to leave the suspended home route. Once React receives it, keep a
    // canonical root URL while preserving the request destination parameters.
    requestsRoute.current = true;
    window.history.replaceState({}, "", target.url);
    setCurrentScreen("home");
    setActiveTab("requests");
    setRequestsNavigationKey((current) => current + 1);
    if (import.meta.env.QA_NOTIFICATION_TRACE) traceNotificationClick('app-target-accepted');
    if (import.meta.env.QA_NOTIFICATION_TRACE) observationAcks.current?.accepted(target.url);
  }, []);

  const completeNotificationTarget = useCallback((value: string) => {
    if (!hasStoredSession()) return;
    const target = notificationNavigation.current!.complete(value);
    if (!target) return;
    if (import.meta.env.QA_NOTIFICATION_TRACE) traceNotificationClick('app-target-ack');
    if (import.meta.env.QA_NOTIFICATION_TRACE) observationAcks.current?.focused(target.url);
    acknowledgeNotificationTarget(target.url);
    const current = parseNotificationTarget(window.location.href, window.location.origin);
    if (current?.identity === target.identity) window.history.replaceState({}, '', '/');
  }, []);

  useEffect(() => {
    if (!import.meta.env.QA_NOTIFICATION_TRACE) return;
    let stopped = false;
    let cleanup: (() => void) | undefined;
    void import("../../notifications/qaNotificationClickTrace").then((trace) => {
      if (!stopped) cleanup = trace.startClickTrace();
    }).catch(() => {});
    return () => { stopped = true; cleanup?.(); };
  }, []);

  useEffect(() => {
    if (import.meta.env.QA_NOTIFICATION_TRACE) traceNotificationClick('app-route', {
      requestsVisible: activeTab === 'requests' && currentScreen === 'home',
      hasSession: hasStoredSession(), sessionReady: isRegistrationComplete,
    });
  }, [activeTab, currentScreen, isRegistrationComplete]);

  useEffect(() => {
    if (isRegistrationComplete && hasStoredSession() && notificationNavigation.current?.pending) {
      setCurrentScreen('home');
      setActiveTab('requests');
      if (import.meta.env.QA_NOTIFICATION_TRACE) observationAcks.current?.accepted(notificationNavigation.current.pending.url);
    }
  }, [isRegistrationComplete]);

  const refreshFavorites = useCallback(async () => {
    const token = localStorage.getItem("zipco-token");
    if (!token) {
      setFavoriteItems([]);
      return;
    }
    try {
      const records = await loadFavorites(token);
      const next = records.map((record) => ({
        key: favoriteKey(record.kind, record.business),
        kind: record.kind,
        item: record.business,
      }));
      setFavoriteItems(next);
      localStorage.setItem("zipco-favorites", JSON.stringify(next));
    } catch (error: any) {
      if (error?.status === 401) handleLogout();
    }
  }, []);

  const toggleFavorite = useCallback(
    async (kind: FavoriteEntry["kind"], item: any) => {
      const key = favoriteKey(kind, item);
      const businessId = Number(item?.id);
      const token = localStorage.getItem("zipco-token");
      if (!token || !Number.isInteger(businessId) || businessId <= 0) {
        showAppToast(
          "Este perfil todavía no está conectado a Favoritos.",
          "error",
        );
        return;
      }
      const wasFavorite = favoriteItems.some(
        (favorite) => favorite.key === key,
      );
      setFavoriteItems((current) => {
        const next = current.some((favorite) => favorite.key === key)
          ? current.filter((favorite) => favorite.key !== key)
          : [...current, { key, kind, item }];
        localStorage.setItem("zipco-favorites", JSON.stringify(next));
        return next;
      });
      try {
        if (wasFavorite) await removeFavorite(businessId, token);
        else await addFavorite(businessId, kind, token);
        await refreshFavorites();
      } catch (error: any) {
        await refreshFavorites();
        if (error?.status === 401) handleLogout();
        else
          showAppToast(
            "No se pudo actualizar Favoritos. Intenta nuevamente.",
            "error",
          );
      }
    },
    [favoriteItems, refreshFavorites],
  );

  useEffect(() => {
    if (hasStoredSession()) {
      localStorage.setItem("zipco-registration-complete", "true");
      setIsRegistrationComplete(true);
    }
  }, []);

  useEffect(() => {
    if (isRegistrationComplete) void refreshFavorites();
  }, [isRegistrationComplete, refreshFavorites]);

  useEffect(() => {
    if (!currentLocation.name.trim()) return;

    localStorage.setItem("zipco-location", JSON.stringify(currentLocation));
  }, [currentLocation]);

  const handleLogout = useCallback(() => {
    if (import.meta.env.QA_NOTIFICATION_TRACE) observationAcks.current?.clear();
    const token = localStorage.getItem("zipco-token");
    if (token) void disablePushNotifications(token).catch(() => undefined);
    localStorage.removeItem("zipco-token");
    localStorage.removeItem("zipco-user-id");
    localStorage.removeItem("zipco-registration-complete");
    localStorage.removeItem("zipco-business-id");
    localStorage.removeItem("zipco-provider-type");
    localStorage.removeItem("zipco-favorites");
    localStorage.removeItem("zipco-request-status-snapshot-v1");
    notifyCoordinationSessionChange();
    setFavoriteItems([]);
    setCurrentScreen("home");
    setActiveTab("home");
    setIsRegistrationComplete(false);
  }, []);

  useEffect(() => {
    const handleNotificationNavigation = (event: MessageEvent) => {
      const data = event.data as { type?: string; url?: string; eventKey?: string; qaObservationAck?: unknown } | null;
      if (data?.type === 'ZIPCO_SYSTEM_NOTIFICATION_PRESENTED' && typeof data.eventKey === 'string') {
        if (import.meta.env.QA_NOTIFICATION_TRACE) traceNotificationClick('app-system-presented', { hasEvent: true });
        rememberOpenedPresentation(data.eventKey);
        setToast((current) => noticeMatchesPresentation(current, data.eventKey!) ? null : current);
        return;
      }
      if (
        data?.type !== "ZIPCO_NOTIFICATION_NAVIGATE" ||
        typeof data.url !== "string"
      )
        return;
      if (import.meta.env.QA_NOTIFICATION_TRACE) traceNotificationClick('app-worker-target');
      if (import.meta.env.QA_NOTIFICATION_TRACE) observationAcks.current?.receive(data.url, data.qaObservationAck, event.source);
      openNotificationTarget(data.url);
    };
    navigator.serviceWorker?.addEventListener(
      "message",
      handleNotificationNavigation,
    );
    return () =>
      navigator.serviceWorker?.removeEventListener(
        "message",
        handleNotificationNavigation,
      );
  }, [openNotificationTarget]);

  useEffect(() => {
    const handleRecoveredNotification = (event: Event) => {
      const target = (event as CustomEvent<unknown>).detail;
      if (typeof target === "string") openNotificationTarget(target);
    };
    window.addEventListener(
      "zipco-notification-open",
      handleRecoveredNotification,
    );
    return () =>
      window.removeEventListener(
        "zipco-notification-open",
        handleRecoveredNotification,
      );
  }, [openNotificationTarget]);

  useEffect(() => {
    let consuming = false;
    const resumeTimers = new Set<number>();
    const consumeStoredNotificationTarget = async () => {
      if (consuming || !("caches" in window)) return;
      consuming = true;
      if (import.meta.env.QA_NOTIFICATION_TRACE) traceNotificationClick('app-cache-start');
      try {
        const navigationCache = await caches.open(
          "zipco-notification-navigation-v1",
        );
        const request = new Request(
          new URL("/__zipco_notification_target__", window.location.origin)
            .href,
        );
        const response = await navigationCache.match(request);
        if (import.meta.env.QA_NOTIFICATION_TRACE) traceNotificationClick('app-cache-read', { hasTarget: !!response });
        if (!response) return;
        const payload = (await response.json()) as {
          url?: unknown;
          createdAt?: unknown;
        };
        const createdAt = Number(payload.createdAt);
        if (
          typeof payload.url === "string" &&
          Number.isFinite(createdAt) &&
          createdAt <= Date.now()
        ) {
          openNotificationTarget(payload.url);
        }
      } catch {
        if (import.meta.env.QA_NOTIFICATION_TRACE) traceNotificationClick('app-cache-failed');
        // Direct navigation and postMessage remain available as fallbacks.
      } finally {
        consuming = false;
      }
    };
    const handleResume = () => {
      if (document.visibilityState !== "visible") return;
      // iOS can update the launch URL while retaining the mounted React app.
      // Recover it on resume as well as on a cold document load.
      if (parseNotificationTarget(window.location.href, window.location.origin)) openNotificationTarget(window.location.href);
      else if (notificationNavigation.current?.pending && !requestsRoute.current) openNotificationTarget(notificationNavigation.current.pending.url);

      // On iOS the app can become visible before notificationclick finishes
      // persisting its destination. Retry briefly so a resumed PWA never loses
      // the deep link and remains on Inicio.
      [0, 200, 700, 1_500, 3_000, 5_000, 8_000, 12_000, 20_000, 30_000].forEach((delay) => {
        const timer = window.setTimeout(() => {
          resumeTimers.delete(timer);
          void consumeStoredNotificationTarget();
          const request = { type: "ZIPCO_REQUEST_NOTIFICATION_TARGET" };
          navigator.serviceWorker?.controller?.postMessage(request);
          void navigator.serviceWorker?.ready.then((registration) =>
            registration.active?.postMessage(request),
          );
        }, delay);
        resumeTimers.add(timer);
      });
    };
    handleResume();
    document.addEventListener("visibilitychange", handleResume);
    window.addEventListener("pageshow", handleResume);
    window.addEventListener("focus", handleResume);
    window.addEventListener("zipco-requests-refresh", consumeStoredNotificationTarget);
    return () => {
      resumeTimers.forEach((timer) => window.clearTimeout(timer));
      resumeTimers.clear();
      document.removeEventListener("visibilitychange", handleResume);
      window.removeEventListener("pageshow", handleResume);
      window.removeEventListener("focus", handleResume);
      window.removeEventListener("zipco-requests-refresh", consumeStoredNotificationTarget);
    };
  }, [openNotificationTarget,isRegistrationComplete]);

  useEffect(() => {
    localStorage.setItem("zipco-theme", isDarkMode ? "dark" : "light");

    const themeColor = isDarkMode ? "#020617" : "#ffffff";
    const themeColorMeta = document.querySelector<HTMLMetaElement>(
      'meta[name="theme-color"]',
    );
    const statusBarMeta = document.querySelector<HTMLMetaElement>(
      'meta[name="apple-mobile-web-app-status-bar-style"]',
    );

    document.documentElement.classList.toggle("dark", isDarkMode);
    document.documentElement.style.colorScheme = isDarkMode
      ? "dark"
      : "only light";
    document.body.style.colorScheme = isDarkMode ? "dark" : "only light";
    document.documentElement.style.backgroundColor = themeColor;
    document.body.style.backgroundColor = themeColor;
    themeColorMeta?.setAttribute("content", themeColor);
    statusBarMeta?.setAttribute(
      "content",
      isDarkMode ? "black-translucent" : "default",
    );
  }, [isDarkMode]);

  useEffect(() => {
    if (!isRegistrationComplete || getPushSupport() === "unsupported") {
      setPushEnabled(null);
      return;
    }
    void getExistingPushSubscription()
      .then((subscription) => setPushEnabled(Boolean(subscription)))
      .catch(() => setPushEnabled(false));
  }, [isRegistrationComplete, activeTab]);

  const togglePushNotifications = async () => {
    const token = localStorage.getItem("zipco-token");
    if (!token || pushEnabled === null || isChangingPush) return;
    setIsChangingPush(true);
    try {
      if (pushEnabled) {
        await disablePushNotifications(token);
        setPushEnabled(false);
        showAppToast("", "success", {
          title: "Notificaciones desactivadas",
          description: "Puedes volver a activarlas desde Inicio.",
          icon: "bell",
        });
      } else {
        await enablePushNotifications(token);
        setPushEnabled(true);
        showAppToast("", "success", {
          title: "Notificaciones activadas",
          description:
            "Te avisaremos sobre pedidos y cotizaciones importantes.",
          icon: "bell",
        });
      }
    } catch (cause) {
      const blocked =
        cause instanceof Error && cause.message === "permission-denied";
      showAppToast(
        blocked
          ? "Debes habilitarlas desde los ajustes del dispositivo."
          : "No pudimos cambiar las notificaciones. Intenta nuevamente.",
        "error",
      );
    } finally {
      setIsChangingPush(false);
    }
  };

  useEffect(() => {
    let active = true;
    const handleToast = (event: Event) => {
      const notification = (event as CustomEvent<ToastNotification>).detail;
      const deliver = () => {
        if (active) setToast((current) => noticeWasPresented(notification) ? current : mergeToastNotification(current, notification));
      };
      void deliverUnpresentedNotice(notification, deliver, () => active);
    };

    window.addEventListener("zipco-toast", handleToast);
    return () => { active = false; window.removeEventListener("zipco-toast", handleToast); };
  }, []);



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
    const controller = new AbortController();

    const timeout = setTimeout(async () => {
      try {
        const data = await fetchLocationSuggestions(query, controller.signal);
        setLocationAutocompleteResults(data);
      } catch (error) {
        if (controller.signal.aborted) return;
        setLocationAutocompleteResults([]);
      } finally {
        if (controller.signal.aborted) return;
        setIsLocationAutocompleteLoading(false);
        setHasLocationAutocompleteSearched(true);
      }
    }, 400);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [locationSearch, showLocationModal]);

  const categories = [
    {
      id: "negocios",
      name: "Negocios",
      icon: Store,
      gradient: "bg-gradient-to-br from-amber-400 via-orange-500 to-red-500",
      iconColor: "text-white",
      textColor: "text-white",
    },
    {
      id: "servicios",
      name: "Servicios",
      icon: Wrench,
      gradient: "bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500",
      iconColor: "text-white",
      textColor: "text-white",
    },
  ];

  const chileLocationBase = [
    { name: "San Bernardo", lat: -33.5922, lng: -70.6996 },
    { name: "Santiago", lat: -33.4489, lng: -70.6693 },
    { name: "Maipú", lat: -33.511, lng: -70.7567 },
    { name: "Coronel", lat: -37.0333, lng: -73.1333 },
    { name: "Concepción", lat: -36.827, lng: -73.0503 },
    { name: "Chiguayante", lat: -36.9256, lng: -73.0286 },
    { name: "Valparaíso", lat: -33.0472, lng: -71.6127 },
    { name: "Viña del Mar", lat: -33.0153, lng: -71.55 },
    { name: "Talcahuano", lat: -36.7248, lng: -73.1169 },
    { name: "Las Condes", lat: -33.4088, lng: -70.5674 },
    { name: "Providencia", lat: -33.4263, lng: -70.6171 },
    { name: "Ñuñoa", lat: -33.4569, lng: -70.5975 },
  ];

  const locationSuggestions = chileLocationBase.filter((city) =>
    city.name.toLowerCase().includes(locationSearch.toLowerCase().trim()),
  );

  const getLocationNameFromResult = (result: any, fallback: string) =>
    String(result.display_name ?? fallback)
      .split(",")
      .slice(0, 2)
      .map((part) => part.trim())
      .join(", ");

  const getLocationSuggestionLabel = (result: any) => {
    const parts = String(result.display_name ?? "")
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
    if (parts[parts.length - 1]?.toLowerCase() === "chile") {
      parts.pop();
    }
    return parts.join(", ");
  };

  const selectLocationResult = (result: any, fallback: string) => {
    setCurrentLocation({
      name: getLocationNameFromResult(result, fallback),
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
    });
    setShowLocationModal(false);
    setLocationSearch("");
    setLocationSearchError("");
    setLocationAutocompleteResults([]);
    setHasLocationAutocompleteSearched(false);
  };

  const updateCurrentLocationFromGeolocation = () => {
    if (!navigator.geolocation) {
      showAppToast(
        "La geolocalización no está disponible en este navegador.",
        "error",
      );
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        let locationName = "Ubicación actual";

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
          );
          const data = await response.json();
          locationName =
            data.address?.city ||
            data.address?.town ||
            data.address?.suburb ||
            locationName;
        } catch (error) {
          console.error("No se pudo obtener el nombre de la ubicación", error);
        }

        setCurrentLocation({ name: locationName, lat, lng });
      },
      () => {
        showAppToast(
          "No se pudo obtener tu ubicación. Revisa los permisos del navegador.",
          "error",
        );
      },
    );
  };

  const searchLocationByText = async () => {
    const query = locationSearch.trim();
    if (!query) return;

    setLocationSearchError("");

    try {
      const data = await fetchLocationSuggestions(query);

      if (!Array.isArray(data) || data.length === 0) {
        setLocationSearchError(
          "No se encontró esa ubicación, intenta con otra",
        );
        return;
      }

      selectLocationResult(data[0], query);
    } catch (error) {
      setLocationSearchError("No se encontró esa ubicación, intenta con otra");
    }
  };

  // Splash Screen

return {activeTab,businessesScrollTopRef,businessesSearchDistance,businessesSearchFilter,businessesSearchQuery,categories,checkoutData,chileLocationBase,closeToast,completeNotificationTarget,currentLocation,currentScreen,favoriteItems,favoriteKey,getLocationSuggestionLabel,globalSearchDistance,globalSearchFilter,globalSearchQuery,handleLogout,hasLocationAutocompleteSearched,hasStoredSession,isChangingPush,isDarkMode,isLocationAutocompleteLoading,isRegistrationComplete,locationAutocompleteResults,locationSearch,locationSearchError,locationSuggestions,openNotificationTarget,pendingLocation,previousScreen,previousServiceScreen,pushEnabled,requestsNavigationKey,searchLocationByText,selectLocationResult,selectedBusiness,selectedService,selectedServiceItem,servicesScrollTopRef,servicesSearchDistance,servicesSearchFilter,servicesSearchQuery,setActiveTab,setBusinessesSearchDistance,setBusinessesSearchFilter,setBusinessesSearchQuery,setCheckoutData,setCurrentLocation,setCurrentScreen,setGlobalSearchDistance,setGlobalSearchFilter,setGlobalSearchQuery,setHasLocationAutocompleteSearched,setIsDarkMode,setIsRegistrationComplete,setLocationAutocompleteResults,setLocationSearch,setLocationSearchError,setPendingLocation,setPreviousScreen,setPreviousServiceScreen,setSelectedBusiness,setSelectedService,setSelectedServiceItem,setServicesSearchDistance,setServicesSearchFilter,setServicesSearchQuery,setShowLocationModal,setShowSplash,showLocationModal,showSplash,toast,toggleFavorite,togglePushNotifications,updateCurrentLocationFromGeolocation};
}
export type AppModel=ReturnType<typeof useAppController>;
