import * as React from 'react';
import ServiceOrderSummary from './components/ServiceOrderSummary';


import { ArrowLeft, Check } from "lucide-react";

import BottomNav from "../../../shared/navigation/BottomNav";







import type {ServiceCheckoutScreenModel} from './application/useServiceCheckoutScreenController';
export default function ServiceCheckoutScreenView({model}:{model:ServiceCheckoutScreenModel}){
const {activeTab,creationIntent,deliveryDate,deliveryTime,handleImageUpload,handleMomentSelection,handleSubmit,isSubmitting,isUploading,message,onBack,provider,scheduleOption,service,setActiveTab,setDeliveryDate,setDeliveryTime,setMessage,setUploadedImage,showNotification,submissionHours,uploadedImage}=model;
return (
    <div className="zipco-theme-surface size-full bg-gradient-to-b from-white via-blue-50/30 to-blue-100/40 flex flex-col">
      {submissionHours.dialog}
      {/* Header */}
      <div
        className="px-4 pb-4 border-b border-white/50"
        style={{ paddingTop: "max(1.5rem, env(safe-area-inset-top))" }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h2 className="text-xl font-bold text-gray-900">
            Resumen del Servicio
          </h2>
        </div>
      </div>

      {/* Content */}
      <ServiceOrderSummary model={{creationIntent,deliveryDate,deliveryTime,handleImageUpload,handleMomentSelection,handleSubmit,isSubmitting,isUploading,message,provider,scheduleOption,service,setDeliveryDate,setDeliveryTime,setMessage,setUploadedImage,uploadedImage}}/>

      {/* Success Notification */}
      {showNotification && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/60 px-6 backdrop-blur-xl">
          <div className="zipco-hologram-card zipco-flow-hologram w-full max-w-sm rounded-3xl bg-white p-8 shadow-2xl dark:border dark:border-violet-300/60 dark:bg-slate-950 dark:text-white">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full flex items-center justify-center mb-4">
                <Check className="w-8 h-8 text-white" strokeWidth={3} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                ¡Solicitud enviada!
              </h3>
              <p className="text-sm text-gray-600">
                Tu solicitud de servicio ha sido enviada a {provider.name}. Te
                notificaremos cuando respondan.
              </p>
            </div>
          </div>
        </div>
      )}

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );

}
