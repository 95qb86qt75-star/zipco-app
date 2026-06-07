import { Check, FileText } from 'lucide-react';
import { useState } from 'react';
import BusinessOrderCard from './BusinessOrderCard';
import EmptyRequestsState from './EmptyRequestsState';
import type { BusinessRequest } from './types';
import { sortByUrgency } from './utils';

type BusinessOrdersTabProps = {
  requests: BusinessRequest[];
  onAccept: (requestId: number) => void;
  onReject: (requestId: number) => void;
};

export default function BusinessOrdersTab({ requests, onAccept, onReject }: BusinessOrdersTabProps) {
  const [businessSubTab, setBusinessSubTab] = useState<'pending' | 'accepted'>('pending');
  const pendingRequests = requests.filter((req) => req.status === 'pending').sort(sortByUrgency);
  const processedRequests = requests.filter((req) => req.status !== 'pending').sort(sortByUrgency);

  return (
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
          Pendientes ({pendingRequests.length})
        </button>
        <button
          onClick={() => setBusinessSubTab('accepted')}
          className={`flex-1 py-2.5 px-4 rounded-xl font-semibold text-sm transition-all ${
            businessSubTab === 'accepted'
              ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg'
              : 'bg-white/60 text-gray-600 hover:bg-white/80'
          }`}
        >
          Historial ({processedRequests.length})
        </button>
      </div>

      {businessSubTab === 'pending' && (
        <>
          {pendingRequests.length > 0 ? (
            <div className="space-y-3">
              {pendingRequests.map((request) => (
                <BusinessOrderCard
                  key={request.id}
                  request={request}
                  onAccept={onAccept}
                  onReject={onReject}
                />
              ))}
            </div>
          ) : (
            <EmptyRequestsState
              icon={FileText}
              title="No hay solicitudes pendientes"
              description="Las nuevas solicitudes apareceran aqui"
              colorClass="text-amber-600"
              bgClass="bg-amber-100"
            />
          )}
        </>
      )}

      {businessSubTab === 'accepted' && (
        <>
          {processedRequests.length > 0 ? (
            <div className="space-y-3">
              {processedRequests.map((request) => (
                <BusinessOrderCard key={request.id} request={request} />
              ))}
            </div>
          ) : (
            <EmptyRequestsState
              icon={Check}
              title="No hay solicitudes en historial"
              description="Las solicitudes aceptadas o rechazadas apareceran aqui"
              colorClass="text-green-600"
              bgClass="bg-green-100"
            />
          )}
        </>
      )}
    </>
  );
}
