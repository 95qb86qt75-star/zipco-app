import FavoriteCard from '../cards/FavoriteCard';
import * as React from 'react';




import BottomNav from "../../../shared/navigation/BottomNav";













import EmptyFavorites from "../EmptyFavorites";












import type { AppModel } from "../../../shell/application/useAppController";
/** Canonical visual section; data and commands come from its screen controller. */
export default function FavoritesScreen({model}:{model:Pick<AppModel,"activeTab"|"favoriteItems"|"isDarkMode"|"setActiveTab"|"setCurrentScreen"|"setPreviousScreen"|"setPreviousServiceScreen"|"setSelectedBusiness"|"setSelectedService">}){
const {activeTab,favoriteItems,isDarkMode,setActiveTab,setCurrentScreen,setPreviousScreen,setPreviousServiceScreen,setSelectedBusiness,setSelectedService}=model;
return (<div className="size-full bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center">
        <div
          className={`w-full max-w-md h-full relative overflow-hidden ${
            isDarkMode
              ? "bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800"
              : "bg-gradient-to-b from-white via-blue-50/30 to-blue-100/40"
          }`}
        >
          <div className="px-6 pt-8 pb-4">
            <h2
              className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}
            >
              Favoritos
            </h2>
            <p
              className={`text-sm mt-1 ${isDarkMode ? "text-slate-300" : "text-gray-600"}`}
            >
              Tus negocios y servicios guardados
            </p>
          </div>

          <div className="flex-1 pb-24 h-[calc(100%-88px)] overflow-auto">
            {favoriteItems.length === 0 ? (
              <EmptyFavorites
                isDarkMode={isDarkMode}
                onExplore={() => {
                  setActiveTab("home");
                  setCurrentScreen("home");
                }}
              />
            ) : (
              <div className="px-6 space-y-3">
                {favoriteItems.map((favorite)=><FavoriteCard key={favorite.key} favorite={favorite} model={{isDarkMode,setActiveTab,setCurrentScreen,setPreviousScreen,setPreviousServiceScreen,setSelectedBusiness,setSelectedService}}/>)}
              </div>
            )}
          </div>

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
      </div>);
}
