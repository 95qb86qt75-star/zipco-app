// Separate development entry. Not imported by App, index.html or the PWA.
// No authentication, storage, fetch, navigation to WhatsApp or service worker.
if (import.meta.env.DEV) {
  void import('./AvailabilityDesignPreview').then(({ mountAvailabilityDesign }) => mountAvailabilityDesign());
} else {
  document.getElementById('root')!.textContent = 'Esta revisión de diseño solo está disponible en desarrollo.';
}
