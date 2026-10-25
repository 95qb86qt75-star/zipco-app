import { type ChangeEvent, useRef, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  Camera,
  ChevronDown,
  FileText,
  Maximize2,
  Minus,
  Plus,
  RotateCcw,
  Send,
  X,
} from "lucide-react";
import { API_BASE_URL } from "../api/apiConfig";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { showAppToast } from "./Toast";
import {
  createOrder,
  CreateOrderError,
  GENERIC_CREATE_ORDER_MESSAGE,
  CUSTOMER_CONTACT_TEXT_VERSION,
} from "./createOrderApi";
import { getCloudinarySecureImageUrl } from "./profile/business-config/catalogValidation";
import type { CatalogItem } from "./profile/business-config/types";
import { nextOrderQuantity } from "./checkoutOrderState";
import OrderMomentSelector from './OrderMomentSelector';
import { selectOrderMoment, type OrderMoment } from './orderMoment';
import { createOrderCreationIntent, OrderSelectionError } from './orderCreationIntent';
import { ConsultationDesignSheet } from './requests/availability-design/AvailabilityDesign';
import { announceAction } from './requests/ActionHologram';

export default function CheckoutScreen({
  business,
  currentUserId,
  selectedProducts,
  products,
  onBack,
  onOrderComplete,
  onCatalogConflict,
  onSessionExpired,
}: {
  business: any;
  currentUserId: unknown;
  selectedProducts: number[];
  products: CatalogItem[];
  onBack: () => void;
  onOrderComplete: () => void;
  onCatalogConflict: () => void;
  onSessionExpired: () => void;
}) {
  const [quantities, setQuantities] = useState<Record<number, number>>(
    selectedProducts.reduce((acc, id) => ({ ...acc, [id]: 1 }), {}),
  );
  const [note, setNote] = useState("");
  const [consultationOpen, setConsultationOpen] = useState(false);
  const [contactAllowed, setContactAllowed] = useState(true);
  const [submissionError, setSubmissionError] = useState<string | undefined>();
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedHour, setSelectedHour] = useState("");
  const [selectedMinute, setSelectedMinute] = useState("");
  const [orderMoment, setOrderMoment] = useState<OrderMoment>('schedule');
  const needNow = orderMoment === 'now';
  const [referencePhoto, setReferencePhoto] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isNoteOpen, setIsNoteOpen] = useState(false);
  const [isPhotoOpen, setIsPhotoOpen] = useState(false);
  const [isPhotoViewerOpen, setIsPhotoViewerOpen] = useState(false);
  const [photoZoom, setPhotoZoom] = useState(1);
  const creationIntent = useRef(createOrderCreationIntent());
  const referencePhotoInputRef = useRef<HTMLInputElement>(null);

  const availableHours = Array.from({ length: 14 }, (_, index) =>
    String(index + 9).padStart(2, "0"),
  );
  const availableMinutes = ["00", "10", "20", "30", "40", "50"];

  const getDateValue = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "Seleccionar fecha";
    const date = new Date(`${dateString}T00:00:00`);
    return date.toLocaleDateString("es-CL", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  const dateOptions = Array.from({ length: 6 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() + index);
    return {
      value: getDateValue(date),
      weekday:
        index === 0
          ? "Hoy"
          : date.toLocaleDateString("es-CL", { weekday: "short" }),
      day: date.getDate(),
      month: date.toLocaleDateString("es-CL", { month: "short" }),
    };
  });

  const selectedItems = products.filter(
    (p) =>
      selectedProducts.includes(p.id) &&
      p.kind === "product" &&
      p.pricingMode === "fixed_price",
  );

  const updateSelectedTime = (hour: string, minute: string) => {
    setSelectedHour(hour);
    setSelectedMinute(minute);
    setSelectedTime(hour && minute ? `${hour}:${minute}` : "");
  };

  const handleDateSelection = (date: string) => {
    setSelectedDate(date);
    setSelectedTime("");
    setSelectedHour("");
    setSelectedMinute("");
  };

  const handleMomentSelection = (moment: OrderMoment) => {
    if (moment === orderMoment) return;
    const selection = selectOrderMoment(moment);
    setOrderMoment(selection.moment);
    setSelectedDate(selection.date);
    setSelectedTime(selection.time);
    setSelectedHour('');
    setSelectedMinute('');
  };

  const handleHourSelection = (hour: string) => {
    setSelectedHour(hour);
    setSelectedMinute("");
    setSelectedTime("");
  };

  const updateQuantity = (productId: number, delta: number) => {
    setQuantities((prev) => ({
      ...prev,
      [productId]: nextOrderQuantity(prev[productId] || 1, delta > 0 ? 1 : -1),
    }));
  };

  const calculateTotal = () => {
    return selectedItems.reduce((total, item) => {
      return total + (item.priceClp ?? 0) * (quantities[item.id] || 1);
    }, 0);
  };

  const handleReferencePhotoChange = async (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "zipco_products");

    setIsUploadingPhoto(true);

    try {
      const response = await fetch(
        "https://api.cloudinary.com/v1_1/dr6xu5xr9/image/upload",
        {
          method: "POST",
          body: formData,
        },
      );

      if (!response.ok) {
        showAppToast("No se pudo subir la foto", "error");
        return;
      }

      const imageUrl = getCloudinarySecureImageUrl(
        (await response.json()) as unknown,
      );
      if (!imageUrl) {
        showAppToast("No se pudo subir la foto", "error");
        return;
      }
      setReferencePhoto(imageUrl);
    } catch (error) {
      showAppToast("No se pudo subir la foto", "error");
    } finally {
      setIsUploadingPhoto(false);
      event.target.value = "";
    }
  };

  const handleSubmitOrder = async () => {
    if (creationIntent.current.isBlocked()) return;
    const token = localStorage.getItem("zipco-token");
    if (!token || selectedItems.length === 0) {
      showAppToast("No se pudo enviar el pedido", "error");
      return;
    }

    setSubmissionError(undefined);
    setIsSubmitting(true);
    try {
      const created = await creationIntent.current.submit({
        identity: JSON.stringify([currentUserId, business.id, business.userId]),
        selection: { moment: orderMoment, date: selectedDate, time: selectedTime },
        details: {
          businessId: business.id,
          items: selectedItems.map((product) => ({ catalogItemId: product.id, quantity: quantities[product.id] || 1 })),
          note, referencePhoto,
          customerContactPreference: { allowed: contactAllowed, textVersion: CUSTOMER_CONTACT_TEXT_VERSION },
        },
      }, (payload, idempotencyKey) => createOrder({
        url: `${API_BASE_URL}/orders`,
        token,
        currentUserId,
        businessUserId: business.userId,
        idempotencyKey, payload,
      }), (message) => showAppToast(message, 'warning'));
      if (!created) return;
      setConsultationOpen(false);
      announceAction('requestSent');
      onOrderComplete();
    } catch (error) {
      const message =
        error instanceof CreateOrderError || error instanceof OrderSelectionError
          ? error.message
          : GENERIC_CREATE_ORDER_MESSAGE;
      setSubmissionError(message);
      showAppToast(message, error instanceof OrderSelectionError ? 'warning' : 'error');
      if (error instanceof CreateOrderError && error.status === 409 && error.outcome === 'not-created')
        onCatalogConflict();
      if (error instanceof CreateOrderError && error.status === 401)
        onSessionExpired();
    } finally {
      setIsSubmitting(false);
    }
  };

  const pendingPayload = creationIntent.current.pendingPayload();
  const reviewItems = (pendingPayload?.items ?? selectedItems.map(product => ({ catalogItemId: product.id, quantity: quantities[product.id] || 1 }))).map(item => {
    const product = products.find(product => product.id === item.catalogItemId);
    return { name: product?.name ?? 'Producto', quantity: item.quantity, unitPrice: product?.priceClp ?? 0 };
  });

  return (
    <div className="zipco-theme-surface size-full min-h-0 overflow-hidden bg-gradient-to-b from-white via-blue-50/30 to-blue-100/40 flex flex-col">
      {/* Header */}
      <div className="zipco-safe-header border-b border-slate-200/60 px-4 pb-3">
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={onBack}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h2 className="text-xl font-bold text-gray-900">
            Resumen del pedido
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <ImageWithFallback
            src={business.image}
            alt={business.name}
            className="w-10 h-10 rounded-full object-cover border-2 border-teal-500"
          />
          <div>
            <p className="font-semibold text-gray-900 text-sm">
              {business.name}
            </p>
            <p className="text-xs text-gray-500">{business.type}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-4 pt-4 pb-48">
        <h3 className="mb-2 text-base font-bold text-gray-900">
          Productos seleccionados
        </h3>

        {/* Products List */}
        <div className="mb-4 space-y-2">
          {selectedItems.map((product) => (
            <div
              key={product.id}
              className="rounded-2xl border border-slate-200 bg-white/80 p-3 shadow-md backdrop-blur-sm"
            >
              <div className="mb-2 flex gap-3">
                <ImageWithFallback
                  src={product.imageUrl}
                  alt={product.name}
                  className="h-14 w-14 rounded-xl object-cover"
                />
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 text-sm mb-1">
                    {product.name}
                  </h4>
                  <p className="text-xs text-gray-600 mb-2 line-clamp-1">
                    {product.description}
                  </p>
                  <span className="text-base font-bold text-gray-900">
                    ${product.priceClp?.toLocaleString("es-CL")}
                  </span>
                </div>
              </div>

              {/* Quantity Controls */}
              <div className="flex items-center justify-between border-t border-gray-100 pt-2">
                <span className="text-sm text-gray-600">Cantidad</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => updateQuantity(product.id, -1)}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 transition-colors hover:bg-gray-200"
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
              <div className="mt-2 flex items-center justify-between border-t border-gray-100 pt-2">
                <span className="text-sm text-gray-600">Subtotal</span>
                <span className="text-base font-bold text-teal-600">
                  $
                  {(
                    (product.priceClp ?? 0) * (quantities[product.id] || 1)
                  ).toLocaleString("es-CL")}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Delivery Date & Time Selection */}
        <div className="mb-4">
          <label className="mb-2 block text-sm font-bold text-gray-900">
            ¿Cuándo lo necesitas?
          </label>

          <OrderMomentSelector moment={orderMoment} onChange={handleMomentSelection}
            time={selectedTime} onTimeChange={setSelectedTime} />

          {orderMoment === 'schedule' && (
            <div className="mb-2 pt-1 animate-in">
              <div className="mb-2 flex items-center justify-between px-0.5">
                <h4 className="text-sm font-bold text-gray-900">
                  Selecciona fecha y hora
                </h4>
                {selectedTime && (
                  <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2 py-1 rounded-full">
                    {selectedTime}
                  </span>
                )}
              </div>

              <div className="mb-3">
                <div className="-mx-0.5 flex gap-2 overflow-x-auto px-0.5 pb-1.5">
                  {dateOptions.map((date) => (
                    <button
                      key={date.value}
                      type="button"
                      onClick={() => handleDateSelection(date.value)}
                      className={`w-[62px] shrink-0 rounded-xl border px-2 py-2 text-center shadow-sm transition-all ${
                        selectedDate === date.value
                          ? "bg-gradient-to-b from-teal-500 to-emerald-500 text-white border-teal-500 shadow-md"
                          : "bg-white text-gray-900 border-gray-200 hover:border-teal-500"
                      }`}
                    >
                      <span className="block text-xs font-semibold capitalize">
                        {date.weekday}
                      </span>
                      <span className="block text-xl font-bold leading-tight">
                        {date.day}
                      </span>
                      <span className="block text-xs capitalize">
                        {date.month}
                      </span>
                    </button>
                  ))}
                  <label className="relative flex min-h-[68px] w-[62px] shrink-0 cursor-pointer flex-col items-center justify-center gap-1 overflow-hidden rounded-xl border border-gray-200 bg-white px-2 py-2 text-center text-gray-900 shadow-sm transition-all hover:border-teal-500">
                    <CalendarDays className="h-5 w-5 text-teal-600" />
                    <span className="block text-xs font-bold">Más</span>
                    <input
                      type="date"
                      aria-label="Abrir calendario"
                      value={selectedDate}
                      onChange={(e) => handleDateSelection(e.target.value)}
                      min={getDateValue(new Date())}
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    />
                  </label>
                </div>
              </div>

              {selectedDate && (
                <div className="animate-in rounded-2xl border border-teal-200 bg-white/85 p-3 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-bold text-gray-900">
                      {selectedHour
                        ? `Minutos para las ${selectedHour}:00`
                        : "Hora"}
                    </p>
                    {selectedHour && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedHour("");
                          setSelectedMinute("");
                          setSelectedTime("");
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
                          onClick={() =>
                            updateSelectedTime(selectedHour, minute)
                          }
                          className={`py-2 rounded-xl text-sm font-semibold transition-all ${
                            selectedMinute === minute
                              ? "bg-teal-500 text-white shadow-md"
                              : "bg-white text-gray-900 border border-gray-200 hover:border-teal-500"
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
          )}

          {/* Summary Display */}
          {needNow && (
            <p className="px-2 text-xs font-semibold text-orange-700">
              ⚡ Entrega urgente · lo antes posible
            </p>
          )}

          {!needNow && (selectedDate || selectedTime) && (
            <div className="bg-teal-50 border border-teal-200 rounded-xl p-3">
              <p className="text-sm text-teal-800">
                <strong>{orderMoment === 'today' ? '📦 Entrega para hoy:' : '📦 Entrega programada:'}</strong>
                {selectedDate && ` ${formatDate(selectedDate)}`}
                {selectedDate && selectedTime && " a las"}
                {selectedTime && ` ${selectedTime}`}
                {!selectedDate && !selectedTime && " No especificada"}
              </p>
            </div>
          )}
        </div>

        {/* Personal Note */}
        <div className="mb-3 rounded-2xl border border-slate-200 bg-white/70 p-3">
          <button
            type="button"
            onClick={() => setIsNoteOpen((value) => !value)}
            className="flex w-full items-center justify-between text-left text-sm font-bold text-gray-900"
          >
            <span className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-teal-500" />
              Agregar nota opcional
            </span>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${isNoteOpen ? "rotate-180" : ""}`}
            />
          </button>
          {isNoteOpen && (
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ej: Sin azúcar, decoración personalizada, hora de entrega..."
              className="zipco-readable-field mt-3 w-full resize-none rounded-xl border border-gray-200 bg-white/80 p-3 text-sm backdrop-blur-sm transition-all focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              rows={3}
            />
          )}
        </div>

        <div className="mb-4 rounded-2xl border border-slate-200 bg-white/70 p-3">
          <button
            type="button"
            onClick={() => setIsPhotoOpen((value) => !value)}
            className="flex w-full items-center justify-between text-left text-sm font-bold text-gray-900"
          >
            <span className="flex items-center gap-2">
              <Camera className="h-4 w-4 text-teal-500" />
              Agregar foto de referencia
            </span>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${isPhotoOpen ? "rotate-180" : ""}`}
            />
          </button>

          {isPhotoOpen &&
            (referencePhoto ? (
              <div className="relative rounded-2xl border border-teal-100 bg-white/80 p-3 shadow-sm backdrop-blur-sm">
                <button
                  type="button"
                  onClick={() => {
                    setPhotoZoom(1);
                    setIsPhotoViewerOpen(true);
                  }}
                  className="group relative block h-44 w-full overflow-hidden rounded-xl bg-slate-100"
                  aria-label="Ampliar foto de referencia"
                >
                  <ImageWithFallback
                    src={referencePhoto}
                    alt="Foto de referencia"
                    className="h-full w-full object-contain"
                  />
                  <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full bg-slate-950/75 px-2.5 py-1.5 text-[11px] font-bold text-white shadow-lg backdrop-blur-sm">
                    <Maximize2 className="h-3.5 w-3.5" /> Ampliar
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setReferencePhoto(null);
                    setIsPhotoViewerOpen(false);
                  }}
                  className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/90 shadow-md flex items-center justify-center text-gray-700 hover:text-red-500 transition-colors"
                  aria-label="Eliminar foto de referencia"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => referencePhotoInputRef.current?.click()}
                disabled={isUploadingPhoto}
                className="w-full bg-white/80 text-gray-700 border-2 border-dashed border-teal-200 hover:border-teal-500 rounded-2xl p-4 font-semibold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <Camera className="w-5 h-5 text-teal-500" />
                <span>
                  {isUploadingPhoto
                    ? "Subiendo foto..."
                    : "Elegir foto desde galeria o camara"}
                </span>
              </button>
            ))}

          <input
            ref={referencePhotoInputRef}
            type="file"
            accept="image/*"
            onChange={handleReferencePhotoChange}
            className="sr-only"
          />
        </div>

        {isPhotoViewerOpen && referencePhoto && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Vista ampliada de la foto de referencia"
            className="fixed inset-0 z-[120] flex flex-col bg-slate-950/95 p-4 backdrop-blur-md"
            onClick={() => setIsPhotoViewerOpen(false)}
          >
            <div className="flex items-center justify-between text-white">
              <p className="text-sm font-bold">Foto de referencia</p>
              <button
                type="button"
                onClick={() => setIsPhotoViewerOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15"
                aria-label="Cerrar foto ampliada"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div
              className="flex min-h-0 flex-1 items-center justify-center overflow-auto py-4"
              onClick={(event) => event.stopPropagation()}
            >
              <ImageWithFallback
                src={referencePhoto}
                alt="Foto de referencia ampliada"
                className="max-h-full max-w-full object-contain transition-transform duration-200"
                style={{ transform: `scale(${photoZoom})` }}
              />
            </div>
            <div
              className="mx-auto flex items-center gap-3 rounded-full border border-white/15 bg-white/10 p-2 text-white backdrop-blur-md"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                disabled={photoZoom <= 1}
                onClick={() =>
                  setPhotoZoom((current) => Math.max(1, current - 0.5))
                }
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 disabled:opacity-35"
                aria-label="Reducir foto"
              >
                <Minus className="h-5 w-5" />
              </button>
              <span className="min-w-12 text-center text-xs font-bold">
                {Math.round(photoZoom * 100)}%
              </span>
              <button
                type="button"
                disabled={photoZoom >= 3}
                onClick={() =>
                  setPhotoZoom((current) => Math.min(3, current + 0.5))
                }
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 disabled:opacity-35"
                aria-label="Ampliar foto"
              >
                <Plus className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => setPhotoZoom(1)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10"
                aria-label="Restablecer tamaño"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Total Summary */}
        <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-2xl p-5 border-2 border-teal-200">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">Total de productos</span>
            <span className="text-sm font-semibold text-gray-900">
              {selectedItems.reduce(
                (sum, item) => sum + (quantities[item.id] || 1),
                0,
              )}{" "}
              unidades
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-lg font-bold text-gray-900">
              Total estimado
            </span>
            <span className="text-2xl font-bold text-teal-600">
              ${calculateTotal().toLocaleString("es-CL")}
            </span>
          </div>
        </div>
      </div>

      {/* Order Button */}
      <div className="zipco-sticky-fade absolute bottom-24 left-0 right-0 z-40 bg-gradient-to-t from-white via-white to-transparent px-4 py-2">
        <div className="flex items-center gap-3 rounded-2xl border border-teal-400/30 bg-slate-950/95 p-2 pl-3 shadow-2xl backdrop-blur-md">
          <div className="min-w-0 shrink-0 text-white">
            <p className="text-[10px] font-semibold text-slate-400">Total</p>
            <p className="text-base font-black text-teal-300">
              ${calculateTotal().toLocaleString("es-CL")}
            </p>
          </div>
          <button
            onClick={() => { if (!creationIntent.current.isBlocked()) setConsultationOpen(true); }}
            disabled={isUploadingPhoto || isSubmitting}
            className="flex min-w-0 flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-500/30 transition-all active:scale-[0.98]"
          >
            <Send className="w-5 h-5" />
            <span>{isSubmitting ? "Enviando..." : creationIntent.current.hasPending() ? 'Reintentar envío' : "Requiero este producto"}</span>
          </button>
        </div>
      </div>

      <ConsultationDesignSheet
        open={consultationOpen}
        onOpenChange={setConsultationOpen}
        data={{
          counterpart: business.name,
          items: reviewItems,
          total: reviewItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0),
          immediate: pendingPayload?.needNow ?? needNow,
          schedule: pendingPayload
            ? pendingPayload.needNow ? 'Ahora' : `${pendingPayload.deliveryDate} · ${pendingPayload.deliveryTime}`
            : needNow ? 'Ahora' : `${selectedDate || 'Selecciona fecha'} · ${selectedTime || 'Selecciona hora'}`,
        }}
        contact={creationIntent.current.pendingPayload()?.customerContactPreference?.allowed ?? contactAllowed}
        contactLocked={creationIntent.current.hasPending()}
        onContactChange={setContactAllowed}
        onSend={handleSubmitOrder}
        busy={isSubmitting || isUploadingPhoto}
        error={submissionError}
      />
    </div>
  );
}
