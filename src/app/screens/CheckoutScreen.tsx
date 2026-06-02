import { useRef, useState } from 'react';
import { ArrowLeft, Minus, Plus, Send } from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

export default function CheckoutScreen({ business, selectedProducts, products, onBack, onOrderComplete }: { business: any; selectedProducts: number[]; products: any[]; onBack: () => void; onOrderComplete: () => void }) {
  const [quantities, setQuantities] = useState<Record<number, number>>(
    selectedProducts.reduce((acc, id) => ({ ...acc, [id]: 1 }), {})
  );
  const [note, setNote] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedHour, setSelectedHour] = useState('');
  const [selectedMinute, setSelectedMinute] = useState('');
  const [needNow, setNeedNow] = useState(false);
  const calendarInputRef = useRef<HTMLInputElement>(null);
  const availableHours = Array.from({ length: 14 }, (_, index) => String(index + 9).padStart(2, '0'));
  const availableMinutes = ['00', '10', '20', '30', '40', '50'];

  const getDateValue = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Seleccionar fecha';
    const date = new Date(`${dateString}T00:00:00`);
    return date.toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const dateOptions = Array.from({ length: 6 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() + index);
    return {
      value: getDateValue(date),
      weekday: index === 0 ? 'Hoy' : date.toLocaleDateString('es-CL', { weekday: 'short' }),
      day: date.getDate(),
      month: date.toLocaleDateString('es-CL', { month: 'short' })
    };
  });

  const selectedItems = products.filter((p) => selectedProducts.includes(p.id));

  const updateSelectedTime = (hour: string, minute: string) => {
    setSelectedHour(hour);
    setSelectedMinute(minute);
    setSelectedTime(hour && minute ? `${hour}:${minute}` : '');
  };

  const handleDateSelection = (date: string) => {
    setNeedNow(false);
    setSelectedDate(date);
    setSelectedTime('');
    setSelectedHour('');
    setSelectedMinute('');
  };

  const handleHourSelection = (hour: string) => {
    setSelectedHour(hour);
    setSelectedMinute('');
    setSelectedTime('');
  };

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
                setSelectedHour('');
                setSelectedMinute('');
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

          <div className={`bg-white/90 backdrop-blur-sm border border-teal-200 rounded-3xl p-4 mb-3 transition-opacity ${needNow ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-gray-900">Selecciona fecha y hora</h4>
              {selectedTime && (
                <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2 py-1 rounded-full">
                  {selectedTime}
                </span>
              )}
            </div>

            <div className="mb-5">
              <p className="text-sm font-bold text-gray-900 mb-3">Fecha</p>
              <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                {dateOptions.map((date) => (
                  <button
                    key={date.value}
                    type="button"
                    onClick={() => handleDateSelection(date.value)}
                    className={`shrink-0 w-16 rounded-xl border px-2 py-3 text-center transition-all ${
                      selectedDate === date.value
                        ? 'bg-gradient-to-b from-teal-500 to-emerald-500 text-white border-teal-500 shadow-md'
                        : 'bg-white text-gray-900 border-gray-200 hover:border-teal-500'
                    }`}
                  >
                    <span className="block text-xs font-semibold capitalize">{date.weekday}</span>
                    <span className="block text-xl font-bold leading-tight">{date.day}</span>
                    <span className="block text-xs capitalize">{date.month}</span>
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => calendarInputRef.current?.showPicker?.() ?? calendarInputRef.current?.click()}
                  className="shrink-0 w-20 rounded-xl border border-gray-200 bg-white px-2 py-3 text-center text-gray-900 transition-all hover:border-teal-500"
                >
                  <span className="block text-xs font-semibold">Abrir</span>
                  <span className="block text-sm font-bold leading-tight">calendario</span>
                </button>
              </div>
              <input
                ref={calendarInputRef}
                type="date"
                value={selectedDate}
                onChange={(e) => handleDateSelection(e.target.value)}
                min={getDateValue(new Date())}
                className="sr-only"
              />
            </div>

            {selectedDate && (
              <div className="animate-in">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-bold text-gray-900">
                    {selectedHour ? `Minutos para las ${selectedHour}:00` : 'Hora'}
                  </p>
                  {selectedHour && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedHour('');
                        setSelectedMinute('');
                        setSelectedTime('');
                      }}
                      className="text-xs font-semibold text-teal-600"
                    >
                      Cambiar hora
                    </button>
                  )}
                </div>
                {!selectedHour ? (
                  <div className="grid grid-cols-4 gap-2">
                    {availableHours.map((hour) => (
                      <button
                        key={hour}
                        type="button"
                        onClick={() => handleHourSelection(hour)}
                        className="py-2 rounded-xl text-sm font-semibold transition-all bg-white text-gray-900 border border-gray-200 hover:border-teal-500"
                      >
                        {hour}:00
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {availableMinutes.map((minute) => (
                      <button
                        key={minute}
                        type="button"
                        onClick={() => updateSelectedTime(selectedHour, minute)}
                        className={`py-2 rounded-xl text-sm font-semibold transition-all ${
                          selectedMinute === minute
                            ? 'bg-teal-500 text-white shadow-md'
                            : 'bg-white text-gray-900 border border-gray-200 hover:border-teal-500'
                        }`}
                      >
                        {selectedHour}:{minute}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

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

