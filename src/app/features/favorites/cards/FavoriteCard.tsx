import * as React from 'react';
import { Heart } from "lucide-react";
import { ImageWithFallback } from "../../../components/figma/ImageWithFallback";


import type { AppModel } from "../../../shell/application/useAppController";
/** Canonical visual section; data and commands come from its screen controller. */
/** Complete visual card; preserves the list's commands and data. */
export default function FavoriteCard({model,favorite}:{model:Pick<AppModel,"isDarkMode"|"setActiveTab"|"setCurrentScreen"|"setPreviousScreen"|"setPreviousServiceScreen"|"setSelectedBusiness"|"setSelectedService">;favorite:AppModel["favoriteItems"][number]}){
const {isDarkMode,setActiveTab,setCurrentScreen,setPreviousScreen,setPreviousServiceScreen,setSelectedBusiness,setSelectedService}=model;
return (<button
                    type="button"
                    key={favorite.key}
                    onClick={() => {
                      setActiveTab("home");
                      if (favorite.kind === "business") {
                        setSelectedBusiness(favorite.item);
                        setPreviousScreen("favorites");
                        setCurrentScreen("profile");
                      } else {
                        setSelectedService(favorite.item);
                        setPreviousServiceScreen("favorites");
                        setCurrentScreen("service-profile");
                      }
                    }}
                    className={`flex w-full items-center gap-3 rounded-2xl p-4 text-left border ${
                      isDarkMode
                        ? "bg-slate-800 border-slate-700 text-slate-100"
                        : "bg-white border-gray-100 text-gray-900"
                    }`}
                  >
                    <ImageWithFallback
                      src={
                        favorite.item.image ??
                        favorite.item.imageUrl ??
                        favorite.item.photo
                      }
                      alt={favorite.item.name ?? "Favorito"}
                      className="h-14 w-14 rounded-xl object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <strong className="block truncate">
                        {favorite.item.name ?? "Favorito"}
                      </strong>
                      <span className="text-xs text-gray-500">
                        {favorite.kind === "business" ? "Negocio" : "Servicio"}
                      </span>
                    </div>
                    <Heart className="h-5 w-5 fill-rose-500 text-rose-500" />
                  </button>);
}
