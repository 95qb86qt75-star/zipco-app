
  import { createRoot } from "react-dom/client";
  import { registerSW } from "virtual:pwa-register";
  import App from "./app/App.tsx";
  import "./styles/index.css";

  createRoot(document.getElementById("root")!).render(<App />);

  if ("serviceWorker" in navigator) {
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
  
