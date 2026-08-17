import { useEffect, useState } from 'react';
import { API_BASE_URL } from '../../../api/apiConfig';
import { showAppToast } from '../../Toast';

export function useBusinessProfile() {
  const [businessRegistrationForm, setBusinessRegistrationForm] = useState({
    name: '',
    type: 'Negocio'
  });
  const [businessConfig, setBusinessConfig] = useState({
    category: '',
    hashtags: [] as string[],
    showFullAddress: false,
    fullAddress: '',
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
  const [businessAddressTouched, setBusinessAddressTouched] = useState(false);
  const [isUploadingBusinessPhoto, setIsUploadingBusinessPhoto] = useState(false);

  const getBusinessAddressLabel = (result: any) => {
    const parts = String(result.display_name ?? '').split(',').map((part) => part.trim()).filter(Boolean);
    if (parts[parts.length - 1]?.toLowerCase() === 'chile') {
      parts.pop();
    }
    const address = result.address ?? {};
    const fallbackStreet = [address.road ?? address.pedestrian ?? address.footway, address.house_number]
      .map((part) => String(part ?? '').trim())
      .filter(Boolean)
      .join(' ');
    if (!parts.length && fallbackStreet) parts.push(fallbackStreet);
    [
      address.city ?? address.town ?? address.village ?? address.municipality ?? address.suburb,
      address.county,
      address.state,
      address.postcode
    ].forEach((part) => {
      const nextPart = String(part ?? '').trim();
      if (nextPart && !parts.some((currentPart) => currentPart.toLowerCase() === nextPart.toLowerCase())) {
        parts.push(nextPart);
      }
    });
    return parts.join(', ');
  };

  const parseKeywords = (value: any): string[] => {
    if (Array.isArray(value)) {
      return value.map((keyword) => String(keyword).trim()).filter(Boolean);
    }

    return String(value ?? '')
      .split(',')
      .map((keyword) => keyword.trim())
      .filter(Boolean);
  };

  const parseSchedule = (value: any) => {
    if (!value) return {};

    try {
      const parsedSchedule = typeof value === 'string' ? JSON.parse(value) : value;
      return parsedSchedule && typeof parsedSchedule === 'object' ? parsedSchedule : {};
    } catch (error) {
      return {};
    }
  };

  useEffect(() => {
    const userId = localStorage.getItem('zipco-user-id');
    const token = localStorage.getItem('zipco-token');

    if (!userId || !token) return;

    const loadUserBusiness = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/businesses`, {
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
        let fullBusiness = currentUserBusiness;

        if (currentBusinessId) {
          try {
            const businessResponse = await fetch(`${API_BASE_URL}/businesses/${currentBusinessId}`, {
              headers: {
                Authorization: `Bearer ${token}`
              }
            });

            if (businessResponse.ok) {
              const businessData = await businessResponse.json();
              fullBusiness = businessData.business ?? businessData;
            }
          } catch (error) {
            fullBusiness = currentUserBusiness;
          }
        }

        setBusinessId(currentBusinessId);
        if (currentBusinessId) {
          localStorage.setItem('zipco-business-id', String(currentBusinessId));
        }
        setHasRegisteredBusiness(true);
        setBusinessInfo((currentBusinessInfo) => ({
          ...currentBusinessInfo,
          name: fullBusiness.name ?? '',
          description: fullBusiness.description ?? '',
          address: fullBusiness.address ?? fullBusiness.location ?? '',
          instagram: fullBusiness.instagram ?? '',
          facebook: fullBusiness.facebook ?? '',
          image:
            fullBusiness.photo ||
            fullBusiness.image ||
            fullBusiness.imageUrl ||
            localStorage.getItem(`zipco-business-${currentBusinessId}-photo`) ||
            ''
        }));
        setBusinessConfig({
          category: fullBusiness.category ?? fullBusiness.categoryName ?? '',
          hashtags: parseKeywords(fullBusiness.keywords ?? fullBusiness.hashtags),
          showFullAddress: fullBusiness.showFullAddress ?? fullBusiness.show_full_address ?? fullBusiness.showOnlyDistance === false,
          fullAddress: fullBusiness.address ?? fullBusiness.location ?? '',
          schedule: parseSchedule(fullBusiness.schedule)
        });
      } catch (error) {
        setHasRegisteredBusiness(false);
      }
    };

    loadUserBusiness();
  }, []);

  useEffect(() => {
    const query = businessSocialForm.address.trim();

    if (!isEditingBusinessInfo || !businessAddressTouched || query.length < 3) {
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
  }, [businessSocialForm.address, businessAddressTouched, isEditingBusinessInfo]);

  const missingBusinessFields = [
    !businessInfo.name?.trim() ? 'Nombre del negocio' : '',
    !businessConfig.category?.trim() ? 'Categoría' : '',
    !businessInfo.description?.trim() ? 'Descripción' : '',
    !businessInfo.address?.trim() ? 'Dirección' : '',
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
    setBusinessAddressTouched(false);
    setIsEditingBusinessInfo(true);
  };

  const handleSaveBusinessInfo = async () => {
    const token = localStorage.getItem('zipco-token');

    if (!businessId || !token) {
      showAppToast('No se pudo guardar el negocio', 'error');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/businesses/${businessId}`, {
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
      setBusinessAddressTouched(false);
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

      const imagePayloads = [
        { photo: imageUrl },
        { image: imageUrl },
        { imageUrl }
      ];
      let wasSaved = false;

      for (const payload of imagePayloads) {
        const saveResponse = await fetch(`${API_BASE_URL}/businesses/${businessId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });

        if (saveResponse.ok) {
          wasSaved = true;
          break;
        }
      }

      localStorage.setItem(`zipco-business-${businessId}-photo`, imageUrl);
      setBusinessInfo((currentBusinessInfo) => ({ ...currentBusinessInfo, image: imageUrl }));
      showAppToast(
        wasSaved ? 'Foto del negocio actualizada' : 'Foto del negocio actualizada en este dispositivo',
        'success'
      );
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
      const response = await fetch(`${API_BASE_URL}/businesses`, {
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
        image: newBusiness.photo || newBusiness.image || newBusiness.imageUrl || ''
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
    businessAddressTouched,
    setBusinessAddressTouched,
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
