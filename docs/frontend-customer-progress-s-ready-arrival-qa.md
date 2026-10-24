# UI-CUSTOMER-PROGRESS-S-01 / UI-READY-ARRIVAL-T-01 / UI-PROGRESS-CATEGORY-SHELL-01

2026-10-23. Clasificación: **solo frontend QA**. Referencias S-1…S-10 y
T-1…T-4 del paquete codex-s de Claude. Integración validada técnicamente;
pendiente conformidad visual de Bastián en la aplicación publicada. Su comentario
«veo que está funcionando» corresponde a la entrega anterior y señala el
defecto de aparición breve del diseño antiguo al entrar a En curso.

## Causa y resultado

ProcessOrderCard elegía la tarjeta de progreso después del GET del acuerdo.
Mientras esperaba mostraba Aurora; al navegar, el componente volvía a montarse
y repetía ese cambio visual. Ahora cliente y negocio presentan desde el primer
render su marco de progreso, con importe reservado y condiciones en verificación.
No muestran precios ni notas originales como si fueran el acuerdo aceptado.
Fallo de GET conserva el marco y permite reintentar solo la lectura.

Cliente IN_PROGRESS/READY usa S: fondo claro, condiciones aceptadas, anillo
decorativo de preparación con brillo y acciones. Cuenta regresiva calculada
desde accepted.scheduledFor; desaparece sin fecha, con needNow o si ya pasó.
Animaciones pausadas al plegar, cubrir, ocultar o salir de pantalla; movimiento
reducido conserva los mensajes sin efectos. Navegación común inicia plegada;
la notificación explícita conserva la apertura dirigida de su pedido.

READY conserva los dos botones, con recepción deshabilitada y «Primero confirma
el aviso» hasta que la API permita recibir. Se reutiliza CustomerReceiptDialog
para ambas confirmaciones. ACK ausente no se interpreta como false: muestra
lectura no disponible y Actualizar estado. Servicios no habilitan ACK/recepción
de producto. Escribir al negocio usa useCoordination, allowedActions,
consentimiento propio y los tres segundos de holograma antes de WhatsApp.
No se construyen URLs nuevas ni se modifican permisos del servidor.

Acuerdo completo reutiliza V2 con perspectiva del cliente: Tú pediste, El negocio
propuso, Tu contrapropuesta, Final del negocio y quién aceptó. La ronda acordada
sigue identificándose por acceptedProposalId y comparándose con el snapshot
inmutable; no se elige arbitrariamente la última. Fechas de aceptación reales
por actor. Resumen y reintento de lectura se conservan si falla el historial.

## Secuencias visuales

- IN_PROGRESS → READY observado para el mismo proceso/acuerdo y versión mayor:
  holograma clientReady. A los 4,3 s selecciona Listos, rebota el chip con aro y
  muestra el globo. Tarjeta entra desde la izquierda con resplandor de 1,3 s;
  globo termina a los 7,9 s. Conteos cambian con la lectura real, sin retrasarlos.
- Primera carga ya READY: sin holograma ni llegada repetida. Sin polling nuevo.
  Cambios simultáneos se agrupan. Cambiar sesión o salir de Mis Pedidos cancela
  efectos pendientes. Si se elige otra categoría durante el holograma, respeta
  esa elección. Movimiento reducido usa 2,2 s de holograma y coordina el cambio
  con esa duración, sin animaciones.
- ACK verificado: mínimo visible 1,1 s, clientAck y plegado a los 3,2 s. Sigue
  en Listos y recepción pasa a principal.
- Recepción verificada: mínimo 1,1 s, Recibido transitorio; +100 ms
  clientReceived; +600 ms publicación y navegación a Historial detrás del
  holograma. Historial conserva su tarjeta existente, como indica el paquete.
  Sus conteos mantienen el significado actual, sin números ficticios.
- Globo reposicionado dentro del viewport a 320 px, con flecha hacia el chip.

Un callback opcional de useCoordination presenta después de POST + GET
verificados y antes de publicar el recibo. Un fallo visual no revierte una
operación confirmada. Holograma global sobrevive al desmontaje, sin pasar a
otra sesión. Conserva bloqueo, intención durable, mismo body/clave al reintentar
y recuperación por lectura. POST confirmado + GET fallido no anuncia éxito.

## Contrato existente

Sin campos, endpoints, estados, timestamps, migraciones ni persistencia nuevos.
Se revisó en lectura la política del backend local QA, sin modificarla.

| Uso | Contrato |
|---|---|
| Listas/verificación | GET /orders/my-orders?processContract=alternatives-v1 y /orders/business/:id?processContract=alternatives-v1 |
| Acuerdo | GET /request-processes/:id/agreement: agreementPublicId, requestProcessId, acceptedProposalId, subjectSnapshot, totalPriceClp, scheduledFor, confirmedAt, customerAcceptedAt, businessAcceptedAt |
| Rondas | GET /request-processes/:id/proposals: id, sequence, type, authorActor, createdAt, subjectSnapshot, totalPriceClp, scheduledFor |
| Aviso | POST /request-processes/:id/actions/ack-ready-notice |
| Recepción | POST /request-processes/:id/actions/confirm-receipt |
| Contacto | OPEN_WHATSAPP existente y navegación devuelta por API |

ACK/recepción: `{expectedVersion, confirmationAccepted:true}`, JWT y
Idempotency-Key existentes. Respuesta: orderId, orderStatus, requestProcess;
contrastada con GET posterior. requestProcess.state/version, agreementPublicId,
allowedActions, readyNoticeAcknowledged y consentimientos mantienen su semántica.
READY/COMPLETED ya pertenecían a Listos/Historial en statusViewFor; no se cambian
transiciones de backend ni filtros de servidor.

## Archivos y validación

Nuevos en src/app/screens/requests: CustomerProgressCard, ProgressCardShell,
useReadyTransitions, readyArrival, ReadyArrivalTip, customerProgressFeedback y
sus pruebas. Adaptados: ProcessOrderCard, BusinessProgressCard, ActionHologram,
useCoordination, RequestStatusTab, AgreementSheet, agreementTimeline,
RequestsScreen, pruebas de integración y src/styles/index.css.
scripts/check-customer-progress-s.mjs añade recorridos S/T;
check-business-progress-r.mjs comprueba separación R/S. Este documento y
frontend-ui-design-catalog.md registran la entrega.

**1.271 pruebas / 108 archivos aprobados**, git diff --check y build QA/PWA
aprobados. Aviso preexistente de bundle >500 kB; no hay scripts lint ni tsc
independiente configurados. Chrome: **20 recorridos S/T**, **19 R/V2** y **13
regresiones de aceptación/coordinación/notificación**, todos aprobados.
Cobertura 320/360/393 px: carga lenta sin Aurora, error de acuerdo/reintento,
secuencia de llegada, ACK/recepción con diálogo y verificación, clave idéntica
en retry, recuperación, ACK ausente, servicios, permisos/contacto, cuatro rondas
aceptadas y movimiento reducido. Tests del hook cubren sesiones, desmontaje,
versión, cambio de categoría y agrupación de transiciones.

Solo HTTP y datos sintéticos, HTTPS externo bloqueado en Chrome. Sin pedidos,
WhatsApp, fotos o notificaciones reales. Capturas revisadas bajo
node_modules/.cache/customer-progress-s y business-progress-r. Fechas 2099 de
cuenta regresiva son exclusivamente fixtures locales.

## Publicación y pendientes

Código respaldado en GitHub, rama qa:
e3229085d373be969fefbc9edff68defde7ed491. Vercel QA **READY**:
dpl_EhfpwzyDYcPSPSyNnKSdM3uetRup. SHA exacto, ref qa, destino Preview y alias
https://zipco-app-git-qa-zipco-s-projects.vercel.app comprobados por API.
Se verificó que productionBranch sigue main y el build global sigue sin cambios.
Este cierre documental también se respalda y publica, con código funcional
idéntico. Railway QA no necesitó cambios. Main y producción no fueron modificados.

Pendiente prueba física Android/iPhone: navegar En curso/Listos, abrir desde
notificación, observar llegada, confirmar aviso y recepción con pedidos QA
autorizados, revisar red lenta y recuperación. Referencias entregadas no
equivalen a aprobación de la implementación desplegada. Reintentos fiables de
notificaciones continúan pendientes del cierre general.
