import { useRef } from "react";
import {
  ArrowLeft,
  Camera,
  Check,
  ChevronRight,
  Facebook,
  ImageIcon,
  Instagram,
  MapPinIcon,
  LoaderCircle,
  Phone,
  Save,
  Settings,
  Store,
} from "lucide-react";
import { ImageWithFallback } from "../../components/figma/ImageWithFallback";

export default function BusinessInfoSection({
  profileTab,
  hasRegisteredBusiness,
  profileCardClass,
  isBusinessProfileTab,
  isBusinessFieldMissing,
  businessTextClass,
  isEditingBusinessInfo,
  handleSaveBusinessInfo,
  isSavingBusinessInfo,
  businessInfoSaveSucceeded,
  handleStartEditingBusinessInfo,
  handleCancelEditingBusinessInfo,
  businessInfo,
  businessSubtextClass,
  businessSocialForm,
  setBusinessSocialForm,
  setShowBusinessConfig,
  isBusinessReadyToPublish,
  businessStatus,
  handlePublishBusiness,
  isUploadingBusinessPhoto,
  uploadBusinessPhoto,
  providerType = "Negocio",
}: any) {
  const businessPhotoInputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      {/* Business Info (visible when business mode is ON) */}
      {profileTab === "negocio" && hasRegisteredBusiness && (
        <>
          {!hasRegisteredBusiness ? (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-md mb-4 text-center">
              <Store className="w-12 h-12 text-teal-500 mx-auto mb-3" />
              <h4 className="font-bold text-gray-900 mb-2">
                Aún no has registrado tu negocio
              </h4>
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
              <div
                className={`${profileCardClass} rounded-2xl p-5 border shadow-md mb-4 ${
                  ["Nombre del negocio", "Descripción", "Dirección"].some(
                    isBusinessFieldMissing,
                  )
                    ? "border-[#EF4444]"
                    : isBusinessProfileTab
                      ? "border-white/20"
                      : "border-white/50"
                }`}
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h4 className={`font-bold ${businessTextClass}`}>
                    🏪 Datos del {providerType}
                  </h4>
                  {isEditingBusinessInfo ? (
                    <button
                      type="button"
                      onClick={handleCancelEditingBusinessInfo}
                      disabled={isSavingBusinessInfo}
                      className={`inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition-all active:scale-95 disabled:opacity-50 ${
                        isBusinessProfileTab
                          ? "border-white/25 bg-white/10 text-white hover:bg-white/15"
                          : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      Volver
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleStartEditingBusinessInfo}
                      className="min-h-9 rounded-full px-3 text-sm font-bold text-teal-400 transition-colors hover:bg-teal-500/10"
                    >
                      Editar
                    </button>
                  )}
                </div>
                <div
                  className="mb-3 flex flex-wrap items-start gap-3"
                >
                  <div className="relative shrink-0">
                    {businessInfo.image ? (
                      <ImageWithFallback
                        src={businessInfo.image}
                        alt={businessInfo.name || "Negocio"}
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
                        e.currentTarget.value = "";
                      }}
                    />
                  </div>
                  <div className="min-w-0 flex-1 pt-1">
                    <h5 className={`font-semibold ${businessTextClass}`}>
                      {businessInfo.name}
                    </h5>
                    <span
                      className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${
                        isBusinessProfileTab
                          ? "bg-teal-400/15 text-teal-200"
                          : "bg-teal-50 text-teal-700"
                      }`}
                    >
                      {providerType}
                    </span>
                    {isBusinessFieldMissing("Nombre del negocio") && (
                      <p className="text-xs text-[#EF4444] mt-1">
                        Campo requerido para publicar
                      </p>
                    )}
                  </div>
                  {!isEditingBusinessInfo && (
                    <div
                      className={`w-full basis-full rounded-xl border px-3.5 py-3 ${
                        isBusinessProfileTab
                          ? "border-white/10 bg-slate-950/25"
                          : "border-slate-100 bg-slate-50"
                      }`}
                    >
                      <p
                        className={`whitespace-pre-wrap break-words text-sm leading-5 ${businessSubtextClass}`}
                      >
                        {businessInfo.description ||
                          "Aún no has agregado una descripción."}
                      </p>
                      {isBusinessFieldMissing("Descripción") && (
                        <p className="mt-1 text-xs text-[#EF4444]">
                          Campo requerido para publicar
                        </p>
                      )}
                    </div>
                  )}
                  {isEditingBusinessInfo ? (
                    <div className="animate-in fade-in slide-in-from-top-2 w-full basis-full space-y-3 pt-3 duration-300">
                      <div>
                        <label
                          className={`text-xs mb-1 block ${isBusinessProfileTab ? "text-white/70" : "text-gray-500"}`}
                        >
                          Nombre
                        </label>
                        <input
                          type="text"
                          value={businessSocialForm.name}
                          onChange={(e) =>
                            setBusinessSocialForm({
                              ...businessSocialForm,
                              name: e.target.value,
                            })
                          }
                          className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                        />
                      </div>
                      <div>
                        <label
                          className={`text-xs mb-1 block ${isBusinessProfileTab ? "text-white/70" : "text-gray-500"}`}
                        >
                          Descripción
                        </label>
                        <textarea
                          value={businessSocialForm.description}
                          onChange={(e) =>
                            setBusinessSocialForm({
                              ...businessSocialForm,
                              description: e.target.value,
                            })
                          }
                          className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all resize-none"
                          rows={3}
                        />
                      </div>
                      <div>
                        <label
                          className={`text-xs mb-1 flex items-center gap-1 ${isBusinessProfileTab ? "text-white/70" : "text-gray-500"}`}
                        >
                          <Instagram className="w-4 h-4 text-pink-500" />
                          Instagram
                        </label>
                        <input
                          type="text"
                          value={businessSocialForm.instagram}
                          onChange={(e) =>
                            setBusinessSocialForm({
                              ...businessSocialForm,
                              instagram: e.target.value,
                            })
                          }
                          placeholder="@tu_negocio"
                          className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                        />
                      </div>
                      <div>
                        <label
                          className={`text-xs mb-1 flex items-center gap-1 ${isBusinessProfileTab ? "text-white/70" : "text-gray-500"}`}
                        >
                          <Facebook className="w-4 h-4 text-blue-600" />
                          Facebook
                        </label>
                        <input
                          type="text"
                          value={businessSocialForm.facebook}
                          onChange={(e) =>
                            setBusinessSocialForm({
                              ...businessSocialForm,
                              facebook: e.target.value,
                            })
                          }
                          placeholder="facebook.com/tu_negocio"
                          className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="w-full basis-full space-y-2 pt-1">
                      {businessInfo.instagram && (
                        <div className="flex items-center gap-2 text-sm">
                          <Instagram className="w-4 h-4 text-pink-500" />
                          <span
                            className={
                              isBusinessProfileTab
                                ? "text-white"
                                : "text-gray-700"
                            }
                          >
                            {businessInfo.instagram}
                          </span>
                        </div>
                      )}
                      {businessInfo.facebook && (
                        <div className="flex items-center gap-2 text-sm">
                          <Facebook className="w-4 h-4 text-blue-600" />
                          <span
                            className={
                              isBusinessProfileTab
                                ? "text-white"
                                : "text-gray-700"
                            }
                          >
                            {businessInfo.facebook}
                          </span>
                        </div>
                      )}
                      {!businessInfo.instagram && !businessInfo.facebook && (
                        <button
                          type="button"
                          onClick={handleStartEditingBusinessInfo}
                          className={`group flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 ${
                            isBusinessProfileTab
                              ? "border-teal-300/25 bg-teal-400/10 text-white"
                              : "border-teal-200 bg-teal-50 text-slate-800"
                          }`}
                        >
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-blue-600 text-white shadow-sm">
                            <Instagram className="h-4 w-4" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <strong className="block text-sm">
                              Agregar redes sociales
                            </strong>
                            <span
                              className={`mt-0.5 block text-xs ${businessSubtextClass}`}
                            >
                              Añade Instagram o Facebook desde aquí.
                            </span>
                          </span>
                          <ChevronRight className="h-5 w-5 shrink-0 text-teal-400 transition-transform group-hover:translate-x-0.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPinIcon className="w-4 h-4 text-gray-400" />
                    <span
                      className={
                        isBusinessProfileTab ? "text-white" : "text-gray-700"
                      }
                    >
                      {businessInfo.address}
                    </span>
                  </div>
                  {isBusinessFieldMissing("Dirección") && (
                    <p className="text-xs text-[#EF4444] pl-6">
                      Campo requerido para publicar
                    </p>
                  )}
                  <div className="hidden">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-700">{businessInfo.phone}</span>
                  </div>
                  {false && isBusinessFieldMissing("Teléfono") && (
                    <p className="text-xs text-[#EF4444] pl-6">
                      Campo requerido para publicar
                    </p>
                  )}
                </div>
              </div>

              {isEditingBusinessInfo && (
                <div className="mb-4 rounded-2xl border border-teal-400/30 bg-gradient-to-r from-teal-500/10 via-cyan-400/10 to-emerald-400/10 p-2 shadow-lg shadow-teal-500/10 backdrop-blur-sm">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleCancelEditingBusinessInfo}
                      disabled={isSavingBusinessInfo}
                      className={`flex min-h-14 shrink-0 items-center justify-center gap-1.5 rounded-xl border px-3 text-sm font-bold transition-all active:scale-[0.97] disabled:opacity-50 ${
                        isBusinessProfileTab
                          ? "border-white/25 bg-white/10 text-white hover:bg-white/15"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Volver
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveBusinessInfo}
                      disabled={
                        isSavingBusinessInfo || businessInfoSaveSucceeded
                      }
                      aria-live="polite"
                      className={`flex min-h-14 min-w-0 flex-1 items-center justify-center gap-2 rounded-xl px-3 py-3.5 font-bold text-white shadow-lg transition-all duration-300 active:scale-[0.98] disabled:cursor-default ${
                        businessInfoSaveSucceeded
                          ? "scale-[1.01] bg-emerald-500 shadow-emerald-500/30"
                          : "bg-gradient-to-r from-[#00A99D] to-[#00C98D] shadow-teal-500/25 hover:brightness-105"
                      }`}
                    >
                      {businessInfoSaveSucceeded ? (
                        <Check className="h-6 w-6 animate-bounce" />
                      ) : isSavingBusinessInfo ? (
                        <LoaderCircle className="h-5 w-5 animate-spin" />
                      ) : (
                        <Save className="h-5 w-5" />
                      )}
                      <span>
                        {businessInfoSaveSucceeded
                          ? "Cambios guardados"
                          : isSavingBusinessInfo
                            ? "Guardando..."
                            : "Guardar cambios"}
                      </span>
                    </button>
                  </div>
                  {!businessInfoSaveSucceeded && (
                    <p
                      className={`px-2 pb-1 pt-2 text-center text-xs ${
                        isBusinessProfileTab
                          ? "text-white/70"
                          : "text-slate-500"
                      }`}
                    >
                      Guarda primero la información antes de publicarla.
                    </p>
                  )}
                </div>
              )}

              {/* Business Configuration Button */}
              <button
                onClick={() => setShowBusinessConfig(true)}
                className={`w-full ${profileCardClass} border rounded-2xl p-4 mb-4 hover:shadow-md transition-all ${
                  ["Categoría", "Horarios de atención", "Palabras clave"].some(
                    isBusinessFieldMissing,
                  )
                    ? "border-[#EF4444]"
                    : isBusinessProfileTab
                      ? "border-white/20"
                      : "border-teal-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-teal-500 rounded-full flex items-center justify-center">
                      <Settings className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-left">
                      <h4 className={`font-bold ${businessTextClass}`}>
                        Configurar {providerType}
                      </h4>
                      <p className={`text-xs ${businessSubtextClass}`}>
                        Categoría, hashtags, horarios
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
                {[
                  "Categoría",
                  "Horarios de atención",
                  "Palabras clave",
                  "Atención presencial",
                  "Servicio a domicilio",
                  "Modalidad de atención",
                ]
                  .filter(isBusinessFieldMissing)
                  .map((field) => (
                    <div key={field} className="text-left mt-2">
                      <p className="text-xs font-semibold text-[#EF4444]">
                        {field}
                      </p>
                      <p className="text-xs text-[#EF4444]">
                        Campo requerido para publicar
                      </p>
                    </div>
                  ))}
              </button>

              {!isEditingBusinessInfo && (
                <button
                  type="button"
                  onClick={handlePublishBusiness}
                  disabled={businessStatus === "approved"}
                  aria-disabled={
                    !isBusinessReadyToPublish || businessStatus === "approved"
                  }
                  className={`w-full py-4 px-6 rounded-2xl font-semibold shadow-lg transition-all active:scale-[0.98] mb-4 ${
                    businessStatus === "approved"
                      ? "border border-emerald-300 bg-emerald-50 text-emerald-700 shadow-emerald-500/10"
                      : isBusinessReadyToPublish
                        ? "bg-[#00BFA5] text-white hover:bg-teal-600 shadow-teal-500/30"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed shadow-gray-300/30"
                  }`}
                >
                  {businessStatus === "approved"
                    ? `${providerType} publicado`
                    : `Publicar ${providerType.toLowerCase()}`}
                </button>
              )}
            </>
          )}
        </>
      )}
    </>
  );
}
