import { useState } from 'react';
import { ChevronRight, Lock, Mail, MapPinIcon, Phone, User, X } from 'lucide-react';
import { API_BASE_URL } from '../../api/apiConfig';
import { showAppToast } from '../Toast';
import { LOCATION_SUGGESTIONS_PANEL_CLASS } from './locationSuggestionLayout';

export const formatChileanMobile = (phone: string) => {
  const digits = String(phone ?? '').replace(/\D/g, '');
  const nationalNumber = digits.startsWith('56') ? digits.slice(2) : digits;
  if (!/^9\d{8}$/.test(nationalNumber)) return phone || 'Sin completar';
  return `+56 9 ${nationalNumber.slice(1, 5)} ${nationalNumber.slice(5)}`;
};

export default function PersonalInfoSection({
  profileTab,
  isEditingPersonalInfo,
  handleStartEditingPersonalInfo,
  personalInfoForm,
  setPersonalInfoForm,
  setPersonalLocationTouched,
  personalLocationTouched,
  isPersonalLocationConfirmed,
  setIsPersonalLocationConfirmed,
  personalLocationSuggestions,
  isPersonalLocationLoading,
  hasPersonalLocationSearched,
  getPersonalLocationLabel,
  setPersonalLocationSuggestions,
  setHasPersonalLocationSearched,
  handleCancelEditingPersonalInfo,
  handleSavePersonalInfo,
  userInfo,
  isLoadingUserInfo,
  handlePhoneChanged
}: any) {
  const [showPhoneChange, setShowPhoneChange] = useState(false);
  const [phoneDigits, setPhoneDigits] = useState('');
  const [phoneCode, setPhoneCode] = useState('');
  const [qaPhoneCode, setQaPhoneCode] = useState('');
  const [phoneStep, setPhoneStep] = useState<'phone' | 'code'>('phone');
  const [isPhoneSubmitting, setIsPhoneSubmitting] = useState(false);

  const newPhone = `569${phoneDigits}`;
  const closePhoneChange = () => {
    setShowPhoneChange(false);
    setPhoneDigits('');
    setPhoneCode('');
    setQaPhoneCode('');
    setPhoneStep('phone');
  };
  const submitPhoneChange = async () => {
    if (phoneDigits.length !== 8) {
      showAppToast('Ingresa los 8 dígitos de tu celular', 'error');
      return;
    }
    const token = localStorage.getItem('zipco-token');
    if (!token) return;
    setIsPhoneSubmitting(true);
    try {
      const path = phoneStep === 'phone' ? 'request-code' : 'confirm';
      const response = await fetch(`${API_BASE_URL}/auth/change-phone/${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(phoneStep === 'phone' ? { phone: newPhone } : { phone: newPhone, code: phoneCode })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        showAppToast(data.message ?? 'No se pudo verificar el teléfono', 'error');
        return;
      }
      if (phoneStep === 'phone') {
        setPhoneStep('code');
        setQaPhoneCode(data.qaCode ?? '');
        showAppToast(data.qaCode ? 'Código de prueba QA generado' : 'Código enviado por SMS', 'success');
      } else {
        handlePhoneChanged(newPhone, data.access_token);
        showAppToast('Teléfono verificado correctamente', 'success');
        closePhoneChange();
      }
    } catch {
      showAppToast('No se pudo conectar, intenta nuevamente', 'error');
    } finally {
      setIsPhoneSubmitting(false);
    }
  };
  return (
    <>
        {/* Personal Information */}
        {profileTab === 'personal' && (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-white/50 shadow-md mb-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold text-gray-900">Informacion Personal</h4>
            {!isEditingPersonalInfo && (
              <button
                type="button"
                onClick={handleStartEditingPersonalInfo}
                className="text-teal-600 text-sm font-semibold hover:text-teal-700"
              >
                Editar
              </button>
            )}
          </div>
          {isEditingPersonalInfo ? (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Nombre</label>
                <input
                  type="text"
                  value={personalInfoForm.name}
                  onChange={(e) => setPersonalInfoForm({ ...personalInfoForm, name: e.target.value })}
                  className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Telefono</label>
                <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-100 p-3 text-sm text-gray-700">
                  <Lock className="h-4 w-4 shrink-0 text-gray-400" />
                  <span className="font-medium">{formatChileanMobile(userInfo.phone)}</span>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {userInfo.phone
                    ? 'Para cambiarlo se requiere verificacion por SMS.'
                    : 'Esta cuenta no tiene un telefono verificado.'}
                </p>
                <button
                  type="button"
                  onClick={() => setShowPhoneChange(true)}
                  className="mt-2 text-sm font-semibold text-teal-600 hover:text-teal-700"
                >
                  {userInfo.phone ? 'Cambiar teléfono' : 'Agregar teléfono'}
                </button>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Ubicacion</label>
                <div className="relative">
                  {isPersonalLocationConfirmed ? (
                    <div className="flex items-center gap-2 rounded-xl border border-teal-200 bg-teal-50 px-3 py-2.5">
                      <span
                        className="min-w-0 flex-1 truncate text-sm font-medium text-teal-800"
                        title={personalInfoForm.location}
                      >
                        {personalInfoForm.location}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setPersonalInfoForm({ ...personalInfoForm, location: '' });
                          setPersonalLocationSuggestions([]);
                          setHasPersonalLocationSearched(false);
                          setPersonalLocationTouched(false);
                          setIsPersonalLocationConfirmed(false);
                        }}
                        aria-label="Borrar ubicacion seleccionada"
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-700 transition-colors hover:bg-teal-200"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={personalInfoForm.location}
                      onChange={(e) => {
                        setPersonalLocationTouched(true);
                        setIsPersonalLocationConfirmed(false);
                        setPersonalInfoForm({ ...personalInfoForm, location: e.target.value });
                      }}
                      className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                    />
                  )}
                  {personalLocationTouched && personalInfoForm.location.trim().length >= 3 && (
                    <div className={LOCATION_SUGGESTIONS_PANEL_CLASS}>
                      {isPersonalLocationLoading ? (
                        <p className="px-4 py-3 text-sm text-gray-500">Buscando...</p>
                      ) : personalLocationSuggestions.length > 0 ? (
                        personalLocationSuggestions.map((result, index) => {
                          const label = getPersonalLocationLabel(result);
                          return (
                            <button
                              key={`${result.place_id ?? result.osm_id ?? 'personal-location'}-${index}`}
                              type="button"
                              onClick={() => {
                                setPersonalInfoForm({ ...personalInfoForm, location: label });
                                setPersonalLocationSuggestions([]);
                                setHasPersonalLocationSearched(false);
                                setPersonalLocationTouched(false);
                                setIsPersonalLocationConfirmed(true);
                              }}
                              className="w-full text-left px-4 py-3 text-sm text-gray-700 border-b border-gray-100 last:border-b-0 hover:bg-teal-50 transition-colors"
                            >
                              {label}
                            </button>
                          );
                        })
                      ) : hasPersonalLocationSearched ? (
                        <p className="px-4 py-3 text-sm text-gray-500">No se encontraron resultados</p>
                      ) : null}
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCancelEditingPersonalInfo}
                  className="bg-gray-100 text-gray-800 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSavePersonalInfo}
                  className="bg-[#00BFA5] text-white py-3 rounded-xl font-semibold hover:bg-teal-600 transition-all"
                >
                  Guardar
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <button className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-gray-400" />
                  <div className="text-left">
                    <p className="text-xs text-gray-500">Nombre</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {isLoadingUserInfo ? 'Cargando...' : userInfo.name || 'Sin completar'}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
              <button className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors">
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <div className="text-left">
                    <p className="text-xs text-gray-500">Telefono</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {isLoadingUserInfo ? 'Cargando...' : formatChileanMobile(userInfo.phone)}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
              <button className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors">
                <div className="flex items-center gap-3">
                  <MapPinIcon className="w-5 h-5 text-gray-400" />
                  <div className="text-left">
                    <p className="text-xs text-gray-500">Ubicacion</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {isLoadingUserInfo ? 'Cargando...' : userInfo.address || 'Sin completar'}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          )}
        </div>
        )}
        {showPhoneChange && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 px-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl">
              <h3 className="text-lg font-bold text-gray-900">
                {phoneStep === 'phone' ? (userInfo.phone ? 'Cambiar teléfono' : 'Agregar teléfono') : 'Ingresa el código SMS'}
              </h3>
              {phoneStep === 'phone' ? (
                <div className="mt-4 flex overflow-hidden rounded-xl border border-gray-300 focus-within:border-teal-500">
                  <span className="bg-gray-100 px-3 py-3 font-semibold text-gray-700">+56 9</span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    value={phoneDigits}
                    onChange={(event) => setPhoneDigits(event.target.value.replace(/\D/g, '').slice(0, 8))}
                    placeholder="1234 5678"
                    className="min-w-0 flex-1 px-3 py-3 outline-none"
                  />
                </div>
              ) : (
                <>
                  {qaPhoneCode && (
                    <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
                      Simulación QA — código: <strong>{qaPhoneCode}</strong>
                    </div>
                  )}
                  <input
                    type="tel"
                    inputMode="numeric"
                    value={phoneCode}
                    onChange={(event) => setPhoneCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Código de 6 dígitos"
                    className="mt-4 w-full rounded-xl border border-gray-300 px-3 py-3 outline-none focus:border-teal-500"
                  />
                </>
              )}
              <div className="mt-5 grid grid-cols-2 gap-3">
                <button type="button" onClick={closePhoneChange} className="rounded-xl bg-gray-100 py-3 font-semibold text-gray-800">Cancelar</button>
                <button
                  type="button"
                  disabled={isPhoneSubmitting || (phoneStep === 'code' && phoneCode.length !== 6)}
                  onClick={submitPhoneChange}
                  className="rounded-xl bg-teal-500 py-3 font-semibold text-white disabled:opacity-50"
                >
                  {isPhoneSubmitting ? 'Procesando...' : phoneStep === 'phone' ? 'Enviar código' : 'Verificar'}
                </button>
              </div>
            </div>
          </div>
        )}
        {false && (
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

        )}
    </>
  );
}
