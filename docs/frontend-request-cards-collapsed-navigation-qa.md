# UI-REQUEST-CARDS-COLLAPSED-01 — Tarjetas cerradas al navegar

2026-10-23. Clasificación: **solo frontend QA**. Aplica a tarjetas de pedidos
del cliente y negocio. Sin cambios de backend, estados, permisos o notificaciones.

## Antes / Después

Antes: BusinessCoordinationCard empezaba desplegada. BusinessOrdersTab además
inicializaba el pedido abierto a partir de orderId en la URL. Las categorías
podían conservar el componente y su estado de apertura anterior.

Después: las tarjetas de coordinación empiezan resumidas. Al cambiar categoría
o filtro de la lista, se remonta la vista local y se pierde únicamente su estado
de apertura. Los formularios/operaciones conservan sus protecciones existentes.
El usuario puede desplegar manualmente una tarjeta; la animación de cierre y
controles inaccesibles del cuerpo plegado se mantienen.

La excepción es navegación explícita desde una notificación: el mecanismo ya
existente espera sesión/listas/tarjeta visibles, enfoca y resalta el destino,
y ahora emite un evento DOM local dirigido a ese orderId para abrirlo. No se
genera por polling, recepción de nuevos pedidos, unread o cambios de categoría.
No basta con conservar orderId en la URL para abrir la lista del negocio.

ProcessOrderCard conserva esa intención si todavía está cargando el acuerdo;
al montar el diseño de coordinación, la tarjeta destino se abre. Si llega otra
navegación explícita al mismo pedido, puede abrirlo de nuevo. Una visita normal
posterior a la categoría empieza cerrada. No se cambia el consumo/deduplicación
de la navegación ni su acuse al service worker.

## Archivos y contrato

- `src/app/notifications/notificationNavigation.ts`: evento local de apertura
  solo al enfocar el destino explícito; prueba en notificationLifecycle.test.ts.
- `src/app/screens/requests/ProcessOrderCard.tsx`: intención local por pedido.
- `BusinessCoordinationCard.tsx`: resumida por defecto y apertura dirigida;
  prueba de apertura manual para ambos participantes.
- `BusinessOrdersTab.tsx`: apertura por evento y no por URL residual;
  businessOrderModal.test.ts adapta su harness a useEffect.
- `src/app/screens/RequestsScreen.tsx`: claves de vista por categoría/filtro.
- `scripts/check-business-own-feedback.mjs`: recorridos de navegación y foco.
- `scripts/check-order-card-aurora.mjs`: sus comprobaciones del diseño desplegado
  abren explícitamente las tarjetas, respetando el nuevo estado inicial.
- Este registro y el catálogo de diseño.

Sin nuevos campos, endpoints ni datos persistidos. Usa los mismos GET de pedidos
con processContract=alternatives-v1 y lectura del acuerdo; no añade POST.
`zipco-notification-card-open` es exclusivamente un evento de presentación
dentro del navegador, no push ni evento enviado al servidor.

## Validación y pendientes

Build QA/PWA aprobado (aviso previo de tamaño de bundle; no hay tsc independiente).
Ocho recorridos Chrome móvil sintéticos aprobados: aceptación/errores existentes
en 360/393 px y, para ambos actores, estado inicial cerrado, notificación,
apertura/cierre manual, cambio de categoría y notificación antes de cargar el
acuerdo. Los recorridos nuevos de navegación no envían acciones al backend.
Suite final: **1.219 pruebas / 104 archivos aprobados**. Comprobaciones visuales
amplias: **234 casos aprobados** en 12 estados, ambos participantes, temas claro
y oscuro, 320/393/400 px; además plegado, hojas, movimiento reducido y recuperación
de coordinación existentes. Solo fixtures sintéticos, sin acciones reales.

Pendiente Android/iPhone, un paso por vez: alternar categorías, abrir/cerrar una
tarjeta, tocar una notificación recibida en segundo plano, comprobar que se abra
solo su destino y volver a navegar normalmente. No se declara validación física.
Los reintentos fiables de notificaciones siguen pendientes del cierre general.

Código respaldado en GitHub, rama qa: `6981c4d3d6516f2262e7a808717b0b0b45908898`.
Vercel QA READY `dpl_6gSKw7zFgfZ9Ybx8nWDCmnTdfhKM`, SHA exacto y alias
`https://zipco-app-git-qa-zipco-s-projects.vercel.app` comprobados.
Este cierre documental también se respalda y publica en QA con código idéntico.
Railway QA no requerido.
Main, producción y backend sin modificaciones.
