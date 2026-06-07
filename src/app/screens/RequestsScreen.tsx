import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import BusinessOrdersTab from './requests/BusinessOrdersTab';
import MyOrdersTab from './requests/MyOrdersTab';
import useRequests from './requests/useRequests';

export default function RequestsScreen({
  onBack
}: {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onBack: () => void;
}) {
  const [subTab, setSubTab] = useState<'my-orders' | 'my-business'>('my-orders');
  const { hasBusiness, isLoading, myOrders, requests, handleAccept, handleReject } = useRequests();

  return (
    <div className="size-full bg-gradient-to-b from-white via-blue-50/30 to-blue-100/40 flex flex-col">
      <div className="px-4 pt-6 pb-4 border-b border-white/50">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={onBack} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900">Solicitudes</h2>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setSubTab('my-orders')}
            className={`flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition-all ${
              subTab === 'my-orders' ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-lg' : 'bg-white/60 text-gray-600 hover:bg-white/80'
            }`}
          >
            Mis Pedidos
          </button>
          {hasBusiness && (
            <button
              onClick={() => setSubTab('my-business')}
              className={`flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition-all ${
                subTab === 'my-business' ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-lg' : 'bg-white/60 text-gray-600 hover:bg-white/80'
              }`}
            >
              Mi Negocio
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto px-4 pt-4 pb-24">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-10 h-10 border-4 border-teal-100 border-t-teal-500 rounded-full animate-spin mb-3" />
            <p className="text-sm font-semibold text-gray-600">Cargando pedidos...</p>
          </div>
        )}

        {!isLoading && subTab === 'my-orders' && (
          <MyOrdersTab myOrders={myOrders} />
        )}

        {!isLoading && hasBusiness && subTab === 'my-business' && (
          <BusinessOrdersTab requests={requests} onAccept={handleAccept} onReject={handleReject} />
        )}
      </div>
    </div>
  );
}
