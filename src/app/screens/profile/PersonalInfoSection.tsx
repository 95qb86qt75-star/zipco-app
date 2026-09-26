import { ChevronRight, Lock, Mail, MapPinIcon, Phone, User, X } from 'lucide-react';
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
  isLoadingUserInfo
}: any) {
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
