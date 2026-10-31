import useSubmissionHoursAdvisory, { hoursDraftKey, readHoursDraft, saveHoursDraft, clearHoursDraft } from "../../../requests/application/useSubmissionHoursAdvisory";
import { type ChangeEvent, useEffect,useRef, useState } from "react";

import { API_BASE_URL } from "../../../../api/apiConfig";

import { showAppToast } from "../../../../shared/notifications/Toast";
import { createOrder, CreateOrderError, GENERIC_CREATE_ORDER_MESSAGE, CUSTOMER_CONTACT_TEXT_VERSION } from "../../api/createOrderApi";
import { getCloudinarySecureImageUrl } from "../../../profile/business-config/catalog/catalogValidation";
import type { CatalogItem } from "../../../profile/business-config/domain/types";
import { nextOrderQuantity } from "../../domain/checkoutOrderState";

import { selectOrderMoment, type OrderMoment } from "../../domain/orderMoment";
import { createOrderCreationIntent, OrderSelectionError } from "../../application/orderCreationIntent";

import { announceAction } from "../../../requests/shared/feedback/ActionHologram";
import { readReservationCapabilities } from "../../../requests/api/reservationCapabilities";

export function useCheckoutScreenController({
  business,
  currentUserId,
  selectedProducts,
  products,
  onBack,
  onFindAlternative,
  onOrderComplete,
  onCatalogConflict,
  onSessionExpired,
}: {
  business: any;
  currentUserId: unknown;
  selectedProducts: number[];
  products: CatalogItem[];
  onBack: () => void;
  onFindAlternative?: () => void;
  onOrderComplete: () => void;
  onCatalogConflict: () => void;
  onSessionExpired: () => void;
}){

  const draftKey=hoursDraftKey('order',business.id);
  const savedDraft=readHoursDraft<{quantities:Record<number,number>;note:string;date:string;time:string;moment:OrderMoment;photo:string|null;contact:boolean}>(draftKey);
  const [quantities, setQuantities] = useState<Record<number, number>>(
    savedDraft?.quantities??selectedProducts.reduce((acc, id) => ({ ...acc, [id]: 1 }), {}),
  );
  const [note, setNote] = useState(savedDraft?.note??"");
  const [consultationOpen, setConsultationOpen] = useState(false);
  const [contactAllowed, setContactAllowed] = useState(savedDraft?.contact??true);
  const [submissionError, setSubmissionError] = useState<string | undefined>();
  const [selectedDate, setSelectedDate] = useState(savedDraft?.date??"");
  const [selectedTime, setSelectedTime] = useState(savedDraft?.time??"");
  const [selectedHour, setSelectedHour] = useState(savedDraft?.time?.slice(0,2)??"");
  const [selectedMinute, setSelectedMinute] = useState(savedDraft?.time?.slice(3,5)??"");
  const [orderMoment, setOrderMoment] = useState<OrderMoment>(savedDraft?.moment??'schedule');
  const needNow = orderMoment === 'now';
  const [referencePhoto, setReferencePhoto] = useState<string | null>(savedDraft?.photo??null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isNoteOpen, setIsNoteOpen] = useState(false);
  const [isPhotoOpen, setIsPhotoOpen] = useState(false);
  const [isPhotoViewerOpen, setIsPhotoViewerOpen] = useState(false);
  const [photoZoom, setPhotoZoom] = useState(1);
  const creationIntent = useRef(createOrderCreationIntent());
  const creationFlow=useRef<'AVAILABILITY_V1'|'AVAILABILITY_V2'|'AVAILABILITY_V3'|null>(null);
  const checkoutAlive=useRef(true);
  useEffect(()=>{checkoutAlive.current=true;return()=>{checkoutAlive.current=false;};},[]);
  const referencePhotoInputRef = useRef<HTMLInputElement>(null);

  const submissionLock=useRef(false);
  const submissionHours=useSubmissionHoursAdvisory(()=>{
    saveHoursDraft(draftKey,{quantities,note,date:selectedDate,time:selectedTime,moment:orderMoment,photo:referencePhoto,contact:contactAllowed});(onFindAlternative??onBack)();
  },onSessionExpired);
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
    if (!checkoutAlive.current||submissionLock.current||creationIntent.current.isBlocked()) return;
    const token = localStorage.getItem("zipco-token");
    if (!token || selectedItems.length === 0) {
      showAppToast("No se pudo enviar el pedido", "error");
      return;
    }

    submissionLock.current=true;
    setSubmissionError(undefined);
    setIsSubmitting(true);
    try {
      if(!creationIntent.current.pendingPayload()&&!await submissionHours.check(business.id,token))return;
      if(!checkoutAlive.current||localStorage.getItem('zipco-token')!==token)return;
      if(!creationFlow.current){const capability=await readReservationCapabilities(token);if(!checkoutAlive.current||localStorage.getItem('zipco-token')!==token)throw new Error('La sesión cambió. Vuelve a abrir la solicitud.');creationFlow.current=capability.simplifiedReservationCreationEnabled?'AVAILABILITY_V3':capability.reservationCreationEnabled?'AVAILABILITY_V2':'AVAILABILITY_V1';}
      const flow=creationFlow.current;
      const created = await creationIntent.current.submit({
        identity: JSON.stringify([currentUserId, business.id, business.userId, flow]),
        selection: { moment: orderMoment, date: selectedDate, time: selectedTime },
        details: {
          businessId: business.id,
          items: selectedItems.map((product) => ({ catalogItemId: product.id, quantity: quantities[product.id] || 1 })),
          note, referencePhoto,
          customerContactPreference: { allowed: contactAllowed, textVersion: CUSTOMER_CONTACT_TEXT_VERSION },
        },
      }, (payload, idempotencyKey) => createOrder({
        url: `${API_BASE_URL}/orders/${flow==='AVAILABILITY_V3'?'availability-reservation-v3-requests':flow==='AVAILABILITY_V2'?'availability-reservation-requests':'availability-requests'}`,
        expectedFlow: flow,
        token,
        currentUserId,
        businessUserId: business.userId,
        idempotencyKey, payload,
      }), (message) => showAppToast(message, 'warning'));
      if (!created) return;
      clearHoursDraft(draftKey);
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
      submissionLock.current=false;
      setIsSubmitting(false);
    }
  };

  const pendingPayload = creationIntent.current.pendingPayload();
  const reviewItems = (pendingPayload?.items ?? selectedItems.map(product => ({ catalogItemId: product.id, quantity: quantities[product.id] || 1 }))).map(item => {
    const product = products.find(product => product.id === item.catalogItemId);
    return { name: product?.name ?? 'Producto', quantity: item.quantity, unitPrice: product?.priceClp ?? 0 };
  });


return {availableHours,availableMinutes,business,calculateTotal,consultationOpen,contactAllowed,creationIntent,dateOptions,formatDate,getDateValue,handleDateSelection,handleHourSelection,handleMomentSelection,handleReferencePhotoChange,handleSubmitOrder,isNoteOpen,isPhotoOpen,isPhotoViewerOpen,isSubmitting,isUploadingPhoto,needNow,note,onBack,orderMoment,pendingPayload,photoZoom,quantities,referencePhoto,referencePhotoInputRef,reviewItems,selectedDate,selectedHour,selectedItems,selectedMinute,selectedTime,setConsultationOpen,setContactAllowed,setIsNoteOpen,setIsPhotoOpen,setIsPhotoViewerOpen,setNote,setPhotoZoom,setReferencePhoto,setSelectedHour,setSelectedMinute,setSelectedTime,submissionError,submissionHours,updateQuantity,updateSelectedTime};
}
export type CheckoutScreenModel=ReturnType<typeof useCheckoutScreenController>;
