import { useRef } from 'react';
import { Camera, ChevronRight, Facebook, ImageIcon, Instagram, MapPinIcon, Phone, Settings, Store } from 'lucide-react';
import { ImageWithFallback } from '../../components/figma/ImageWithFallback';

export default function BusinessInfoSection({
  profileTab,
  hasRegisteredBusiness,
  profileCardClass,
  isBusinessProfileTab,
  isBusinessFieldMissing,
  businessTextClass,
  isEditingBusinessInfo,
  handleSaveBusinessInfo,
  handleStartEditingBusinessInfo,
  businessInfo,
  businessSubtextClass,
  businessSocialForm,
  setBusinessSocialForm,
  businessAddressSuggestions,
  isBusinessAddressLoading,
  getBusinessAddressLabel,
  setBusinessAddressSuggestions,
  setHasBusinessAddressSearched,
  hasBusinessAddressSearched,
  setShowBusinessConfig,
  isBusinessReadyToPublish,
  handlePublishBusiness,
  isUploadingBusinessPhoto,
  uploadBusinessPhoto
}: any) {
  const businessPhotoInputRef = useRef<HTMLInputElement>(null);

  return (
    <>
        {/* Business Info (visible when business mode is ON) */}
        {profileTab === 'negocio' && hasRegisteredBusiness && (
          <>
            {!hasRegisteredBusiness ? (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-md mb-4 text-center">
                <Store className="w-12 h-12 text-teal-500 mx-auto mb-3" />
                <h4 className="font-bold text-gray-900 mb-2">Aún no has registrado tu negocio</h4>
                <button
                  type="button"
                  onClick={() => setShowBusinessConfig(true)}
                  className="mt-3 bg-[#00BFA5] text-white py-3 px-5 rounded-xl font-semibold hover:bg-teal-600 transition-all"
                >
                  Registrar negocio ahora
                </button>
              </div>
            ) : (
            <>
            <div className={`${profileCardClass} rounded-2xl p-5 border shadow-md mb-4 ${
              ['Nombre del negocio', 'Descripción', 'Dirección', 'Teléfono'].some(isBusinessFieldMissing) ? 'border-[#EF4444]' : isBusinessProfileTab ? 'border-white/20' : 'border-white/50'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <h4 className={`font-bold ${businessTextClass}`}>🏪 Datos del Negocio</h4>
                <button
                  type="button"
                  onClick={isEditingBusinessInfo ? handleSaveBusinessInfo : handleStartEditingBusinessInfo}
                  className="text-teal-600 text-sm font-semibold hover:text-teal-700"
                >
                  {isEditingBusinessInfo ? 'Guardar' : 'Editar'}
                </button>
              </div>
              <div className="flex items-center gap-3 mb-3">
                <div className="relative shrink-0">
                  {businessInfo.image ? (
                    <ImageWithFallback
                      src={businessInfo.image}
                      alt={businessInfo.name || 'Negocio'}
                      className="w-16 h-16 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center">
                      <ImageIcon className="w-7 h-7 text-gray-400" />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => businessPhotoInputRef.current?.click()}
                    disabled={isUploadingBusinessPhoto}
                    className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-teal-500 flex items-center justify-center shadow-lg hover:bg-teal-600 transition-colors disabled:opacity-60"
                  >
                    <Camera className="w-3.5 h-3.5 text-white" />
                  </button>
                  <input
                    ref={businessPhotoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadBusinessPhoto(file);
                      e.currentTarget.value = '';
                    }}
                  />
                </div>
                <div className="flex-1">
                  <h5 className={`font-semibold ${businessTextClass}`}>{businessInfo.name}</h5>
                  {isBusinessFieldMissing('Nombre del negocio') && (
                    <p className="text-xs text-[#EF4444] mt-1">Campo requerido para publicar</p>
                  )}
                  <p className={`text-xs ${businessSubtextClass}`}>{businessInfo.description}</p>
                  {isBusinessFieldMissing('Descripción') && (
                    <p className="text-xs text-[#EF4444] mt-1">Campo requerido para publicar</p>
                  )}
                </div>
                {isEditingBusinessInfo ? (
                  <div className="space-y-3 pt-2">
                    <div>
                      <label className={`text-xs mb-1 block ${isBusinessProfileTab ? 'text-white/70' : 'text-gray-500'}`}>Nombre</label>
                      <input
                        type="text"
                        value={businessSocialForm.name}
                        onChange={(e) => setBusinessSocialForm({ ...businessSocialForm, name: e.target.value })}
                        className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                      />
                    </div>
                    <div>
                      <label className={`text-xs mb-1 block ${isBusinessProfileTab ? 'text-white/70' : 'text-gray-500'}`}>Descripción</label>
                      <textarea
                        value={businessSocialForm.description}
                        onChange={(e) => setBusinessSocialForm({ ...businessSocialForm, description: e.target.value })}
                        className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all resize-none"
                        rows={3}
                      />
                    </div>
                    <div>
                      <label className={`text-xs mb-1 block ${isBusinessProfileTab ? 'text-white/70' : 'text-gray-500'}`}>Dirección</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={businessSocialForm.address}
                          onChange={(e) => setBusinessSocialForm({ ...businessSocialForm, address: e.target.value })}
                          className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                        />
                        {businessSocialForm.address.trim().length >= 3 && (
                          <div className="absolute left-0 right-0 top-full mt-2 z-30 max-h-52 overflow-auto rounded-2xl border border-gray-100 bg-white shadow-xl">
                            {isBusinessAddressLoading ? (
                              <p className="px-4 py-3 text-sm text-gray-500">Buscando...</p>
                            ) : businessAddressSuggestions.length > 0 ? (
                              businessAddressSuggestions.map((result, index) => {
                                const label = getBusinessAddressLabel(result);
                                return (
                                  <button
                                    key={`${result.place_id ?? result.osm_id ?? 'business-address'}-${index}`}
                                    type="button"
                                    onClick={() => {
                                      setBusinessSocialForm({ ...businessSocialForm, address: label });
                                      setBusinessAddressSuggestions([]);
                                      setHasBusinessAddressSearched(false);
                                    }}
                                    className="w-full text-left px-4 py-3 text-sm text-gray-700 border-b border-gray-100 last:border-b-0 hover:bg-teal-50 transition-colors"
                                  >
                                    {label}
                                  </button>
                                );
                              })
                            ) : hasBusinessAddressSearched ? (
                              <p className="px-4 py-3 text-sm text-gray-500">No se encontraron resultados</p>
                            ) : null}
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className={`text-xs mb-1 flex items-center gap-1 ${isBusinessProfileTab ? 'text-white/70' : 'text-gray-500'}`}>
                        <Instagram className="w-4 h-4 text-pink-500" />
                        Instagram
                      </label>
                      <input
                        type="text"
                        value={businessSocialForm.instagram}
                        onChange={(e) => setBusinessSocialForm({ ...businessSocialForm, instagram: e.target.value })}
                        placeholder="@tu_negocio"
                        className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                      />
                    </div>
                    <div>
                      <label className={`text-xs mb-1 flex items-center gap-1 ${isBusinessProfileTab ? 'text-white/70' : 'text-gray-500'}`}>
                        <Facebook className="w-4 h-4 text-blue-600" />
                        Facebook
                      </label>
                      <input
                        type="text"
                        value={businessSocialForm.facebook}
                        onChange={(e) => setBusinessSocialForm({ ...businessSocialForm, facebook: e.target.value })}
                        placeholder="facebook.com/tu_negocio"
                        className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 pt-1">
                    {businessInfo.instagram && (
                      <div className="flex items-center gap-2 text-sm">
                        <Instagram className="w-4 h-4 text-pink-500" />
                        <span className={isBusinessProfileTab ? 'text-white' : 'text-gray-700'}>{businessInfo.instagram}</span>
                      </div>
                    )}
                    {businessInfo.facebook && (
                      <div className="flex items-center gap-2 text-sm">
                        <Facebook className="w-4 h-4 text-blue-600" />
                        <span className={isBusinessProfileTab ? 'text-white' : 'text-gray-700'}>{businessInfo.facebook}</span>
                      </div>
                    )}
                    {!businessInfo.instagram && !businessInfo.facebook && (
                      <div className={`border rounded-xl p-3 text-xs ${
                        isBusinessProfileTab ? 'bg-white/10 border-white/20 text-white' : 'bg-yellow-50 border-yellow-200 text-yellow-800'
                      }`}>
                        Agrega tus redes sociales para generar más confianza en tus clientes
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <MapPinIcon className="w-4 h-4 text-gray-400" />
                  <span className={isBusinessProfileTab ? 'text-white' : 'text-gray-700'}>{businessInfo.address}</span>
                </div>
                {isBusinessFieldMissing('Dirección') && (
                  <p className="text-xs text-[#EF4444] pl-6">Campo requerido para publicar</p>
                )}
                <div className="hidden">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700">{businessInfo.phone}</span>
                </div>
                {false && isBusinessFieldMissing('Teléfono') && (
                  <p className="text-xs text-[#EF4444] pl-6">Campo requerido para publicar</p>
                )}
              </div>
            </div>

            {/* Business Configuration Button */}
            <button
              onClick={() => setShowBusinessConfig(true)}
              className={`w-full ${profileCardClass} border rounded-2xl p-4 mb-4 hover:shadow-md transition-all ${
                ['Categoría', 'Horarios de atención', 'Palabras clave'].some(isBusinessFieldMissing) ? 'border-[#EF4444]' : isBusinessProfileTab ? 'border-white/20' : 'border-teal-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-teal-500 rounded-full flex items-center justify-center">
                    <Settings className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <h4 className={`font-bold ${businessTextClass}`}>Configurar Negocio</h4>
                    <p className={`text-xs ${businessSubtextClass}`}>Categoría, hashtags, horarios</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
              {['Categoría', 'Horarios de atención', 'Palabras clave'].filter(isBusinessFieldMissing).map((field) => (
                <div key={field} className="text-left mt-2">
                  <p className="text-xs font-semibold text-[#EF4444]">{field}</p>
                  <p className="text-xs text-[#EF4444]">Campo requerido para publicar</p>
                </div>
              ))}
            </button>

            <button
              type="button"
              onClick={handlePublishBusiness}
              aria-disabled={!isBusinessReadyToPublish}
              className={`w-full py-4 px-6 rounded-2xl font-semibold shadow-lg transition-all active:scale-[0.98] mb-4 ${
                isBusinessReadyToPublish
                  ? 'bg-[#00BFA5] text-white hover:bg-teal-600 shadow-teal-500/30'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-gray-300/30'
              }`}
            >
              Publicar negocio
            </button>
            </>
            )}
          </>
        )}
    </>
  );
}
