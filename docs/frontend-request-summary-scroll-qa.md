# UI-REQUEST-SUMMARY-SCROLL-01 — Campanitas con desplazamiento a resultados

Fecha: 2026-10-19. Clasificación: solo frontend, navegación y espacio de desplazamiento local.

## Reporte y causa comprobada

Bastián mostró Android negocio con SHA visible `7953f21`: al pulsar Nuevos Pedidos, Por coordinar, En curso o Listos seleccionaba el filtro pero no llegaba a las tarjetas. La versión queda acreditada por la captura; no se atribuye el fallo a una app desactualizada.

Se confirmaron dos problemas:

1. Solo las campanitas de Coordinación tenían solicitud de scroll. Los otros resúmenes de negocio y los resúmenes Listos/respuestas del cliente actualizaban únicamente los filtros.
2. En una lista corta, el contenedor no tenía suficiente recorrido vertical para situar sus resultados debajo del encabezado. El navegador limita `scrollTop` al máximo disponible. Las pruebas anteriores usaban una propiedad que no simulaba ese límite y por eso no detectaban el desplazamiento parcial.

Reproducción aislada sobre RequestsScreen real, CSS compilado y datos sintéticos en Chrome, viewport 400×870: antes del ajuste, Coordinación dejaba la primera tarjeta en y=547 con el área útil iniciando en y=125; Nuevos Pedidos, En curso y Listos quedaban en scroll=0. Esto acredita la limitación de la implementación en el navegador local; no equivale a inspeccionar el controlador ni el DOM del teléfono.

## Implementación

- Todas las campanitas visibles de negocio para pedidos/cotizaciones solicitan el mismo recorrido: tipo, categoría y filtro correctos, y después desplazamiento al comienzo de los resultados.
- Los resúmenes de cliente Listos, respuestas y Coordinación usan ese mismo recorrido, sin confirmar avisos, recepción, consentimiento o lectura.
- La solicitud conserva rol, tipo y filtro: se espera una carga interpuesta y se cancela si cambia el contexto o aparece un error.
- Se usa un contenedor real de resultados, en lugar del marcador vacío exclusivo de Coordinación. Se mide el recorrido que falta y se añade únicamente esa altura como espacio inferior; no se acumula al repetir clics y se limpia al cambiar de contexto.
- Los resultados quedan 12 px debajo del encabezado, desplazando solo el contenedor existente de Solicitudes. El usuario puede desplazar después sin ser devuelto automáticamente.
- Sin timers, requestAnimationFrame, observadores continuos ni nuevas recargas. No expande el acuerdo ni la tarjeta, no enfoca un pedido individual ni añade borde azul. No cambia los clics de las pestañas compactas. El recorrido de notificación externa permanece separado y sin cambios.

La tarjeta se ve completa si cabe entre encabezado y barra inferior. Una tarjeta más alta conserva su contenido y el desplazamiento manual; no se reduce u oculta información para forzar su encuadre.

## Archivos

- `src/app/screens/RequestsScreen.tsx`: conexión de campanitas, contexto de navegación, contenedor de resultados y espacio inferior.
- `src/app/screens/requests/requestSummaryScroll.ts`: medida del espacio faltante y scroll puntual.
- `src/app/screens/requests/requestSummaryScroll.test.ts`: reproducción del límite real de scrollTop, listas cortas/largas y no acumulación de espacio.
- `src/app/screens/RequestsScreen.notificationNavigation.test.ts`: selección y scroll de los resúmenes, ambos roles, pedidos/cotizaciones, segundo clic, espera y cancelación; conserva regresiones de notificación.
- `scripts/check-request-summary-scroll.mjs`: comprobación DOM real con Chrome instalado, React y CSS reales, datos sintéticos y eventos táctiles CDP. Sin dependencias nuevas ni backend.
- Este documento y la entrada de catálogo de cierre.

## Pruebas y evidencia

**933 pruebas aprobadas en 85 archivos**, build QA aprobado y diff sin errores. Advertencia habitual de tamaño de bundle de Vite.

Prueba aislada en navegador: **18 casos con eventos táctiles aprobados**, tres tamaños (400×870, 393×852 y 320×700), cuatro campanitas de negocio y dos de cliente. Además se comprobó que el scroll manual no fuera revertido. No es una prueba de WebKit ni del teléfono físico.

En 400×870, los cuatro resúmenes de negocio dejan resultados en y=137 y primera tarjeta en y=169, con área útil desde y=125; cliente deja resultados en y=163, primera tarjeta en y=195 y área útil desde y=151. Las tarjetas plegadas sintéticas quedan sobre el área reservada a navegación inferior. No se imprimen datos de pedidos reales.

Reproducir después del build QA en `node_modules/.cache/request-summary-scroll-qa`:

`node scripts/check-request-summary-scroll.mjs`

También admite como argumento otra carpeta de assets de build QA y `CHROME_PATH` para un Chrome instalado. El script compila un fixture aislado, crea un perfil temporal bajo `node_modules/.cache`, sirve exclusivamente en 127.0.0.1 y cierra navegador/servidor al terminar. Bloquea HTTPS y sustituye las llamadas backend. No habilita vista local para celulares ni requiere la excepción CORS cancelada de DEV-LOCAL-QA-01.

## Contrato y publicación

Sin campos/endpoints nuevos o modificados; usa agrupación y datos existentes `status`, `requestProcess.state` y disponibilidad normalizada. No altera peticiones, recargas, permisos, estados, contratos push ni acciones. No ejecuta START_WORK, WhatsApp u otras acciones reales. Backend/Railway QA no requiere cambios; arquitectura nueva de notificaciones y registro del clic siguen pausados. `main` y producción sin modificaciones.

Guardar código, pruebas y ficha con commit y push solo a `qa`. Publicar Preview desde Git real y SHA exacto, Backend QA y configuración exclusiva por despliegue:

`ZIPCO_QA_LOAD_DIAGNOSTICS=1 ZIPCO_QA_NOTIFICATION_TRACE=0 npm run build -- --mode qa`

Después de comprobar READY, SHA y alias, guardar también el resultado y nombre+commit en Git mediante cierre documental; no dejar notas locales sin respaldo.

## Comprobación en los celulares

Actualizar QA habitual y comprobar SHA. En Mi Negocio, con los pedidos existentes, pulsar cada campanita: Nuevos Pedidos, Por coordinar, En curso y Listos. Debe seleccionar el filtro y llevar a la fecha/primera tarjeta debajo del encabezado, también cuando haya un único pedido. Repetir en Mis Pedidos con Coordinación y Listos. Comprobar que el desplazamiento manual sigue libre y que otro clic regresa al inicio. Sin acciones de pedidos para esta prueba. Confirmación física de Bastián: pendiente hasta que la comunique.

## Resultado publicado y cierre documental

Código, pruebas, script de navegador y ficha inicial: `723674f51e0189d8e9bc6432591a7c22177f982f`, rama `qa`, seis rutas comprobadas, sin divergencia antes del envío y diff de staging aprobado.

Preview funcional **READY** `dpl_61NAZ6nrf6Cf2xiZJEwt85vC2vog`, URL propia https://zipco-7ojxjlt04-zipco-s-projects.vercel.app. Origen GitHub real, SHA exacto, rama `qa`, entorno Preview y comando temporal verificados. Logs confirman modo QA y build completado, sin auxiliar del recorrido. Alias habitual https://zipco-app-git-qa-zipco-s-projects.vercel.app comprobado apuntando a ese Preview.

Backend QA comprobado; build global sigue nulo y rama de producción `main` intacta. Sin cambios de backend/Railway, configuración global, permisos o datos. La comprobación remota inicial de Git no se ejecutó por vencimiento del plazo de revisión automática de permisos; no se interpretó como rechazo de seguridad ni se repitieron POST de despliegue. Se continuó comprobando el origen Git/SHA desde Vercel.

Este resultado y el nombre+commit se guardan en un commit documental de cierre junto con el catálogo y referencias desde las dos fichas anteriores. El build documental posterior conserva exactamente el código de `723674f`, con las mismas opciones QA por despliegue; su SHA identifica el cierre documental, no otro ajuste funcional. No quedan estas comprobaciones solo locales. La validación física de Bastián en celulares continúa pendiente.

## Confirmación de funcionamiento y nueva solicitud — 2026-10-20

Bastián confirmó «está funcionando super bien» el recorrido entregado y pidió añadir una transición suave hasta el mismo destino. Se registra conformidad funcional del recorrido anterior, sin atribuir una prueba independiente a ambos dispositivos ni una aprobación global de UI. La entrega de referencia es `ee070a99dcc733d2f4321fb2cdfa0cb826d14e93`; no se recibió una nueva lectura de SHA del teléfono en ese mensaje.

La transición solicitada se registra por separado como [UI-REQUEST-SUMMARY-SMOOTH-01](frontend-request-summary-smooth-qa.md), conservando destino, filtros y cálculo del recorrido. Su aprobación visual sigue pendiente hasta la nueva prueba de Bastián.
