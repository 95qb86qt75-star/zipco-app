import * as React from 'react';


import { Camera, Send, X } from "lucide-react";
import { ImageWithFallback } from "../../../../components/figma/ImageWithFallback";





import OrderMomentSelector from "../../shared/OrderMomentSelector";


import type { ServiceCheckoutScreenModel } from "../application/useServiceCheckoutScreenController";
/** Canonical visual section; data and commands come from its screen controller. */
export default function ServiceOrderSummary({model}:{model:Pick<ServiceCheckoutScreenModel,"creationIntent"|"deliveryDate"|"deliveryTime"|"handleImageUpload"|"handleMomentSelection"|"handleSubmit"|"isSubmitting"|"isUploading"|"message"|"provider"|"scheduleOption"|"service"|"setDeliveryDate"|"setDeliveryTime"|"setMessage"|"setUploadedImage"|"uploadedImage">}){
const {creationIntent,deliveryDate,deliveryTime,handleImageUpload,handleMomentSelection,handleSubmit,isSubmitting,isUploading,message,provider,scheduleOption,service,setDeliveryDate,setDeliveryTime,setMessage,setUploadedImage,uploadedImage}=model;
return (<div className="flex-1 overflow-auto px-4 pt-4 pb-28">
        {/* Provider Info */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-white/50 shadow-md mb-4">
          <div className="flex items-center gap-3 mb-3">
            <ImageWithFallback
              src={provider.image}
              alt={provider.name}
              className="w-14 h-14 rounded-full object-cover"
            />
            <div className="flex-1">
              <h3 className="font-bold text-gray-900">{provider.name}</h3>
              <p className="text-xs text-gray-600">{provider.description}</p>
            </div>
          </div>
        </div>

        {/* Service Details */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-white/50 shadow-md mb-4">
          <h4 className="font-bold text-gray-900 mb-3">Servicio solicitado</h4>
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-4">
            <h5 className="font-bold text-purple-900 mb-1">{service.name}</h5>
            <p className="text-sm text-purple-700">{service.description}</p>
          </div>
        </div>

        {/* Schedule Options */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-white/50 shadow-md mb-4">
          <h4 className="font-bold text-gray-900 mb-3">
            ¿Cuándo lo necesitas?
          </h4>

          <OrderMomentSelector variant="service" moment={scheduleOption} onChange={handleMomentSelection}
            time={deliveryTime} onTimeChange={setDeliveryTime} />

          {/* Date and time selection for Programar */}
          {scheduleOption === "schedule" && (
            <div className="space-y-3 bg-purple-50 border border-purple-200 rounded-xl p-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Fecha
                </label>
                <input
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Hora
                </label>
                <input
                  type="time"
                  value={deliveryTime}
                  onChange={(e) => setDeliveryTime(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                />
              </div>
            </div>
          )}
        </div>

        {/* Message Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-white/50 shadow-md mb-4">
          <h4 className="font-bold text-gray-900 mb-3">
            Mensaje personalizado (opcional)
          </h4>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Describe detalles adicionales sobre el servicio que necesitas..."
            className="zipco-readable-field w-full bg-white border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all resize-none"
            rows={4}
          />
        </div>

        {/* Image Upload Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-white/50 shadow-md mb-4">
          <h4 className="font-bold text-gray-900 mb-2">
            Adjuntar foto (opcional)
          </h4>
          <p className="text-xs text-gray-500 mb-3">
            La foto estará disponible por 24 horas
          </p>

          {uploadedImage ? (
            <div className="relative">
              <img
                src={uploadedImage}
                alt="Preview"
                className="w-full h-48 object-cover rounded-xl"
              />
              <button
                onClick={() => setUploadedImage(null)}
                className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <label className="w-full border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-purple-500 hover:bg-purple-50/50 transition-all">
              <Camera className="w-10 h-10 text-gray-400 mb-2" />
              <span className="text-sm text-gray-600">
                Toca para subir una foto
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
          )}
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || isUploading}
          className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white py-4 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 mb-4"
        >
          <Send className="w-5 h-5" />
          {isSubmitting
            ? "Enviando…"
            : isUploading
              ? "Subiendo foto…"
              : creationIntent.current.hasPending() ? 'Reintentar envío' : "Solicitar Servicio"}
        </button>
      </div>);
}
