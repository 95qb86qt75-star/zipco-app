import { useEffect, useState } from 'react';
import { showAppToast } from '../../Toast';

export function usePersonalProfile() {
  const [userInfo, setUserInfo] = useState({
    name: '',
    email: '',
    phone: localStorage.getItem('zipco-user-phone') ?? '',
    address: localStorage.getItem('zipco-user-location') ?? '',
    profileImage: ''
  });
  const [isEditingPersonalInfo, setIsEditingPersonalInfo] = useState(false);
  const [personalInfoForm, setPersonalInfoForm] = useState({
    name: '',
    phone: '',
    location: ''
  });
  const [personalLocationSuggestions, setPersonalLocationSuggestions] = useState<any[]>([]);
  const [isPersonalLocationLoading, setIsPersonalLocationLoading] = useState(false);
  const [hasPersonalLocationSearched, setHasPersonalLocationSearched] = useState(false);
  const [personalLocationTouched, setPersonalLocationTouched] = useState(false);
  const [isUploadingProfilePhoto, setIsUploadingProfilePhoto] = useState(false);
  const [isLoadingUserInfo, setIsLoadingUserInfo] = useState(true);

  useEffect(() => {
    const userId = localStorage.getItem('zipco-user-id');
    const token = localStorage.getItem('zipco-token');
    const savedPhone = localStorage.getItem('zipco-user-phone') ?? '';
    const savedLocation = localStorage.getItem('zipco-user-location') ?? '';

    if (!userId || !token) {
      setIsLoadingUserInfo(false);
      return;
    }

    const loadUserInfo = async () => {
      try {
        const response = await fetch(`https://zipco-backend-production.up.railway.app/users/${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!response.ok) return;

        const data = await response.json();
        setUserInfo((currentUserInfo) => ({
          ...currentUserInfo,
          name: data.name ?? '',
          email: data.email ?? '',
          phone: data.phone ?? savedPhone,
          address: savedLocation,
          profileImage:
            data.photo ||
            data.profileImage ||
            data.profile_image ||
            data.image ||
            data.imageUrl ||
            localStorage.getItem('zipco-user-profile-photo') ||
            ''
        }));
      } catch (error) {
        // Mantener datos locales si el backend no responde.
      } finally {
        setIsLoadingUserInfo(false);
      }
    };

    loadUserInfo();
  }, []);

  useEffect(() => {
    const query = personalInfoForm.location.trim();

    if (!isEditingPersonalInfo || !personalLocationTouched || query.length < 3) {
      setPersonalLocationSuggestions([]);
      setIsPersonalLocationLoading(false);
      setHasPersonalLocationSearched(false);
      return;
    }

    setIsPersonalLocationLoading(true);
    setHasPersonalLocationSearched(false);

    const timeout = setTimeout(async () => {
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}+Chile&format=json&limit=5&countrycodes=cl&addressdetails=1`);
        const data = await response.json();
        setPersonalLocationSuggestions(Array.isArray(data) ? data : []);
      } catch (error) {
        setPersonalLocationSuggestions([]);
      } finally {
        setIsPersonalLocationLoading(false);
        setHasPersonalLocationSearched(true);
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [personalInfoForm.location, isEditingPersonalInfo, personalLocationTouched]);

  const handleStartEditingPersonalInfo = () => {
    setPersonalInfoForm({
      name: userInfo.name,
      phone: userInfo.phone,
      location: userInfo.address
    });
    setPersonalLocationTouched(false);
    setIsEditingPersonalInfo(true);
  };

  const handleCancelEditingPersonalInfo = () => {
    setIsEditingPersonalInfo(false);
    setPersonalInfoForm({
      name: '',
      phone: '',
      location: ''
    });
    setPersonalLocationSuggestions([]);
    setHasPersonalLocationSearched(false);
    setPersonalLocationTouched(false);
  };

  const getPersonalLocationLabel = (result: any) => {
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

  const uploadProfilePhoto = async (file: File) => {
    const userId = localStorage.getItem('zipco-user-id');
    const token = localStorage.getItem('zipco-token');

    if (!userId || !token) return;

    setIsUploadingProfilePhoto(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'zipco_products');

      const uploadResponse = await fetch('https://api.cloudinary.com/v1_1/dr6xu5xr9/image/upload', {
        method: 'POST',
        body: formData
      });

      if (!uploadResponse.ok) {
        showAppToast('No se pudo subir la foto de perfil', 'error');
        return;
      }

      const uploadData = await uploadResponse.json();
      const imageUrl = uploadData.secure_url ?? uploadData.url ?? '';

      localStorage.setItem('zipco-user-profile-photo', imageUrl);
      setUserInfo((currentUserInfo) => ({ ...currentUserInfo, profileImage: imageUrl }));
      showAppToast('Foto de perfil actualizada', 'success');

      const imagePayloads = [{ photo: imageUrl }, { profileImage: imageUrl }, { image: imageUrl }, { imageUrl }];
      imagePayloads.reduce(
        (previousRequest, payload) => previousRequest.then(async (wasSaved) => {
          if (wasSaved) return true;
          const saveResponse = await fetch(`https://zipco-backend-production.up.railway.app/users/${userId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(payload)
          });
          return saveResponse.ok;
        }).catch(() => false),
        Promise.resolve(false)
      );
    } catch (error) {
      showAppToast('No se pudo subir la foto de perfil', 'error');
    } finally {
      setIsUploadingProfilePhoto(false);
    }
  };
  const handleSavePersonalInfo = async () => {
    const userId = localStorage.getItem('zipco-user-id');
    const token = localStorage.getItem('zipco-token');

    if (!userId || !token) return;

    try {
      const response = await fetch(`https://zipco-backend-production.up.railway.app/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: personalInfoForm.name,
          phone: personalInfoForm.phone,
          location: personalInfoForm.location
        })
      });

      if (!response.ok) return;

      const nextLocation = personalInfoForm.location.trim();
      if (nextLocation) {
        localStorage.setItem('zipco-user-location', nextLocation);
      } else {
        localStorage.removeItem('zipco-user-location');
      }

      setUserInfo((currentUserInfo) => ({
        ...currentUserInfo,
        name: personalInfoForm.name,
        phone: personalInfoForm.phone,
        address: nextLocation
      }));
      setIsEditingPersonalInfo(false);
      setPersonalLocationTouched(false);
      showAppToast('Datos actualizados correctamente', 'success');
    } catch (error) {
      // Mantener datos locales si el backend no responde.
    }
  };

  return {
    userInfo,
    isEditingPersonalInfo,
    personalInfoForm,
    setPersonalInfoForm,
    personalLocationSuggestions,
    setPersonalLocationSuggestions,
    isPersonalLocationLoading,
    hasPersonalLocationSearched,
    setHasPersonalLocationSearched,
    personalLocationTouched,
    setPersonalLocationTouched,
    isUploadingProfilePhoto,
    isLoadingUserInfo,
    handleStartEditingPersonalInfo,
    handleCancelEditingPersonalInfo,
    getPersonalLocationLabel,
    uploadProfilePhoto,
    handleSavePersonalInfo
  };
}
