import { useState } from 'react';
import { ArrowLeft, Check, FileText, Package, X } from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

export default function RequestsScreen({ activeTab, setActiveTab, onBack }: { activeTab: string; setActiveTab: (tab: string) => void; onBack: () => void }) {
  const [subTab, setSubTab] = useState<'my-orders' | 'my-business'>('my-orders');
  const [businessSubTab, setBusinessSubTab] = useState<'pending' | 'accepted'>('pending');
  const [requests, setRequests] = useState([
    {
      id: 1,
      customerName: 'María José González',
      customerImage: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&q=80',
      date: '26 Abr, 10:30',
      status: 'pending',
      products: [
        { name: 'Pan de Pascua clásico', quantity: 2, price: 12000 },
        { name: 'Galletas artesanales', quantity: 1, price: 6000 }
      ],
      note: 'Sin azúcar por favor, es para diabético',
      distance: '0.7 km',
      deliveryDate: '2026-04-27',
      deliveryTime: '14:00',
      needNow: false
    },
    {
      id: 2,
      customerName: 'Carlos Muñoz',
      customerImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80',
      date: '26 Abr, 9:15',
      status: 'pending',
      products: [
        { name: 'Torta personalizada', quantity: 1, price: 25000 }
      ],
      note: 'Decoración de cumpleaños para niño de 5 años, tema dinosaurios',
      distance: '0.9 km',
      deliveryDate: '2026-04-28',
      deliveryTime: '16:30',
      needNow: false
    },
    {
      id: 3,
      customerName: 'Andrea Pasteles',
      customerImage: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80',
      date: '26 Abr, 8:45',
      status: 'pending',
      products: [
        { name: 'Pan de Pascua frutos secos', quantity: 3, price: 14000 },
        { name: 'Rollitos de canela', quantity: 2, price: 3500 }
      ],
      note: '',
      distance: '1.8 km',
      deliveryDate: '',
      deliveryTime: '',
      needNow: true
    },
    {
      id: 4,
      customerName: 'Roberto Silva',
      customerImage: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&q=80',
      date: '25 Abr, 16:20',
      status: 'accepted',
      products: [
        { name: 'Queque navideño', quantity: 2, price: 8000 }
      ],
      note: 'Excelente servicio, gracias!',
      distance: '1.2 km',
      deliveryDate: '2026-04-26',
      deliveryTime: '10:00',
      needNow: false
    },
    {
      id: 5,
      customerName: 'Patricia Flores',
      customerImage: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&q=80',
      date: '25 Abr, 14:10',
      status: 'accepted',
      products: [
        { name: 'Pan de Pascua clásico', quantity: 1, price: 12000 },
        { name: 'Galletas artesanales', quantity: 2, price: 6000 }
      ],
      note: '',
      distance: '0.5 km',
      deliveryDate: '2026-04-27',
      deliveryTime: '18:00',
      needNow: false
    },
    {
      id: 6,
      customerName: 'Javiera López',
      customerImage: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=80',
      date: '26 Abr, 11:30',
      status: 'pending',
      products: [
        { name: 'Cupcakes decorados', quantity: 12, price: 18000 }
      ],
      note: 'Necesito para una reunión urgente',
      distance: '0.4 km',
      deliveryDate: '',
      deliveryTime: '',
      needNow: true
    },
    {
      id: 7,
      customerName: 'Felipe Rojas',
      customerImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
      date: '26 Abr, 7:20',
      status: 'pending',
      products: [
        { name: 'Torta tres leches', quantity: 1, price: 22000 }
      ],
      note: '',
      distance: '1.1 km',
      deliveryDate: '2026-04-29',
      deliveryTime: '10:00',
      needNow: false
    },
    {
      id: 8,
      customerName: 'Daniela Castro',
      customerImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80',
      date: '26 Abr, 12:00',
      status: 'accepted',
      products: [
        { name: 'Galletas de chocolate', quantity: 2, price: 5000 }
      ],
      note: '',
      distance: '0.8 km',
      deliveryDate: '',
      deliveryTime: '',
      needNow: true
    },
    {
      id: 9,
      customerName: 'Gonzalo Vega',
      customerImage: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&q=80',
      date: '26 Abr, 6:50',
      status: 'accepted',
      products: [
        { name: 'Pan de Pascua con nueces', quantity: 1, price: 13000 }
      ],
      note: 'Excelente atención',
      distance: '1.5 km',
      deliveryDate: '2026-04-27',
      deliveryTime: '11:00',
      needNow: false
    },
    {
      id: 10,
      customerName: 'Lorena Méndez',
      customerImage: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=80',
      date: '26 Abr, 13:15',
      status: 'pending',
      products: [
        { name: 'Empanadas de pino', quantity: 10, price: 15000 }
      ],
      note: 'Para almuerzo familiar',
      distance: '0.6 km',
      deliveryDate: '2026-04-26',
      deliveryTime: '13:00',
      needNow: false
    }
  ]);

  const [myOrders, setMyOrders] = useState([
    {
      id: 1,
      businessName: 'Pastelería Delicias Tere',
      businessImage: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&q=80',
      date: '26 Abr, 11:00',
      status: 'pending',
      products: [
        { name: 'Pan de Pascua clásico', quantity: 2, price: 12000 },
      ],
      note: 'Sin azúcar por favor',
      total: 24000,
      deliveryDate: '27 Abr',
      deliveryTime: '15:00'
    },
    {
      id: 2,
      businessName: 'Confitería San Martín',
      businessImage: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80',
      date: '25 Abr, 15:30',
      status: 'accepted',
      products: [
        { name: 'Torta de chocolate', quantity: 1, price: 18000 },
      ],
      note: '',
      total: 18000
    },
    {
      id: 3,
      businessName: 'Dulce Tentación',
      businessImage: 'https://images.unsplash.com/photo-1562059390-a761a084768e?w=400&q=80',
      date: '24 Abr, 09:20',
      status: 'rejected',
      products: [
        { name: 'Cupcakes', quantity: 6, price: 3000 },
      ],
      note: '',
      total: 18000
    }
  ]);

  const handleAccept = (requestId: number) => {
    setRequests(requests.map(req =>
      req.id === requestId ? { ...req, status: 'accepted' } : req
    ));
  };

  const handleReject = (requestId: number) => {
    setRequests(requests.map(req =>
      req.id === requestId ? { ...req, status: 'rejected' } : req
    ));
  };

  const calculateTotal = (products: any[]) => {
    return products.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const sortByUrgency = (a: any, b: any) => {
    // Primero: "Lo necesito ahora"
    if (a.needNow && !b.needNow) return -1;
    if (!a.needNow && b.needNow) return 1;

    // Después: ordenar por fecha y hora
    if (!a.needNow && !b.needNow) {
      const dateA = new Date(`${a.deliveryDate} ${a.deliveryTime}`);
      const dateB = new Date(`${b.deliveryDate} ${b.deliveryTime}`);
      return dateA.getTime() - dateB.getTime();
    }

    return 0;
  };

  const isToday = (dateString: string) => {
    if (!dateString) return false;
    // Usamos la fecha de hoy (26 Abr 2026)
    const today = new Date('2026-04-26');
    const checkDate = new Date(dateString);
    return today.toDateString() === checkDate.toDateString();
  };

  const formatDate = (dateString: string) => {
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const date = new Date(dateString);
    return `${date.getDate()} ${months[date.getMonth()]}`;
  };

  const groupByDate = (requests: any[]) => {
    const today: any[] = [];
    const upcoming: any[] = [];

    requests.forEach(req => {
      if (req.needNow || isToday(req.deliveryDate)) {
        today.push(req);
      } else {
        upcoming.push(req);
      }
    });

    return { today, upcoming };
  };

  const pendingRequests = requests.filter(req => req.status === 'pending').sort(sortByUrgency);
  const acceptedRequests = requests.filter(req => req.status === 'accepted').sort(sortByUrgency);
  const rejectedRequests = requests.filter(req => req.status === 'rejected');

  const groupedPending = groupByDate(pendingRequests);
  const groupedAccepted = groupByDate(acceptedRequests);

  return (
    <div className="size-full bg-gradient-to-b from-white via-blue-50/30 to-blue-100/40 flex flex-col">
      {/* Header */}
      <div className="px-4 pt-6 pb-4 border-b border-white/50">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={onBack} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900">Solicitudes</h2>
          </div>
        </div>

        {/* Sub Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setSubTab('my-orders')}
            className={`flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition-all ${
              subTab === 'my-orders'
                ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-lg'
                : 'bg-white/60 text-gray-600 hover:bg-white/80'
            }`}
          >
            🛒 Mis Pedidos
          </button>
          <button
            onClick={() => setSubTab('my-business')}
            className={`flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition-all ${
              subTab === 'my-business'
                ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-lg'
                : 'bg-white/60 text-gray-600 hover:bg-white/80'
            }`}
          >
            🏪 Mi Negocio
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-4 pt-4 pb-24">

        {/* MY ORDERS TAB */}
        {subTab === 'my-orders' && (
          <>
            <p className="text-sm text-gray-600 mb-4">
              {myOrders.filter(o => o.status === 'pending').length} {myOrders.filter(o => o.status === 'pending').length === 1 ? 'pedido pendiente' : 'pedidos pendientes'}
            </p>

            {/* Pending Orders */}
            {myOrders.filter(o => o.status === 'pending').length > 0 && (
              <div className="mb-6">
                <h3 className="text-base font-bold text-gray-900 mb-3">Pendientes</h3>
                <div className="space-y-3">
                  {myOrders.filter(o => o.status === 'pending').map((order) => (
                    <div
                      key={order.id}
                      className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border-2 border-amber-200 shadow-md"
                    >
                      <div className="flex items-center gap-3 mb-3 pb-3 border-b border-gray-100">
                        <ImageWithFallback
                          src={order.businessImage}
                          alt={order.businessName}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 text-sm">{order.businessName}</h4>
                          <p className="text-xs text-gray-500">{order.date}</p>
                        </div>
                        <div className="px-2 py-1 bg-amber-100 rounded-full">
                          <span className="text-xs font-semibold text-amber-700">En espera</span>
                        </div>
                      </div>

                      <div className="mb-3">
                        <div className="space-y-1">
                          {order.products.map((product, idx) => (
                            <div key={idx} className="flex justify-between items-center text-sm">
                              <span className="text-gray-700">
                                {product.quantity}x {product.name}
                              </span>
                              <span className="font-semibold text-gray-900">
                                ${(product.price * product.quantity).toLocaleString('es-CL')}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {order.note && (
                        <div className="mb-3 p-3 bg-blue-50 rounded-xl">
                          <p className="text-xs text-gray-600 italic">"{order.note}"</p>
                        </div>
                      )}

                      <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                        <span className="font-bold text-gray-900">Total</span>
                        <span className="text-lg font-bold text-teal-600">
                          ${order.total.toLocaleString('es-CL')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Processed Orders */}
            {myOrders.filter(o => o.status !== 'pending').length > 0 && (
              <div className="mb-6">
                <h3 className="text-base font-bold text-gray-900 mb-3">Historial</h3>
                <div className="space-y-3">
                  {myOrders.filter(o => o.status !== 'pending').map((order) => (
                    <div
                      key={order.id}
                      className={`bg-white/60 backdrop-blur-sm rounded-2xl p-4 border ${
                        order.status === 'accepted' ? 'border-green-200' : 'border-red-200'
                      } shadow-sm`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <ImageWithFallback
                          src={order.businessImage}
                          alt={order.businessName}
                          className="w-10 h-10 rounded-full object-cover opacity-70"
                        />
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-700 text-sm">{order.businessName}</h4>
                          <p className="text-xs text-gray-500">{order.date}</p>
                        </div>
                        <div className={`px-2 py-1 rounded-full ${
                          order.status === 'accepted' ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          <span className={`text-xs font-semibold ${
                            order.status === 'accepted' ? 'text-green-700' : 'text-red-700'
                          }`}>
                            {order.status === 'accepted' ? 'Aceptado' : 'Rechazado'}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">
                        {order.products.length} {order.products.length === 1 ? 'producto' : 'productos'} •
                        <span className="font-semibold text-gray-900 ml-1">
                          ${order.total.toLocaleString('es-CL')}
                        </span>
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {myOrders.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Package className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">No tienes pedidos</h3>
                <p className="text-sm text-gray-600 text-center">
                  Tus pedidos aparecerán aquí
                </p>
              </div>
            )}
          </>
        )}

        {/* MY BUSINESS TAB */}
        {subTab === 'my-business' && (
          <>
            {/* Business Sub Tabs */}
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

            {/* PENDING SUB-TAB */}
            {businessSubTab === 'pending' && (
              <>
                {pendingRequests.length > 0 ? (
                  <div className="space-y-4">
                    {/* Solicitudes Hoy */}
                    {groupedPending.today.length > 0 && (
                      <div>
                        <h3 className="text-sm font-bold text-gray-700 mb-2 px-1">📍 Solicitudes Hoy</h3>
                        <div className="space-y-2">
                          {groupedPending.today.map((request) => (
                            <div
                              key={request.id}
                              className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border-2 border-amber-200 shadow-sm"
                            >
                              {/* Header compacto */}
                              <div className="flex items-center gap-2 mb-2">
                                <ImageWithFallback
                                  src={request.customerImage}
                                  alt={request.customerName}
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-bold text-gray-900 text-xs truncate">{request.customerName}</h4>
                                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                    <span className="text-xs">{request.distance}</span>
                                    {request.needNow && (
                                      <>
                                        <span>•</span>
                                        <span className="text-orange-600 font-bold">🚀 URGENTE</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                                <div className="px-2 py-0.5 bg-amber-100 rounded-full">
                                  <span className="text-xs font-semibold text-amber-700">Pendiente</span>
                                </div>
                              </div>

                              {/* Productos compactos */}
                              <div className="mb-2 bg-gray-50 rounded-lg p-2">
                                {request.products.map((product: any, idx: number) => (
                                  <div key={idx} className="flex justify-between items-center text-xs">
                                    <span className="text-gray-700">{product.quantity}x {product.name}</span>
                                    <span className="font-semibold text-gray-900">${(product.price * product.quantity).toLocaleString('es-CL')}</span>
                                  </div>
                                ))}
                              </div>

                              {/* Info entrega */}
                              <div className="mb-2 p-2 bg-purple-50 border border-purple-200 rounded-lg">
                                <p className="text-xs text-purple-900">
                                  {request.needNow ? (
                                    <span className="font-bold">⚡ Lo necesita AHORA</span>
                                  ) : (
                                    <span>📅 {formatDate(request.deliveryDate)} • {request.deliveryTime}</span>
                                  )}
                                </p>
                              </div>

                              {/* Nota si existe */}
                              {request.note && (
                                <div className="mb-2 p-2 bg-blue-50 rounded-lg">
                                  <p className="text-xs text-gray-600 italic line-clamp-2">"{request.note}"</p>
                                </div>
                              )}

                              {/* Total y botones */}
                              <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100">
                                <span className="text-sm font-bold text-teal-600">${calculateTotal(request.products).toLocaleString('es-CL')}</span>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleReject(request.id)}
                                    className="flex items-center gap-1 py-1.5 px-3 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-semibold transition-all"
                                  >
                                    <X className="w-3 h-3" />
                                    Rechazar
                                  </button>
                                  <button
                                    onClick={() => handleAccept(request.id)}
                                    className="flex items-center gap-1 py-1.5 px-3 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-lg text-xs font-semibold transition-all"
                                  >
                                    <Check className="w-3 h-3" />
                                    Aceptar
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Solicitudes Próximas */}
                    {groupedPending.upcoming.length > 0 && (
                      <div>
                        <h3 className="text-sm font-bold text-gray-700 mb-2 px-1">📅 Próximas Solicitudes</h3>
                        <div className="space-y-2">
                          {groupedPending.upcoming.map((request) => (
                            <div
                              key={request.id}
                              className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-gray-200 shadow-sm"
                            >
                              {/* Header compacto */}
                              <div className="flex items-center gap-2 mb-2">
                                <ImageWithFallback
                                  src={request.customerImage}
                                  alt={request.customerName}
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-bold text-gray-900 text-xs truncate">{request.customerName}</h4>
                                  <p className="text-xs text-gray-500">{request.distance}</p>
                                </div>
                                <div className="px-2 py-0.5 bg-gray-100 rounded-full">
                                  <span className="text-xs font-semibold text-gray-700">Pendiente</span>
                                </div>
                              </div>

                              {/* Productos compactos */}
                              <div className="mb-2 bg-gray-50 rounded-lg p-2">
                                {request.products.map((product: any, idx: number) => (
                                  <div key={idx} className="flex justify-between items-center text-xs">
                                    <span className="text-gray-700">{product.quantity}x {product.name}</span>
                                    <span className="font-semibold text-gray-900">${(product.price * product.quantity).toLocaleString('es-CL')}</span>
                                  </div>
                                ))}
                              </div>

                              {/* Info entrega */}
                              <div className="mb-2 p-2 bg-purple-50 border border-purple-200 rounded-lg">
                                <p className="text-xs text-purple-900">📅 {formatDate(request.deliveryDate)} • {request.deliveryTime}</p>
                              </div>

                              {/* Nota si existe */}
                              {request.note && (
                                <div className="mb-2 p-2 bg-blue-50 rounded-lg">
                                  <p className="text-xs text-gray-600 italic line-clamp-2">"{request.note}"</p>
                                </div>
                              )}

                              {/* Total y botones */}
                              <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100">
                                <span className="text-sm font-bold text-teal-600">${calculateTotal(request.products).toLocaleString('es-CL')}</span>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleReject(request.id)}
                                    className="flex items-center gap-1 py-1.5 px-3 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-semibold transition-all"
                                  >
                                    <X className="w-3 h-3" />
                                    Rechazar
                                  </button>
                                  <button
                                    onClick={() => handleAccept(request.id)}
                                    className="flex items-center gap-1 py-1.5 px-3 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-lg text-xs font-semibold transition-all"
                                  >
                                    <Check className="w-3 h-3" />
                                    Aceptar
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16">
                    <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                      <FileText className="w-10 h-10 text-amber-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">No hay solicitudes pendientes</h3>
                    <p className="text-sm text-gray-600 text-center">
                      Las nuevas solicitudes aparecerán aquí
                    </p>
                  </div>
                )}
              </>
            )}

            {/* ACCEPTED SUB-TAB */}
            {businessSubTab === 'accepted' && (
              <>
                {acceptedRequests.length > 0 ? (
                  <div className="space-y-4">
                    {/* Aceptadas Hoy */}
                    {groupedAccepted.today.length > 0 && (
                      <div>
                        <h3 className="text-sm font-bold text-gray-700 mb-2 px-1">📍 Para Hoy</h3>
                        <div className="space-y-2">
                          {groupedAccepted.today.map((request) => (
                            <div
                              key={request.id}
                              className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border-2 border-green-200 shadow-sm"
                            >
                              {/* Header compacto */}
                              <div className="flex items-center gap-2 mb-2">
                                <ImageWithFallback
                                  src={request.customerImage}
                                  alt={request.customerName}
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-bold text-gray-900 text-xs truncate">{request.customerName}</h4>
                                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                    <span className="text-xs">{request.distance}</span>
                                    {request.needNow && (
                                      <>
                                        <span>•</span>
                                        <span className="text-orange-600 font-bold">🚀 URGENTE</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                                <div className="px-2 py-0.5 bg-green-100 rounded-full">
                                  <span className="text-xs font-semibold text-green-700">Aceptada</span>
                                </div>
                              </div>

                              {/* Productos compactos */}
                              <div className="mb-2 bg-gray-50 rounded-lg p-2">
                                {request.products.map((product: any, idx: number) => (
                                  <div key={idx} className="flex justify-between items-center text-xs">
                                    <span className="text-gray-700">{product.quantity}x {product.name}</span>
                                    <span className="font-semibold text-gray-900">${(product.price * product.quantity).toLocaleString('es-CL')}</span>
                                  </div>
                                ))}
                              </div>

                              {/* Info entrega */}
                              <div className="mb-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                                <p className="text-xs text-green-900">
                                  {request.needNow ? (
                                    <span className="font-bold">⚡ Urgente - Lo necesita AHORA</span>
                                  ) : (
                                    <span>📅 {formatDate(request.deliveryDate)} • {request.deliveryTime}</span>
                                  )}
                                </p>
                              </div>

                              {/* Total */}
                              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                                <span className="text-xs text-gray-600">Total</span>
                                <span className="text-sm font-bold text-green-600">${calculateTotal(request.products).toLocaleString('es-CL')}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Aceptadas Próximas */}
                    {groupedAccepted.upcoming.length > 0 && (
                      <div>
                        <h3 className="text-sm font-bold text-gray-700 mb-2 px-1">📅 Próximas Entregas</h3>
                        <div className="space-y-2">
                          {groupedAccepted.upcoming.map((request) => (
                            <div
                              key={request.id}
                              className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-green-200 shadow-sm"
                            >
                              {/* Header compacto */}
                              <div className="flex items-center gap-2 mb-2">
                                <ImageWithFallback
                                  src={request.customerImage}
                                  alt={request.customerName}
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-bold text-gray-900 text-xs truncate">{request.customerName}</h4>
                                  <p className="text-xs text-gray-500">{request.distance}</p>
                                </div>
                                <div className="px-2 py-0.5 bg-green-100 rounded-full">
                                  <span className="text-xs font-semibold text-green-700">Aceptada</span>
                                </div>
                              </div>

                              {/* Productos compactos */}
                              <div className="mb-2 bg-gray-50 rounded-lg p-2">
                                {request.products.map((product: any, idx: number) => (
                                  <div key={idx} className="flex justify-between items-center text-xs">
                                    <span className="text-gray-700">{product.quantity}x {product.name}</span>
                                    <span className="font-semibold text-gray-900">${(product.price * product.quantity).toLocaleString('es-CL')}</span>
                                  </div>
                                ))}
                              </div>

                              {/* Info entrega */}
                              <div className="mb-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                                <p className="text-xs text-green-900">📅 {formatDate(request.deliveryDate)} • {request.deliveryTime}</p>
                              </div>

                              {/* Total */}
                              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                                <span className="text-xs text-gray-600">Total</span>
                                <span className="text-sm font-bold text-green-600">${calculateTotal(request.products).toLocaleString('es-CL')}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
                      <Check className="w-10 h-10 text-green-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">No hay solicitudes aceptadas</h3>
                    <p className="text-sm text-gray-600 text-center">
                      Las solicitudes que aceptes aparecerán aquí
                    </p>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

