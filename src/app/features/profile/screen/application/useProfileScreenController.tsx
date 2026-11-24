import { useLayoutEffect, useRef, useState } from "react";







import { useBusinessProfile } from "../../application/useBusinessProfile";
import { usePersonalProfile } from "../../application/usePersonalProfile";

export function useProfileScreenController({
  activeTab,
  setActiveTab,
  onBack,
  onLogout,
}: {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onBack: () => void;
  onLogout: () => void;
}){

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


return {businessProfile,onBack,onLogout,personalProfile,profileContentRef,profilePhotoInputRef,profileTab,setProfileTab,setShowBusinessConfig,showBusinessConfig};
}
export type ProfileScreenModel=ReturnType<typeof useProfileScreenController>;
