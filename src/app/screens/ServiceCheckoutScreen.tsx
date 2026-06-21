import React, { useState } from 'react';
import { ArrowLeft, Calendar, Camera, Check, Clock, Send, X } from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import BottomNav from './BottomNav';

export default function ServiceCheckoutScreen({ onBack, service, provider, activeTab, setActiveTab }: { onBack: () => void; service: any; provider: any; activeTab: string; setActiveTab: (tab: string) => void }) {
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('');
  const [scheduleOption, setScheduleOption] = useState<'now' | 'schedule' | null>(null);
  const [message, setMessage] = useState('');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [showNotification, setShowNotification] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    setShowNotification(true);
    setTimeout(() => {
      setShowNotification(false);
      onBack();
    }, 3000);
  };

  return (
    <div className="size-full bg-gradient-to-b from-white via-blue-50/30 to-blue-100/40 flex flex-col">
      {/* Header */}
      <div
        className="px-4 pb-4 border-b border-white/50"
        style={{ paddingTop: 'max(1.5rem, env(safe-area-inset-top))' }}
      >
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h2 className="text-xl font-bold text-gray-900">Resumen del Servicio</h2>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-4 pt-4 pb-28">
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
          <h4 className="font-bold text-gray-900 mb-3">¿Cuándo lo necesitas?</h4>

          {/* Two Options */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <button
              onClick={() => {
                setScheduleOption('now');
                setDeliveryDate('');
                setDeliveryTime('');
              }}
              className={`py-3 px-4 rounded-xl font-semibold text-sm transition-all flex flex-col items-center justify-center gap-2 ${
                scheduleOption === 'now'
                  ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Clock className="w-6 h-6" />
              Lo necesito AHORA
            </button>

            <button
              onClick={() => setScheduleOption('schedule')}
              className={`py-3 px-4 rounded-xl font-semibold text-sm transition-all flex flex-col items-center justify-center gap-2 ${
                scheduleOption === 'schedule'
                  ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Calendar className="w-6 h-6" />
              Agendar
            </button>
          </div>

          {/* Date and Time Pickers - Only show when "Agendar" is selected */}
          {scheduleOption === 'schedule' && (
            <div className="space-y-3 bg-purple-50 border border-purple-200 rounded-xl p-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Fecha</label>
                <input
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Hora</label>
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
          <h4 className="font-bold text-gray-900 mb-3">Mensaje personalizado (opcional)</h4>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Describe detalles adicionales sobre el servicio que necesitas..."
            className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all resize-none"
            rows={4}
          />
        </div>

        {/* Image Upload Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-white/50 shadow-md mb-4">
          <h4 className="font-bold text-gray-900 mb-2">Adjuntar foto (opcional)</h4>
          <p className="text-xs text-gray-500 mb-3">La foto estará disponible por 24 horas</p>

          {uploadedImage ? (
            <div className="relative">
              <img src={uploadedImage} alt="Preview" className="w-full h-48 object-cover rounded-xl" />
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
              <span className="text-sm text-gray-600">Toca para subir una foto</span>
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
          className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white py-4 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 mb-4"
        >
          <Send className="w-5 h-5" />
          Solicitar Servicio
        </button>
      </div>

      {/* Success Notification */}
      {showNotification && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl transform animate-in">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full flex items-center justify-center mb-4">
                <Check className="w-8 h-8 text-white" strokeWidth={3} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">¡Solicitud enviada!</h3>
              <p className="text-sm text-gray-600">
                Tu solicitud de servicio ha sido enviada a {provider.name}. Te notificaremos cuando respondan.
              </p>
            </div>
          </div>
        </div>
      )}

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}

