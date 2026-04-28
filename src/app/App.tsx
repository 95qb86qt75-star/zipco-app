import { useState, useEffect, useRef } from 'react';
import { MapPin, Search, Mic, MapPinned, User, Heart, FileText, Home, Store, Wrench, Calendar, ArrowLeft, Clock, Star, Instagram, Facebook, Plus, Minus, Send, Check, X, Package, Phone, Mail, MapPinIcon, CreditCard, Settings, LogOut, ChevronRight, Camera, Building2, TrendingUp, Tag, Edit2, Eye, EyeOff, Moon, Sun } from 'lucide-react';
import { ImageWithFallback } from './components/figma/ImageWithFallback';
import { motion } from 'motion/react';

function BusinessConfigScreen({ onBack, onSave }: { onBack: () => void; onSave: (config: any) => void }) {
  const [category, setCategory] = useState('reposteria');
  const [hashtags, setHashtags] = useState('Tortas de cumpleaños personalizadas, Galletas de Navidad artesanales, Pasteles para bodas y eventos, Cupcakes decorados');
  const [showFullAddress, setShowFullAddress] = useState(false);
  const [fullAddress, setFullAddress] = useState('Av. Principal 123, San Bernardo');
  const [schedule, setSchedule] = useState({
    monday: { enabled: true, open: '09:00', close: '18:00' },
    tuesday: { enabled: true, open: '09:00', close: '18:00' },
    wednesday: { enabled: true, open: '09:00', close: '18:00' },
    thursday: { enabled: true, open: '09:00', close: '18:00' },
    friday: { enabled: true, open: '09:00', close: '18:00' },
    saturday: { enabled: true, open: '10:00', close: '14:00' },
    sunday: { enabled: false, open: '00:00', close: '00:00' }
  });

  const categories = [
    { id: 'reposteria', name: 'Repostería y Pastelería', icon: '🎂' },
    { id: 'comida', name: 'Comida y Restaurantes', icon: '🍽️' },
    { id: 'servicios', name: 'Servicios Profesionales', icon: '🔧' },
    { id: 'belleza', name: 'Belleza y Estética', icon: '💅' },
    { id: 'hogar', name: 'Hogar y Construcción', icon: '🏠' },
    { id: 'salud', name: 'Salud y Bienestar', icon: '💊' },
    { id: 'educacion', name: 'Educación', icon: '📚' },
    { id: 'tecnologia', name: 'Tecnología', icon: '💻' },
    { id: 'eventos', name: 'Eventos y Entretenimiento', icon: '🎉' },
    { id: 'otros', name: 'Otros', icon: '📦' }
  ];

  const days = [
    { id: 'monday', name: 'Lunes' },
    { id: 'tuesday', name: 'Martes' },
    { id: 'wednesday', name: 'Miércoles' },
    { id: 'thursday', name: 'Jueves' },
    { id: 'friday', name: 'Viernes' },
    { id: 'saturday', name: 'Sábado' },
    { id: 'sunday', name: 'Domingo' }
  ];

  const handleSave = () => {
    onSave({
      category,
      hashtags: hashtags.split(',').map(tag => tag.trim()),
      showFullAddress,
      fullAddress,
      schedule
    });
    onBack();
  };

  return (
    <div className="size-full bg-gradient-to-b from-white via-blue-50/30 to-blue-100/40 flex flex-col">
      {/* Header */}
      <div className="px-4 pt-6 pb-4 border-b border-white/50">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={onBack} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h2 className="text-xl font-bold text-gray-900">Configuración de Negocio</h2>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-4 pt-4 pb-28">

        {/* Category Selection */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-white/50 shadow-md mb-4">
          <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Store className="w-5 h-5 text-teal-600" />
            Categoría del Negocio
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`p-3 rounded-xl text-left transition-all ${
                  category === cat.id
                    ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-lg'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">{cat.icon}</span>
                  <span className="text-xs font-semibold">{cat.name}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Hashtags */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-white/50 shadow-md mb-4">
          <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
            <Tag className="w-5 h-5 text-teal-600" />
            Palabras clave de búsqueda
          </h4>
          <p className="text-xs text-gray-500 mb-3">
            Describe exactamente lo que vendes. Los clientes encontrarán tu negocio cuando busquen estas palabras. No se muestran públicamente.
          </p>
          <textarea
            value={hashtags}
            onChange={(e) => setHashtags(e.target.value)}
            placeholder="Ej: Tortas de cumpleaños personalizadas, Galletas de Navidad artesanales, Pasteles para bodas y eventos, Cupcakes decorados con fondant"
            className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all resize-none"
            rows={4}
          />
          <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs font-semibold text-blue-900 mb-1">💡 Ejemplos útiles:</p>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Tortas de cumpleaños personalizadas</li>
              <li>• Galletas de Navidad artesanales</li>
              <li>• Reparación de gasfitería 24/7</li>
              <li>• Clases de inglés para niños</li>
            </ul>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Separa cada frase con comas. Sé específico para mejores resultados.
          </p>
        </div>

        {/* Location Privacy */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-white/50 shadow-md mb-4">
          <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <MapPinIcon className="w-5 h-5 text-teal-600" />
            Privacidad de Ubicación
          </h4>

          <div className="mb-4">
            <label className="text-sm text-gray-700 mb-2 block">Dirección completa</label>
            <input
              type="text"
              value={fullAddress}
              onChange={(e) => setFullAddress(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {showFullAddress ? (
                  <Eye className="w-5 h-5 text-blue-600" />
                ) : (
                  <EyeOff className="w-5 h-5 text-gray-600" />
                )}
                <span className="font-semibold text-gray-900 text-sm">
                  {showFullAddress ? 'Mostrar dirección completa' : 'Mostrar solo distancia'}
                </span>
              </div>
              <button
                onClick={() => setShowFullAddress(!showFullAddress)}
                className={`relative w-14 h-8 rounded-full transition-all ${
                  showFullAddress ? 'bg-blue-500' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${
                    showFullAddress ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            <p className="text-xs text-gray-600">
              {showFullAddress
                ? 'Los clientes verán tu dirección exacta'
                : 'Los clientes solo verán la distancia en km'}
            </p>
          </div>
        </div>

        {/* Schedule */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-white/50 shadow-md mb-4">
          <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Clock className="w-5 h-5 text-teal-600" />
            Horarios de Atención
          </h4>
          <div className="space-y-3">
            {days.map((day) => {
              const daySchedule = schedule[day.id as keyof typeof schedule];
              return (
                <div key={day.id} className="flex items-center gap-3">
                  <button
                    onClick={() => setSchedule({
                      ...schedule,
                      [day.id]: { ...daySchedule, enabled: !daySchedule.enabled }
                    })}
                    className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                      daySchedule.enabled
                        ? 'bg-teal-500 border-teal-500'
                        : 'bg-white border-gray-300'
                    }`}
                  >
                    {daySchedule.enabled && <Check className="w-4 h-4 text-white" />}
                  </button>
                  <span className="text-sm font-medium text-gray-700 w-24">{day.name}</span>
                  {daySchedule.enabled ? (
                    <div className="flex-1 flex items-center gap-2">
                      <input
                        type="time"
                        value={daySchedule.open}
                        onChange={(e) => setSchedule({
                          ...schedule,
                          [day.id]: { ...daySchedule, open: e.target.value }
                        })}
                        className="flex-1 bg-white border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                      />
                      <span className="text-gray-400">-</span>
                      <input
                        type="time"
                        value={daySchedule.close}
                        onChange={(e) => setSchedule({
                          ...schedule,
                          [day.id]: { ...daySchedule, close: e.target.value }
                        })}
                        className="flex-1 bg-white border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                      />
                    </div>
                  ) : (
                    <span className="flex-1 text-sm text-gray-400">Cerrado</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Save Button */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white via-white to-transparent">
        <button
          onClick={handleSave}
          className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 text-white py-4 px-6 rounded-full font-semibold shadow-xl shadow-teal-500/30 hover:shadow-2xl hover:shadow-teal-500/40 transition-all active:scale-[0.98]"
        >
          Guardar Configuración
        </button>
      </div>
    </div>
  );
}

function ProfileScreen({ activeTab, setActiveTab, onBack }: { activeTab: string; setActiveTab: (tab: string) => void; onBack: () => void }) {
  const [businessMode, setBusinessMode] = useState(false);
  const [showBusinessConfig, setShowBusinessConfig] = useState(false);
  const [businessConfig, setBusinessConfig] = useState({
    category: 'reposteria',
    hashtags: ['tortas', 'pasteles', 'cumpleaños'],
    showFullAddress: false,
    fullAddress: 'Av. Principal 123, San Bernardo',
    schedule: {}
  });
  const [userInfo] = useState({
    name: 'María González',
    email: 'maria.gonzalez@email.com',
    phone: '+56 9 1234 5678',
    address: 'San Bernardo, Región Metropolitana',
    profileImage: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&q=80'
  });

  const [businessInfo] = useState({
    name: 'Pastelería Delicias Tere',
    description: 'Repostería artesanal y tortas personalizadas',
    address: 'Av. Principal 123, San Bernardo',
    phone: '+56 9 8765 4321',
    image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&q=80'
  });

  if (showBusinessConfig) {
    return (
      <BusinessConfigScreen
        onBack={() => setShowBusinessConfig(false)}
        onSave={(config) => setBusinessConfig(config)}
      />
    );
  }

  return (
    <div className="size-full bg-gradient-to-b from-white via-blue-50/30 to-blue-100/40 flex flex-col">
      {/* Header */}
      <div className="px-4 pt-6 pb-4 border-b border-white/50">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={onBack} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900">Mi Perfil</h2>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-4 pt-4 pb-24">

        {/* Profile Header */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-lg mb-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="relative">
              <ImageWithFallback
                src={userInfo.profileImage}
                alt={userInfo.name}
                className="w-20 h-20 rounded-full object-cover border-4 border-teal-500"
              />
              <button className="absolute bottom-0 right-0 w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center shadow-lg hover:bg-teal-600 transition-colors">
                <Camera className="w-4 h-4 text-white" />
              </button>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900">{userInfo.name}</h3>
              <p className="text-sm text-gray-600">{userInfo.email}</p>
            </div>
          </div>
        </div>

        {/* Business Mode Toggle */}
        <div className="bg-gradient-to-r from-teal-50 to-emerald-50 border-2 border-teal-200 rounded-2xl p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-teal-500 rounded-full flex items-center justify-center">
                <Store className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900">Modo Negocio</h4>
                <p className="text-xs text-gray-600">Vender productos y servicios</p>
              </div>
            </div>
            <button
              onClick={() => setBusinessMode(!businessMode)}
              className={`relative w-14 h-8 rounded-full transition-all ${
                businessMode ? 'bg-teal-500' : 'bg-gray-300'
              }`}
            >
              <div
                className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${
                  businessMode ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Business Info (visible when business mode is ON) */}
        {businessMode && (
          <>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-white/50 shadow-md mb-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold text-gray-900">🏪 Datos del Negocio</h4>
                <button className="text-teal-600 text-sm font-semibold hover:text-teal-700">
                  Editar
                </button>
              </div>
              <div className="flex items-center gap-3 mb-3">
                <ImageWithFallback
                  src={businessInfo.image}
                  alt={businessInfo.name}
                  className="w-16 h-16 rounded-xl object-cover"
                />
                <div className="flex-1">
                  <h5 className="font-semibold text-gray-900">{businessInfo.name}</h5>
                  <p className="text-xs text-gray-600">{businessInfo.description}</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <MapPinIcon className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700">{businessInfo.address}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700">{businessInfo.phone}</span>
                </div>
              </div>
            </div>

            {/* Business Configuration Button */}
            <button
              onClick={() => setShowBusinessConfig(true)}
              className="w-full bg-gradient-to-r from-teal-50 to-emerald-50 border-2 border-teal-200 rounded-2xl p-4 mb-4 hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-teal-500 rounded-full flex items-center justify-center">
                    <Settings className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <h4 className="font-bold text-gray-900">Configurar Negocio</h4>
                    <p className="text-xs text-gray-600">Categoría, hashtags, horarios</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </button>
          </>
        )}

        {/* Personal Information */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-white/50 shadow-md mb-4">
          <h4 className="font-bold text-gray-900 mb-4">📱 Información Personal</h4>
          <div className="space-y-3">
            <button className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors">
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-gray-400" />
                <div className="text-left">
                  <p className="text-xs text-gray-500">Teléfono</p>
                  <p className="text-sm font-semibold text-gray-900">{userInfo.phone}</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
            <button className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <div className="text-left">
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-sm font-semibold text-gray-900">{userInfo.email}</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
            <button className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors">
              <div className="flex items-center gap-3">
                <MapPinIcon className="w-5 h-5 text-gray-400" />
                <div className="text-left">
                  <p className="text-xs text-gray-500">Ubicación</p>
                  <p className="text-sm font-semibold text-gray-900">{userInfo.address}</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-white/50 shadow-md mb-4">
          <h4 className="font-bold text-gray-900 mb-4">⚡ Acciones Rápidas</h4>
          <div className="space-y-2">
            <button className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-teal-600" />
                <span className="text-sm font-semibold text-gray-900">Historial de compras/ventas</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
            <button className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors">
              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-semibold text-gray-900">Métodos de pago</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
            <button className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors">
              <div className="flex items-center gap-3">
                <Settings className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-semibold text-gray-900">Configuración de cuenta</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Logout */}
        <button className="w-full bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center justify-center gap-3 hover:bg-red-100 transition-colors">
          <LogOut className="w-5 h-5 text-red-600" />
          <span className="font-semibold text-red-600">Cerrar sesión</span>
        </button>

      </div>
    </div>
  );
}

function RequestsScreen({ activeTab, setActiveTab, onBack }: { activeTab: string; setActiveTab: (tab: string) => void; onBack: () => void }) {
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

function CheckoutScreen({ business, selectedProducts, products, onBack, onOrderComplete }: { business: any; selectedProducts: number[]; products: any[]; onBack: () => void; onOrderComplete: () => void }) {
  const [quantities, setQuantities] = useState<Record<number, number>>(
    selectedProducts.reduce((acc, id) => ({ ...acc, [id]: 1 }), {})
  );
  const [note, setNote] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [needNow, setNeedNow] = useState(false);

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Seleccionar fecha';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return 'Seleccionar hora';
    return timeString;
  };

  const selectedItems = products.filter((p) => selectedProducts.includes(p.id));

  const updateQuantity = (productId: number, delta: number) => {
    setQuantities((prev) => ({
      ...prev,
      [productId]: Math.max(1, (prev[productId] || 1) + delta)
    }));
  };

  const calculateTotal = () => {
    return selectedItems.reduce((total, item) => {
      return total + item.price * (quantities[item.id] || 1);
    }, 0);
  };

  return (
    <div className="size-full bg-gradient-to-b from-white via-blue-50/30 to-blue-100/40 flex flex-col">
      {/* Header */}
      <div className="px-4 pt-6 pb-4 border-b border-white/50">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={onBack} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h2 className="text-xl font-bold text-gray-900">Resumen del pedido</h2>
        </div>
        <div className="flex items-center gap-2">
          <ImageWithFallback
            src={business.image}
            alt={business.name}
            className="w-10 h-10 rounded-full object-cover border-2 border-teal-500"
          />
          <div>
            <p className="font-semibold text-gray-900 text-sm">{business.name}</p>
            <p className="text-xs text-gray-500">{business.type}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-4 pt-4 pb-36">
        <h3 className="text-base font-bold text-gray-900 mb-3">Productos seleccionados</h3>

        {/* Products List */}
        <div className="space-y-3 mb-6">
          {selectedItems.map((product) => (
            <div
              key={product.id}
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-white/50 shadow-md"
            >
              <div className="flex gap-3 mb-3">
                <ImageWithFallback
                  src={product.image}
                  alt={product.name}
                  className="w-16 h-16 rounded-xl object-cover"
                />
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 text-sm mb-1">{product.name}</h4>
                  <p className="text-xs text-gray-600 mb-2 line-clamp-1">{product.description}</p>
                  <span className="text-base font-bold text-gray-900">${product.price.toLocaleString('es-CL')}</span>
                </div>
              </div>

              {/* Quantity Controls */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Cantidad</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => updateQuantity(product.id, -1)}
                    className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                  >
                    <Minus className="w-4 h-4 text-gray-700" />
                  </button>
                  <span className="text-lg font-bold text-gray-900 w-8 text-center">
                    {quantities[product.id] || 1}
                  </span>
                  <button
                    onClick={() => updateQuantity(product.id, 1)}
                    className="w-8 h-8 rounded-full bg-teal-500 hover:bg-teal-600 flex items-center justify-center transition-colors"
                  >
                    <Plus className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>

              {/* Subtotal */}
              <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center">
                <span className="text-sm text-gray-600">Subtotal</span>
                <span className="text-base font-bold text-teal-600">
                  ${((product.price * (quantities[product.id] || 1)).toLocaleString('es-CL'))}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Delivery Date & Time Selection */}
        <div className="mb-6">
          <label className="block text-base font-bold text-gray-900 mb-3">
            ¿Para cuándo lo necesitas?
          </label>

          {/* Need Now Button */}
          <button
            onClick={() => {
              setNeedNow(!needNow);
              if (!needNow) {
                setSelectedDate('');
                setSelectedTime('');
                setShowDatePicker(false);
                setShowTimePicker(false);
              }
            }}
            className={`w-full py-4 px-6 rounded-2xl font-bold text-base transition-all mb-3 ${
              needNow
                ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-xl shadow-orange-500/30'
                : 'bg-white/80 text-gray-700 border-2 border-gray-200 hover:border-orange-500'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl">🚀</span>
              <span>Lo necesito ahora</span>
            </div>
          </button>

          {/* Date and Time Buttons */}
          <div className={`grid grid-cols-2 gap-3 mb-3 transition-opacity ${needNow ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
            {/* Date Button */}
            <button
              onClick={() => {
                setNeedNow(false);
                setShowDatePicker(!showDatePicker);
                setShowTimePicker(false);
              }}
              disabled={needNow}
              className={`py-4 px-4 rounded-2xl font-semibold text-sm transition-all ${
                selectedDate
                  ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-lg'
                  : 'bg-white/80 text-gray-700 border-2 border-gray-200 hover:border-teal-500'
              }`}
            >
              <div className="flex flex-col items-center gap-1">
                <span className="text-2xl">📅</span>
                <span className="text-xs">{formatDate(selectedDate)}</span>
              </div>
            </button>

            {/* Time Button */}
            <button
              onClick={() => {
                setNeedNow(false);
                setShowTimePicker(!showTimePicker);
                setShowDatePicker(false);
              }}
              disabled={needNow}
              className={`py-4 px-4 rounded-2xl font-semibold text-sm transition-all ${
                selectedTime
                  ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-lg'
                  : 'bg-white/80 text-gray-700 border-2 border-gray-200 hover:border-teal-500'
              }`}
            >
              <div className="flex flex-col items-center gap-1">
                <span className="text-2xl">🕐</span>
                <span className="text-xs">{formatTime(selectedTime)}</span>
              </div>
            </button>
          </div>

          {/* Date Picker */}
          {showDatePicker && (
            <div className="bg-white/80 backdrop-blur-sm border border-teal-200 rounded-2xl p-4 mb-3 animate-in">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Selecciona la fecha:
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setShowDatePicker(false);
                }}
                min={getTodayDate()}
                className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
              />
            </div>
          )}

          {/* Time Picker */}
          {showTimePicker && (
            <div className="bg-white/80 backdrop-blur-sm border border-teal-200 rounded-2xl p-4 mb-3 animate-in">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Selecciona la hora:
              </label>
              <input
                type="time"
                value={selectedTime}
                onChange={(e) => {
                  setSelectedTime(e.target.value);
                  setShowTimePicker(false);
                }}
                className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
              />
            </div>
          )}

          {/* Summary Display */}
          {needNow && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-3">
              <p className="text-sm text-orange-800">
                <strong>🚀 Entrega urgente:</strong> Lo más pronto posible
              </p>
            </div>
          )}

          {!needNow && (selectedDate || selectedTime) && (
            <div className="bg-teal-50 border border-teal-200 rounded-xl p-3">
              <p className="text-sm text-teal-800">
                <strong>📦 Entrega programada:</strong>
                {selectedDate && ` ${formatDate(selectedDate)}`}
                {selectedDate && selectedTime && ' a las'}
                {selectedTime && ` ${selectedTime}`}
                {!selectedDate && !selectedTime && ' No especificada'}
              </p>
            </div>
          )}
        </div>

        {/* Personal Note */}
        <div className="mb-6">
          <label className="block text-base font-bold text-gray-900 mb-3">
            Agregar nota personalizada:
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ej: Sin azúcar, decoración personalizada, hora de entrega..."
            className="w-full bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all resize-none"
            rows={4}
          />
        </div>

        {/* Total Summary */}
        <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-2xl p-5 border-2 border-teal-200">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">Total de productos</span>
            <span className="text-sm font-semibold text-gray-900">
              {selectedItems.reduce((sum, item) => sum + (quantities[item.id] || 1), 0)} unidades
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-lg font-bold text-gray-900">Total a pagar</span>
            <span className="text-2xl font-bold text-teal-600">
              ${calculateTotal().toLocaleString('es-CL')}
            </span>
          </div>
        </div>
      </div>

      {/* Order Button */}
      <div className="absolute bottom-20 left-0 right-0 p-4 bg-gradient-to-t from-white via-white to-transparent">
        <button
          onClick={() => setShowConfirmation(true)}
          className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 text-white py-4 px-6 rounded-full font-semibold shadow-xl shadow-teal-500/30 hover:shadow-2xl hover:shadow-teal-500/40 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
        >
          <Send className="w-5 h-5" />
          <span>Realizar pedido</span>
        </button>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl transform scale-100 animate-in">
            <div className="w-16 h-16 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
              ¡Pedido enviado!
            </h3>

            <p className="text-sm text-gray-600 text-center mb-1">
              Tu solicitud ha sido enviada a:
            </p>
            <p className="text-base font-bold text-teal-600 text-center mb-4">
              {business.name}
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6">
              <p className="text-sm text-blue-800 text-center">
                Revisa tu barra en la opción <strong>Solicitudes</strong> para ver el estado de tu pedido
              </p>
            </div>

            <button
              onClick={() => {
                setShowConfirmation(false);
                onOrderComplete();
              }}
              className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 text-white py-3 px-6 rounded-full font-semibold hover:shadow-lg transition-all"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function BusinessProfileScreen({ business, onBack, onCheckout }: { business: any; onBack: () => void; onCheckout: (selectedProducts: number[], products: any[]) => void }) {
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [lastClickTime, setLastClickTime] = useState<{ [key: number]: number }>({});
  const [isScrolled, setIsScrolled] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (scrollContainerRef.current) {
        setIsScrolled(scrollContainerRef.current.scrollTop > 50);
      }
    };

    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  const products = [
    {
      id: 1,
      name: 'Pan de Pascua clásico',
      description: 'Tradicional pan de Pascua con frutos confitados, nueces y almendras',
      price: 12000,
      image: 'https://images.unsplash.com/photo-1607478900766-efe13248b125?w=400&q=80',
      isAvailable: true
    },
    {
      id: 2,
      name: 'Pan de Pascua frutos secos',
      description: 'Pan de Pascua con almendras, nueces y nueces confitadas',
      price: 14000,
      image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&q=80',
      isAvailable: true
    },
    {
      id: 3,
      name: 'Queque navideño',
      description: 'Pan caletas de manjar con nueces y pasas',
      price: 8000,
      image: 'https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?w=400&q=80',
      isAvailable: false
    },
    {
      id: 4,
      name: 'Galletas artesanales',
      description: 'Ricas galletas de jengibre especiadas y decoradas',
      price: 6000,
      image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&q=80',
      isAvailable: true
    },
    {
      id: 5,
      name: 'Rollitos de canela',
      description: 'Rollitos de canela esponjosos con glaseado',
      price: 3500,
      image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80',
      isAvailable: true
    }
  ];

  const toggleProductSelection = (productId: number) => {
    setSelectedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const handleProductClick = (productId: number) => {
    const now = Date.now();
    const lastClick = lastClickTime[productId] || 0;
    const timeDiff = now - lastClick;

    // Doble clic detectado (menos de 300ms entre clics)
    if (timeDiff < 300 && timeDiff > 0) {
      if (!isSelectionMode) {
        setIsSelectionMode(true);
      }
      toggleProductSelection(productId);
      setLastClickTime({ ...lastClickTime, [productId]: 0 }); // Reset para evitar triple clic
    } else if (isSelectionMode) {
      // Si ya está en modo selección, un clic simple selecciona/deselecciona
      toggleProductSelection(productId);
    } else {
      // Primer clic, guardamos el tiempo
      setLastClickTime({ ...lastClickTime, [productId]: now });
    }
  };

  return (
    <div className="size-full bg-gradient-to-b from-white via-blue-50/30 to-blue-100/40 flex flex-col relative">
      {/* Header fijo */}
      <div className="px-4 pt-6 pb-2 border-b border-white/50 bg-white/80 backdrop-blur-sm">
        <button onClick={onBack} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors mb-2">
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>

        {/* Business Card - Version dinámica */}
        <motion.div
          animate={{
            height: isScrolled ? 70 : 'auto',
            padding: isScrolled ? '8px' : '20px'
          }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 overflow-hidden mb-2"
        >
          <div className="flex gap-3 items-center">
            <motion.div
              animate={{
                width: isScrolled ? 50 : 80,
                height: isScrolled ? 50 : 80
              }}
              transition={{ duration: 0.3 }}
            >
              <ImageWithFallback
                src={business.image}
                alt={business.name}
                className="w-full h-full rounded-full object-cover border-2 border-teal-500"
              />
            </motion.div>

            <div className="flex-1 min-w-0">
              <h2 className={`font-bold text-gray-900 truncate ${isScrolled ? 'text-sm' : 'text-xl mb-1'}`}>
                {business.name}
              </h2>

              {!isScrolled && (
                <motion.div
                  initial={{ opacity: 1 }}
                  animate={{ opacity: isScrolled ? 0 : 1 }}
                  className="flex items-center gap-2 mb-2"
                >
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    business.type === 'Negocio'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {business.type}
                  </span>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span className="text-sm font-semibold text-gray-700">4.8</span>
                    <span className="text-xs text-gray-500">(23 reseñas)</span>
                  </div>
                </motion.div>
              )}

              <div className="flex items-center gap-2">
                <button className={`bg-gradient-to-br from-purple-500 to-pink-500 rounded-full hover:scale-110 transition-all ${isScrolled ? 'p-1.5' : 'p-2'}`}>
                  <Instagram className={`text-white ${isScrolled ? 'w-3 h-3' : 'w-4 h-4'}`} />
                </button>
                <button className={`bg-blue-600 rounded-full hover:scale-110 transition-all ${isScrolled ? 'p-1.5' : 'p-2'}`}>
                  <Facebook className={`text-white ${isScrolled ? 'w-3 h-3' : 'w-4 h-4'}`} />
                </button>
              </div>
            </div>
          </div>

          {!isScrolled && (
            <motion.p
              initial={{ opacity: 1, height: 'auto' }}
              animate={{
                opacity: isScrolled ? 0 : 1,
                height: isScrolled ? 0 : 'auto'
              }}
              transition={{ duration: 0.2 }}
              className="text-sm text-gray-600 leading-relaxed mt-4"
            >
              Especialistas en repostería artesanal. Más de 10 años creando momentos dulces para tu familia. Productos frescos elaborados diariamente con ingredientes de primera calidad.
            </motion.p>
          )}
        </motion.div>
      </div>

      {/* Products Section */}
      <div ref={scrollContainerRef} className="flex-1 overflow-auto px-4 pt-4 pb-28">
        <h3 className="text-lg font-bold text-gray-900 mb-2">Productos disponibles</h3>

        {/* Instruction Message */}
        <div className="bg-teal-50 border border-teal-200 rounded-xl p-3 mb-4 flex items-start gap-2">
          <span className="text-2xl">👆</span>
          <p className="text-xs text-teal-800 leading-relaxed">
            Haz <strong>doble clic</strong> en un producto para activar el modo selección
          </p>
        </div>

        {/* Products List */}
        <div className="space-y-3">
          {products.map((product) => {
            const isSelected = selectedProducts.includes(product.id);
            return (
              <div
                key={product.id}
                onClick={() => handleProductClick(product.id)}
                className={`bg-white/80 backdrop-blur-sm rounded-2xl p-4 border-2 transition-all cursor-pointer ${
                  isSelected
                    ? 'border-teal-500 shadow-lg shadow-teal-500/30'
                    : 'border-white/50 shadow-md hover:shadow-lg'
                }`}
              >
                <div className="flex gap-3">
                  <div className="relative">
                    <ImageWithFallback
                      src={product.image}
                      alt={product.name}
                      className="w-20 h-20 rounded-xl object-cover"
                    />
                    {isSelected && (
                      <div className="absolute inset-0 bg-teal-500/30 rounded-xl flex items-center justify-center">
                        <div className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-lg">✓</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 text-sm mb-1">{product.name}</h4>
                    <p className="text-xs text-gray-600 mb-2 line-clamp-2">{product.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-base font-bold text-gray-900">${product.price.toLocaleString('es-CL')}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Order Button */}
      {selectedProducts.length > 0 && (
        <div className="absolute bottom-20 left-0 right-0 p-4 bg-gradient-to-t from-white via-white to-transparent">
          <button
            onClick={() => onCheckout(selectedProducts, products)}
            className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 text-white py-4 px-6 rounded-full font-semibold shadow-xl shadow-teal-500/30 hover:shadow-2xl hover:shadow-teal-500/40 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <span>Realizar pedido ({selectedProducts.length})</span>
          </button>
        </div>
      )}
    </div>
  );
}

function BottomNav({ activeTab, setActiveTab, onNavigate }: { activeTab: string; setActiveTab: (tab: string) => void; onNavigate?: (tab: string) => void }) {
  return (
    <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-3 shadow-lg">
      <div className="flex items-center justify-around">
        {[
          { id: 'home', icon: Home, label: 'Inicio' },
          { id: 'profile', icon: User, label: 'Perfil' },
          { id: 'favorites', icon: Heart, label: 'Favoritos' },
          { id: 'requests', icon: FileText, label: 'Solicitudes' }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                if (onNavigate) onNavigate(tab.id);
              }}
              className={`flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-all ${
                isActive ? 'text-teal-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ServiceCheckoutScreen({ onBack, service, provider, activeTab, setActiveTab }: { onBack: () => void; service: any; provider: any; activeTab: string; setActiveTab: (tab: string) => void }) {
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
      <div className="px-4 pt-6 pb-4 border-b border-white/50">
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

function ServiceProfileScreen({ service, onBack, onRequestService, activeTab, setActiveTab }: { service: any; onBack: () => void; onRequestService: (selectedService: any) => void; activeTab: string; setActiveTab: (tab: string) => void }) {
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

function ServiciosScreen({ onBack, onSelectService, activeTab, setActiveTab }: { onBack: () => void; onSelectService: (service: any) => void; activeTab: string; setActiveTab: (tab: string) => void }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('todos');
  const [maxDistance, setMaxDistance] = useState(10);
  const [showDistanceModal, setShowDistanceModal] = useState(false);

  const filters = [
    { id: 'todos', label: 'Todos' },
    { id: 'negocios', label: 'Empresas' },
    { id: 'particular', label: 'Independientes' },
    { id: 'distance', label: `${maxDistance} km` }
  ];

  const allResults = [
    // GASFITERÍA
    {
      id: 1,
      name: 'Gasfitería Express 24/7',
      description: 'Reparaciones urgentes de gasfitería',
      distance: 0.6,
      type: 'Particular',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&q=80',
      keywords: 'reparación cañerías, destape wc, fuga de agua, instalación grifería, gasfiter urgente',
      instagram: '@gasfiteria_express',
      facebook: 'GasfiteriaExpress24',
      services: [
        { id: 1, name: 'Cambio de cañería', description: 'Reemplazo de cañerías antiguas o dañadas' },
        { id: 2, name: 'Instalación de calefont', description: 'Instalación y conexión de calefont a gas' },
        { id: 3, name: 'Destape de WC y cañerías', description: 'Destape urgente de baños y desagües' },
        { id: 4, name: 'Reparación de fuga de agua', description: 'Detección y reparación de filtraciones' },
        { id: 5, name: 'Instalación de grifería', description: 'Instalación de llaves y grifos' }
      ]
    },
    {
      id: 2,
      name: 'Juan Pérez Gasfiter',
      description: 'Gasfitería a domicilio, presupuesto sin cargo',
      distance: 1.2,
      type: 'Particular',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80',
      keywords: 'gasfiter barato, reparación baños, instalación lavamanos, cambio llaves'
    },

    // ELECTRICIDAD
    {
      id: 3,
      name: 'Electricidad Profesional',
      description: 'Instalaciones eléctricas certificadas',
      distance: 0.8,
      type: 'Negocio',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1473186578172-c141e6798cf4?w=400&q=80',
      keywords: 'electricista certificado, instalación paneles solares, reparación cortocircuitos, instalación enchufes'
    },
    {
      id: 4,
      name: 'Marcos Electricista',
      description: 'Electricista con 10 años de experiencia',
      distance: 1.5,
      type: 'Particular',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
      keywords: 'electricista económico, reparación tableros, instalación luminarias'
    },

    // BELLEZA Y ESTÉTICA
    {
      id: 5,
      name: 'Salón de Belleza Glamour',
      description: 'Peluquería y tratamientos estéticos',
      distance: 0.9,
      type: 'Negocio',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&q=80',
      keywords: 'corte de pelo mujer, tintura cabello, manicure, pedicure, tratamiento keratina'
    },
    {
      id: 6,
      name: 'Estética Carolina',
      description: 'Manicure, pedicure y depilación',
      distance: 1.1,
      type: 'Particular',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&q=80',
      keywords: 'manicure gel, uñas acrílicas, depilación con cera, diseño de uñas'
    },

    // EDUCACIÓN
    {
      id: 7,
      name: 'Academia de Inglés SmartLearn',
      description: 'Clases de inglés para todas las edades',
      distance: 1.3,
      type: 'Negocio',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&q=80',
      keywords: 'clases de inglés para niños, inglés conversacional, preparación TOEFL, inglés empresarial'
    },
    {
      id: 8,
      name: 'Profesora Matemáticas',
      description: 'Reforzamiento escolar matemáticas',
      distance: 0.7,
      type: 'Particular',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80',
      keywords: 'clases particulares matemáticas, reforzamiento PSU, ayuda tareas, preparación pruebas'
    },

    // TECNOLOGÍA
    {
      id: 9,
      name: 'TechRepair - Reparación Celulares',
      description: 'Reparación de smartphones y tablets',
      distance: 1.0,
      type: 'Negocio',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1556656793-08538906a9f8?w=400&q=80',
      keywords: 'reparación pantalla iphone, cambio batería celular, reparación samsung, desbloqueo celular'
    },
    {
      id: 10,
      name: 'Soporte PC a Domicilio',
      description: 'Reparación de computadores',
      distance: 1.8,
      type: 'Particular',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&q=80',
      keywords: 'formateo computador, instalación windows, reparación notebook, limpieza virus'
    },

    // HOGAR Y CONSTRUCCIÓN
    {
      id: 11,
      name: 'Pinturas y Remodelaciones',
      description: 'Pintores profesionales',
      distance: 2.0,
      type: 'Negocio',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=400&q=80',
      keywords: 'pintor casa, pintura fachadas, remodelación baños, instalación porcelanato'
    },
    {
      id: 12,
      name: 'Carpintería El Maestro',
      description: 'Muebles a medida y reparaciones',
      distance: 1.7,
      type: 'Negocio',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=400&q=80',
      keywords: 'muebles a medida, closet empotrado, reparación muebles, carpintero'
    },

    // SALUD Y BIENESTAR
    {
      id: 13,
      name: 'Centro de Masajes Relax',
      description: 'Masajes terapéuticos y relajantes',
      distance: 1.4,
      type: 'Negocio',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&q=80',
      keywords: 'masajes terapéuticos, masajes relajantes, quiromasaje, reflexología'
    },
    {
      id: 14,
      name: 'Nutricionista María Fernanda',
      description: 'Planes nutricionales personalizados',
      distance: 0.9,
      type: 'Particular',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80',
      keywords: 'nutricionista online, plan de alimentación, dieta personalizada, bajar de peso'
    },

    // EVENTOS
    {
      id: 15,
      name: 'DJ Profesional Eventos',
      description: 'Música para fiestas y eventos',
      distance: 2.5,
      type: 'Particular',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80',
      keywords: 'dj para fiestas, animación eventos, música matrimonios, dj cumpleaños'
    },
    {
      id: 16,
      name: 'Fotografía Profesional',
      description: 'Fotografía de eventos y retratos',
      distance: 1.2,
      type: 'Negocio',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=400&q=80',
      keywords: 'fotógrafo matrimonios, sesión fotos, fotografía eventos, book fotográfico'
    },

    // MASCOTAS
    {
      id: 17,
      name: 'Veterinaria PetCare',
      description: 'Atención veterinaria integral',
      distance: 0.8,
      type: 'Negocio',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=400&q=80',
      keywords: 'veterinario urgencias, vacunas perros, esterilización gatos, consulta veterinaria'
    },
    {
      id: 18,
      name: 'Peluquería Canina',
      description: 'Baño y corte para mascotas',
      distance: 1.5,
      type: 'Negocio',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=400&q=80',
      keywords: 'peluquería perros, baño mascotas, corte pelo perros, grooming'
    },

    // LIMPIEZA
    {
      id: 19,
      name: 'Limpieza Express',
      description: 'Servicio de limpieza profesional',
      distance: 1.1,
      type: 'Negocio',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&q=80',
      keywords: 'limpieza profunda casa, aseo oficinas, limpieza mudanza, servicio doméstico'
    },

    // TRANSPORTE
    {
      id: 20,
      name: 'Fletes y Mudanzas Rápido',
      description: 'Servicio de fletes y mudanzas',
      distance: 2.3,
      type: 'Negocio',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1600880292089-90a7e086ee0c?w=400&q=80',
      keywords: 'fletes económicos, mudanzas completas, retiro muebles, flete pequeño'
    },

    // JARDINERÍA
    {
      id: 21,
      name: 'Jardines y Paisajismo Verde',
      description: 'Diseño y mantención de jardines',
      distance: 1.6,
      type: 'Negocio',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&q=80',
      keywords: 'jardinero, mantención jardines, poda de árboles, paisajismo, diseño jardines'
    },
    {
      id: 22,
      name: 'Jardinero Luis Parra',
      description: 'Servicio de jardinería a domicilio',
      distance: 1.0,
      type: 'Particular',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
      keywords: 'jardinero, corte de pasto, limpieza de jardín, poda, jardinero económico'
    },

    // LAVADO DE AUTOS
    {
      id: 23,
      name: 'AutoSpa Premium',
      description: 'Lavado y detailing automotriz',
      distance: 0.9,
      type: 'Negocio',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1601362840469-51e4d8d58785?w=400&q=80',
      keywords: 'carwash, lavado de auto, limpieza de auto, detailing, pulido auto, encerado',
      instagram: '@autospa_premium',
      facebook: 'AutoSpaPremium',
      services: [
        { id: 1, name: 'Lavado Exterior Completo', description: 'Lavado y secado exterior profesional' },
        { id: 2, name: 'Lavado Interior y Exterior', description: 'Lavado completo interior y exterior' },
        { id: 3, name: 'Detailing Premium', description: 'Pulido, encerado y protección de pintura' },
        { id: 4, name: 'Limpieza de Motor', description: 'Lavado y desengrase de motor' },
        { id: 5, name: 'Tratamiento de Tapicería', description: 'Limpieza profunda de asientos y alfombras' }
      ]
    },
    {
      id: 24,
      name: 'Lavado Express El Brillo',
      description: 'Lavado rápido de vehículos',
      distance: 1.3,
      type: 'Negocio',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=400&q=80',
      keywords: 'carwash, lavado auto express, lavado motor, aspirado, limpieza vehículos'
    },
    {
      id: 25,
      name: 'Lavado a Domicilio Carlos',
      description: 'Lavado de autos en tu casa',
      distance: 0.7,
      type: 'Particular',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80',
      keywords: 'lavado de auto a domicilio, carwash móvil, limpieza auto en casa, lavado ecológico'
    },

    // MECÁNICA Y HOJALATERÍA
    {
      id: 26,
      name: 'Taller Mecánico AutoFix',
      description: 'Mecánica y hojalatería',
      distance: 1.5,
      type: 'Negocio',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400&q=80',
      keywords: 'desabolladura, hojalatería, pintura automotriz, mecánica general, reparación autos'
    },
    {
      id: 27,
      name: 'Hojalatería y Pintura Rodríguez',
      description: 'Desabolladura y pintura de vehículos',
      distance: 2.0,
      type: 'Negocio',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1625047509168-a7026f36de04?w=400&q=80',
      keywords: 'desabolladura, hojalatería, pintura de autos, reparación chapa, enderezado'
    },
    {
      id: 28,
      name: 'Taller Multimarca Speed',
      description: 'Mecánica rápida y confiable',
      distance: 1.8,
      type: 'Negocio',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?w=400&q=80',
      keywords: 'mecánica, cambio aceite, alineación, balanceo, scanner automotriz, desabolladura'
    }
  ];

  // Filtrar resultados
  const filteredResults = allResults.filter((result) => {
    // Filtro por búsqueda
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchesName = result.name.toLowerCase().includes(query);
      const matchesDescription = result.description.toLowerCase().includes(query);
      const matchesKeywords = result.keywords?.toLowerCase().includes(query) || false;

      if (!matchesName && !matchesDescription && !matchesKeywords) {
        return false;
      }
    }

    // Filtro por distancia
    if (result.distance > maxDistance) return false;

    // Filtro por tipo
    if (selectedFilter === 'negocios' && result.type !== 'Negocio') return false;
    if (selectedFilter === 'particular' && result.type !== 'Particular') return false;

    return true;
  });

  const formatDistance = (km: number) => {
    if (km < 1) {
      return `${Math.round(km * 1000)} m`;
    }
    return `${km.toFixed(1)} km`;
  };

  return (
    <div className="size-full bg-gradient-to-b from-white via-blue-50/30 to-blue-100/40 flex flex-col">
      {/* Header */}
      <div className="px-4 pt-6 pb-4 border-b border-white/50">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={onBack} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ej: gasfiter, clases, masajes..."
              className="w-full bg-gray-50 border border-gray-200 rounded-full py-2.5 pl-11 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
            />
            <button className="absolute inset-y-0 right-4 flex items-center">
              <Mic className="w-4 h-4 text-gray-400 hover:text-teal-600 transition-colors" />
            </button>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => {
                if (filter.id === 'distance') {
                  setShowDistanceModal(true);
                } else {
                  setSelectedFilter(filter.id);
                }
              }}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                (selectedFilter === filter.id || filter.id === 'distance')
                  ? filter.id === 'distance'
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'bg-teal-500 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-auto px-4 pt-4">
        <p className="text-sm text-gray-600 mb-4">{filteredResults.length} servicios cerca de ti</p>

        <div className="space-y-3 pb-6">
          {filteredResults.map((result) => (
            <div
              key={result.id}
              onClick={() => onSelectService(result)}
              className="bg-white border border-gray-200 rounded-2xl p-4 hover:shadow-md transition-all flex gap-4 cursor-pointer"
            >
              {/* Image */}
              <div className="flex-shrink-0">
                <ImageWithFallback
                  src={result.image}
                  alt={result.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900 text-sm">{result.name}</h3>
                  <span className="text-xs text-gray-500 whitespace-nowrap">{formatDistance(result.distance)}</span>
                </div>
                <p className="text-xs text-gray-600 mb-2 line-clamp-2">{result.description}</p>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    result.type === 'Negocio'
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {result.type === 'Negocio' ? 'Empresa' : 'Independiente'}
                  </span>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span className={`text-xs ${result.isOpen ? 'text-green-600' : 'text-red-600'}`}>
                      {result.isOpen ? 'Disponible' : 'No disponible'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Distance Modal - Same as Negocios */}
      {showDistanceModal && (
        <div className="absolute inset-0 bg-black/50 flex items-end z-50" onClick={() => setShowDistanceModal(false)}>
          <div className="bg-white rounded-t-3xl p-6 w-full" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-6"></div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Ajustar distancia</h3>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-600">Distancia máxima</span>
                <span className="text-2xl font-bold text-teal-600">{maxDistance} km</span>
              </div>

              <div className="relative py-2">
                <input
                  type="range"
                  min="0.5"
                  max="10"
                  step="0.5"
                  value={maxDistance}
                  onChange={(e) => setMaxDistance(parseFloat(e.target.value))}
                  style={{
                    background: `linear-gradient(to right, #14b8a6 0%, #14b8a6 ${((maxDistance - 0.5) / 9.5) * 100}%, #e5e7eb ${((maxDistance - 0.5) / 9.5) * 100}%, #e5e7eb 100%)`
                  }}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer slider-custom"
                />
              </div>

              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>0.5 km</span>
                <span>10 km</span>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 mb-6">
              {[1, 2, 5, 10].map((km) => (
                <button
                  key={km}
                  onClick={() => setMaxDistance(km)}
                  className={`py-2 rounded-full text-sm font-medium transition-all ${
                    maxDistance === km
                      ? 'bg-teal-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {km} km
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowDistanceModal(false)}
              className="w-full bg-teal-500 text-white py-3 rounded-full font-semibold hover:bg-teal-600 transition-colors"
            >
              Aplicar
            </button>
          </div>
        </div>
      )}

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} onNavigate={(tab) => {}} />
    </div>
  );
}

function NegociosScreen({ onBack, onSelectBusiness, activeTab, setActiveTab }: { onBack: () => void; onSelectBusiness: (business: any) => void; activeTab: string; setActiveTab: (tab: string) => void }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('todos');
  const [maxDistance, setMaxDistance] = useState(10);
  const [showDistanceModal, setShowDistanceModal] = useState(false);

  const filters = [
    { id: 'todos', label: 'Todos' },
    { id: 'negocios', label: 'Negocios' },
    { id: 'particular', label: 'Particular' },
    { id: 'distance', label: `${maxDistance} km` }
  ];

  const allResults = [
    // REPOSTERÍA Y ALIMENTOS
    {
      id: 1,
      name: 'Pastelería Delicias Tere',
      description: 'Repostería artesanal y tortas personalizadas',
      distance: 0.85,
      type: 'Negocio',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&q=80',
      keywords: 'tortas de cumpleaños personalizadas, pasteles para bodas, cupcakes decorados, galletas de navidad, postres artesanales'
    },
    {
      id: 2,
      name: 'Tortas del Barrio',
      description: 'Tortas personalizadas para toda ocasión',
      distance: 0.5,
      type: 'Negocio',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=400&q=80',
      keywords: 'tortas personalizadas, diseños únicos, tortas temáticas'
    },
    {
      id: 3,
      name: 'Pizzería Don Giovanni',
      description: 'Pizzas artesanales a leña',
      distance: 0.4,
      type: 'Negocio',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&q=80',
      keywords: 'pizza artesanal, pizza a domicilio, pizza familiar, comida italiana'
    },
    {
      id: 4,
      name: 'Cocina Casera Doña Rosa',
      description: 'Comida casera y saludable',
      distance: 0.6,
      type: 'Particular',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80',
      keywords: 'almuerzo casero, colaciones saludables, comida delivery, menú del día'
    },

    // ARTESANÍA Y MANUALIDADES
    {
      id: 5,
      name: 'Artesanías María',
      description: 'Productos artesanales hechos a mano',
      distance: 0.9,
      type: 'Particular',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=400&q=80',
      keywords: 'artesanía chilena, tejidos a mano, cerámica artesanal, regalos personalizados'
    },
    {
      id: 6,
      name: 'Taller de Manualidades',
      description: 'Decoraciones y regalos hechos a mano',
      distance: 1.2,
      type: 'Negocio',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=400&q=80',
      keywords: 'manualidades personalizadas, decoración eventos, souvenirs, tarjetas artesanales'
    },
    {
      id: 7,
      name: 'Macramé y Tejidos',
      description: 'Productos de macramé y tejido a crochet',
      distance: 1.5,
      type: 'Particular',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1611327073339-2b2ab3d8c4d4?w=400&q=80',
      keywords: 'macramé decorativo, tejidos a crochet, cortinas macramé, tapices artesanales'
    },

    // JOYERÍA Y ACCESORIOS
    {
      id: 8,
      name: 'Joyería Artesanal Luna',
      description: 'Joyería hecha a mano con diseños únicos',
      distance: 1.1,
      type: 'Negocio',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&q=80',
      keywords: 'joyería artesanal, collares personalizados, anillos plata, aretes hechos a mano'
    },
    {
      id: 9,
      name: 'Accesorios Bella',
      description: 'Accesorios de moda y bisutería',
      distance: 0.8,
      type: 'Particular',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400&q=80',
      keywords: 'bisutería, accesorios para el pelo, carteras artesanales, pulseras de moda'
    },

    // FLORES Y PLANTAS
    {
      id: 10,
      name: 'Florería El Jardín',
      description: 'Arreglos florales para toda ocasión',
      distance: 0.7,
      type: 'Negocio',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=400&q=80',
      keywords: 'ramos de flores, arreglos florales, flores para eventos, coronas fúnebres'
    },
    {
      id: 11,
      name: 'Vivero Las Plantas',
      description: 'Plantas de interior y exterior',
      distance: 1.3,
      type: 'Negocio',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1466781783364-36c955e42a7f?w=400&q=80',
      keywords: 'plantas ornamentales, suculentas, cactus, plantas de interior, maceteros'
    },

    // ROPA Y TEXTILES
    {
      id: 12,
      name: 'Boutique Fashion',
      description: 'Ropa de moda para mujer',
      distance: 1.0,
      type: 'Negocio',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=400&q=80',
      keywords: 'ropa mujer, vestidos elegantes, ropa casual, accesorios moda'
    },
    {
      id: 13,
      name: 'Ropa Deportiva FitStyle',
      description: 'Indumentaria deportiva y fitness',
      distance: 1.8,
      type: 'Negocio',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1556906781-9a412961c28c?w=400&q=80',
      keywords: 'ropa deportiva, zapatillas running, yoga wear, gimnasio'
    },

    // LAVANDERÍA (servicio sobre productos)
    {
      id: 14,
      name: 'Lavandería y Tintorería',
      description: 'Lavado y planchado de ropa',
      distance: 0.7,
      type: 'Negocio',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?w=400&q=80',
      keywords: 'lavandería a domicilio, tintorería, planchado ropa, lavado cortinas'
    },

    // LIBRERÍA Y PAPELERÍA
    {
      id: 15,
      name: 'Librería Santillana',
      description: 'Libros, útiles escolares y papelería',
      distance: 0.9,
      type: 'Negocio',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&q=80',
      keywords: 'útiles escolares, libros, cuadernos, material oficina, papelería'
    },

    // PRODUCTOS PARA MASCOTAS
    {
      id: 16,
      name: 'Pet Shop Mi Mascota',
      description: 'Alimentos y accesorios para mascotas',
      distance: 1.2,
      type: 'Negocio',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400&q=80',
      keywords: 'comida para perros, alimento gatos, juguetes mascotas, collares correas'
    },

    // COSMÉTICOS Y BELLEZA (productos)
    {
      id: 17,
      name: 'Cosmética Natural',
      description: 'Productos de belleza naturales y orgánicos',
      distance: 1.4,
      type: 'Negocio',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=400&q=80',
      keywords: 'cosméticos naturales, cremas faciales, productos orgánicos, maquillaje natural'
    },

    // TECNOLOGÍA (productos)
    {
      id: 18,
      name: 'TechStore',
      description: 'Accesorios y productos tecnológicos',
      distance: 1.6,
      type: 'Negocio',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=400&q=80',
      keywords: 'fundas celular, cargadores, audífonos, mouse teclado, accesorios tech'
    },

    // PANADERÍA
    {
      id: 19,
      name: 'Panadería El Horno de Oro',
      description: 'Pan artesanal recién horneado',
      distance: 0.5,
      type: 'Negocio',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80',
      keywords: 'pan artesanal, pan integral, empanadas, masas caseras, marraquetas'
    },

    // PRODUCTOS ORGÁNICOS
    {
      id: 20,
      name: 'Almacén Orgánico Verde',
      description: 'Productos orgánicos y saludables',
      distance: 1.3,
      type: 'Negocio',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80',
      keywords: 'productos orgánicos, frutas verduras orgánicas, alimentos saludables, sin pesticidas'
    },

    // BEBIDAS Y CAFETERÍA
    {
      id: 21,
      name: 'Café Frappé Express',
      description: 'Bebidas frías y calientes, hielo frappé',
      distance: 0.3,
      type: 'Negocio',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&q=80',
      keywords: 'hielo frappé, café frío, frappuccino, bebidas heladas, café express'
    },

    // COMIDA CHILENA
    {
      id: 22,
      name: 'Cocina Casera Doña Elsa',
      description: 'Comida chilena casera y tradicional',
      distance: 0.8,
      type: 'Particular',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80',
      keywords: 'pastel de choclo, empanadas, cazuela, comida casera chilena, menú del día'
    },

    // CALZADO Y ACCESORIOS DEPORTIVOS
    {
      id: 23,
      name: 'Zapatería Sport Plus',
      description: 'Calzado deportivo y accesorios',
      distance: 1.0,
      type: 'Negocio',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80',
      keywords: 'zapatillas nike, zapatillas adidas, calzado deportivo, cordones de zapatillas, zapatillas running'
    },

    // PAPELERÍA
    {
      id: 24,
      name: 'Librería y Papelería Central',
      description: 'Útiles escolares y material de oficina',
      distance: 0.6,
      type: 'Negocio',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&q=80',
      keywords: 'cartulina, papel lustre, útiles escolares, cuadernos, lápices, papelería'
    },

    // FARMACIA
    {
      id: 25,
      name: 'Farmacia Cruz Verde Plus',
      description: 'Medicamentos y productos de salud',
      distance: 0.4,
      type: 'Negocio',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=400&q=80',
      keywords: 'tapsín caliente, tapsin, medicamentos, remedios, vitaminas, farmacia'
    },

    // MINIMARKET
    {
      id: 26,
      name: 'Minimarket Don Luis',
      description: 'Abarrotes y productos de primera necesidad',
      distance: 0.5,
      type: 'Negocio',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=400&q=80',
      keywords: 'hielo, bebidas, abarrotes, despensa, almacén'
    },

    // DEPORTES
    {
      id: 27,
      name: 'Deportes y Más',
      description: 'Implementos y ropa deportiva',
      distance: 1.4,
      type: 'Negocio',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&q=80',
      keywords: 'zapatillas deportivas, ropa fitness, cordones zapatillas, balones, implementos deportivos'
    }
  ];

  // Filtrar resultados
  const filteredResults = allResults.filter((result) => {
    // Filtro por búsqueda (nombre, descripción y keywords)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchesName = result.name.toLowerCase().includes(query);
      const matchesDescription = result.description.toLowerCase().includes(query);
      const matchesKeywords = result.keywords?.toLowerCase().includes(query) || false;

      if (!matchesName && !matchesDescription && !matchesKeywords) {
        return false;
      }
    }

    // Filtro por distancia
    if (result.distance > maxDistance) return false;

    // Filtro por tipo
    if (selectedFilter === 'negocios' && result.type !== 'Negocio') return false;
    if (selectedFilter === 'particular' && result.type !== 'Particular') return false;

    return true;
  });

  const formatDistance = (km: number) => {
    if (km < 1) {
      return `${Math.round(km * 1000)} m`;
    }
    return `${km.toFixed(1)} km`;
  };

  return (
    <div className="size-full bg-gradient-to-b from-white via-blue-50/30 to-blue-100/40 flex flex-col">
      {/* Header */}
      <div className="px-4 pt-6 pb-4 border-b border-white/50">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={onBack} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ej: tortas, gasfiter, clases de inglés..."
              className="w-full bg-gray-50 border border-gray-200 rounded-full py-2.5 pl-11 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
            />
            <button className="absolute inset-y-0 right-4 flex items-center">
              <Mic className="w-4 h-4 text-gray-400 hover:text-teal-600 transition-colors" />
            </button>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => {
                if (filter.id === 'distance') {
                  setShowDistanceModal(true);
                } else {
                  setSelectedFilter(filter.id);
                }
              }}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                (selectedFilter === filter.id || filter.id === 'distance')
                  ? filter.id === 'distance'
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'bg-teal-500 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Distance Modal */}
      {showDistanceModal && (
        <div className="absolute inset-0 bg-black/50 flex items-end z-50" onClick={() => setShowDistanceModal(false)}>
          <div className="bg-white rounded-t-3xl p-6 w-full" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-6"></div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Ajustar distancia</h3>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-600">Distancia máxima</span>
                <span className="text-2xl font-bold text-teal-600">{maxDistance} km</span>
              </div>

              {/* Slider */}
              <div className="relative py-2">
                <input
                  type="range"
                  min="0.5"
                  max="10"
                  step="0.5"
                  value={maxDistance}
                  onChange={(e) => setMaxDistance(parseFloat(e.target.value))}
                  style={{
                    background: `linear-gradient(to right, #14b8a6 0%, #14b8a6 ${((maxDistance - 0.5) / 9.5) * 100}%, #e5e7eb ${((maxDistance - 0.5) / 9.5) * 100}%, #e5e7eb 100%)`
                  }}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer slider-custom"
                />
              </div>

              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>0.5 km</span>
                <span>10 km</span>
              </div>
            </div>

            {/* Quick presets */}
            <div className="grid grid-cols-4 gap-2 mb-6">
              {[1, 2, 5, 10].map((km) => (
                <button
                  key={km}
                  onClick={() => setMaxDistance(km)}
                  className={`py-2 rounded-full text-sm font-medium transition-all ${
                    maxDistance === km
                      ? 'bg-teal-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {km} km
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowDistanceModal(false)}
              className="w-full bg-teal-500 text-white py-3 rounded-full font-semibold hover:bg-teal-600 transition-colors"
            >
              Aplicar
            </button>
          </div>
        </div>
      )}

      {/* Results */}
      <div className="flex-1 overflow-auto px-4 pt-4">
        <p className="text-sm text-gray-600 mb-4">{filteredResults.length} resultados cerca de ti</p>

        <div className="space-y-3 pb-6">
          {filteredResults.map((result) => (
            <div
              key={result.id}
              onClick={() => onSelectBusiness(result)}
              className="bg-white border border-gray-200 rounded-2xl p-4 hover:shadow-md transition-all flex gap-4 cursor-pointer"
            >
              {/* Image */}
              <div className="flex-shrink-0">
                <ImageWithFallback
                  src={result.image}
                  alt={result.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900 text-sm">{result.name}</h3>
                  <span className="text-xs text-gray-500 whitespace-nowrap">{formatDistance(result.distance)}</span>
                </div>
                <p className="text-xs text-gray-600 mb-2 line-clamp-2">{result.description}</p>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    result.type === 'Negocio'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {result.type}
                  </span>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span className={`text-xs ${result.isOpen ? 'text-green-600' : 'text-red-600'}`}>
                      {result.isOpen ? 'Abierto' : 'Cerrado'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}

function GlobalSearchScreen({ onBack, initialQuery, activeTab, setActiveTab }: { onBack: () => void; initialQuery: string; activeTab: string; setActiveTab: (tab: string) => void }) {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedFilter, setSelectedFilter] = useState('todos');
  const [typeFilter, setTypeFilter] = useState('todos'); // 'todos', 'negocios', 'servicios'
  const [maxDistance, setMaxDistance] = useState(10);
  const [showDistanceModal, setShowDistanceModal] = useState(false);

  const filters = [
    { id: 'todos', label: 'Todos' },
    { id: 'negocios', label: 'Negocios' },
    { id: 'servicios', label: 'Servicios' },
    { id: 'particular', label: 'Particular' },
    { id: 'distance', label: `${maxDistance} km` }
  ];

  // Datos combinados de negocios y servicios
  const allResults = [
    // NEGOCIOS (productos físicos)
    {
      id: 1,
      name: 'Pastelería Delicias Tere',
      description: 'Repostería artesanal y tortas personalizadas',
      distance: 0.85,
      type: 'Negocio',
      category: 'negocios',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&q=80',
      keywords: 'tortas de cumpleaños personalizadas, pasteles para bodas, cupcakes decorados, galletas de navidad, postres artesanales'
    },
    {
      id: 2,
      name: 'Tortas del Barrio',
      description: 'Tortas personalizadas para toda ocasión',
      distance: 0.5,
      type: 'Negocio',
      category: 'negocios',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=400&q=80',
      keywords: 'tortas personalizadas, diseños únicos, tortas temáticas'
    },
    {
      id: 3,
      name: 'Pizzería Don Giovanni',
      description: 'Pizzas artesanales a leña',
      distance: 0.4,
      type: 'Negocio',
      category: 'negocios',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&q=80',
      keywords: 'pizza artesanal, pizza a domicilio, pizza familiar, comida italiana'
    },
    {
      id: 4,
      name: 'Artesanías María',
      description: 'Productos artesanales hechos a mano',
      distance: 0.9,
      type: 'Particular',
      category: 'negocios',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=400&q=80',
      keywords: 'artesanía chilena, tejidos a mano, cerámica artesanal, regalos personalizados'
    },
    {
      id: 5,
      name: 'Florería El Jardín',
      description: 'Arreglos florales para toda ocasión',
      distance: 0.7,
      type: 'Negocio',
      category: 'negocios',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=400&q=80',
      keywords: 'ramos de flores, arreglos florales, flores para eventos, coronas fúnebres'
    },
    {
      id: 6,
      name: 'Joyería Artesanal Luna',
      description: 'Joyería hecha a mano con diseños únicos',
      distance: 1.1,
      type: 'Negocio',
      category: 'negocios',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&q=80',
      keywords: 'joyería artesanal, collares personalizados, anillos plata, aretes hechos a mano'
    },
    {
      id: 7,
      name: 'Café Frappé Express',
      description: 'Bebidas frías y calientes, hielo frappé',
      distance: 0.3,
      type: 'Negocio',
      category: 'negocios',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&q=80',
      keywords: 'hielo frappé, café frío, frappuccino, bebidas heladas, café express'
    },
    {
      id: 8,
      name: 'Cocina Casera Doña Elsa',
      description: 'Comida chilena casera y tradicional',
      distance: 0.8,
      type: 'Particular',
      category: 'negocios',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80',
      keywords: 'pastel de choclo, empanadas, cazuela, comida casera chilena, menú del día'
    },
    {
      id: 9,
      name: 'Zapatería Sport Plus',
      description: 'Calzado deportivo y accesorios',
      distance: 1.0,
      type: 'Negocio',
      category: 'negocios',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80',
      keywords: 'zapatillas nike, zapatillas adidas, calzado deportivo, cordones de zapatillas, zapatillas running'
    },
    {
      id: 10,
      name: 'Librería y Papelería Central',
      description: 'Útiles escolares y material de oficina',
      distance: 0.6,
      type: 'Negocio',
      category: 'negocios',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&q=80',
      keywords: 'cartulina, papel lustre, útiles escolares, cuadernos, lápices, papelería'
    },
    {
      id: 11,
      name: 'Farmacia Cruz Verde Plus',
      description: 'Medicamentos y productos de salud',
      distance: 0.4,
      type: 'Negocio',
      category: 'negocios',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=400&q=80',
      keywords: 'tapsín caliente, tapsin, medicamentos, remedios, vitaminas, farmacia'
    },
    {
      id: 12,
      name: 'Minimarket Don Luis',
      description: 'Abarrotes y productos de primera necesidad',
      distance: 0.5,
      type: 'Negocio',
      category: 'negocios',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=400&q=80',
      keywords: 'hielo, bebidas, abarrotes, despensa, almacén'
    },
    {
      id: 13,
      name: 'Deportes y Más',
      description: 'Implementos y ropa deportiva',
      distance: 1.4,
      type: 'Negocio',
      category: 'negocios',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&q=80',
      keywords: 'zapatillas deportivas, ropa fitness, cordones zapatillas, balones, implementos deportivos'
    },

    // SERVICIOS
    {
      id: 101,
      name: 'Gasfitería Express 24/7',
      description: 'Reparaciones urgentes de gasfitería',
      distance: 0.6,
      type: 'Particular',
      category: 'servicios',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&q=80',
      keywords: 'reparación cañerías, destape wc, fuga de agua, instalación grifería, gasfiter urgente',
      instagram: '@gasfiteria_express',
      facebook: 'GasfiteriaExpress24',
      services: [
        { id: 1, name: 'Cambio de cañería', description: 'Reemplazo de cañerías antiguas o dañadas' },
        { id: 2, name: 'Instalación de calefont', description: 'Instalación y conexión de calefont a gas' },
        { id: 3, name: 'Destape de WC y cañerías', description: 'Destape urgente de baños y desagües' },
        { id: 4, name: 'Reparación de fuga de agua', description: 'Detección y reparación de filtraciones' },
        { id: 5, name: 'Instalación de grifería', description: 'Instalación de llaves y grifos' }
      ]
    },
    {
      id: 102,
      name: 'Juan Pérez Gasfiter',
      description: 'Gasfitería a domicilio, presupuesto sin cargo',
      distance: 1.2,
      type: 'Particular',
      category: 'servicios',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80',
      keywords: 'gasfiter barato, reparación baños, instalación lavamanos, cambio llaves'
    },
    {
      id: 103,
      name: 'Electricidad Profesional',
      description: 'Instalaciones eléctricas certificadas',
      distance: 0.8,
      type: 'Negocio',
      category: 'servicios',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1473186578172-c141e6798cf4?w=400&q=80',
      keywords: 'electricista certificado, instalación paneles solares, reparación cortocircuitos, instalación enchufes'
    },
    {
      id: 104,
      name: 'Salón de Belleza Glamour',
      description: 'Peluquería y tratamientos estéticos',
      distance: 0.9,
      type: 'Negocio',
      category: 'servicios',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&q=80',
      keywords: 'corte de pelo mujer, tintura cabello, manicure, pedicure, tratamiento keratina'
    },
    {
      id: 105,
      name: 'Academia de Inglés SmartLearn',
      description: 'Clases de inglés para todas las edades',
      distance: 1.3,
      type: 'Negocio',
      category: 'servicios',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&q=80',
      keywords: 'clases de inglés para niños, inglés conversacional, preparación TOEFL, inglés empresarial'
    },
    {
      id: 106,
      name: 'Centro de Masajes Relax',
      description: 'Masajes terapéuticos y relajantes',
      distance: 1.4,
      type: 'Negocio',
      category: 'servicios',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&q=80',
      keywords: 'masajes terapéuticos, masajes relajantes, quiromasaje, reflexología'
    },
    {
      id: 107,
      name: 'Veterinaria PetCare',
      description: 'Atención veterinaria integral',
      distance: 0.8,
      type: 'Negocio',
      category: 'servicios',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=400&q=80',
      keywords: 'veterinario urgencias, vacunas perros, esterilización gatos, consulta veterinaria'
    },
    {
      id: 108,
      name: 'Limpieza Express',
      description: 'Servicio de limpieza profesional',
      distance: 1.1,
      type: 'Negocio',
      category: 'servicios',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&q=80',
      keywords: 'limpieza profunda casa, aseo oficinas, limpieza mudanza, servicio doméstico'
    },
    {
      id: 109,
      name: 'Fletes y Mudanzas Rápido',
      description: 'Servicio de fletes y mudanzas',
      distance: 2.3,
      type: 'Negocio',
      category: 'servicios',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1600880292089-90a7e086ee0c?w=400&q=80',
      keywords: 'fletes económicos, mudanzas completas, retiro muebles, flete pequeño'
    },
    {
      id: 110,
      name: 'Jardines y Paisajismo Verde',
      description: 'Diseño y mantención de jardines',
      distance: 1.6,
      type: 'Negocio',
      category: 'servicios',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&q=80',
      keywords: 'jardinero, mantención jardines, poda de árboles, paisajismo, diseño jardines'
    },
    {
      id: 111,
      name: 'Jardinero Luis Parra',
      description: 'Servicio de jardinería a domicilio',
      distance: 1.0,
      type: 'Particular',
      category: 'servicios',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
      keywords: 'jardinero, corte de pasto, limpieza de jardín, poda, jardinero económico'
    },
    {
      id: 112,
      name: 'AutoSpa Premium',
      description: 'Lavado y detailing automotriz',
      distance: 0.9,
      type: 'Negocio',
      category: 'servicios',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1601362840469-51e4d8d58785?w=400&q=80',
      keywords: 'carwash, lavado de auto, limpieza de auto, detailing, pulido auto, encerado',
      instagram: '@autospa_premium',
      facebook: 'AutoSpaPremium',
      services: [
        { id: 1, name: 'Lavado Exterior Completo', description: 'Lavado y secado exterior profesional' },
        { id: 2, name: 'Lavado Interior y Exterior', description: 'Lavado completo interior y exterior' },
        { id: 3, name: 'Detailing Premium', description: 'Pulido, encerado y protección de pintura' },
        { id: 4, name: 'Limpieza de Motor', description: 'Lavado y desengrase de motor' },
        { id: 5, name: 'Tratamiento de Tapicería', description: 'Limpieza profunda de asientos y alfombras' }
      ]
    },
    {
      id: 113,
      name: 'Lavado Express El Brillo',
      description: 'Lavado rápido de vehículos',
      distance: 1.3,
      type: 'Negocio',
      category: 'servicios',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=400&q=80',
      keywords: 'carwash, lavado auto express, lavado motor, aspirado, limpieza vehículos'
    },
    {
      id: 114,
      name: 'Taller Mecánico AutoFix',
      description: 'Mecánica y hojalatería',
      distance: 1.5,
      type: 'Negocio',
      category: 'servicios',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400&q=80',
      keywords: 'desabolladura, hojalatería, pintura automotriz, mecánica general, reparación autos'
    },
    {
      id: 115,
      name: 'Hojalatería y Pintura Rodríguez',
      description: 'Desabolladura y pintura de vehículos',
      distance: 2.0,
      type: 'Negocio',
      category: 'servicios',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1625047509168-a7026f36de04?w=400&q=80',
      keywords: 'desabolladura, hojalatería, pintura de autos, reparación chapa, enderezado'
    },
    {
      id: 116,
      name: 'Lavado a Domicilio Carlos',
      description: 'Lavado de autos en tu casa',
      distance: 0.7,
      type: 'Particular',
      category: 'servicios',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80',
      keywords: 'lavado de auto a domicilio, carwash móvil, limpieza auto en casa, lavado ecológico'
    },
    {
      id: 117,
      name: 'Taller Multimarca Speed',
      description: 'Mecánica rápida y confiable',
      distance: 1.8,
      type: 'Negocio',
      category: 'servicios',
      isOpen: true,
      image: 'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?w=400&q=80',
      keywords: 'mecánica, cambio aceite, alineación, balanceo, scanner automotriz, desabolladura'
    }
  ];

  // Filtrar resultados
  const filteredResults = allResults.filter((result) => {
    // Filtro por búsqueda
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchesName = result.name.toLowerCase().includes(query);
      const matchesDescription = result.description.toLowerCase().includes(query);
      const matchesKeywords = result.keywords?.toLowerCase().includes(query) || false;

      if (!matchesName && !matchesDescription && !matchesKeywords) {
        return false;
      }
    }

    // Filtro por distancia
    if (result.distance > maxDistance) return false;

    // Filtro por tipo (Negocio/Particular)
    if (selectedFilter === 'negocios' && result.type !== 'Negocio') return false;
    if (selectedFilter === 'particular' && result.type !== 'Particular') return false;

    // Filtro por categoría (negocios vs servicios)
    if (typeFilter === 'negocios' && result.category !== 'negocios') return false;
    if (typeFilter === 'servicios' && result.category !== 'servicios') return false;

    return true;
  });

  const formatDistance = (km: number) => {
    if (km < 1) {
      return `${Math.round(km * 1000)} m`;
    }
    return `${km.toFixed(1)} km`;
  };

  return (
    <div className="size-full bg-gradient-to-b from-white via-blue-50/30 to-blue-100/40 flex flex-col">
      {/* Header */}
      <div className="px-4 pt-6 pb-4 border-b border-white/50">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={onBack} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ej: tortas, gasfiter, clases de inglés..."
              className="w-full bg-gray-50 border border-gray-200 rounded-full py-2.5 pl-11 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
            />
            <button className="absolute inset-y-0 right-4 flex items-center">
              <Mic className="w-4 h-4 text-gray-400 hover:text-teal-600 transition-colors" />
            </button>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => {
                if (filter.id === 'distance') {
                  setShowDistanceModal(true);
                } else if (filter.id === 'negocios' || filter.id === 'servicios') {
                  setTypeFilter(filter.id);
                } else if (filter.id === 'todos') {
                  setSelectedFilter('todos');
                  setTypeFilter('todos');
                } else {
                  setSelectedFilter(filter.id);
                }
              }}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                (selectedFilter === filter.id || typeFilter === filter.id || filter.id === 'distance')
                  ? filter.id === 'distance'
                    ? 'bg-blue-500 text-white shadow-sm'
                    : filter.id === 'negocios'
                    ? typeFilter === 'negocios'
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    : filter.id === 'servicios'
                    ? typeFilter === 'servicios'
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    : 'bg-teal-500 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Distance Modal */}
      {showDistanceModal && (
        <div className="absolute inset-0 bg-black/50 flex items-end z-50" onClick={() => setShowDistanceModal(false)}>
          <div className="bg-white rounded-t-3xl p-6 w-full" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-6"></div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Ajustar distancia</h3>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-600">Distancia máxima</span>
                <span className="text-2xl font-bold text-teal-600">{maxDistance} km</span>
              </div>

              <div className="relative py-2">
                <input
                  type="range"
                  min="0.5"
                  max="10"
                  step="0.5"
                  value={maxDistance}
                  onChange={(e) => setMaxDistance(parseFloat(e.target.value))}
                  style={{
                    background: `linear-gradient(to right, #14b8a6 0%, #14b8a6 ${((maxDistance - 0.5) / 9.5) * 100}%, #e5e7eb ${((maxDistance - 0.5) / 9.5) * 100}%, #e5e7eb 100%)`
                  }}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer slider-custom"
                />
              </div>

              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>0.5 km</span>
                <span>10 km</span>
              </div>
            </div>

            <button
              onClick={() => setShowDistanceModal(false)}
              className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 text-white py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              Aplicar
            </button>
          </div>
        </div>
      )}

      {/* Results */}
      <div className="flex-1 overflow-auto px-4 pt-4 pb-24">
        <p className="text-sm text-gray-600 mb-4">
          {filteredResults.length} {filteredResults.length === 1 ? 'resultado encontrado' : 'resultados encontrados'}
        </p>

        <div className="space-y-3">
          {filteredResults.map((result) => {
            const isNegocio = result.category === 'negocios';
            const CardIcon = isNegocio ? Store : Wrench;

            return (
              <div
                key={result.id}
                className={`backdrop-blur-sm rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all cursor-pointer border-2 ${
                  isNegocio
                    ? 'bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200'
                    : 'bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200'
                }`}
              >
                <div className="flex items-start gap-3 p-4">
                  <div className="relative">
                    <ImageWithFallback
                      src={result.image}
                      alt={result.name}
                      className="w-20 h-20 rounded-xl object-cover"
                    />
                    <div className={`absolute -top-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center shadow-lg ${
                      isNegocio
                        ? 'bg-gradient-to-br from-amber-500 to-orange-500'
                        : 'bg-gradient-to-br from-indigo-500 to-purple-500'
                    }`}>
                      <CardIcon className="w-4 h-4 text-white" strokeWidth={2.5} />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-bold text-gray-900 text-sm leading-tight">{result.name}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${
                        isNegocio
                          ? 'bg-orange-500 text-white'
                          : 'bg-purple-500 text-white'
                      }`}>
                        {isNegocio ? 'Negocio' : 'Servicio'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mb-2 line-clamp-2">{result.description}</p>
                    <div className="flex items-center gap-2 text-xs flex-wrap">
                      <div className="flex items-center gap-1 text-gray-600">
                        <MapPin className="w-3 h-3" />
                        <span>{formatDistance(result.distance)}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full font-medium ${
                        result.type === 'Negocio'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {result.type}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full font-semibold ${
                        result.isOpen
                          ? 'bg-green-500 text-white'
                          : 'bg-red-500 text-white'
                      }`}>
                        {result.isOpen ? 'Abierto' : 'Cerrado'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredResults.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Search className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">No se encontraron resultados</h3>
            <p className="text-sm text-gray-600 text-center px-8">
              Intenta con otras palabras clave o ajusta los filtros
            </p>
          </div>
        )}
      </div>

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const [currentScreen, setCurrentScreen] = useState('home');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentLocation, setCurrentLocation] = useState('San Bernardo');
  const [selectedBusiness, setSelectedBusiness] = useState<any>(null);
  const [checkoutData, setCheckoutData] = useState<{ selectedProducts: number[]; products: any[] } | null>(null);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedServiceItem, setSelectedServiceItem] = useState<any>(null);

  // Splash screen timer
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3000); // 3 segundos

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const savedTheme = localStorage.getItem('zipco-theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('zipco-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const categories = [
    {
      id: 'negocios',
      name: 'Negocios',
      icon: Store,
      gradient: 'bg-gradient-to-br from-amber-400 via-orange-500 to-red-500',
      iconColor: 'text-white',
      textColor: 'text-white'
    },
    {
      id: 'servicios',
      name: 'Servicios',
      icon: Wrench,
      gradient: 'bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500',
      iconColor: 'text-white',
      textColor: 'text-white'
    }
  ];

  // Splash Screen
  if (showSplash) {
    return (
      <div className="size-full bg-gradient-to-br from-teal-500 via-blue-600 to-purple-700 flex items-center justify-center overflow-hidden">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            duration: 0.8,
            ease: "easeOut"
          }}
          className="flex flex-col items-center"
        >
          {/* Logo Icon with Pulse */}
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="mb-6"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-white/30 rounded-full blur-3xl"></div>
              <MapPin className="w-32 h-32 text-white drop-shadow-2xl relative z-10" strokeWidth={2} />
            </div>
          </motion.div>

          {/* App Name */}
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-6xl font-bold text-white tracking-tight mb-3 drop-shadow-lg"
          >
            ZIPCCO
          </motion.h1>

          {/* Tagline */}
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="text-white/90 text-lg font-medium tracking-wide"
          >
            Descubre lo cercano
          </motion.p>

          {/* Loading dots */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.4 }}
            className="flex gap-2 mt-12"
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.3, 1, 0.3]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.2
                }}
                className="w-3 h-3 bg-white rounded-full"
              />
            ))}
          </motion.div>
        </motion.div>
      </div>
    );
  }

  if (activeTab === 'profile') {
    return (
      <div className="size-full bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center">
        <div className="w-full max-w-md h-full relative">
          <ProfileScreen
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onBack={() => {
              setActiveTab('home');
              setCurrentScreen('home');
            }}
          />
          <BottomNav
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onNavigate={(tab) => {
              if (tab === 'home') {
                setCurrentScreen('home');
              }
            }}
          />
        </div>
      </div>
    );
  }

  if (activeTab === 'requests') {
    return (
      <div className="size-full bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center">
        <div className="w-full max-w-md h-full relative">
          <RequestsScreen
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onBack={() => {
              setActiveTab('home');
              setCurrentScreen('home');
            }}
          />
          <BottomNav
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onNavigate={(tab) => {
              if (tab === 'home') {
                setCurrentScreen('home');
              }
            }}
          />
        </div>
      </div>
    );
  }

  if (currentScreen === 'checkout' && selectedBusiness && checkoutData) {
    return (
      <div className="size-full bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center">
        <div className="w-full max-w-md h-full relative">
          <CheckoutScreen
            business={selectedBusiness}
            selectedProducts={checkoutData.selectedProducts}
            products={checkoutData.products}
            onBack={() => setCurrentScreen('profile')}
            onOrderComplete={() => {
              setCurrentScreen('home');
              setActiveTab('requests');
            }}
          />
          <BottomNav
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onNavigate={(tab) => {
              if (tab === 'home') {
                setCurrentScreen('home');
              }
            }}
          />
        </div>
      </div>
    );
  }

  if (currentScreen === 'profile' && selectedBusiness) {
    return (
      <div className="size-full bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center">
        <div className="w-full max-w-md h-full relative">
          <BusinessProfileScreen
            business={selectedBusiness}
            onBack={() => setCurrentScreen('negocios')}
            onCheckout={(selectedProducts, products) => {
              setCheckoutData({ selectedProducts, products });
              setCurrentScreen('checkout');
            }}
          />
          <BottomNav
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onNavigate={(tab) => {
              if (tab === 'home') {
                setCurrentScreen('home');
              }
            }}
          />
        </div>
      </div>
    );
  }

  if (currentScreen === 'negocios') {
    return (
      <div className="size-full bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center">
        <div className="w-full max-w-md h-full relative">
          <NegociosScreen
            onBack={() => setCurrentScreen('home')}
            onSelectBusiness={(business) => {
              setSelectedBusiness(business);
              setCurrentScreen('profile');
            }}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
        </div>
      </div>
    );
  }

  if (currentScreen === 'servicios') {
    return (
      <div className="size-full bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center">
        <div className="w-full max-w-md h-full relative">
          <ServiciosScreen
            onBack={() => setCurrentScreen('home')}
            onSelectService={(service) => {
              setSelectedService(service);
              setCurrentScreen('service-profile');
            }}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
        </div>
      </div>
    );
  }

  if (currentScreen === 'service-profile') {
    return (
      <div className="size-full bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center">
        <div className="w-full max-w-md h-full relative">
          <ServiceProfileScreen
            service={selectedService}
            onBack={() => setCurrentScreen('servicios')}
            onRequestService={(serviceItem) => {
              setSelectedServiceItem(serviceItem);
              setCurrentScreen('service-checkout');
            }}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
        </div>
      </div>
    );
  }

  if (currentScreen === 'service-checkout') {
    return (
      <div className="size-full bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center">
        <div className="w-full max-w-md h-full relative">
          <ServiceCheckoutScreen
            service={selectedServiceItem}
            provider={selectedService}
            onBack={() => setCurrentScreen('service-profile')}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
        </div>
      </div>
    );
  }

  if (currentScreen === 'search') {
    return (
      <div className="size-full bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center">
        <div className="w-full max-w-md h-full relative">
          <GlobalSearchScreen
            onBack={() => {
              setCurrentScreen('home');
              setGlobalSearchQuery('');
            }}
            initialQuery={globalSearchQuery}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="size-full bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center">
      {/* Mobile Frame */}
      <div className={`w-full max-w-md h-full flex flex-col relative overflow-hidden backdrop-blur-sm transition-colors ${
        isDarkMode
          ? 'bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800'
          : 'bg-gradient-to-b from-white via-blue-50/30 to-blue-100/40'
      }`}>

        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className={`absolute top-6 right-6 z-20 p-2.5 rounded-full border transition-all shadow-md ${
            isDarkMode
              ? 'bg-slate-800 border-slate-700 text-amber-300 hover:bg-slate-700'
              : 'bg-white/90 border-white text-slate-700 hover:bg-white'
          }`}
          aria-label={isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        >
          {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Header */}
        <div className="px-6 pt-8 pb-6">
          {/* Logo */}
          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center gap-2">
              <MapPin className="w-8 h-8 text-teal-600" strokeWidth={2.5} />
              <h1 className={`text-3xl tracking-tight ${isDarkMode ? 'text-teal-400' : 'text-teal-700'}`}>ZIPCCO</h1>
            </div>
          </div>

          {/* Primary Action Button */}
          <button
            className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 text-white py-3.5 px-6 rounded-full flex items-center justify-center gap-2 shadow-lg shadow-teal-500/30 hover:shadow-xl hover:shadow-teal-500/40 transition-all active:scale-[0.98]"
          >
            <MapPinned className="w-5 h-5" />
            <span className="font-medium">Localízame</span>
          </button>

          {/* Search Bar */}
          <div className="mt-4 relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={globalSearchQuery}
              onChange={(e) => setGlobalSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && globalSearchQuery.trim()) {
                  setCurrentScreen('search');
                }
              }}
              placeholder="Qué buscas? ej: torta, gásfiter, hielo"
              className={`w-full border rounded-full py-3 pl-11 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all shadow-sm ${
                isDarkMode
                  ? 'bg-slate-800/80 border-slate-700 text-slate-100 placeholder:text-slate-400'
                  : 'bg-white border-gray-200 placeholder:text-gray-400'
              }`}
            />
            <button
              onClick={() => {
                if (globalSearchQuery.trim()) {
                  setCurrentScreen('search');
                }
              }}
              className="absolute inset-y-0 right-4 flex items-center"
            >
              <Send className="w-4 h-4 text-gray-400 hover:text-teal-600 transition-colors" />
            </button>
          </div>

          {/* Location Indicator */}
          <div className="mt-4 flex items-center justify-center gap-2 text-sm">
            <MapPin className="w-4 h-4 text-teal-600" />
            <span className={isDarkMode ? 'text-slate-300' : 'text-gray-600'}>Ubicación actual:</span>
            <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{currentLocation}</span>
            <button className="text-teal-600 hover:text-teal-700 underline underline-offset-2 transition-colors">
              Cambiar
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 px-6 pb-24 overflow-auto flex flex-col justify-center pt-8">
          <div className="w-full max-w-sm mx-auto">
            <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-600 via-blue-600 to-purple-600 mb-12 text-center tracking-tight animate-gradient" style={{ fontFamily: 'system-ui, -apple-system, sans-serif', letterSpacing: '-0.03em' }}>
              ¿Qué necesitas hoy?
            </h2>

            {/* Category Cards */}
            <div className="grid grid-cols-2 gap-6">
              {categories.map((category) => {
                const Icon = category.icon;
                return (
                  <button
                    key={category.id}
                    onClick={() => {
                      if (category.id === 'negocios') setCurrentScreen('negocios');
                      if (category.id === 'servicios') setCurrentScreen('servicios');
                    }}
                    className={`${category.gradient} rounded-3xl p-12 flex flex-col items-center justify-center gap-6 shadow-2xl hover:shadow-3xl transition-all active:scale-[0.95] border border-white/20 backdrop-blur-sm relative overflow-hidden group min-h-[200px]`}
                  >
                    {/* Shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/30 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                    <Icon className={`w-20 h-20 ${category.iconColor} relative z-10 drop-shadow-2xl`} strokeWidth={2.5} />
                    <span className={`text-lg font-bold ${category.textColor} relative z-10 drop-shadow-lg tracking-wide`}>
                      {category.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Navigation */}
        <BottomNav
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onNavigate={(tab) => {
            if (tab === 'home') {
              setCurrentScreen('home');
            }
          }}
        />

      </div>
    </div>
  );
}
