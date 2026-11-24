import useSubmissionHoursAdvisory, { hoursDraftKey, readHoursDraft, clearHoursDraft,focusSubmissionSchedule } from "../../../requests/application/useSubmissionHoursAdvisory";
import {requestedMoment} from '../../../requests/api/requestedMomentAdvisory';
import React, { useRef, useState } from "react";



import { API_BASE_URL } from "../../../../api/apiConfig";
import { createOrder, CreateOrderError } from "../../api/createOrderApi";
import { getCloudinarySecureImageUrl } from "../../../profile/business-config/catalog/catalogValidation";
import { showAppToast } from "../../../../shared/notifications/Toast";

import { resolveOrderDelivery,resolvedOrderSelection,selectOrderMoment, type OrderMoment } from "../../domain/orderMoment";
import { createOrderCreationIntent, OrderSelectionError } from "../../application/orderCreationIntent";

export function useServiceCheckoutScreenController({
  onBack,
  onFindAlternative,
  service,
  provider,
  activeTab,
  setActiveTab,
  onSessionExpired,
}: {
  onBack: () => void;
  onFindAlternative?: () => void;
  service: any;
  provider: any;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onSessionExpired?: () => void;
}){

  const draftKey=hoursDraftKey('service-'+service.id,Number(provider.id));
  const savedDraft=readHoursDraft<{date:string;time:string;moment:OrderMoment|null;message:string;photo:string|null}>(draftKey);
  const [deliveryDate, setDeliveryDate] = useState(savedDraft?.date??"");
  const [deliveryTime, setDeliveryTime] = useState(savedDraft?.time??"");
  const [scheduleOption, setScheduleOption] = useState<OrderMoment | null>(savedDraft?.moment??null);
  const [message, setMessage] = useState(savedDraft?.message??"");
  const [uploadedImage, setUploadedImage] = useState<string | null>(savedDraft?.photo??null);
  const [showNotification, setShowNotification] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const creationIntent = useRef(createOrderCreationIntent());
  const reviewedSelection=useRef<{key:string;value:Parameters<typeof resolveOrderDelivery>[0]}|null>(null);
  const selectionSignature=JSON.stringify([scheduleOption,deliveryDate,deliveryTime]);
  const submissionContext=JSON.stringify([provider.id,provider.userId,selectionSignature]);
  const submissionContextRef=useRef(submissionContext);submissionContextRef.current=submissionContext;

  const submitLock=useRef(false);
  const scheduleRef=useRef<HTMLDivElement>(null);
  const submissionHours=useSubmissionHoursAdvisory(()=>focusSubmissionSchedule(scheduleRef.current),()=>onSessionExpired?.(),{
    businessId:Number(provider.id),key:selectionSignature,
    selection:()=>requestedMoment(resolveOrderDelivery({moment:scheduleOption,date:deliveryDate,time:deliveryTime}))});
  const handleMomentSelection = (moment: OrderMoment) => {
    if (moment === scheduleOption) return;
    const selection = selectOrderMoment(moment);
    setScheduleOption(selection.moment);
    setDeliveryDate(selection.date);
    setDeliveryTime(selection.time);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/") || file.size > 10 * 1024 * 1024) {
        showAppToast("Selecciona una imagen de hasta 10 MB.", "error");
        return;
      }
      setIsUploading(true);
      try {
        const body = new FormData();
        body.append("file", file);
        body.append("upload_preset", "zipco_products");
        const response = await fetch(
          "https://api.cloudinary.com/v1_1/dr6xu5xr9/image/upload",
          { method: "POST", body },
        );
        if (!response.ok) throw new Error();
        const url = getCloudinarySecureImageUrl(await response.json());
        if (!url) throw new Error();
        setUploadedImage(url);
      } catch {
        showAppToast("No se pudo subir la foto.", "error");
      } finally {
        setIsUploading(false);
        e.target.value = "";
      }
    }
  };

  const handleSubmit = async () => {
    if (submitLock.current||creationIntent.current.isBlocked()) return;
    const token = localStorage.getItem("zipco-token");
    if (!token || isSubmitting || isUploading) return;
    submitLock.current=true;
    setIsSubmitting(true);
    try {
      let selection:Parameters<typeof resolveOrderDelivery>[0]=creationIntent.current.pendingPayload()&&reviewedSelection.current?.key===selectionSignature
        ?reviewedSelection.current.value:{moment:scheduleOption,date:deliveryDate,time:deliveryTime};
      if(!creationIntent.current.pendingPayload()){
        let delivery:ReturnType<typeof resolveOrderDelivery>;
        try{delivery=resolveOrderDelivery(selection);selection=resolvedOrderSelection(delivery);}
        catch(error){throw new OrderSelectionError(error instanceof Error?error.message:'Selecciona cuándo lo necesitas.');}
        if(!await submissionHours.check(Number(provider.id),token,requestedMoment(delivery)))return;
        reviewedSelection.current={key:selectionSignature,value:selection};
      }
      if(localStorage.getItem('zipco-token')!==token||submissionContextRef.current!==submissionContext)return;
      const created = await creationIntent.current.submit({
        identity: JSON.stringify([localStorage.getItem('zipco-user-id'), provider.id, provider.userId]),
        selection,
        details: { businessId: Number(provider.id), items: [{ catalogItemId: Number(service.id), quantity: 1 }],
          note: message, referencePhoto: uploadedImage },
      }, (payload, idempotencyKey) => createOrder({
        url: `${API_BASE_URL}/orders`,
        token,
        currentUserId: localStorage.getItem("zipco-user-id"),
        businessUserId: provider.userId,
        idempotencyKey, payload,
      }), (message) => showAppToast(message, 'warning'));
      if (!created) return;
      clearHoursDraft(draftKey);
      setShowNotification(true);
      setTimeout(() => {
        setShowNotification(false);
        onBack();
      }, 2800);
    } catch (error) {
      showAppToast(
        error instanceof CreateOrderError || error instanceof OrderSelectionError
          ? error.message
          : "No se pudo solicitar el servicio.",
        error instanceof OrderSelectionError ? 'warning' : 'error',
      );
      if (error instanceof CreateOrderError && error.status === 401)
        onSessionExpired?.();
    } finally {
      submitLock.current=false;
      setIsSubmitting(false);
    }
  };


return {scheduleRef,activeTab,creationIntent,deliveryDate,deliveryTime,handleImageUpload,handleMomentSelection,handleSubmit,isSubmitting,isUploading,message,onBack,provider,scheduleOption,service,setActiveTab,setDeliveryDate,setDeliveryTime,setMessage,setUploadedImage,showNotification,submissionHours,uploadedImage};
}
export type ServiceCheckoutScreenModel=ReturnType<typeof useServiceCheckoutScreenController>;
