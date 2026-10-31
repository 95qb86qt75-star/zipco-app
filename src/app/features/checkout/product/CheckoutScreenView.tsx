import * as React from 'react';
import ProductSelectionCard from './components/ProductSelectionCard';
import ScheduleSelectionPanel from './components/ScheduleSelectionPanel';
import ReferencePhotoAttachment from './components/ReferencePhotoAttachment';
import ReferencePhotoDialog from './components/ReferencePhotoDialog';


import { ArrowLeft, ChevronDown, FileText, Send } from "lucide-react";

import { ImageWithFallback } from "../../../components/figma/ImageWithFallback";








import { ConsultationDesignSheet } from "../../requests/shared/availability-design/AvailabilityDesign";


import type {CheckoutScreenModel} from './application/useCheckoutScreenController';
export default function CheckoutScreenView({model}:{model:CheckoutScreenModel}){
const {availableHours,availableMinutes,business,calculateTotal,consultationOpen,contactAllowed,creationIntent,dateOptions,formatDate,getDateValue,handleDateSelection,handleHourSelection,handleMomentSelection,handleReferencePhotoChange,handleSubmitOrder,isNoteOpen,isPhotoOpen,isPhotoViewerOpen,isSubmitting,isUploadingPhoto,needNow,note,onBack,orderMoment,pendingPayload,photoZoom,quantities,referencePhoto,referencePhotoInputRef,reviewItems,selectedDate,selectedHour,selectedItems,selectedMinute,selectedTime,setConsultationOpen,setContactAllowed,setIsNoteOpen,setIsPhotoOpen,setIsPhotoViewerOpen,setNote,setPhotoZoom,setReferencePhoto,setSelectedHour,setSelectedMinute,setSelectedTime,submissionError,submissionHours,updateQuantity,updateSelectedTime}=model;
return (
    <div className="zipco-theme-surface size-full min-h-0 overflow-hidden bg-gradient-to-b from-white via-blue-50/30 to-blue-100/40 flex flex-col">
      {submissionHours.dialog}
      {/* Header */}
      <div className="zipco-safe-header border-b border-slate-200/60 px-4 pb-3">
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={onBack}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h2 className="text-xl font-bold text-gray-900">
            Resumen del pedido
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <ImageWithFallback
            src={business.image}
            alt={business.name}
            className="w-10 h-10 rounded-full object-cover border-2 border-teal-500"
          />
          <div>
            <p className="font-semibold text-gray-900 text-sm">
              {business.name}
            </p>
            <p className="text-xs text-gray-500">{business.type}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-4 pt-4 pb-48">
        <h3 className="mb-2 text-base font-bold text-gray-900">
          Productos seleccionados
        </h3>

        {/* Products List */}
        <ProductSelectionCard model={{quantities,selectedItems,updateQuantity}}/>

        {/* Delivery Date & Time Selection */}
        <ScheduleSelectionPanel model={{availableHours,availableMinutes,dateOptions,formatDate,getDateValue,handleDateSelection,handleHourSelection,handleMomentSelection,needNow,orderMoment,selectedDate,selectedHour,selectedMinute,selectedTime,setSelectedHour,setSelectedMinute,setSelectedTime,updateSelectedTime}}/>

        {/* Personal Note */}
        <div className="mb-3 rounded-2xl border border-slate-200 bg-white/70 p-3">
          <button
            type="button"
            onClick={() => setIsNoteOpen((value) => !value)}
            className="flex w-full items-center justify-between text-left text-sm font-bold text-gray-900"
          >
            <span className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-teal-500" />
              Agregar nota opcional
            </span>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${isNoteOpen ? "rotate-180" : ""}`}
            />
          </button>
          {isNoteOpen && (
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ej: Sin azúcar, decoración personalizada, hora de entrega..."
              className="zipco-readable-field mt-3 w-full resize-none rounded-xl border border-gray-200 bg-white/80 p-3 text-sm backdrop-blur-sm transition-all focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              rows={3}
            />
          )}
        </div>

        <ReferencePhotoAttachment model={{handleReferencePhotoChange,isPhotoOpen,isUploadingPhoto,referencePhoto,referencePhotoInputRef,setIsPhotoOpen,setIsPhotoViewerOpen,setPhotoZoom,setReferencePhoto}}/>

        {isPhotoViewerOpen && referencePhoto && (
          <ReferencePhotoDialog model={{photoZoom,referencePhoto,setIsPhotoViewerOpen,setPhotoZoom}}/>
        )}

        {/* Total Summary */}
        <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-2xl p-5 border-2 border-teal-200">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">Total de productos</span>
            <span className="text-sm font-semibold text-gray-900">
              {selectedItems.reduce(
                (sum, item) => sum + (quantities[item.id] || 1),
                0,
              )}{" "}
              unidades
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-lg font-bold text-gray-900">
              Total estimado
            </span>
            <span className="text-2xl font-bold text-teal-600">
              ${calculateTotal().toLocaleString("es-CL")}
            </span>
          </div>
        </div>
      </div>

      {/* Order Button */}
      <div className="zipco-sticky-fade absolute bottom-24 left-0 right-0 z-40 bg-gradient-to-t from-white via-white to-transparent px-4 py-2">
        <div className="flex items-center gap-3 rounded-2xl border border-teal-400/30 bg-slate-950/95 p-2 pl-3 shadow-2xl backdrop-blur-md">
          <div className="min-w-0 shrink-0 text-white">
            <p className="text-[10px] font-semibold text-slate-400">Total</p>
            <p className="text-base font-black text-teal-300">
              ${calculateTotal().toLocaleString("es-CL")}
            </p>
          </div>
          <button
            onClick={() => { if (!creationIntent.current.isBlocked()) setConsultationOpen(true); }}
            disabled={isUploadingPhoto || isSubmitting}
            className="flex min-w-0 flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-500/30 transition-all active:scale-[0.98]"
          >
            <Send className="w-5 h-5" />
            <span>{isSubmitting ? "Enviando..." : creationIntent.current.hasPending() ? 'Reintentar envío' : "Requiero este producto"}</span>
          </button>
        </div>
      </div>

      <ConsultationDesignSheet
        open={consultationOpen}
        onOpenChange={setConsultationOpen}
        data={{
          counterpart: business.name,
          items: reviewItems,
          total: reviewItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0),
          immediate: pendingPayload?.needNow ?? needNow,
          schedule: pendingPayload
            ? pendingPayload.needNow ? 'Ahora' : `${pendingPayload.deliveryDate} · ${pendingPayload.deliveryTime}`
            : needNow ? 'Ahora' : `${selectedDate || 'Selecciona fecha'} · ${selectedTime || 'Selecciona hora'}`,
        }}
        contact={creationIntent.current.pendingPayload()?.customerContactPreference?.allowed ?? contactAllowed}
        contactLocked={creationIntent.current.hasPending()}
        onContactChange={setContactAllowed}
        onSend={handleSubmitOrder}
        busy={isSubmitting || isUploadingPhoto}
        error={submissionError}
      />
    </div>
  );

}
