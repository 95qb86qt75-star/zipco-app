import { type ChangeEvent, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  Camera,
  ChevronDown,
  FileText,
  Minus,
  Plus,
  Send,
  Zap,
  X,
} from "lucide-react";
import { API_BASE_URL } from "../api/apiConfig";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { showAppToast } from "./Toast";
import {
  buildCreateOrderPayload,
  createOrder,
  CreateOrderError,
  GENERIC_CREATE_ORDER_MESSAGE,
  hasCompleteDeliverySelection,
} from "./createOrderApi";
import { getCloudinarySecureImageUrl } from "./profile/business-config/catalogValidation";
import type { CatalogItem } from "./profile/business-config/types";
import { nextOrderQuantity } from "./checkoutOrderState";

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
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedHour, setSelectedHour] = useState("");
  const [selectedMinute, setSelectedMinute] = useState("");
  const [needNow, setNeedNow] = useState(false);
  const [referencePhoto, setReferencePhoto] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [officialTotal, setOfficialTotal] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isNoteOpen, setIsNoteOpen] = useState(false);
  const [isPhotoOpen, setIsPhotoOpen] = useState(false);
  const submitLock = useRef(false);
  const idempotencyKey = useRef<string | null>(null);
  const calendarInputRef = useRef<HTMLInputElement>(null);
  const referencePhotoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!showConfirmation) return;
    const timer = window.setTimeout(() => {
      setShowConfirmation(false);
      onOrderComplete();
    }, 2800);
    return () => window.clearTimeout(timer);
  }, [onOrderComplete, showConfirmation]);
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
    setNeedNow(false);
    setSelectedDate(date);
    setSelectedTime("");
    setSelectedHour("");
    setSelectedMinute("");
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
    if (
      !hasCompleteDeliverySelection({
        needNow,
        deliveryDate: selectedDate,
        deliveryTime: selectedTime,
      })
    ) {
      showAppToast(
        "Selecciona si lo necesitas ahora o una fecha y hora.",
        "warning",
      );
      return;
    }
    const token = localStorage.getItem("zipco-token");
    if (!token || selectedItems.length === 0 || submitLock.current) {
      showAppToast("No se pudo enviar el pedido", "error");
      return;
    }

    submitLock.current = true;
    setIsSubmitting(true);
    try {
      idempotencyKey.current ??= crypto.randomUUID();
      const created = await createOrder({
        url: `${API_BASE_URL}/orders`,
        token,
        currentUserId,
        businessUserId: business.userId,
        idempotencyKey: idempotencyKey.current,
        payload: buildCreateOrderPayload({
          businessId: business.id,
          items: selectedItems.map((product) => ({
            catalogItemId: product.id,
            quantity: quantities[product.id] || 1,
          })),
          note,
          needNow,
          deliveryDate: selectedDate,
          deliveryTime: selectedTime,
          referencePhoto,
        }),
      });
      setOfficialTotal(created.total);
      setShowConfirmation(true);
      idempotencyKey.current = null;
    } catch (error) {
      const message =
        error instanceof CreateOrderError
          ? error.message
          : GENERIC_CREATE_ORDER_MESSAGE;
      showAppToast(message, "error");
      if (error instanceof CreateOrderError && error.status === 409)
        onCatalogConflict();
      if (error instanceof CreateOrderError && error.status === 401)
        onSessionExpired();
    } finally {
      submitLock.current = false;
      setIsSubmitting(false);
    }
  };

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

          <div className="mb-2 grid grid-cols-2 gap-1 rounded-2xl border border-slate-200 bg-white/75 p-1 shadow-sm">
            <button
              type="button"
              onClick={() => {
                setNeedNow(true);
                setSelectedDate("");
                setSelectedTime("");
                setSelectedHour("");
                setSelectedMinute("");
              }}
              className={`zipco-now-option relative min-h-12 overflow-hidden rounded-xl px-2 py-2 text-sm font-bold transition-all ${
                needNow
                  ? "is-active bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-800 text-white shadow-md shadow-indigo-950/30"
                  : "bg-transparent text-gray-600 hover:bg-white"
              }`}
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 180 52"
                preserveAspectRatio="none"
                className="zipco-storm-lightning absolute inset-0 h-full w-full"
              >
                <path d="M142 -2 112 18 128 22 92 54" />
                <path d="m113 18-22 1-12 13" />
                <path d="m127 22 20 7 10 13" />
              </svg>
              <div className="relative z-10 flex items-center justify-center gap-2">
                <span className="zipco-now-bolt flex h-7 w-7 items-center justify-center rounded-full bg-amber-400/15 text-amber-300 shadow-[0_0_14px_rgba(251,191,36,0.18)]">
                  <Zap className="h-4 w-4" fill="currentColor" />
                </span>
                <span>Ahora</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setNeedNow(false)}
              className={`min-h-12 rounded-xl px-2 py-2 text-sm font-bold transition-all ${
                !needNow
                  ? "bg-gradient-to-r from-teal-600 to-emerald-500 text-white shadow-md"
                  : "bg-transparent text-gray-600 hover:bg-white"
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <CalendarDays className="h-4 w-4" />
                Programar
              </span>
            </button>
          </div>

          {!needNow && (
            <div className="mb-3 rounded-3xl border border-teal-200 bg-white/90 p-4 backdrop-blur-sm animate-in">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold text-gray-900">
                  Selecciona fecha y hora
                </h4>
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
                  <button
                    type="button"
                    onClick={() =>
                      calendarInputRef.current?.showPicker?.() ??
                      calendarInputRef.current?.click()
                    }
                    className="shrink-0 w-20 rounded-xl border border-gray-200 bg-white px-2 py-3 text-center text-gray-900 transition-all hover:border-teal-500"
                  >
                    <span className="block text-xs font-semibold">Abrir</span>
                    <span className="block text-sm font-bold leading-tight">
                      calendario
                    </span>
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
                <strong>📦 Entrega programada:</strong>
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
              <div className="relative bg-white/80 backdrop-blur-sm border border-teal-100 rounded-2xl p-3 shadow-sm">
                <ImageWithFallback
                  src={referencePhoto}
                  alt="Foto de referencia"
                  className="w-full h-44 rounded-xl object-cover"
                />
                <button
                  type="button"
                  onClick={() => setReferencePhoto(null)}
                  className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/90 shadow-md flex items-center justify-center text-gray-700 hover:text-red-500 transition-colors"
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
            onClick={handleSubmitOrder}
            disabled={isUploadingPhoto || isSubmitting}
            className="flex min-w-0 flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-500/30 transition-all active:scale-[0.98]"
          >
            <Send className="w-5 h-5" />
            <span>{isSubmitting ? "Enviando..." : "Realizar pedido"}</span>
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/60 p-6 backdrop-blur-xl">
          <div className="zipco-hologram-card zipco-flow-hologram w-full max-w-sm rounded-3xl bg-white p-8 shadow-2xl dark:border dark:border-teal-300/60 dark:bg-slate-950 dark:text-white">
            <div className="w-16 h-16 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
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
            {officialTotal !== null && (
              <p className="mb-4 text-center text-sm font-bold text-slate-900">
                Total confirmado: ${officialTotal.toLocaleString("es-CL")}
              </p>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6">
              <p className="text-sm text-blue-800 text-center">
                Revisa tu barra en la opción <strong>Solicitudes</strong> para
                ver el estado de tu pedido
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
