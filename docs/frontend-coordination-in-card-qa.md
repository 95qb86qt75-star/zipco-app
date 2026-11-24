# Coordinación WhatsApp dentro de la tarjeta — entrega frontend QA

Fecha: 2026-10-30. Rama: `qa`. Clasificación: **frontend + backend coordinados**; esta entrega modifica únicamente frontend. El contrato definitivo ya fue implementado y publicado por backend en Railway QA `c3da34e`; no se modifica Railway desde este trabajo.

## Resultado

La consulta pertenece a su tarjeta de pedido y muestra producto, contraparte y precio. Desaparecen de este flujo el aside y el holograma confirm/respond. Sí actúa directamente; Falta abre Devolver/Cancelar dentro de la misma tarjeta. Cancelar no guarda ni avisa. Devolver inicial guarda la negativa, sigue Por coordinar y deja la consulta cerrada tras recargar, con acceso para coordinar después. La negativa de una contraparte con ronda pendiente conserva RESPOND y devuelve el pedido a Por coordinar.

Se conserva el detalle original y sus controles; la miniatura abre el producto de forma independiente. No se cambia la categoría seleccionada automáticamente. Guardando, resultado comprobado, salida cuando corresponde, aviso inferior con Ver y chispeo de contadores se presentan de forma compartida. Las cifras proceden de las listas reales, no del snapshot visual de salida.

## Campos, endpoints y compatibilidad

Contrato definitivo: `C:/dev/zipco-backend-qa/docs/testing/whatsapp-coordination-initial-decline-contract-qa.md`.

- GET `/request-process-capabilities`: capacidad bilateral existente y `whatsappCoordination.initialDecline.contract/enabled`.
- GET `/orders/my-orders`, `/orders/business/:businessId` y las lecturas existentes de proceso: se negocia el resumen opcional con `X-Whatsapp-Coordination-Initial-Decline-Contract: whatsapp-coordination-initial-decline-v1`, sin caché en la recuperación.
- Resumen `whatsappCoordinationInitialDecline`: contract, id, declinedBy, declinedAt, recordedVersion, active. Se validan tipo, identidad y versión. id no se usa como confirmationId.
- POST `/request-processes/:id/actions/decline-whatsapp-coordination`: `{expectedVersion,coordinationAccepted:false}` y `X-Whatsapp-Coordination-Contract: whatsapp-coordination-initial-decline-v1`.
- CONFIRM y RESPOND conservan sus endpoints, cuerpos y header `whatsapp-coordination-v1`. OPEN, autorizaciones de contacto, START_WORK, MARK_READY y demás acciones existentes conservan permisos y contratos.
- Bearer, Idempotency-Key, expectedVersion y allowedActions siguen siendo obligatorios. No se añade una transición, endpoint, entidad, timestamp ni regla comercial desde frontend.
- Sin capacidad/permiso nuevo no se ofrece una negativa inicial persistida. ownPending no permite autorrespuesta. Una negativa activa no se reabre por GET, recarga ni un marcador local.
- Se reconoce el tipo/tag existentes `order-whatsapp-coordination-initial-declined` / `order-{orderId}-coordination-initial-declined-{version}`. Cambio mínimo de compatibilidad del decodificador; worker permanece v11. El diagnóstico del clic externo iPhone sigue pausado y no se declara corregido.

## Recuperación y concurrencia

El doble toque comparte intención. Un transporte incierto conserva UUID, cuerpo y acción; solo se reintenta por decisión del usuario. Una lectura autorizada puede comprobar que ya se guardó sin repetir POST. Un recibo definitivo seguido de GET fallido informa que falta actualizar, sin éxito ficticio. Una versión posterior prevalece sobre un recibo anterior. Una consulta abierta deja de ser válida si el pedido cambia, pasa a Listo o cambia la sesión; no se convierte una negativa antigua en otra acción.

## Archivos modificados

Bajo `src/app/screens/requests/`:

- Nueva presentación compartida: `StatusChangeFlow.tsx`, `statusChangePresentation.ts`, `status-change.css`, `useChipBump.ts`.
- Contrato: `whatsappInitialDeclineContract.ts`, `whatsappCoordinationCapability.ts`, `requestProcess.ts`, `coordinationApi.ts`, `coordinationIntent.ts`, `requestProcessApi.ts`, `requestProcessErrors.ts`.
- Tarjetas/detalle: `AvailabilityWaitingCard.tsx`, `availability-waiting.css`, `WhatsappCoordinationPanel.tsx`, `ProcessOrderCard.tsx`, `BusinessCoordinationCard.tsx`, `BusinessProgressCard.tsx`, `CustomerProgressCard.tsx`.
- Integración/lecturas: `useCoordination.ts`, `useAvailability.ts`, `ProposalNegotiation.tsx`, `useLateInitial.ts`, `useReservation.ts`, `useRequests.ts`, `useRequestListMotion.ts`, `MyOrdersTab.tsx`, `RequestStatusTab.tsx`.
- Pruebas: `whatsappInitialDeclineContract.test.ts`, `statusChangePresentation.test.ts`, `useCoordination.test.ts`, `RequestStatusTab.test.ts`.

Otros archivos:

- `src/app/screens/RequestsScreen.tsx`.
- `src/app/notifications/BusinessNotificationMonitor.tsx`, `notificationDelivery.ts`, `orderNotice.ts`, `whatsappCoordinationNotice.ts`, `notificationLifecycle.test.ts`.
- `public/push-sw.js` (solo compatibilidad de identidad/tipo del aviso nuevo).
- `scripts/check-coordination-inline.mjs`, `scripts/check-availability-status-flow.mjs`, `scripts/check-whatsapp-bilateral.mjs`.
- Los cinco documentos de `docs/design/coordination-in-card/` y este informe. 01/02 quedan expresamente históricos; 12/13/14 reflejan el contrato publicado.

Las copias adjuntas de los seis componentes coincidían con HEAD `45801dd` al iniciar. Se modificaron las versiones actuales; no se copiaron componentes antiguos sobre el repositorio. Los diez documentos ajenos previamente no rastreados se conservaron fuera del bloque.

## Validación

- Suite completa: **1706 pruebas aprobadas en 129 archivos**. Incluye contrato, headers/cuerpos, permisos, capacidad, normalización, recuperación, concurrencia, identidad de aviso y presentación.
- Navegador Chrome local: **14 escenarios aprobados**, con componentes/hooks reales y HTTP sintético. Ambos roles, primer Sí, Sí/No de contraparte, Cancelar, doble toque, negativa persistida y recarga, coordinación posterior, reintento exacto, lectura pendiente, capacidad desactivada/parcial, Listo invalidando la confirmación, varias tarjetas a 320 px, producto independiente y movimiento reducido/navegación.
- Regresión con presentación compartida: **10 recorridos de disponibilidad/propuestas aprobados**, con checkout real del proyecto y transporte sintético; retiro local y WhatsApp, anchos 320/390/430, consentimiento, rechazo, retirada y aceptación de propuestas/contrapropuestas.
- Build QA/PWA aprobado: 2306 módulos; precaché generado. Advertencia conocida de bundle principal mayor de 500 kB. El proyecto no tiene scripts separados de lint/typecheck: no se declara que se hayan ejecutado.
- Comprobación HTTP de solo lectura en Railway QA: capacidad sin autenticación responde 401; preflight de lectura con la cabecera nueva responde 204. No equivale a una prueba autenticada del flujo de negocio.
- No se crearon pedidos ni se ejecutaron confirmaciones/notificaciones reales o pushes artificiales.

## Publicación y pendientes

El commit que incorpora este informe está en la rama `qa`; la entrega al usuario incluye su SHA exacto. La publicación se realiza por el despliegue automático de esa rama y se verifica estado Ready, alias QA y coincidencia de versión en el bundle/worker antes de cerrar.

Alias: `https://zipco-app-git-qa-zipco-s-projects.vercel.app`.

**Pendiente:** probar físicamente en iPhone y Android la tarjeta, ambos iniciadores, Sí/Falta/Cancelar, recarga tras negativa inicial y coordinación posterior. Las pruebas automatizadas no sustituyen esa validación.

No hubo cambios nuevos de Railway, migraciones ni flags. `main`, el workspace `C:/dev/zipco-app` y producción permanecen intactos. El fallo del clic de notificación del sistema en iPhone continúa pausado, con su evidencia conservada.
