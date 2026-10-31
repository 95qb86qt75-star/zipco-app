
import * as React from 'react';

















import type { AppModel } from "../../../shell/application/useAppController";
/** Complete visual card; preserves the list's commands and data. */
export default function HomeCategoryCard({model,category}:{model:Pick<AppModel,"setCurrentScreen">;category:AppModel["categories"][number]}){
const {setCurrentScreen}=model;

                const Icon = category.icon;
                return (
                  <button
                    key={category.id}
                    onClick={() => {
                      if (category.id === "negocios")
                        setCurrentScreen("negocios");
                      if (category.id === "servicios")
                        setCurrentScreen("servicios");
                    }}
                    className={`${category.gradient} rounded-3xl p-12 flex flex-col items-center justify-center gap-6 shadow-2xl hover:shadow-3xl transition-all active:scale-[0.95] border border-white/20 backdrop-blur-sm relative overflow-hidden group min-h-[200px]`}
                  >
                    {/* Shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/30 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                    <Icon
                      className={`w-20 h-20 ${category.iconColor} relative z-10 drop-shadow-2xl`}
                      strokeWidth={2.5}
                    />
                    <span
                      className={`text-lg font-bold ${category.textColor} relative z-10 drop-shadow-lg tracking-wide`}
                    >
                      {category.name}
                    </span>
                  </button>
                );

}
