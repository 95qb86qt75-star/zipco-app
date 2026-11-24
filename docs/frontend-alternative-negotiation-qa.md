# REQ-FRONTEND-ALTERNATIVES-V1-01 — Alternativas y respuestas con acuerdo exacto

2026-10-20. Clasificación: **frontend + backend**, sobre contrato ya implementado y
publicado. Este bloque solo modifica frontend QA. Backend base confirmado por
Bastián y contrato: c1f3b57112f37236af5c08b923d2c12c7be43de5.
Contrato de referencia: C:/dev/zipco-backend-qa/docs/testing/business-alternative-proposal-qa.md,
REQ-BUSINESS-ALTERNATIVE-01. Lectura anónima de la ruta QA proposals comprobada:
HTTP401; acredita ruta protegida, no constituye prueba funcional autenticada.

## Antes / Después

Antes: negocio preparaba y revisaba un borrador; Confirmar y enviar estaba
bloqueado. No había respuesta de cliente ni representación completa de schema2.

Después: con permisos y lectura autorizada vigente, el negocio confirma y envía;
el cliente compara original y propuesta, acepta/rechaza o contrapropone una vez;
el negocio acepta/rechaza esa contrapropuesta o propone una final, que el cliente
solo acepta/rechaza. La aceptación crea coordinación con el acuerdo exacto.
No se sobrescriben solicitud original, catálogo ni versiones anteriores.

Conserva [formulario aprobado](frontend-alternative-change-editor-qa.md) y
[resumen aprobado](frontend-alternative-review-qa.md). Bastián aprobó el diseño en
Android sobre 7c72069; esa aprobación visual no acredita esta integración nueva.
Los nombres de botones se conservan; no se aplica el renombrado antes pausado.

## Archivos involucrados

- ProposalNegotiation.tsx: comparación, versiones/actores/fechas, confirmaciones,
  opciones según allowedActions, lectura previa al POST, sesión y respuestas.
- proposalContract.ts: representación estricta schema1/2, cadena hasta4 versiones,
  permisos por actor/estado, importes, CUSTOM y fotos de propuesta.
- proposalApi.ts y proposalIntent.ts: lecturas, carga de foto, rutas, recibos,
  clave UUIDv4, protección contra clics repetidos y recuperación de intención.
- PendingAlternativeActions.tsx, alternativeDraft.ts, AlternativeChangeEditor.tsx
  y AlternativeReviewPanel.tsx: reutilización del diseño, fuente canónica,
  CUSTOM recibido como total de línea, foto preparada y envío desde el resumen.
- requestProcess.ts, requestStatusGrouping.ts y useRequests.ts: acciones/estados,
  cierres, recibos, listas, categorías y contadores sin repetir acciones.
- requestProcessApi.ts, coordinationApi.ts: lecturas de recuperación con contrato.
- agreement.ts, AcceptedConditions.tsx, ProcessOrderCard.tsx, OrderCardHeaders.tsx
  y ProcessHistoryCard.tsx: acuerdo schema2, total negociado, condiciones CUSTOM,
  foto/explicación aceptada e historial de propuestas rechazadas.
- notifications/proposalNotice.ts, orderNotice.ts, BusinessNotificationMonitor.tsx,
  notificationDelivery.ts, notificationNavigation.ts, qaNotificationClickTrace.ts
  y public/push-sw.js: identidad por propuesta/acción y navegación existente.
- Pruebas de contrato/API/intención/avisos, fixtures sintéticos y regresiones de
  lecturas, permisos, recuperación, presentación y worker; script
  scripts/check-alternative-negotiation.mjs.

## API, campos y compatibilidad

GET /orders/business/:businessId y /orders/my-orders, también en monitor y
recuperaciones, negocian ?processContract=alternatives-v1. No hay GET individual
de proceso sin ese parámetro en el recorrido implementado; el detalle usa GET
/request-processes/:id/proposals, que negocia explícitamente el contrato nuevo.
Solo se descargan explicación, foto y snapshots al abrir el detalle/formulario.
Las listas usan proposalSummary.totalPriceClp; no muestran Order.total original
como si fuera el negociado. No clasifican las esperas nuevas como coordinación.

POST /request-processes/:id/actions/:ruta, con JWT e Idempotency-Key UUIDv4:

| Acción | Ruta |
| --- | --- |
| PROPOSE_ALTERNATIVE | propose-alternative |
| COUNTER_PROPOSAL | counter-proposal |
| PROPOSE_FINAL | propose-final |
| ACCEPT_PROPOSAL | accept-proposal |
| REJECT_PROPOSAL | reject-proposal |
| ACCEPT_COUNTER_PROPOSAL | accept-counter-proposal |
| REJECT_COUNTER_PROPOSAL | reject-counter-proposal |

Cuerpo de confirmación: expectedVersion, proposalId y confirmationAccepted:true.
Creaciones agregan lineChanges, totalPriceClp, message, schedule si cambia y photo.
CUSTOM mantiene null en precio unitario canónico; nunca se divide su total para
crear un unitario fraccionario. Modificar cantidad/precio de CUSTOM recibido envía
lineTotalPriceClp, sin replacement artificial. Servicio conserva cantidad1.
La fecha usa America/Santiago y mantiene validación de horas inválidas/ambiguas.

Accept/reject no envían productos, precios ni fotos. Si backend responde
EXPIRED_SCHEDULE_CONFIRMATION_REQUIRED, se pide una segunda confirmación literal
antes de agregar acceptPastSchedule:true, conservando la clave.
Las respuestas nuevas se habilitan solo con actor, estado, allowedActions y
propuesta exacta validados. Lecturas inválidas/403/401 no otorgan acciones.
GET /request-processes/:id/agreement admite schema1/2 y conserva total/subtotales,
explicación y fotos canónicas; WhatsApp/consentimientos/coordinación siguen su
recorrido existente sin autorizar contacto automáticamente.

## Foto e idempotencia

La foto queda local hasta Confirmar y enviar. Carga mediante el mecanismo
Cloudinary existente (image/upload, preset zipco_products, JPG/PNG/WebP ≤8MB).
Solo una secure_url HTTPS image/upload válida pasa a photo; sin URL válida no
se envía la propuesta. Si falla el POST, el formulario y la URL cargada se conservan
en esa sesión del componente para reintentar; no se presenta como propuesta guardada.
No se han hecho cargas reales durante las verificaciones de este bloque.

La intención guarda en sessionStorage solo clave, huella SHA256, versión,
proposalId, acción y marca de confirmación, aislados por actor/vista/proceso.
No guarda token, contacto, texto del motivo, cuerpos ni foto. Un fallo de
almacenamiento previo al POST impide enviarlo; recuperación corrupta falla cerrada.
Mientras el POST está en curso no hay otro envío. La misma intención incierta
conserva clave y datos; cambiar sus datos exige resolver antes su estado.
Los recibos confirmados no se reenvían porque falle una lectura posterior.
Tras respuesta perdida se relee: si cambió la versión/propuesta se presenta el
estado actual y no se repite el POST. El borrador no se persiste tras cerrar o
recargar; la protección mínima de reintento sí permanece en sessionStorage.

## Avisos y navegación

order-proposal-event conserva identidad pedido/proposalId/acción: tag backend
order-N-proposal-P-ACCION se normaliza igual en worker y app. Eventos diferentes
del mismo pedido no quedan silenciados. Polling/retorno/push actualizan listas y
contadores aunque el aviso ya presentado se omita. Se conservan destino pendiente,
sesión/listas/render y ACK después de enfocar, sin ampliar temporizadores.
Worker: alternatives-v1-click-v6. Las notificaciones posteriores READY mantienen
su identidad y presentación existentes. Sin texto libre/foto/contacto en avisos.

No cambia la arquitectura de notificaciones. **Reintentos fiables pendientes para
el cierre general**, como declara backend. Tampoco se declara resuelto el objetivo
general de solo aviso interno con app visible en iPhone ni se oculta un push
recibido como solución a sus restricciones de Web Push.

## Validación y límites

- **1125 pruebas / 96 archivos aprobados**. Contrato, acciones/actores, rondas,
  CUSTOM, acuerdos, idempotencia, almacenamiento corrupto, eventos diferenciados,
  supresión de duplicados y mantenimiento de avisos READY.
- Build QA/PWA aprobado. Se mantiene la advertencia de bundle >500kB. No se declara
  chequeo tsc independiente (el proyecto no tiene TypeScript instalado).
- **12 recorridos táctiles Chrome sintéticos**: anchos393/320; envío+foto+aceptación,
  contrapropuesta CUSTOM y final, cuatro decisiones directas/cierres, error sin
  perder formulario/clave, fecha vencida explícita, respuesta perdida tras commit,
  versión cambiada y lectura autorizada fallida. Sin backend/pedidos/uploads reales.
- **9 escenarios de regresión** del formulario/resumen aprobados, incluidos
  servicios, multilínea, altura reducida y movimiento reducido.
- Capturas sintéticas inspeccionadas en node_modules/.cache/
  alternative-negotiation-browser/customer-comparison-393.png y -320.png,
  regenerables y excluidas de Git. Chrome no equivale a WebKit/iPhone físico.

No se declara comprobado el recorrido autenticado real ni CORS/entrega push/carga
Cloudinary en celulares por pasar pruebas sintéticas o por un despliegue READY.
No se detectó una incompatibilidad que requiera cambiar el contrato backend.

## Comprobación móvil pendiente, un paso a la vez

Primero: actualizar ZIPCO QA en Android e iPhone y verificar versión desplegada y
worker alternatives-v1-click-v6 antes de crear propuestas. Cliente antiguo puede
no reconocer los nuevos estados; no iniciar negociaciones con un dispositivo viejo.

Después, coordinar cada comprobación con Bastián: primera oferta simple del negocio;
comparación cliente; aceptar y comprobar acuerdo/consentimiento; otro pedido para
rechazo/Historial; otro para contrapropuesta única y respuesta/final. Luego foto,
fecha vencida, concurrencia y aviso/clic externo con app en segundo plano en ambos.
Cada aceptación/cierre se prueba sobre pedidos QA destinados a esa prueba, sin
reutilizar acciones confirmadas. Guardar los resultados reales al recibirlos.

## Publicación

Rama qa, Vercel Preview QA desde SHA de Git, Backend QA conservado.
Override por despliegue: ZIPCO_QA_LOAD_DIAGNOSTICS=1
ZIPCO_QA_NOTIFICATION_TRACE=0 npm run build -- --mode qa.
Registrar commit/deployment verificados en cierre documental, sin repetir acciones.
Railway no requiere intervención: backend ya activo. Sin cambios en backend,
Railway, main ni producción. Avances anteriores conservados.

## Publicación comprobada y cierre — 2026-10-20

Código de integración enviado a GitHub/qa:
`10170537180383b7c3544978006f63e9269e99ea`. Preview funcional **READY**:
`dpl_HEvVcoeJkDxfuMSCSvfvA9f8qQ1t`, URL propia
https://zipco-2sgot0c5d-zipco-s-projects.vercel.app. Verificados SHA GitHub exacto,
target Preview, alias habitual, log de build qa completo y Backend QA configurado.
Build global null y rama de producción main conservados.

El cierre posterior conserva ese código e incorpora la precisión del rótulo de
base del editor: primera oferta «Solicitud original»; contrapropuesta y final
«Propuesta vigente». No confunde la base de edición con la solicitud original,
que siempre sigue en la comparación. 30 pruebas relevantes aprobadas tras ese
rótulo, build QA y repetición de los 12 recorridos sintéticos. Se versiona junto
al catálogo y referencias; su SHA será la versión visible final en el alias QA,
con el mismo override de build temporal. No se hicieron acciones reales.

La prueba autenticada Android/iPhone, carga real y notificaciones físicas siguen
pendientes. No cerrar todavía la validación integrada ni los reintentos fiables.

## Comprobación reportada y continuidad de UI — 2026-10-20

Bastián informó que pasó la notificación y pudo enviar la respuesta al cliente.
Se conserva como comprobación reportada de ese paso, sin extenderla a aceptación,
rechazo, contrapropuesta/final, foto ni a ambos sistemas móviles. No repetir la
operación confirmada para verificar feedback.

Se añade [UI-ALTERNATIVE-SENT-HOLOGRAM-01](frontend-alternative-sent-hologram-qa.md),
código 0ef735603d90b8a9945ad5aa15e3fa52bc86a7f6: reutiliza el holograma existente
después del envío confirmado para indicar Esperando respuesta (negocio) y Por
responder (cliente). Sin cambiar el contrato ni agregar otra notificación.
