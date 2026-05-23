import type { BusinessRequest, MyOrder } from './types';

export const initialRequests: BusinessRequest[] = [
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
    products: [{ name: 'Torta personalizada', quantity: 1, price: 25000 }],
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
    products: [{ name: 'Queque navideño', quantity: 2, price: 8000 }],
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
    products: [{ name: 'Cupcakes decorados', quantity: 12, price: 18000 }],
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
    products: [{ name: 'Torta tres leches', quantity: 1, price: 22000 }],
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
    products: [{ name: 'Galletas de chocolate', quantity: 2, price: 5000 }],
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
    products: [{ name: 'Pan de Pascua con nueces', quantity: 1, price: 13000 }],
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
    products: [{ name: 'Empanadas de pino', quantity: 10, price: 15000 }],
    note: 'Para almuerzo familiar',
    distance: '0.6 km',
    deliveryDate: '2026-04-26',
    deliveryTime: '13:00',
    needNow: false
  }
];

export const initialMyOrders: MyOrder[] = [
  {
    id: 1,
    businessName: 'Pastelería Delicias Tere',
    businessImage: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&q=80',
    date: '26 Abr, 11:00',
    status: 'pending',
    products: [{ name: 'Pan de Pascua clásico', quantity: 2, price: 12000 }],
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
    products: [{ name: 'Torta de chocolate', quantity: 1, price: 18000 }],
    note: '',
    total: 18000
  },
  {
    id: 3,
    businessName: 'Dulce Tentación',
    businessImage: 'https://images.unsplash.com/photo-1562059390-a761a084768e?w=400&q=80',
    date: '24 Abr, 09:20',
    status: 'rejected',
    products: [{ name: 'Cupcakes', quantity: 6, price: 3000 }],
    note: '',
    total: 18000
  }
];
