import CatalogProductCard from '../../../catalog/cards/CatalogProductCard';
import * as React from 'react';

import { Store } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";








import type { BusinessProfileScreenModel } from "../application/useBusinessProfileScreenController";
/** Canonical visual section; data and commands come from its screen controller. */
export default function BusinessCatalogSection({model}:{model:Pick<BusinessProfileScreenModel,"catalogError"|"catalogFilter"|"catalogPricingCounts"|"handleOrderToggle"|"isCatalogLoading"|"isOwnBusinessProfile"|"loadCatalog"|"products"|"reduceMotion"|"scrollContainerRef"|"selectedProducts"|"setCatalogFilter"|"setPreviewProduct"|"setQuoteItem"|"visibleProducts">}){
const {catalogError,catalogFilter,catalogPricingCounts,handleOrderToggle,isCatalogLoading,isOwnBusinessProfile,loadCatalog,products,reduceMotion,scrollContainerRef,selectedProducts,setCatalogFilter,setPreviewProduct,setQuoteItem,visibleProducts}=model;
return (<div
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
                {visibleProducts.map((product,index)=><CatalogProductCard key={product.id} product={product} index={index} model={{handleOrderToggle,isOwnBusinessProfile,reduceMotion,selectedProducts,setPreviewProduct,setQuoteItem}}/>)}
              </AnimatePresence>
            </motion.div>
          </>
        )}
      </div>);
}
