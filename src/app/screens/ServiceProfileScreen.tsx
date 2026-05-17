import { useState } from 'react';
import { ArrowLeft, Facebook, Instagram } from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import BottomNav from './BottomNav';

export default function ServiceProfileScreen({ service, onBack, onRequestService, activeTab, setActiveTab }: { service: any; onBack: () => void; onRequestService: (selectedService: any) => void; activeTab: string; setActiveTab: (tab: string) => void }) {
  const [selectedService, setSelectedService] = useState<any>(null);

  return (
    <div className="size-full bg-gradient-to-b from-white via-blue-50/30 to-blue-100/40 flex flex-col">
      {/* Header */}
      <div className="px-4 pt-6 pb-4 border-b border-white/50">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h2 className="text-xl font-bold text-gray-900">Perfil del Servicio</h2>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-4 pt-4 pb-28">
        {/* Profile Card */}
        <div className="bg-gradient-to-br from-purple-500 via-indigo-500 to-blue-500 rounded-3xl overflow-hidden shadow-2xl mb-4 border border-white/20">
          <div className="p-6">
            <div className="flex items-start gap-4 mb-4">
              <ImageWithFallback
                src={service.image}
                alt={service.name}
                className="w-24 h-24 rounded-2xl object-cover border-4 border-white/30 shadow-xl"
              />
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-white mb-1">{service.name}</h3>
                <p className="text-sm text-white/90 mb-2">{service.description}</p>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-semibold text-white">
                    {service.type === 'Negocio' ? 'Empresa' : 'Independiente'}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    service.isOpen ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                  }`}>
                    {service.isOpen ? 'Disponible' : 'No disponible'}
                  </span>
                </div>
              </div>
            </div>

            {/* Social Media */}
            <div className="flex gap-3">
              <a
                href={`https://instagram.com/${service.instagram?.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl py-3 px-4 flex items-center justify-center gap-2 hover:bg-white/30 transition-all"
              >
                <Instagram className="w-5 h-5 text-white" />
                <span className="text-sm font-semibold text-white">Instagram</span>
              </a>
              <a
                href={`https://facebook.com/${service.facebook}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl py-3 px-4 flex items-center justify-center gap-2 hover:bg-white/30 transition-all"
              >
                <Facebook className="w-5 h-5 text-white" />
                <span className="text-sm font-semibold text-white">Facebook</span>
              </a>
            </div>
          </div>
        </div>

        {/* Services List */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-white/50 shadow-md">
          <h4 className="font-bold text-gray-900 mb-2">Servicios disponibles</h4>
          <p className="text-xs text-gray-500 mb-4 italic">Haz doble clic para seleccionar el servicio</p>
          <div className="space-y-3">
            {service.services?.map((item: any) => (
              <div
                key={item.id}
                onDoubleClick={() => {
                  setSelectedService(item);
                  onRequestService(item);
                }}
                className={`w-full bg-gradient-to-br from-purple-50 to-indigo-50 border-2 rounded-xl p-4 hover:shadow-md transition-all cursor-pointer ${
                  selectedService?.id === item.id
                    ? 'border-purple-500 bg-gradient-to-br from-purple-100 to-indigo-100'
                    : 'border-purple-200'
                }`}
              >
                <h5 className="font-bold text-purple-900 mb-1">{item.name}</h5>
                <p className="text-sm text-purple-700">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}

