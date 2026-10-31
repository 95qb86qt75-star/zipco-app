import * as React from 'react';
import { Minus, Plus } from "lucide-react";
import { ImageWithFallback } from "../../../../components/figma/ImageWithFallback";
import type { CheckoutScreenModel } from "../application/useCheckoutScreenController";
/** Canonical visual section; data and commands come from its screen controller. */
/** Complete visual card; preserves the list's commands and data. */
export default function SelectedProductCard({model,product}:{model:Pick<CheckoutScreenModel,"quantities"|"updateQuantity">;product:CheckoutScreenModel["selectedItems"][number]}){
const {quantities,updateQuantity}=model;
return (<div
              key={product.id}
              className="rounded-2xl border border-slate-200 bg-white/80 p-3 shadow-md backdrop-blur-sm"
            >
              <div className="mb-2 flex gap-3">
                <ImageWithFallback
                  src={product.imageUrl}
                  alt={product.name}
                  className="h-14 w-14 rounded-xl object-cover"
                />
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 text-sm mb-1">
                    {product.name}
                  </h4>
                  <p className="text-xs text-gray-600 mb-2 line-clamp-1">
                    {product.description}
                  </p>
                  <span className="text-base font-bold text-gray-900">
                    ${product.priceClp?.toLocaleString("es-CL")}
                  </span>
                </div>
              </div>

              {/* Quantity Controls */}
              <div className="flex items-center justify-between border-t border-gray-100 pt-2">
                <span className="text-sm text-gray-600">Cantidad</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => updateQuantity(product.id, -1)}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 transition-colors hover:bg-gray-200"
                  >
                    <Minus className="w-4 h-4 text-gray-700" />
                  </button>
                  <span className="text-lg font-bold text-gray-900 w-8 text-center">
                    {quantities[product.id] || 1}
                  </span>
                  <button
                    onClick={() => updateQuantity(product.id, 1)}
                    className="w-8 h-8 rounded-full bg-teal-500 hover:bg-teal-600 flex items-center justify-center transition-colors"
                  >
                    <Plus className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>

              {/* Subtotal */}
              <div className="mt-2 flex items-center justify-between border-t border-gray-100 pt-2">
                <span className="text-sm text-gray-600">Subtotal</span>
                <span className="text-base font-bold text-teal-600">
                  $
                  {(
                    (product.priceClp ?? 0) * (quantities[product.id] || 1)
                  ).toLocaleString("es-CL")}
                </span>
              </div>
            </div>);
}
