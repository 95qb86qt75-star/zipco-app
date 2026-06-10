import { useEffect, useState } from 'react';
import { showAppToast } from '../../Toast';

export function usePersonalProfile() {
  const [userInfo, setUserInfo] = useState({
    name: 'María González',
    email: 'maria.gonzalez@email.com',
    phone: '',
    address: '',
    profileImage: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&q=80'
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

  useEffect(() => {
    const userId = localStorage.getItem('zipco-user-id');
    const token = localStorage.getItem('zipco-token');

    if (!userId || !token) return;

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
          name: data.name ?? currentUserInfo.name,
          email: data.email ?? currentUserInfo.email,
          phone: data.phone ?? '',
          address: data.location ?? data.address ?? ''
        }));
      } catch (error) {
        // Mantener datos locales si el backend no responde.
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
        const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}+Chile&format=json&limit=5&countrycodes=cl`);
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
    return parts.join(', ');
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

      setUserInfo((currentUserInfo) => ({
        ...currentUserInfo,
        name: personalInfoForm.name,
        phone: personalInfoForm.phone,
        address: personalInfoForm.location
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
    handleStartEditingPersonalInfo,
    handleCancelEditingPersonalInfo,
    getPersonalLocationLabel,
    handleSavePersonalInfo
  };
}
