import { useLayoutEffect, useRef, useState } from "react";
import { ArrowLeft, Camera, User } from "lucide-react";
import { ImageWithFallback } from "../../components/figma/ImageWithFallback";
import BusinessConfigScreen from "./BusinessConfigScreen";
import BusinessInfoSection from "./BusinessInfoSection";
import BusinessRegistrationCard from "./BusinessRegistrationCard";
import PersonalInfoSection from "./PersonalInfoSection";
import QuickActionsCard from "./QuickActionsCard";
import { useBusinessProfile } from "./profile-screen/useBusinessProfile";
import { usePersonalProfile } from "./profile-screen/usePersonalProfile";

export default function ProfileScreen({
  activeTab,
  setActiveTab,
  onBack,
  onLogout,
}: {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onBack: () => void;
  onLogout: () => void;
}) {
  const [profileTab, setProfileTab] = useState<"personal" | "negocio">(
    "personal",
  );
  const [showBusinessConfig, setShowBusinessConfig] = useState(false);
  const profilePhotoInputRef = useRef<HTMLInputElement>(null);
  const profileContentRef = useRef<HTMLDivElement>(null);
  const personalProfile = usePersonalProfile();
  const businessProfile = useBusinessProfile();

  useLayoutEffect(() => {
    profileContentRef.current?.scrollTo({ top: 0 });
  }, [profileTab]);

  if (showBusinessConfig) {
    return (
      <BusinessConfigScreen
        providerType={businessProfile.providerType}
        onBack={() => setShowBusinessConfig(false)}
        onSave={(config) => businessProfile.setBusinessConfig(config)}
      />
    );
  }

  const isBusinessProfileTab = profileTab === "negocio";
  const profileCardClass = isBusinessProfileTab
    ? "bg-white/10 backdrop-blur-sm border-white/20"
    : "bg-white/80 backdrop-blur-sm border-white/50";
  const businessTextClass = isBusinessProfileTab
    ? "text-white"
    : "text-gray-900";
  const businessSubtextClass = isBusinessProfileTab
    ? "text-white/70"
    : "text-gray-600";

  return (
    <div
      className={`size-full flex flex-col ${isBusinessProfileTab ? "bg-gradient-to-b from-[#0F172A] via-[#1E3A5F] to-[#0F172A]" : "bg-white"}`}
    >
      <div
        className="px-4 pb-4 border-b border-white/50"
        style={{ paddingTop: "max(1.5rem, env(safe-area-inset-top))" }}
      >
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={onBack}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div className="flex-1">
            <h2
              className={`text-xl font-bold ${isBusinessProfileTab ? "text-white" : "text-gray-900"}`}
            >
              Mi Perfil
            </h2>
          </div>
        </div>
      </div>

      <div
        ref={profileContentRef}
        className="min-h-0 flex-1 overflow-auto px-4 pt-4 pb-24"
      >
        <div
          className={`${profileCardClass} rounded-2xl p-6 border shadow-lg mb-4`}
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="relative">
              {personalProfile.userInfo.profileImage ? (
                <ImageWithFallback
                  src={personalProfile.userInfo.profileImage}
                  alt={personalProfile.userInfo.name || "Perfil"}
                  className="w-20 h-20 rounded-full object-cover border-4 border-teal-500"
                />
              ) : (
                <div className="w-20 h-20 rounded-full border-4 border-teal-500 bg-teal-50 flex items-center justify-center">
                  <User className="w-9 h-9 text-teal-500" />
                </div>
              )}
              <button
                type="button"
                onClick={() => profilePhotoInputRef.current?.click()}
                disabled={personalProfile.isUploadingProfilePhoto}
                className="absolute bottom-0 right-0 w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center shadow-lg hover:bg-teal-600 transition-colors disabled:opacity-60"
              >
                <Camera className="w-4 h-4 text-white" />
              </button>
              <input
                ref={profilePhotoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) personalProfile.uploadProfilePhoto(file);
                  e.currentTarget.value = "";
                }}
              />
            </div>
            <div className="flex-1">
              <h3
                className={`text-xl font-bold ${isBusinessProfileTab ? "text-white" : "text-gray-900"}`}
              >
                {personalProfile.userInfo.name}
              </h3>
            </div>
          </div>
          {businessProfile.hasRegisteredBusiness && (
            <div
              role="tablist"
              aria-label="Cambiar tipo de perfil"
              className={`relative grid grid-cols-2 rounded-full border p-1 shadow-inner ${
                isBusinessProfileTab
                  ? "border-slate-500/80 bg-slate-950/55"
                  : "border-slate-200 bg-slate-200/90"
              }`}
            >
              <span
                aria-hidden="true"
                className={`pointer-events-none absolute bottom-1 top-1 left-1 w-[calc(50%-0.25rem)] rounded-full shadow-md transition-transform duration-300 ease-out motion-reduce:transition-none ${
                  isBusinessProfileTab
                    ? "translate-x-full bg-gradient-to-r from-teal-500 to-cyan-500"
                    : "translate-x-0 bg-white"
                }`}
              />
              {[
                { id: "personal", label: "Personal" },
                { id: "negocio", label: businessProfile.providerType },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={profileTab === tab.id}
                  onClick={() =>
                    setProfileTab(tab.id as "personal" | "negocio")
                  }
                  className={`relative z-10 min-h-10 rounded-full px-4 py-2 text-sm font-bold transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300 focus-visible:ring-offset-2 ${
                    profileTab === tab.id
                      ? tab.id === "negocio"
                        ? "text-white"
                        : "text-teal-700"
                      : isBusinessProfileTab
                        ? "text-slate-200 hover:text-white"
                        : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <BusinessInfoSection
          profileTab={profileTab}
          hasRegisteredBusiness={businessProfile.hasRegisteredBusiness}
          profileCardClass={profileCardClass}
          isBusinessProfileTab={isBusinessProfileTab}
          isBusinessFieldMissing={businessProfile.isBusinessFieldMissing}
          businessTextClass={businessTextClass}
          isEditingBusinessInfo={businessProfile.isEditingBusinessInfo}
          handleSaveBusinessInfo={businessProfile.handleSaveBusinessInfo}
          isSavingBusinessInfo={businessProfile.isSavingBusinessInfo}
          businessInfoSaveSucceeded={businessProfile.businessInfoSaveSucceeded}
          handleStartEditingBusinessInfo={
            businessProfile.handleStartEditingBusinessInfo
          }
          businessInfo={businessProfile.businessInfo}
          businessSubtextClass={businessSubtextClass}
          businessSocialForm={businessProfile.businessSocialForm}
          setBusinessSocialForm={businessProfile.setBusinessSocialForm}
          setShowBusinessConfig={setShowBusinessConfig}
          isBusinessReadyToPublish={businessProfile.isBusinessReadyToPublish}
          businessStatus={businessProfile.businessStatus}
          handlePublishBusiness={businessProfile.handlePublishBusiness}
          isUploadingBusinessPhoto={businessProfile.isUploadingBusinessPhoto}
          uploadBusinessPhoto={businessProfile.uploadBusinessPhoto}
          providerType={businessProfile.providerType}
        />
        <PersonalInfoSection
          profileTab={profileTab}
          isEditingPersonalInfo={personalProfile.isEditingPersonalInfo}
          handleStartEditingPersonalInfo={
            personalProfile.handleStartEditingPersonalInfo
          }
          personalInfoForm={personalProfile.personalInfoForm}
          setPersonalInfoForm={personalProfile.setPersonalInfoForm}
          setPersonalLocationTouched={
            personalProfile.setPersonalLocationTouched
          }
          personalLocationTouched={personalProfile.personalLocationTouched}
          isPersonalLocationConfirmed={
            personalProfile.isPersonalLocationConfirmed
          }
          setIsPersonalLocationConfirmed={
            personalProfile.setIsPersonalLocationConfirmed
          }
          personalLocationSuggestions={
            personalProfile.personalLocationSuggestions
          }
          isPersonalLocationLoading={personalProfile.isPersonalLocationLoading}
          hasPersonalLocationSearched={
            personalProfile.hasPersonalLocationSearched
          }
          getPersonalLocationLabel={personalProfile.getPersonalLocationLabel}
          setPersonalLocationSuggestions={
            personalProfile.setPersonalLocationSuggestions
          }
          setHasPersonalLocationSearched={
            personalProfile.setHasPersonalLocationSearched
          }
          handleCancelEditingPersonalInfo={
            personalProfile.handleCancelEditingPersonalInfo
          }
          handleSavePersonalInfo={personalProfile.handleSavePersonalInfo}
          userInfo={personalProfile.userInfo}
          isLoadingUserInfo={personalProfile.isLoadingUserInfo}
          handlePhoneChanged={personalProfile.handlePhoneChanged}
        />
        <QuickActionsCard profileTab={profileTab} onLogout={onLogout} />

        <BusinessRegistrationCard
          profileTab={profileTab}
          hasRegisteredBusiness={businessProfile.hasRegisteredBusiness}
          profileCardClass={profileCardClass}
          showBusinessRegistrationForm={
            businessProfile.showBusinessRegistrationForm
          }
          businessRegistrationForm={businessProfile.businessRegistrationForm}
          setBusinessRegistrationForm={
            businessProfile.setBusinessRegistrationForm
          }
          isBusinessProfileTab={isBusinessProfileTab}
          setShowBusinessRegistrationForm={
            businessProfile.setShowBusinessRegistrationForm
          }
          handleRegisterBusiness={businessProfile.handleRegisterBusiness}
        />
      </div>
    </div>
  );
}
