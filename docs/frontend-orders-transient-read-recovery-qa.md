# Solicitudes: conservar tarjetas durante fallos temporales de lectura

2026-10-27, America/Santiago. Clasificación: solo frontend QA.

Se leyó el traspaso backend `C:/dev/zipco-backend-qa/docs/testing/orders-transient-read-error-handoff-qa.md`. En d04a6ff, un TypeError de refresh-event sin respuesta HTTP ocultaba ambas listas y sus contadores. Los arrays seguían en memoria. El cancelled/superseded anterior es una cancelación controlada independiente. No hay evidencia de borrado de pedidos; tampoco se conoce la causa del fallo de transporte.

## Cambios

- Cliente y negocio ejecutan sus GET en paralelo, con éxito, error y carga independientes. Cada lado publica su resultado sin esperar al otro. Se conserva la deduplicación de lecturas y el aborto por reemplazo, salida o pantalla oculta.
- Una lectura exitosa establece una instantánea, incluso cuando es una lista vacía. Las siguientes actualizaciones conservan esa lista y sus contadores mientras cargan o si fallan temporalmente.
- La pantalla usa el estado del rol seleccionado. Un fallo en Mis Pedidos no oculta Mi Negocio. Un fallo con datos anteriores muestra «No pudimos actualizar. Mostramos la última información disponible» y un reintento de lectura. El aviso permanece disponible incluso antes de elegir una categoría de atención del cliente.
- La primera carga fallida sigue mostrando el error completo. Se evita repetir toasts por cada actualización automática. Una respuesta vacía exitosa sí reemplaza las tarjetas antiguas.
- Logout, cambio de token/negocio y sesión expirada descartan las instantáneas. Los resultados de una lectura obsoleta no se aplican. Un 401 limpia ambos lados y conserva el manejo de expiración existente; 403 o incompatibilidad de contrato descartan las tarjetas del lado afectado.
- No hay reintentos automáticos nuevos, POST de recuperación ni cambios a estados, reservas, consentimientos, idempotencia o acciones del pedido. Las comprobaciones de versión y los recibos existentes permanecen.

## Contrato y archivos

Sin campos ni endpoints nuevos. GET `/orders/my-orders` y `/orders/business/:businessId`, Authorization Bearer y query `processContract=availability-v3&initialResponseContract=late-initial-v1` existentes. La resolución auxiliar del nombre conserva GET `/businesses/:id`. `readStatus` es exclusivamente estado local de React.

- `src/app/screens/requests/useRequests.ts`: lecturas independientes, instantáneas y guardas de sesión.
- `src/app/screens/RequestsScreen.tsx`: estado por rol y aviso sin reemplazar tarjetas.
- `useRequestsContract.test.ts`: regresiones de lectura y 11 casos nuevos de conservación/recuperación.
- `RequestsScreen.notificationNavigation.test.ts`, `RequestsScreen.readySelection.test.ts`, `requests/RequestsScreen2A.test.ts`: mocks adaptados al estado por rol, conservando sus comprobaciones de navegación y categorías.
- `scripts/check-orders-refresh-recovery.mjs`: App y pantalla reales en Chrome, HTTP sintético; sin mutaciones QA.

## Validación

- 1.511 pruebas aprobadas en 120 archivos.
- Siete escenarios móviles de pantalla real: conservación de tarjetas y contadores a 360/390 px, error cliente con negocio actualizado, recuperación cliente, lista vacía válida, primera carga fallida con negocio independiente y 403 sin tarjetas accionables.
- Siete regresiones del clic de notificación aprobadas: segundo plano, repetición, otro pedido, URL, caché, lista tardía y sesión tardía. Sin modificar el protocolo push.
- Build QA/PWA aprobado. Permanece el aviso conocido de bundle mayor a 500 kB. No se reportan lint ni TypeScript independientes como ejecutados.

Publicación exclusivamente por rama `qa` hacia la integración GitHub/Vercel QA. Railway QA no requiere cambios ni despliegue. Main conserva `8295ab8c6024ab20851ebd371308d2f299b4668f`; producción intacta. Se dejan fuera los seis documentos locales previos ajenos a esta entrega.

Pendiente físico: actualizar Android/iPhone y comprobar que un fallo temporal de lectura ya no haga desaparecer tarjetas. El navegador usa fallos sintéticos reproducibles; no acredita la causa ni reproduce el incidente de red original.
