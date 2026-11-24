import * as React from 'react';

import { MessageCircle, ShoppingCart, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { ImageWithFallback } from "../../../../components/figma/ImageWithFallback";


import { getCatalogItemAction, getPublicCatalogPriceLabel } from "../../../catalog/domain/catalogItemPresentation";




import type { BusinessProfileScreenModel } from "../application/useBusinessProfileScreenController";
/** Canonical visual section; data and commands come from its screen controller. */
export default function CatalogProductPreview({model}:{model:Pick<BusinessProfileScreenModel,"handleOrderToggle"|"isOwnBusinessProfile"|"previewProduct"|"reduceMotion"|"selectedProducts"|"setPreviewProduct"|"setQuoteItem">}){
const {handleOrderToggle,isOwnBusinessProfile,previewProduct,reduceMotion,selectedProducts,setPreviewProduct,setQuoteItem}=model;
return (<AnimatePresence>
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
      </AnimatePresence>);
}
