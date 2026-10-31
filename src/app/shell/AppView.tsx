import HomeCategoryCard from '../features/home/cards/HomeCategoryCard';
import AppShell from './AppShell';
import * as React from 'react';
import FavoritesScreen from '../features/favorites/screen/FavoritesScreen';
import HomeDiscoveryHeader from '../features/home/sections/HomeDiscoveryHeader';
import HomeLocationDialog from '../features/home/dialogs/HomeLocationDialog';

import { Moon, Sun, Bell, BellOff } from "lucide-react";


import BottomNav from "../shared/navigation/BottomNav";
import RegistrationFlow from "../features/registration/screen/RegistrationFlow";
import RequestsScreen from "../features/requests/screen/RequestsScreen";


import { notifyCoordinationSessionChange } from "../features/requests/application/intents/coordinationSession";
import CheckoutScreen from "../features/checkout/product/CheckoutScreen";
import BusinessProfileScreen from "../features/businesses/profile/BusinessProfileScreen";
import ServiceProfileScreen from "../features/services/profile/ServiceProfileScreen";
import ServiceCheckoutScreen from "../features/checkout/service/ServiceCheckoutScreen";
import ServiciosScreen from "../features/services/search/ServiciosScreen";
import NegociosScreen from "../features/businesses/search/NegociosScreen";
import GlobalSearchScreen from "../features/search/screen/GlobalSearchScreen";
import ProfileScreen from "../features/profile/screen/ProfileScreen";


import SplashScreen from "../features/onboarding/SplashScreen";










import type {AppModel} from './application/useAppController';
export default function AppView({model}:{model:AppModel}){
const {activeTab,businessesScrollTopRef,businessesSearchDistance,businessesSearchFilter,businessesSearchQuery,categories,checkoutData,chileLocationBase,closeToast,completeNotificationTarget,currentLocation,currentScreen,favoriteItems,favoriteKey,getLocationSuggestionLabel,globalSearchDistance,globalSearchFilter,globalSearchQuery,handleLogout,hasLocationAutocompleteSearched,hasStoredSession,isChangingPush,isDarkMode,isLocationAutocompleteLoading,isRegistrationComplete,locationAutocompleteResults,locationSearch,locationSearchError,locationSuggestions,openNotificationTarget,pendingLocation,previousScreen,previousServiceScreen,pushEnabled,requestsNavigationKey,searchLocationByText,selectLocationResult,selectedBusiness,selectedService,selectedServiceItem,servicesScrollTopRef,servicesSearchDistance,servicesSearchFilter,servicesSearchQuery,setActiveTab,setBusinessesSearchDistance,setBusinessesSearchFilter,setBusinessesSearchQuery,setCheckoutData,setCurrentLocation,setCurrentScreen,setGlobalSearchDistance,setGlobalSearchFilter,setGlobalSearchQuery,setHasLocationAutocompleteSearched,setIsDarkMode,setIsRegistrationComplete,setLocationAutocompleteResults,setLocationSearch,setLocationSearchError,setPendingLocation,setPreviousScreen,setPreviousServiceScreen,setSelectedBusiness,setSelectedService,setSelectedServiceItem,setServicesSearchDistance,setServicesSearchFilter,setServicesSearchQuery,setShowLocationModal,setShowSplash,showLocationModal,showSplash,toast,toggleFavorite,togglePushNotifications,updateCurrentLocationFromGeolocation}=model;
const renderWithToast=(content:React.ReactNode)=><AppShell model={{closeToast,handleLogout,hasStoredSession,openNotificationTarget,toast}}>{content}</AppShell>;

if (showSplash) {
    return renderWithToast(
      <SplashScreen
        onComplete={() => {
          sessionStorage.setItem("zipco-splash-seen", "true");
          setShowSplash(false);
        }}
      />,
    );
  }

  if (!isRegistrationComplete) {
    return renderWithToast(
      <RegistrationFlow onComplete={() => { notifyCoordinationSessionChange(); setIsRegistrationComplete(true); }} />,
    );
  }

  if (activeTab === "profile") {
    return renderWithToast(
      <div className="size-full bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center">
        <div className="w-full max-w-md h-full relative">
          <ProfileScreen
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onLogout={handleLogout}
            onBack={() => {
              setActiveTab("home");
              setCurrentScreen("home");
            }}
          />
          <BottomNav
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onNavigate={(tab) => {
              if (tab === "home") {
                setCurrentScreen("home");
              }
            }}
          />
        </div>
      </div>,
    );
  }

  if (activeTab === "requests") {
    return renderWithToast(
      <div className="size-full bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center">
        <div className="w-full max-w-md h-full relative">
          <RequestsScreen
            key={requestsNavigationKey}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onSessionExpired={handleLogout}
            onNotificationFocused={completeNotificationTarget}
            onBack={() => {
              setActiveTab("home");
              setCurrentScreen("home");
            }}
          />
          <BottomNav
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onNavigate={(tab) => {
              if (tab === "home") {
                setCurrentScreen("home");
              }
            }}
          />
        </div>
      </div>,
    );
  }

  if (activeTab === "favorites") {
    return renderWithToast(
      <FavoritesScreen model={{activeTab,favoriteItems,isDarkMode,setActiveTab,setCurrentScreen,setPreviousScreen,setPreviousServiceScreen,setSelectedBusiness,setSelectedService}}/>,
    );
  }

  if (currentScreen === "checkout" && selectedBusiness && checkoutData) {
    return renderWithToast(
      <div className="size-full bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center">
        <div className="w-full max-w-md h-full relative">
          <CheckoutScreen
            business={selectedBusiness}
            currentUserId={localStorage.getItem("zipco-user-id")}
            selectedProducts={checkoutData.selectedProducts}
            products={checkoutData.products}
            onBack={() => setCurrentScreen("profile")}
            onFindAlternative={()=>{if(previousScreen==='favorites'){setCurrentScreen('home');setActiveTab('favorites');}else setCurrentScreen(previousScreen);}}
            onOrderComplete={() => {
              setCheckoutData(null);
              setCurrentScreen("profile");
            }}
            onCatalogConflict={() => {
              setCheckoutData(null);
              setCurrentScreen("profile");
            }}
            onSessionExpired={handleLogout}
          />
          <BottomNav
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onNavigate={(tab) => {
              if (tab === "home") {
                setCurrentScreen("home");
              }
            }}
          />
        </div>
      </div>,
    );
  }

  if (currentScreen === "profile" && selectedBusiness) {
    return renderWithToast(
      <div className="size-full bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center">
        <div className="w-full max-w-md h-full relative">
          <BusinessProfileScreen
            business={selectedBusiness}
            currentUserId={localStorage.getItem("zipco-user-id")}
            currentLocation={currentLocation}
            isFavorite={favoriteItems.some(
              (favorite) =>
                favorite.key === favoriteKey("business", selectedBusiness),
            )}
            onToggleFavorite={() =>
              toggleFavorite("business", selectedBusiness)
            }
            onBack={() => {
              if (previousScreen === "favorites") {
                setCurrentScreen("home");
                setActiveTab("favorites");
              } else {
                setCurrentScreen(previousScreen);
              }
            }}
            onCheckout={(selectedProducts, products) => {
              setCheckoutData({ selectedProducts, products });
              setCurrentScreen("checkout");
            }}
            onSessionExpired={handleLogout}
          />
          <BottomNav
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onNavigate={(tab) => {
              if (tab === "home") {
                setCurrentScreen("home");
              }
            }}
          />
        </div>
      </div>,
    );
  }

  if (currentScreen === "negocios") {
    return renderWithToast(
      <div className="size-full bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center">
        <div className="w-full max-w-md h-full relative">
          <NegociosScreen
            onBack={() => setCurrentScreen("home")}
            onSelectBusiness={(business) => {
              setSelectedBusiness(business);
              setPreviousScreen("negocios");
              setCurrentScreen("profile");
            }}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onSessionExpired={handleLogout}
            initialQuery={businessesSearchQuery}
            onQueryChange={setBusinessesSearchQuery}
            initialFilter={businessesSearchFilter}
            onFilterChange={setBusinessesSearchFilter}
            initialMaxDistance={businessesSearchDistance}
            onMaxDistanceChange={setBusinessesSearchDistance}
            initialScrollTop={businessesScrollTopRef.current}
            onScrollTopChange={(scrollTop) => {
              businessesScrollTopRef.current = scrollTop;
            }}
          />
        </div>
      </div>,
    );
  }

  if (currentScreen === "servicios") {
    return renderWithToast(
      <div className="size-full bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center">
        <div className="w-full max-w-md h-full relative">
          <ServiciosScreen
            onBack={() => setCurrentScreen("home")}
            onSelectService={(service) => {
              setSelectedService(service);
              setPreviousServiceScreen("servicios");
              setCurrentScreen("service-profile");
            }}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            initialQuery={servicesSearchQuery}
            onQueryChange={setServicesSearchQuery}
            initialFilter={servicesSearchFilter}
            onFilterChange={setServicesSearchFilter}
            initialMaxDistance={servicesSearchDistance}
            onMaxDistanceChange={setServicesSearchDistance}
            currentLocation={currentLocation}
            initialScrollTop={servicesScrollTopRef.current}
            onScrollTopChange={(scrollTop) => {
              servicesScrollTopRef.current = scrollTop;
            }}
          />
        </div>
      </div>,
    );
  }

  if (currentScreen === "service-profile") {
    return renderWithToast(
      <div className="size-full bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center">
        <div className="w-full max-w-md h-full relative">
          <ServiceProfileScreen
            service={selectedService}
            isFavorite={favoriteItems.some(
              (favorite) =>
                favorite.key === favoriteKey("service", selectedService),
            )}
            onToggleFavorite={() => toggleFavorite("service", selectedService)}
            onBack={() => {
              if (previousServiceScreen === "favorites") {
                setCurrentScreen("home");
                setActiveTab("favorites");
              } else {
                setCurrentScreen(previousServiceScreen);
              }
            }}
            onRequestService={(serviceItem) => {
              setSelectedServiceItem(serviceItem);
              setCurrentScreen("service-checkout");
            }}
            onSessionExpired={handleLogout}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
        </div>
      </div>,
    );
  }

  if (currentScreen === "service-checkout") {
    return renderWithToast(
      <div className="size-full bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center">
        <div className="w-full max-w-md h-full relative">
          <ServiceCheckoutScreen
            service={selectedServiceItem}
            provider={selectedService}
            onBack={() => setCurrentScreen("service-profile")}
            onFindAlternative={()=>{if(previousServiceScreen==='favorites'){setCurrentScreen('home');setActiveTab('favorites');}else setCurrentScreen(previousServiceScreen);}}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onSessionExpired={handleLogout}
          />
        </div>
      </div>,
    );
  }

  if (currentScreen === "search") {
    return renderWithToast(
      <div className="size-full bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center">
        <div className="w-full max-w-md h-full relative">
          <GlobalSearchScreen
            onBack={() => {
              setCurrentScreen("home");
              setGlobalSearchQuery("");
              setGlobalSearchFilter("todos");
              setGlobalSearchDistance(10);
            }}
            initialQuery={globalSearchQuery}
            onQueryChange={setGlobalSearchQuery}
            initialFilter={globalSearchFilter}
            onFilterChange={setGlobalSearchFilter}
            initialMaxDistance={globalSearchDistance}
            onMaxDistanceChange={setGlobalSearchDistance}
            currentLocation={currentLocation}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onSelectBusiness={(business) => {
              setSelectedBusiness(business);
              setPreviousScreen("search");
              setCurrentScreen("profile");
            }}
            onSelectService={(service) => {
              setSelectedService(service);
              setPreviousServiceScreen("search");
              setCurrentScreen("service-profile");
            }}
          />
        </div>
      </div>,
    );
  }

  return renderWithToast(
    <div
      className={`size-full flex items-center justify-center ${
        isDarkMode
          ? "bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800"
          : "bg-gradient-to-br from-blue-50 via-white to-blue-100"
      }`}
    >
      {/* Mobile Frame */}
      <div
        className={`w-full max-w-md h-full flex flex-col relative overflow-hidden backdrop-blur-sm transition-colors ${
          isDarkMode
            ? "bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800"
            : "bg-gradient-to-b from-white via-blue-50/30 to-blue-100/40"
        }`}
      >
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className={`absolute right-6 z-20 p-2.5 rounded-full border transition-all shadow-md ${
            isDarkMode
              ? "bg-slate-800 border-slate-700 text-amber-300 hover:bg-slate-700"
              : "bg-white/90 border-white text-slate-700 hover:bg-white"
          }`}
          style={{ top: "max(1.5rem, env(safe-area-inset-top))" }}
          aria-label={
            isDarkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"
          }
        >
          {isDarkMode ? (
            <Sun className="w-4 h-4" />
          ) : (
            <Moon className="w-4 h-4" />
          )}
        </button>

        {pushEnabled !== null && (
          <button
            type="button"
            onClick={togglePushNotifications}
            disabled={isChangingPush}
            className={`absolute right-20 z-20 p-2.5 rounded-full border transition-all shadow-md disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 ${
              pushEnabled
                ? isDarkMode
                  ? "bg-teal-950/75 border-teal-400/45 text-teal-200 shadow-teal-950/50 ring-1 ring-inset ring-teal-300/10 hover:bg-teal-900/80 hover:text-teal-100"
                  : "bg-teal-50/95 border-teal-100 text-teal-700 hover:bg-teal-100"
                : isDarkMode
                  ? "bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700"
                  : "bg-white/90 border-white text-slate-500 hover:bg-white"
            }`}
            style={{ top: "max(1.5rem, env(safe-area-inset-top))" }}
            aria-label={
              pushEnabled
                ? "Desactivar notificaciones"
                : "Activar notificaciones"
            }
            title={
              pushEnabled
                ? "Desactivar notificaciones"
                : "Activar notificaciones"
            }
          >
            {pushEnabled ? (
              <Bell className="w-4 h-4" />
            ) : (
              <BellOff className="w-4 h-4" />
            )}
          </button>
        )}

        {/* Header */}
        <HomeDiscoveryHeader model={{currentLocation,getLocationSuggestionLabel,globalSearchQuery,hasLocationAutocompleteSearched,isDarkMode,isLocationAutocompleteLoading,locationAutocompleteResults,locationSearch,locationSearchError,searchLocationByText,selectLocationResult,setCurrentScreen,setGlobalSearchQuery,setHasLocationAutocompleteSearched,setLocationAutocompleteResults,setLocationSearch,setLocationSearchError,setShowLocationModal,showLocationModal,updateCurrentLocationFromGeolocation}}/>

        {/* Main Content */}
        <div className="flex-1 px-6 pb-24 overflow-auto flex flex-col justify-center pt-8">
          <div className="w-full max-w-sm mx-auto">
            <h2
              className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-600 via-blue-600 to-purple-600 mb-12 text-center tracking-tight animate-gradient"
              style={{
                fontFamily: "system-ui, -apple-system, sans-serif",
                letterSpacing: "-0.03em",
              }}
            >
              ¿Qué necesitas hoy?
            </h2>

            {/* Category Cards */}
            <div className="grid grid-cols-2 gap-6">
              {categories.map((category)=><HomeCategoryCard key={category.id} category={category} model={{setCurrentScreen}}/>)}
            </div>
          </div>
        </div>

        {/* Bottom Navigation */}
        <BottomNav
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onNavigate={(tab) => {
            if (tab === "home") {
              setCurrentScreen("home");
            }
          }}
        />

        {false && showLocationModal && (
          <HomeLocationDialog model={{chileLocationBase,currentLocation,isDarkMode,locationSearch,locationSuggestions,pendingLocation,setCurrentLocation,setLocationSearch,setPendingLocation,setShowLocationModal}}/>
        )}
      </div>
    </div>,
  );

}
