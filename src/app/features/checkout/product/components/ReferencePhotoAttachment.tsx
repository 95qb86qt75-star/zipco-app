import * as React from 'react';


import { Camera, ChevronDown, Maximize2, X } from "lucide-react";

import { ImageWithFallback } from "../../../../components/figma/ImageWithFallback";











import type { CheckoutScreenModel } from "../application/useCheckoutScreenController";
/** Canonical visual section; data and commands come from its screen controller. */
export default function ReferencePhotoAttachment({model}:{model:Pick<CheckoutScreenModel,"handleReferencePhotoChange"|"isPhotoOpen"|"isUploadingPhoto"|"referencePhoto"|"referencePhotoInputRef"|"setIsPhotoOpen"|"setIsPhotoViewerOpen"|"setPhotoZoom"|"setReferencePhoto">}){
const {handleReferencePhotoChange,isPhotoOpen,isUploadingPhoto,referencePhoto,referencePhotoInputRef,setIsPhotoOpen,setIsPhotoViewerOpen,setPhotoZoom,setReferencePhoto}=model;
return (<div className="mb-4 rounded-2xl border border-slate-200 bg-white/70 p-3">
          <button
            type="button"
            onClick={() => setIsPhotoOpen((value) => !value)}
            className="flex w-full items-center justify-between text-left text-sm font-bold text-gray-900"
          >
            <span className="flex items-center gap-2">
              <Camera className="h-4 w-4 text-teal-500" />
              Agregar foto de referencia
            </span>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${isPhotoOpen ? "rotate-180" : ""}`}
            />
          </button>

          {isPhotoOpen &&
            (referencePhoto ? (
              <div className="relative rounded-2xl border border-teal-100 bg-white/80 p-3 shadow-sm backdrop-blur-sm">
                <button
                  type="button"
                  onClick={() => {
                    setPhotoZoom(1);
                    setIsPhotoViewerOpen(true);
                  }}
                  className="group relative block h-44 w-full overflow-hidden rounded-xl bg-slate-100"
                  aria-label="Ampliar foto de referencia"
                >
                  <ImageWithFallback
                    src={referencePhoto}
                    alt="Foto de referencia"
                    className="h-full w-full object-contain"
                  />
                  <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full bg-slate-950/75 px-2.5 py-1.5 text-[11px] font-bold text-white shadow-lg backdrop-blur-sm">
                    <Maximize2 className="h-3.5 w-3.5" /> Ampliar
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setReferencePhoto(null);
                    setIsPhotoViewerOpen(false);
                  }}
                  className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/90 shadow-md flex items-center justify-center text-gray-700 hover:text-red-500 transition-colors"
                  aria-label="Eliminar foto de referencia"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => referencePhotoInputRef.current?.click()}
                disabled={isUploadingPhoto}
                className="w-full bg-white/80 text-gray-700 border-2 border-dashed border-teal-200 hover:border-teal-500 rounded-2xl p-4 font-semibold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <Camera className="w-5 h-5 text-teal-500" />
                <span>
                  {isUploadingPhoto
                    ? "Subiendo foto..."
                    : "Elegir foto desde galeria o camara"}
                </span>
              </button>
            ))}

          <input
            ref={referencePhotoInputRef}
            type="file"
            accept="image/*"
            onChange={handleReferencePhotoChange}
            className="sr-only"
          />
        </div>);
}
