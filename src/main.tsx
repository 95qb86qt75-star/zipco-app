
  import { createRoot } from "react-dom/client";
  import { registerSW } from "virtual:pwa-register";
  import App from "./app/App.tsx";
  import AgreementRoute from './app/screens/requests/AgreementRoute';
  import "./styles/index.css";

  const availabilityDesign = import.meta.env.QA_AVAILABILITY_DESIGN &&
    new URLSearchParams(window.location.search).get('design') === 'availability';
  if (availabilityDesign) {
    void import('./design-preview/AvailabilityDesignPreview').then(({ mountAvailabilityDesign }) => mountAvailabilityDesign());
  } else {
    createRoot(document.getElementById("root")!).render(<AgreementRoute><App /></AgreementRoute>);
  }

  if (!availabilityDesign && "serviceWorker" in navigator) {
    const hadControllerAtStartup = Boolean(navigator.serviceWorker.controller);
    let isReloadingForUpdate = false;

    const reloadForUpdate = () => {
      if (isReloadingForUpdate) return;

      isReloadingForUpdate = true;
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (hadControllerAtStartup) {
        reloadForUpdate();
      }
    });

    registerSW({
      immediate: true,
      onNeedReload: reloadForUpdate,
      onRegisteredSW: (_serviceWorkerUrl, registration) => {
        if (!registration) return;

        const checkForUpdates = () => {
          if (document.visibilityState === "visible") {
            void registration.update();
          }
        };

        void registration.update();
        document.addEventListener("visibilitychange", checkForUpdates);
        window.addEventListener("focus", checkForUpdates);
      },
    });
  }
  
