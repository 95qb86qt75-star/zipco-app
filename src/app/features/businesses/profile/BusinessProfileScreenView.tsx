import * as React from 'react';
import BusinessProfileHeader from './components/BusinessProfileHeader';
import BusinessCatalogSection from './components/BusinessCatalogSection';
import CatalogProductPreview from './components/CatalogProductPreview';

import { Check, ShoppingCart, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";





import { parseBusinessId } from "../../profile/business-config/catalog/catalogValidation";

import QuoteRequestModal from "../../quotes/shared/QuoteRequestModal";
import type {BusinessProfileScreenModel} from './application/useBusinessProfileScreenController';
export default function BusinessProfileScreenView({model}:{model:BusinessProfileScreenModel}){
const {business,businessDescription,businessImage,businessType,catalogError,catalogFilter,catalogPricingCounts,closingTime,distanceLabel,expanded,handleCollapsedHeaderClick,handleOrderToggle,handleProfileTouchMove,handleProfileTouchStart,handleProfileWheel,hasExtendedDescription,isBusinessOpen,isCatalogLoading,isFavorite,isOwnBusinessProfile,isScrolled,loadCatalog,onBack,onCheckout,onQuoteCreated,onSessionExpired,onToggleFavorite,openSocialProfile,previewProduct,products,quoteItem,reduceMotion,scrollContainerRef,selectedProducts,selectedTotal,setCatalogFilter,setExpanded,setPreviewProduct,setQuoteItem,setShowRemoveTooltip,showRemoveTooltip,socialNotice,visibleProducts}=model;
return (
    <div
      className="zipco-theme-surface size-full bg-gradient-to-b from-white via-blue-50/30 to-blue-100/40 flex flex-col relative"
      onWheel={handleProfileWheel}
      onTouchStart={handleProfileTouchStart}
      onTouchMove={handleProfileTouchMove}
    >
      <BusinessProfileHeader model={{business,businessDescription,businessImage,businessType,closingTime,distanceLabel,expanded,handleCollapsedHeaderClick,hasExtendedDescription,isBusinessOpen,isFavorite,isScrolled,onBack,onToggleFavorite,openSocialProfile,setExpanded}}/>

      <BusinessCatalogSection model={{catalogError,catalogFilter,catalogPricingCounts,handleOrderToggle,isCatalogLoading,isOwnBusinessProfile,loadCatalog,products,reduceMotion,scrollContainerRef,selectedProducts,setCatalogFilter,setPreviewProduct,setQuoteItem,visibleProducts}}/>

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

      <CatalogProductPreview model={{handleOrderToggle,isOwnBusinessProfile,previewProduct,reduceMotion,selectedProducts,setPreviewProduct,setQuoteItem}}/>
      {quoteItem && parseBusinessId(business.id) !== null && (
        <QuoteRequestModal
          businessId={parseBusinessId(business.id) as number}
          item={quoteItem}
          onClose={() => setQuoteItem(null)}
          onFindAlternative={()=>{setQuoteItem(null);onBack();}}
          onCreated={() => onQuoteCreated?.()}
          onSessionExpired={onSessionExpired}
        />
      )}
    </div>
  );

}
