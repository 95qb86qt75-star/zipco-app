import * as React from 'react';
import { Check, Eye, MessageCircle, ShoppingCart } from "lucide-react";
import { motion } from "motion/react";
import { ImageWithFallback } from "../../../components/figma/ImageWithFallback";
import { getCatalogItemAction, getPublicCatalogPriceLabel } from "../domain/catalogItemPresentation";
import type { BusinessProfileScreenModel } from "../../businesses/profile/application/useBusinessProfileScreenController";
/** Canonical visual section; data and commands come from its screen controller. */
/** Complete visual card; preserves the list's commands and data. */
export default function CatalogProductCard({model,product,index}:{model:Pick<BusinessProfileScreenModel,"handleOrderToggle"|"isOwnBusinessProfile"|"reduceMotion"|"selectedProducts"|"setPreviewProduct"|"setQuoteItem">;product:BusinessProfileScreenModel["visibleProducts"][number];index:number}){
const {handleOrderToggle,isOwnBusinessProfile,reduceMotion,selectedProducts,setPreviewProduct,setQuoteItem}=model;

                  const isSelected = selectedProducts.includes(product.id);
                  const action = getCatalogItemAction(product);
                  const canOrder = action === "order";
                  const priceLabel = getPublicCatalogPriceLabel(product);
                  return (
                    <motion.div
                      key={product.id}
                      layout
                      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={
                        reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }
                      }
                      transition={{
                        duration: 0.22,
                        delay: reduceMotion ? 0 : index * 0.045,
                      }}
                      onClick={() => {
                        setPreviewProduct(product);
                      }}
                      className={`zipco-catalog-card relative min-h-[88px] overflow-hidden rounded-xl border-2 p-3 shadow-md transition-all ${
                        canOrder
                          ? isSelected
                            ? "border-teal-400 bg-emerald-50 ring-1 ring-teal-200"
                            : "border-teal-200 bg-gradient-to-br from-white to-teal-50 hover:shadow-md"
                          : product.pricingMode === "quote"
                            ? "cursor-pointer border-violet-200 bg-gradient-to-br from-white to-violet-50 hover:shadow-md"
                            : "cursor-pointer border-slate-200 bg-gradient-to-br from-white to-slate-50 hover:shadow-md"
                      }`}
                    >
                      <div className="grid grid-cols-[56px_minmax(0,1fr)_96px] items-center gap-2.5 min-[430px]:grid-cols-[64px_minmax(0,1fr)_105px]">
                        <div className="relative">
                          <ImageWithFallback
                            src={product.imageUrl}
                            alt={product.name}
                            className="h-14 w-14 rounded-lg object-cover min-[430px]:h-16 min-[430px]:w-16"
                          />
                          <div
                            className={`absolute -left-1.5 -top-1.5 flex h-7 w-7 items-center justify-center rounded-full border border-white shadow-lg ${
                              canOrder
                                ? "bg-gradient-to-br from-teal-400 to-emerald-500 shadow-teal-500/30"
                                : "bg-gradient-to-br from-violet-500 to-purple-600 shadow-violet-500/30"
                            }`}
                          >
                            {canOrder ? (
                              <ShoppingCart className="h-4 w-4 text-white" />
                            ) : (
                              <Eye className="h-4 w-4 text-white" />
                            )}
                          </div>
                        </div>
                        <div className="min-w-0 self-center">
                          <h4 className="mb-0.5 line-clamp-2 text-[12px] font-bold leading-4 text-slate-950 min-[430px]:text-[13px]">
                            {product.name}
                          </h4>
                          <p className="line-clamp-2 text-[10px] leading-[14px] text-slate-500 min-[430px]:text-[11px]">
                            {product.description}
                          </p>
                        </div>
                        <div className="flex h-full min-h-14 min-w-0 flex-col items-end justify-between">
                          {priceLabel && product.pricingMode === "quote" ? (
                            <span className="text-right text-violet-600">
                              {priceLabel.startsWith("Desde ") && (
                                <small className="block text-[9px] font-semibold leading-none text-slate-500">
                                  Desde
                                </small>
                              )}
                              <strong className="text-[15px] font-black leading-none min-[430px]:text-[16px]">
                                {priceLabel.replace(/^Desde /, "")}
                              </strong>
                            </span>
                          ) : priceLabel ? (
                            <span className="text-right text-[14px] font-extrabold leading-none text-slate-950 min-[430px]:text-[15px]">
                              {priceLabel}
                            </span>
                          ) : null}
                          {canOrder && !isOwnBusinessProfile && (
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleOrderToggle(product);
                              }}
                              className={`relative inline-flex h-9 w-auto items-center justify-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1 text-[11px] font-bold shadow-sm transition-all after:absolute after:-inset-y-1.5 after:inset-x-0 ${
                                isSelected
                                  ? "border-green-500 bg-white text-green-600 shadow-sm"
                                  : "border-teal-500 bg-[#14C8B8] text-white shadow-sm shadow-teal-500/20 hover:bg-[#0FB5A7]"
                              }`}
                            >
                              {isSelected ? (
                                <Check className="h-4 w-4" />
                              ) : (
                                <ShoppingCart className="h-4 w-4" />
                              )}
                              {isSelected ? "Agregado" : "Agregar"}
                            </button>
                          )}
                          {action === "view" || isOwnBusinessProfile ? (
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                setPreviewProduct(product);
                              }}
                              className="relative inline-flex min-h-8 w-auto items-center justify-center gap-1.5 rounded-lg border border-violet-500 bg-white px-3 py-1 text-[11px] font-bold text-violet-600 shadow-sm transition-all after:absolute after:-inset-y-1.5 after:inset-x-0 hover:bg-violet-50"
                            >
                              <Eye className="h-4 w-4" />
                              Ver detalle
                            </button>
                          ) : action === "quote-soon" ? (
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                setQuoteItem(product);
                              }}
                              className="relative inline-flex min-h-8 w-auto items-center gap-1 rounded-lg bg-gradient-to-r from-violet-600 to-purple-500 px-3 py-1 text-[11px] font-bold text-white shadow-sm after:absolute after:-inset-y-1.5 after:inset-x-0"
                            >
                              <MessageCircle className="h-3.5 w-3.5" />
                              Cotizar
                            </button>
                          ) : !canOrder ? (
                            <button
                              type="button"
                              className="relative min-h-8 w-auto rounded-lg border border-violet-400 bg-white px-3 py-1 text-[10px] font-bold leading-3 text-violet-600 shadow-sm after:absolute after:-inset-y-1.5 after:inset-x-0"
                            >
                              Solicitar servicio
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </motion.div>
                  );

}
