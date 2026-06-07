import { CalendarDays, Check, ClipboardList, FileText } from 'lucide-react';
import { useState } from 'react';
import BusinessOrderCard from './BusinessOrderCard';
import EmptyRequestsState from './EmptyRequestsState';
import type { BusinessRequest } from './types';

type DateFilter = 'today' | 'tomorrow' | 'upcoming';

type BusinessOrdersTabProps = {
  requests: BusinessRequest[];
  onAccept: (requestId: number) => void;
  onReject: (requestId: number) => void;
};

function getLocalDateStr(offsetDays: number = 0): string {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().split('T')[0];
}

function getDateFilter(request: BusinessRequest): DateFilter {
  if (request.needNow) return 'today';

  const today = getLocalDateStr();
  const tomorrow = getLocalDateStr(1);

  if (!request.deliveryDate || request.deliveryDate <= today) return 'today';
  if (request.deliveryDate === tomorrow) return 'tomorrow';
  return 'upcoming';
}

export default function BusinessOrdersTab({ requests, onAccept, onReject }: BusinessOrdersTabProps) {
  const [businessSubTab, setBusinessSubTab] = useState<'pending' | 'accepted'>('pending');
  const [dateFilter, setDateFilter] = useState<DateFilter>('today');

  const pendingRequests = requests
    .filter((req) => req.status === 'pending')
    .sort((a, b) => b.id - a.id);

  const acceptedRequests = requests
    .filter((req) => req.status === 'accepted')
    .sort((a, b) => b.id - a.id);

  const todayCount = acceptedRequests.filter((request) => getDateFilter(request) === 'today').length;
  const tomorrowCount = acceptedRequests.filter((request) => getDateFilter(request) === 'tomorrow').length;
  const upcomingCount = acceptedRequests.filter((request) => getDateFilter(request) === 'upcoming').length;
  const filteredAccepted = acceptedRequests.filter((request) => getDateFilter(request) === dateFilter);
  const acceptedSectionTitle = dateFilter === 'today'
    ? 'Para Hoy'
    : dateFilter === 'tomorrow'
      ? 'Para Manana'
      : 'Proximas Entregas';

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
          <span className="inline-flex items-center justify-center gap-2">
            <ClipboardList className="w-4 h-4" />
            Pendientes ({pendingRequests.length})
          </span>
        </button>
        <button
          onClick={() => setBusinessSubTab('accepted')}
          className={`flex-1 py-2.5 px-4 rounded-xl font-semibold text-sm transition-all ${
            businessSubTab === 'accepted'
              ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg'
              : 'bg-white/60 text-gray-600 hover:bg-white/80'
          }`}
        >
          <span className="inline-flex items-center justify-center gap-2">
            <Check className="w-4 h-4" />
            Aceptados ({acceptedRequests.length})
          </span>
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
          <div className="grid grid-cols-3 gap-2 mb-4">
            <button
              onClick={() => setDateFilter('today')}
              className={`py-2 px-2 rounded-xl font-semibold text-xs transition-all ${
                dateFilter === 'today'
                  ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-md'
                  : 'bg-white/60 text-gray-600 hover:bg-white/80'
              }`}
            >
              Hoy ({todayCount})
            </button>
            <button
              onClick={() => setDateFilter('tomorrow')}
              className={`py-2 px-2 rounded-xl font-semibold text-xs transition-all ${
                dateFilter === 'tomorrow'
                  ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-md'
                  : 'bg-white/60 text-gray-600 hover:bg-white/80'
              }`}
            >
              Manana ({tomorrowCount})
            </button>
            <button
              onClick={() => setDateFilter('upcoming')}
              className={`py-2 px-2 rounded-xl font-semibold text-xs transition-all ${
                dateFilter === 'upcoming'
                  ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-md'
                  : 'bg-white/60 text-gray-600 hover:bg-white/80'
              }`}
            >
              Proximos ({upcomingCount})
            </button>
          </div>

          {filteredAccepted.length > 0 ? (
            <div>
              <h3 className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-3 px-1">
                <CalendarDays className="w-4 h-4 text-teal-500" />
                {acceptedSectionTitle}
              </h3>
              <div className="space-y-3">
                {filteredAccepted.map((request) => (
                  <BusinessOrderCard key={request.id} request={request} />
                ))}
              </div>
            </div>
          ) : (
            <EmptyRequestsState
              icon={Check}
              title="No hay solicitudes aceptadas"
              description="Las solicitudes aceptadas apareceran aqui"
              colorClass="text-green-600"
              bgClass="bg-green-100"
            />
          )}
        </>
      )}
    </>
  );
}
