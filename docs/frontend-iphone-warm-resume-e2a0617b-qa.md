# iPhone QA: recuperación del clic con una ventana suspendida

2026-10-29. Clasificación: **solo frontend/worker QA**, dentro del contrato E168 ya coordinado. No cambia el payload, endpoints, diagnóstico remoto, permisos o estados del servidor. La navegación nativa sigue pendiente de acuerdo y no se implementa aquí.

## Evidencia física y límites

El usuario comparó dos situaciones en frontend `655efcc08298bde859359fbd45b4a274363938a1`, revisión v11:

- App existente en segundo plano: tocar el banner devuelve la pantalla anterior sin abrir la tarjeta.
- Después de cerrar ZIPCO en el selector: el aviso **QA e2a0617b** abre Solicitudes, la categoría y tarjeta correctas, marcada «Abierta desde la notificación».

El segundo caso tiene `click-entered → click-received → target-normalized → launch-requested → windows-found (hasClient=false) → card-focused → ack-consumed`. La correlación del clic es `e2a0617b-b27e-4e79-a168-1d390673582d`; controlador/activo coinciden con frontend. El recorrido contiene también ack-mismatch después de consumir el ACK; no acredita un fallo y no se lo atribuye al caso en segundo plano.

Se conserva el adjunto íntegro en [evidence/iphone-system-e2a0617b-cold-success-v11.json](evidence/iphone-system-e2a0617b-cold-success-v11.json), SHA-256 `14f19b58af9e3e9e9bfca820e3e93dea5328f86f3db958359a49fd67fd98c482`. El adjunto posterior d28c44a2 es idéntico al anterior 2ce7bae8 por hash; se mantiene una sola copia.

Esta evidencia acredita el éxito con app cerrada. No compara el mismo aviso en ambos estados ni contiene una traza correlacionada del clic fallido en segundo plano. No permite atribuir la causa al sistema operativo o backend. La ausencia de una sesión consultable al volver al panel remoto tampoco prueba que no hubiera entrega: sessionStorage de la ventana puede perderse al cerrarla y la memoria backend es volátil. No se abrió otra sesión para recuperar retrospectivamente el evento.

## Defecto local y corrección

Antes del cambio, el worker enviaba un mensaje inicial a las ventanas enumeradas y luego esperaba `openWindow` en la rama Apple. Si la promesa quedaba pendiente, no llegaba al fallback de ventana existente. Si devolvía otro WindowClient, los reintentos se dirigían únicamente al cliente devuelto; una ventana suspendida que perdió el mensaje inicial no recibía los reenvíos posteriores. Son riesgos reproducidos con transporte sintético, no una causa física acreditada del iPhone del usuario.

La corrección mantiene el lanzamiento síncrono durante el gesto y el destino concreto del clic:

- Cuando hay ventanas del mismo origen, programa reenvíos independientes a los 500, 1.500, 3.000 y 5.000 ms, sin esperar a que termine `openWindow`. Cada vez vuelve a consultar `clients.matchAll` para obtener los WindowClient actuales y filtra por origen propio. Un rechazo del mensaje inicial no cancela esta recuperación.
- Solo en ese camino con ventana existente, limita la espera de `openWindow` a 1.500 ms. Si sigue pendiente, utiliza el fallback existente de navigate/focus con la misma URL de lanzamiento, el mismo pedido, identidad versionada y nonce de clic. No vuelve a abrir otro pedido ni inventa una ruta a partir del último push. No cancela una operación del sistema ya iniciada.
- Cada reenvío conserva el destino capturado para ese clic. Antes de leer/enviar se comprueba que todavía sea el destino pendiente: un ACK consumido o un clic posterior impiden que los temporizadores antiguos reenvíen otra navegación. No se reabre el clic consumido desde caché para esos temporizadores.
- El camino sin ventanas conserva la apertura en frío ya acreditada y sus reenvíos. La App mantiene recuperación por URL/caché/mensajes, sesión/lista tardías y ACK tras enfocar realmente la tarjeta. Reanudar sin destino de clic válido no abre una tarjeta automáticamente.

La solución necesita que se ejecute notificationclick. Si el navegador no lo despacha, no existe aquí una forma de deducir qué aviso tocó el usuario; no se simula su recepción ni se toma el último pedido como alternativa. La validación física de ambos estados sigue pendiente.

## Contrato y archivos

Se mantienen URL `/?open=requests-customer&orderId={orderId}`, orderId/processId/processVersion y tag `order-{orderId}-availability-{processVersion}`, más parámetros locales de clic existentes. Notification.data sigue siendo la fuente del destino y del bloque privado de observación. No se añaden credenciales o comprobantes a mensajes, caché, URL o informes.

E168 conserva `/qa/push-observations/sessions`, `/qa/push-observations/sessions/:sessionId`, `/qa/push-observations/events`, sus campos/etapas y separación JWT/comprobante. Los reenvíos no generan nuevas acciones comerciales ni reportes de etapa duplicados. Se conserva revisión v11 admitida por backend; la nueva publicación se identifica por SHA.

Archivos: `public/push-sw.js`; `src/app/notifications/notificationLifecycle.test.ts`; `scripts/check-whatsapp-notification-click.mjs`; esta ficha y el JSON de evidencia. No se modifica App/UI ni los documentos locales ajenos anteriores.

## Validación y entrega

- Pruebas nuevas del worker con reloj controlado: ventana suspendida que pierde el primer mensaje y reaparece como otro WindowClient; openWindow que nunca resuelve y fallback al mismo destino; ACK consumido; clic posterior que invalida los reenvíos del anterior. Se conserva regresión de apertura en frío, privacidad, caché indisponible y aviso interno.
- Trece escenarios de navegador con App real aprobados. Los dos nuevos ejecutan también `public/push-sw.js` real en un entorno VM: la ventana suspendida descarta el primer mensaje, Cache API falla y openWindow devuelve otro cliente o no resuelve. El pedido sintético 21 llega a su categoría, detalle y foco reales; no se navega al reanudar sin destino. Los once anteriores cubren URL/caché, sesión/lista tardías, destinos distintos, clic repetido y toast desde Inicio/Perfil/catálogo.
- El transporte, plataforma y HTTP son sintéticos; cero pushes, pedidos o mutaciones reales. No equivale a probar el clic físico en iOS. Suite completa: **1.619 pruebas aprobadas en 126 archivos**, con `--maxWorkers=2`. Build QA/PWA aprobado; advertencia habitual por bundle mayor de 500 kB. No se afirma lint/tsc independiente. El SHA publicado se entrega al usuario tras verificarlo.
- Un intento previo de suite general con paralelismo predeterminado y Chrome simultáneo terminó con procesos de Vitest cerrados inesperadamente; no se cuenta como aprobado. Se repite aisladamente con `--maxWorkers=2`.
- Solo commit/push en rama `qa`, despliegue automático GitHub → Vercel QA y verificación de Ready/artefactos publicados. Sin cambios de Railway, flags, suscripciones o pedidos. `main` conserva `8295ab8c6024ab20851ebd371308d2f299b4668f`; producción intacta.

Después de actualizar el iPhone a la entrega, quedan por comprobar físicamente app existente en segundo plano y app cerrada usando los siguientes avisos legítimos, conservando banner/código y recorrido inmediato. No repetir confirmaciones, crear pedidos, enviar pushes artificiales, reinstalar ni borrar evidencia. Si falta click-entered en el intento correlacionado, mantener ese tramo abierto y coordinar cualquier cambio de contrato/payload/diagnóstico o navegación nativa antes de implementarlo.
