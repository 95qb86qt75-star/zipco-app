import { type ReactNode, useState } from 'react';
import { ArrowLeft, Check, FileText, Package } from 'lucide-react';
import BusinessRequestCard from './requests/BusinessRequestCard';
import EmptyRequestsState from './requests/EmptyRequestsState';
import MyOrderCard from './requests/MyOrderCard';
import { initialMyOrders, initialRequests } from './requests/mockData';
import type { BusinessRequest, MyOrder } from './requests/types';
import { groupByDate, sortByUrgency } from './requests/utils';

export default function RequestsScreen({
  onBack
}: {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onBack: () => void;
}) {
  const [subTab, setSubTab] = useState<'my-orders' | 'my-business'>('my-orders');
  const [businessSubTab, setBusinessSubTab] = useState<'pending' | 'accepted'>('pending');
  const [requests, setRequests] = useState<BusinessRequest[]>(initialRequests);
  const [myOrders] = useState<MyOrder[]>(initialMyOrders);

  const handleAccept = (requestId: number) => {
    setRequests(requests.map((req) => (req.id === requestId ? { ...req, status: 'accepted' } : req)));
  };

  const handleReject = (requestId: number) => {
    setRequests(requests.map((req) => (req.id === requestId ? { ...req, status: 'rejected' } : req)));
  };

  const pendingOrders = myOrders.filter((order) => order.status === 'pending');
  const processedOrders = myOrders.filter((order) => order.status !== 'pending');
  const pendingRequests = requests.filter((req) => req.status === 'pending').sort(sortByUrgency);
  const acceptedRequests = requests.filter((req) => req.status === 'accepted').sort(sortByUrgency);
  const groupedPending = groupByDate(pendingRequests);
  const groupedAccepted = groupByDate(acceptedRequests);

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
            🛒 Mis Pedidos
          </button>
          <button
            onClick={() => setSubTab('my-business')}
            className={`flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition-all ${
              subTab === 'my-business' ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-lg' : 'bg-white/60 text-gray-600 hover:bg-white/80'
            }`}
          >
            🏪 Mi Negocio
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-4 pt-4 pb-24">
        {subTab === 'my-orders' && (
          <>
            <p className="text-sm text-gray-600 mb-4">
              {pendingOrders.length} {pendingOrders.length === 1 ? 'pedido pendiente' : 'pedidos pendientes'}
            </p>

            {pendingOrders.length > 0 && (
              <div className="mb-6">
                <h3 className="text-base font-bold text-gray-900 mb-3">Pendientes</h3>
                <div className="space-y-3">
                  {pendingOrders.map((order) => (
                    <MyOrderCard key={order.id} order={order} variant="pending" />
                  ))}
                </div>
              </div>
            )}

            {processedOrders.length > 0 && (
              <div className="mb-6">
                <h3 className="text-base font-bold text-gray-900 mb-3">Historial</h3>
                <div className="space-y-3">
                  {processedOrders.map((order) => (
                    <MyOrderCard key={order.id} order={order} variant="history" />
                  ))}
                </div>
              </div>
            )}

            {myOrders.length === 0 && (
              <EmptyRequestsState icon={Package} title="No tienes pedidos" description="Tus pedidos aparecerán aquí" />
            )}
          </>
        )}

        {subTab === 'my-business' && (
          <>
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setBusinessSubTab('pending')}
                className={`flex-1 py-2.5 px-4 rounded-xl font-semibold text-sm transition-all ${
                  businessSubTab === 'pending'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg'
                    : 'bg-white/60 text-gray-600 hover:bg-white/80'
                }`}
              >
                📋 Pendientes ({pendingRequests.length})
              </button>
              <button
                onClick={() => setBusinessSubTab('accepted')}
                className={`flex-1 py-2.5 px-4 rounded-xl font-semibold text-sm transition-all ${
                  businessSubTab === 'accepted'
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg'
                    : 'bg-white/60 text-gray-600 hover:bg-white/80'
                }`}
              >
                ✅ Aceptadas ({acceptedRequests.length})
              </button>
            </div>

            {businessSubTab === 'pending' && (
              <>
                {pendingRequests.length > 0 ? (
                  <div className="space-y-4">
                    {groupedPending.today.length > 0 && (
                      <RequestsSection title="📍 Solicitudes Hoy">
                        {groupedPending.today.map((request) => (
                          <BusinessRequestCard
                            key={request.id}
                            request={request}
                            variant="pending-today"
                            onAccept={handleAccept}
                            onReject={handleReject}
                          />
                        ))}
                      </RequestsSection>
                    )}

                    {groupedPending.upcoming.length > 0 && (
                      <RequestsSection title="📅 Próximas Solicitudes">
                        {groupedPending.upcoming.map((request) => (
                          <BusinessRequestCard
                            key={request.id}
                            request={request}
                            variant="pending-upcoming"
                            onAccept={handleAccept}
                            onReject={handleReject}
                          />
                        ))}
                      </RequestsSection>
                    )}
                  </div>
                ) : (
                  <EmptyRequestsState
                    icon={FileText}
                    title="No hay solicitudes pendientes"
                    description="Las nuevas solicitudes aparecerán aquí"
                    colorClass="text-amber-600"
                    bgClass="bg-amber-100"
                  />
                )}
              </>
            )}

            {businessSubTab === 'accepted' && (
              <>
                {acceptedRequests.length > 0 ? (
                  <div className="space-y-4">
                    {groupedAccepted.today.length > 0 && (
                      <RequestsSection title="📍 Para Hoy">
                        {groupedAccepted.today.map((request) => (
                          <BusinessRequestCard key={request.id} request={request} variant="accepted-today" />
                        ))}
                      </RequestsSection>
                    )}

                    {groupedAccepted.upcoming.length > 0 && (
                      <RequestsSection title="📅 Próximas Entregas">
                        {groupedAccepted.upcoming.map((request) => (
                          <BusinessRequestCard key={request.id} request={request} variant="accepted-upcoming" />
                        ))}
                      </RequestsSection>
                    )}
                  </div>
                ) : (
                  <EmptyRequestsState
                    icon={Check}
                    title="No hay solicitudes aceptadas"
                    description="Las solicitudes que aceptes aparecerán aquí"
                    colorClass="text-green-600"
                    bgClass="bg-green-100"
                  />
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function RequestsSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-bold text-gray-700 mb-2 px-1">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}
