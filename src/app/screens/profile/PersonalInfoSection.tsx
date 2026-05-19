import { ChevronRight, Mail, MapPinIcon, Phone, User } from 'lucide-react';

export default function PersonalInfoSection({
  profileTab,
  isEditingPersonalInfo,
  handleStartEditingPersonalInfo,
  personalInfoForm,
  setPersonalInfoForm,
  setPersonalLocationTouched,
  personalLocationTouched,
  personalLocationSuggestions,
  isPersonalLocationLoading,
  hasPersonalLocationSearched,
  getPersonalLocationLabel,
  setPersonalLocationSuggestions,
  setHasPersonalLocationSearched,
  handleCancelEditingPersonalInfo,
  handleSavePersonalInfo,
  userInfo
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
                <input
                  type="tel"
                  value={personalInfoForm.phone}
                  onChange={(e) => setPersonalInfoForm({ ...personalInfoForm, phone: e.target.value })}
                  className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Ubicacion</label>
                <div className="relative">
                  <input
                    type="text"
                    value={personalInfoForm.location}
                    onChange={(e) => {
                      setPersonalLocationTouched(true);
                      setPersonalInfoForm({ ...personalInfoForm, location: e.target.value });
                    }}
                    className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                  />
                  {personalLocationTouched && personalInfoForm.location.trim().length >= 3 && (
                    <div className="absolute left-0 right-0 top-full mt-2 z-30 max-h-52 overflow-auto rounded-2xl border border-gray-100 bg-white shadow-xl">
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
                    <p className="text-sm font-semibold text-gray-900">{userInfo.name}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
              <button className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors">
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <div className="text-left">
                    <p className="text-xs text-gray-500">Telefono</p>
                    <p className="text-sm font-semibold text-gray-900">{userInfo.phone}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
              <button className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors">
                <div className="flex items-center gap-3">
                  <MapPinIcon className="w-5 h-5 text-gray-400" />
                  <div className="text-left">
                    <p className="text-xs text-gray-500">Ubicacion</p>
                    <p className="text-sm font-semibold text-gray-900">{userInfo.address}</p>
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