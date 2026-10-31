import * as React from 'react';


import { Minus, Plus, RotateCcw, X } from "lucide-react";

import { ImageWithFallback } from "../../../../components/figma/ImageWithFallback";











import type { CheckoutScreenModel } from "../application/useCheckoutScreenController";
/** Canonical visual section; data and commands come from its screen controller. */
export default function ReferencePhotoDialog({model}:{model:Pick<CheckoutScreenModel,"photoZoom"|"referencePhoto"|"setIsPhotoViewerOpen"|"setPhotoZoom">}){
const {photoZoom,referencePhoto,setIsPhotoViewerOpen,setPhotoZoom}=model;
return (<div
            role="dialog"
            aria-modal="true"
            aria-label="Vista ampliada de la foto de referencia"
            className="fixed inset-0 z-[120] flex flex-col bg-slate-950/95 p-4 backdrop-blur-md"
            onClick={() => setIsPhotoViewerOpen(false)}
          >
            <div className="flex items-center justify-between text-white">
              <p className="text-sm font-bold">Foto de referencia</p>
              <button
                type="button"
                onClick={() => setIsPhotoViewerOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15"
                aria-label="Cerrar foto ampliada"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div
              className="flex min-h-0 flex-1 items-center justify-center overflow-auto py-4"
              onClick={(event) => event.stopPropagation()}
            >
              <ImageWithFallback
                src={referencePhoto}
                alt="Foto de referencia ampliada"
                className="max-h-full max-w-full object-contain transition-transform duration-200"
                style={{ transform: `scale(${photoZoom})` }}
              />
            </div>
            <div
              className="mx-auto flex items-center gap-3 rounded-full border border-white/15 bg-white/10 p-2 text-white backdrop-blur-md"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                disabled={photoZoom <= 1}
                onClick={() =>
                  setPhotoZoom((current) => Math.max(1, current - 0.5))
                }
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 disabled:opacity-35"
                aria-label="Reducir foto"
              >
                <Minus className="h-5 w-5" />
              </button>
              <span className="min-w-12 text-center text-xs font-bold">
                {Math.round(photoZoom * 100)}%
              </span>
              <button
                type="button"
                disabled={photoZoom >= 3}
                onClick={() =>
                  setPhotoZoom((current) => Math.min(3, current + 0.5))
                }
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 disabled:opacity-35"
                aria-label="Ampliar foto"
              >
                <Plus className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => setPhotoZoom(1)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10"
                aria-label="Restablecer tamaño"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>
          </div>);
}
