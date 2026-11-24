# Disponibilidad: navegación e identidad de notificaciones QA

Fecha: 2026-10-27. Clasificación: frontend + backend coordinados mediante contrato E164; implementación exclusivamente frontend/worker. Rama qa.

Contrato leído: C:/dev/zipco-backend-qa/docs/testing/availability-notification-identity-navigation-contract-qa.md. Backend publicado 26ee14b, sin necesidad de otro despliegue Railway, migración, flag ni cambio de API.

## Cambio

- Reconocimiento específico y acotado de requests-{customer|business}:order-{orderId}-availability-{processVersion}. ID y versión son enteros PostgreSQL positivos, y la identidad debe coincidir con vista/orderId del destino. No ampliar indiscriminadamente las identidades anteriores.
- Worker v9 reconoce el tag order-{orderId}-availability-{processVersion}, preserva URL y recupera la identidad también desde notificaciones antiguas. processId no sustituye orderId.
- Aviso propio al detectar una nueva confirmación en AWAITING_CUSTOMER_CONTINUATION, con WHATSAPP o LOCAL_PICKUP, antes del fallback de proposalSummary. Se conserva baseline: no anunciar pedidos antiguos al iniciar sesión. En este estado, la versión corresponde a la confirmación: las transiciones posteriores abandonan el estado; no se inventa una versión fija ni un campo backend.
- Sistema y aviso propio comparten identidad semántica para deduplicar presentación. Cada toque del aviso propio genera un intento local nuevo; el receptor existente recupera URL/mensaje/caché y espera sesión/lista/tarjeta antes del ACK local. Destinos antiguos sin notificationEvent siguen funcionando. No se elige el pedido por último push o polling.
- Correlación QA con UUID aleatorio por presentación, conservado en datos locales de la notificación y en etapas presentación/clic/destino del worker; el aviso propio vincula notice-delivered y toast-click. No es un ID de pedido ni un token de autenticación, no se envía a backend, no va en el enlace y el saneador rechaza cadenas semánticas. Solo se habilita con la instrumentación QA existente. Sin cambiar la política de entrega push de Apple.

## Contrato utilizado

Payload vigente: type order-availability-event, orderId, processId, processVersion, tag y url. Destino confirmado: /?open=requests-customer&orderId={orderId}; también se admite requests-business. Lectura existente GET /orders/my-orders?processContract=availability-v3&initialResponseContract=late-initial-v1; monitor conserva los endpoints y permisos previos, incluida lectura del negocio. Campos usados: requestProcess.id, version, state, agreementPublicId, currentProposalId y availability.path/proposalId/availabilityConfirmationId, con normalización availability-v3 vigente. No nuevos campos, endpoints ni acciones comerciales. El estado actual autorizado se lee al abrir, aunque el aviso sea anterior.

## Archivos

- public/push-sw.js: identidad versionada, revisión v9 y correlación QA.
- src/app/notifications/availabilityNotice.ts y orderNotice.ts: aviso y precedencia.
- src/app/notifications/BusinessNotificationMonitor.tsx y notificationDelivery.ts: identidad compartida y deduplicación.
- src/app/App.tsx y src/app/screens/Toast.tsx: intento físico del aviso propio y correlación QA.
- src/app/notifications/notificationClickTrace.ts, qaNotificationClickTrace.ts, qaNotificationClickTraceStore.js y QaNotificationClickTracePanel.tsx: diagnóstico saneado.
- Pruebas: availabilityNotice.test.ts, notificationLifecycle.test.ts, BusinessNotificationMonitorFlow.test.ts, qaNotificationClickTraceStore.test.ts, screens/Toast.test.ts; scripts/check-whatsapp-notification-click.mjs.

## Validación

- Suite completa: 122 archivos, 1.558 pruebas aprobadas.
- Navegador con App/RequestsScreen reales y red sintética: 11 escenarios de disponibilidad, incluidos toque propio desde Inicio/Perfil/catálogo, destino exacto entre dos pedidos, nuevo toque al mismo aviso, repetición de entrega, recuperación URL/caché, sesión/lista tardías, compatibilidad sin identidad y correlación presentación/clic del toast.
- Regresión anterior scripts/check-notification-click-app.mjs: 7 escenarios de consulta Fuera de hora aprobados. Total 18 escenarios.
- Build QA/PWA correcto. Build local sin instrumentación correcto; comprobado que no emite assets de trazas, cadenas del panel/toast-click ni UUID de diagnóstico en NotificationOptions.data. Ninguna publicación de producción. Se conserva advertencia de tamaño del bundle >500 kB.
- git diff --check correcto. No se ejecutó ni se afirma lint/tsc independiente.
- Sin notificaciones reales, sin repetir CONFIRM_AVAILABILITY y sin modificar pedidos de prueba. Las pruebas de navegador interceptan la red y rechazan mutaciones comerciales.

## Alcance y pendiente físico

La incompatibilidad de identidad y la ausencia del aviso propio están corregidas y probadas. El recorrido físico anterior no acredita que el aviso mostrado y el clic pertenezcan al mismo registro; no se declara resuelto el incidente físico de iPhone mediante pruebas sintéticas. Tras publicar, comprobar frontend y worker v9 del nuevo commit y probar ambos accesos con el siguiente aviso legítimo o uno ya disponible, sin repetir la confirmación del negocio. Si falla, copiar el recorrido inmediatamente: el UUID aleatorio permite vincular presentación y clic del mismo aviso.

Publicación: exclusivamente git push origin qa, con verificación posterior del estado Vercel y artefactos servidos. Commit de entrega: el que incorpora este documento. Resultado del despliegue y SHA se entregan al usuario al terminar. main permanece en 8295ab8c6024ab20851ebd371308d2f299b4668f; producción y Railway no modificados. Los ocho documentos locales previos de diagnóstico/traspaso quedan fuera de este commit.
