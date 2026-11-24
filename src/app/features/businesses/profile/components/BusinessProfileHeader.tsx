import * as React from 'react';

import { ArrowLeft, Clock, Facebook, Heart, Instagram, MapPin, Sparkles, Store } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { ImageWithFallback } from "../../../../components/figma/ImageWithFallback";

import DistanceInfo from "../../../../shared/location/DistanceInfo";





import type { BusinessProfileScreenModel } from "../application/useBusinessProfileScreenController";
/** Canonical visual section; data and commands come from its screen controller. */
export default function BusinessProfileHeader({model}:{model:Pick<BusinessProfileScreenModel,"business"|"businessDescription"|"businessImage"|"businessType"|"closingTime"|"distanceLabel"|"expanded"|"handleCollapsedHeaderClick"|"hasExtendedDescription"|"isBusinessOpen"|"isFavorite"|"isScrolled"|"onBack"|"onToggleFavorite"|"openSocialProfile"|"setExpanded">}){
const {business,businessDescription,businessImage,businessType,closingTime,distanceLabel,expanded,handleCollapsedHeaderClick,hasExtendedDescription,isBusinessOpen,isFavorite,isScrolled,onBack,onToggleFavorite,openSocialProfile,setExpanded}=model;
return (<div className="zipco-safe-header border-b border-slate-200/60 bg-white/80 px-4 pb-1 backdrop-blur-sm">
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
                    {businessDescription}
                  </p>
                  {hasExtendedDescription && (
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
                        : "Ver descripción completa"}
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>);
}
