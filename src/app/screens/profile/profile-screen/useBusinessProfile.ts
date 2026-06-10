import { useEffect, useState } from 'react';
import { showAppToast } from '../../Toast';

export function useBusinessProfile() {
  const [businessRegistrationForm, setBusinessRegistrationForm] = useState({
    name: '',
    type: 'Negocio'
  });
  const [businessConfig, setBusinessConfig] = useState({
    category: 'reposteria',
    hashtags: ['tortas', 'pasteles', 'cumpleaños'],
    showFullAddress: false,
    fullAddress: 'Av. Principal 123, San Bernardo',
    schedule: {}
  });
  const [businessInfo, setBusinessInfo] = useState({
    name: '',
    description: '',
    address: '',
    phone: '',
    instagram: '',
    facebook: '',
    image: ''
  });
  const [businessId, setBusinessId] = useState<string | number | null>(() => localStorage.getItem('zipco-business-id'));
  const [hasRegisteredBusiness, setHasRegisteredBusiness] = useState(() => Boolean(localStorage.getItem('zipco-business-id')));
  const [isEditingBusinessInfo, setIsEditingBusinessInfo] = useState(false);
  const [showBusinessRegistrationForm, setShowBusinessRegistrationForm] = useState(false);
  const [businessSocialForm, setBusinessSocialForm] = useState({
    name: '',
    description: '',
    address: '',
    instagram: '',
    facebook: ''
  });
  const [businessAddressSuggestions, setBusinessAddressSuggestions] = useState<any[]>([]);
  const [isBusinessAddressLoading, setIsBusinessAddressLoading] = useState(false);
  const [hasBusinessAddressSearched, setHasBusinessAddressSearched] = useState(false);
  const [isUploadingBusinessPhoto, setIsUploadingBusinessPhoto] = useState(false);

  const getBusinessAddressLabel = (result: any) => {
    const parts = String(result.display_name ?? '').split(',').map((part) => part.trim()).filter(Boolean);
    if (parts[parts.length - 1]?.toLowerCase() === 'chile') {
      parts.pop();
    }
    return parts.join(', ');
  };

  useEffect(() => {
    const userId = localStorage.getItem('zipco-user-id');
    const token = localStorage.getItem('zipco-token');

    if (!userId || !token) return;

    const loadUserBusiness = async () => {
      try {
        const response = await fetch('https://zipco-backend-production.up.railway.app/businesses', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!response.ok) return;

        const data = await response.json();
        const businesses = Array.isArray(data) ? data : data.businesses ?? data.results ?? [];
        const currentUserBusiness = businesses.find((business: any) => {
          const ownerId = business.userId ?? business.user_id ?? business.ownerId ?? business.owner_id ?? business.user?.id ?? business.user?._id ?? business.user ?? business.owner?.id ?? business.owner?._id ?? business.owner;
          return String(ownerId) === String(userId);
        });

        if (!currentUserBusiness) {
          setHasRegisteredBusiness(false);
          setBusinessId(null);
          localStorage.removeItem('zipco-business-id');
          return;
        }

        const currentBusinessId = currentUserBusiness.id ?? currentUserBusiness._id;
        setBusinessId(currentBusinessId);
        if (currentBusinessId) {
          localStorage.setItem('zipco-business-id', String(currentBusinessId));
        }
        setHasRegisteredBusiness(true);
        setBusinessInfo((currentBusinessInfo) => ({
          ...currentBusinessInfo,
          name: currentUserBusiness.name ?? '',
          description: currentUserBusiness.description ?? '',
          address: currentUserBusiness.address ?? currentUserBusiness.location ?? '',
          instagram: currentUserBusiness.instagram ?? '',
          facebook: currentUserBusiness.facebook ?? '',
          image: currentUserBusiness.image ?? currentUserBusiness.imageUrl ?? ''
        }));
      } catch (error) {
        setHasRegisteredBusiness(false);
      }
    };

    loadUserBusiness();
  }, []);

  useEffect(() => {
    const query = businessSocialForm.address.trim();

    if (!isEditingBusinessInfo || query.length < 3) {
      setBusinessAddressSuggestions([]);
      setIsBusinessAddressLoading(false);
      setHasBusinessAddressSearched(false);
      return;
    }

    setIsBusinessAddressLoading(true);
    setHasBusinessAddressSearched(false);

    const timeout = setTimeout(async () => {
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}+Chile&format=json&limit=5&countrycodes=cl&addressdetails=1`);
        const data = await response.json();
        setBusinessAddressSuggestions(Array.isArray(data) ? data : []);
      } catch (error) {
        setBusinessAddressSuggestions([]);
      } finally {
        setIsBusinessAddressLoading(false);
        setHasBusinessAddressSearched(true);
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [businessSocialForm.address, isEditingBusinessInfo]);

  const missingBusinessFields = [
    !businessInfo.name?.trim() ? 'Nombre del negocio' : '',
    !businessConfig.category?.trim() ? 'Categoría' : '',
    !businessInfo.description?.trim() ? 'Descripción' : '',
    !businessInfo.address?.trim() ? 'Dirección' : '',
    !businessInfo.phone?.trim() ? 'Teléfono' : '',
    !businessConfig.schedule || Object.keys(businessConfig.schedule).length === 0 ? 'Horarios de atención' : '',
    !businessConfig.hashtags || businessConfig.hashtags.length === 0 ? 'Palabras clave' : ''
  ].filter(Boolean);

  const isBusinessFieldMissing = (field: string) => missingBusinessFields.includes(field);
  const isBusinessReadyToPublish = missingBusinessFields.length === 0;

  const handlePublishBusiness = () => {
    if (!isBusinessReadyToPublish) {
      showAppToast(`Faltan completar estos campos:\n${missingBusinessFields.join('\n')}`, 'error');
      return;
    }

    showAppToast('¡Tu negocio está listo para publicarse! Será revisado por nuestro equipo antes de aparecer en los resultados', 'success');
  };

  const handleStartEditingBusinessInfo = () => {
    setBusinessSocialForm({
      name: businessInfo.name,
      description: businessInfo.description,
      address: businessInfo.address,
      instagram: businessInfo.instagram,
      facebook: businessInfo.facebook
    });
    setIsEditingBusinessInfo(true);
  };

  const handleSaveBusinessInfo = async () => {
    const token = localStorage.getItem('zipco-token');

    if (!businessId || !token) {
      showAppToast('No se pudo guardar el negocio', 'error');
      return;
    }

    try {
      const response = await fetch(`https://zipco-backend-production.up.railway.app/businesses/${businessId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: businessSocialForm.name,
          description: businessSocialForm.description,
          address: businessSocialForm.address,
          instagram: businessSocialForm.instagram,
          facebook: businessSocialForm.facebook
        })
      });

      if (!response.ok) {
        showAppToast('No se pudo guardar el negocio', 'error');
        return;
      }

      setBusinessInfo((currentBusinessInfo) => ({
        ...currentBusinessInfo,
        name: businessSocialForm.name,
        description: businessSocialForm.description,
        address: businessSocialForm.address,
        instagram: businessSocialForm.instagram,
        facebook: businessSocialForm.facebook
      }));
      setIsEditingBusinessInfo(false);
      setBusinessAddressSuggestions([]);
      setHasBusinessAddressSearched(false);
      showAppToast('Datos del negocio actualizados correctamente', 'success');
    } catch (error) {
      showAppToast('No se pudo guardar el negocio', 'error');
    }
  };

  const uploadBusinessPhoto = async (file: File) => {
    const token = localStorage.getItem('zipco-token');

    if (!businessId || !token) return;

    setIsUploadingBusinessPhoto(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'zipco_products');

      const uploadResponse = await fetch('https://api.cloudinary.com/v1_1/dr6xu5xr9/image/upload', {
        method: 'POST',
        body: formData
      });

      if (!uploadResponse.ok) {
        showAppToast('No se pudo subir la foto del negocio', 'error');
        return;
      }

      const uploadData = await uploadResponse.json();
      const imageUrl = uploadData.secure_url ?? uploadData.url ?? '';

      const saveResponse = await fetch(`https://zipco-backend-production.up.railway.app/businesses/${businessId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ image: imageUrl, imageUrl })
      });

      if (!saveResponse.ok) {
        showAppToast('No se pudo guardar la foto del negocio', 'error');
        return;
      }

      setBusinessInfo((currentBusinessInfo) => ({ ...currentBusinessInfo, image: imageUrl }));
      showAppToast('Foto del negocio actualizada', 'success');
    } catch (error) {
      showAppToast('No se pudo subir la foto del negocio', 'error');
    } finally {
      setIsUploadingBusinessPhoto(false);
    }
  };

  const handleRegisterBusiness = async () => {
    const token = localStorage.getItem('zipco-token');
    const businessName = businessRegistrationForm.name.trim();

    if (!token || !businessName) {
      showAppToast('No se pudo registrar el negocio', 'error');
      return;
    }

    try {
      const response = await fetch('https://zipco-backend-production.up.railway.app/businesses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: businessName,
          type: businessRegistrationForm.type,
          status: 'pending',
          categoryId: 1,
          address: '',
          latitude: null,
          longitude: null
        })
      });

      if (!response.ok) {
        showAppToast('No se pudo registrar el negocio', 'error');
        return;
      }

      const data = await response.json();
      const newBusiness = data.business ?? data;
      const newBusinessId = newBusiness.id ?? newBusiness._id ?? data.businessId;

      if (newBusinessId) {
        localStorage.setItem('zipco-business-id', String(newBusinessId));
      }

      setBusinessId(newBusinessId ?? null);
      setBusinessInfo((currentBusinessInfo) => ({
        ...currentBusinessInfo,
        name: businessName,
        description: newBusiness.description ?? '',
        address: newBusiness.address ?? '',
        instagram: newBusiness.instagram ?? '',
        facebook: newBusiness.facebook ?? '',
        image: newBusiness.image ?? newBusiness.imageUrl ?? ''
      }));
      setHasRegisteredBusiness(true);
      setShowBusinessRegistrationForm(false);
      setBusinessRegistrationForm({ name: '', type: 'Negocio' });
      showAppToast('¡Tu negocio fue registrado! Completa tu información en la sección de negocio', 'success');
    } catch (error) {
      showAppToast('No se pudo registrar el negocio', 'error');
    }
  };

  return {
    businessConfig,
    setBusinessConfig,
    businessInfo,
    hasRegisteredBusiness,
    isEditingBusinessInfo,
    businessSocialForm,
    setBusinessSocialForm,
    businessAddressSuggestions,
    setBusinessAddressSuggestions,
    isBusinessAddressLoading,
    hasBusinessAddressSearched,
    setHasBusinessAddressSearched,
    isUploadingBusinessPhoto,
    getBusinessAddressLabel,
    uploadBusinessPhoto,
    isBusinessFieldMissing,
    isBusinessReadyToPublish,
    handlePublishBusiness,
    handleStartEditingBusinessInfo,
    handleSaveBusinessInfo,
    businessRegistrationForm,
    setBusinessRegistrationForm,
    showBusinessRegistrationForm,
    setShowBusinessRegistrationForm,
    handleRegisterBusiness
  };
}
