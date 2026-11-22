# E221 — Revisar la fecha vencida de una disponibilidad

Fecha: 2026-11-21, America/Santiago. Workspace frontend QA, rama qa.
Clasificación: frontend + backend coordinado; implementación backend previa.

## Contrato y publicación backend

Se leyó completo el contrato definitivo
`C:/dev/zipco-backend-qa/docs/testing/availability-schedule-review-contract-qa.md`.
Railway QA del SHA `0e0df6c4c0812a1d170173ef002779f2f206b014`: estado success
comprobado mediante GitHub, coincide con la entrega backend y su despliegue.
Lecturas QA sin credenciales: raíz 200; capacidad y recuperación 401; OPTIONS
204 admite origen Vercel QA y las cabeceras nuevas. No se leyeron sesiones,
pedidos o capacidades autenticadas de una cuenta real para esta comprobación.

La sesión de la app consulta la capacidad `availabilityScheduleReview` antes
de enviar `X-Availability-Schedule-Contract: availability-schedule-review-v1`.
Sin soporte o resumen válido no se inventan controles ni categorías nuevas.
Se conservan las cabeceras availability-v3 y service-hours-advisory-v1.

## Composición y comportamiento

- La tarjeta exterior de disponibilidad V3 LOCAL_PICKUP vencida indica
  «La fecha de retiro ya pasó» usando el resumen del servidor. No anuncia que
  la reserva vencida está disponible. Cliente solicita otra fecha futura de Chile
  y una nota opcional; pedir fecha no acepta, reserva, paga ni aparta.
- Tras guardar: cliente En espera; negocio Pendientes, según `categories` de la
  misma proyección que usan listas y contadores. El cliente no vuelve a enviar.
- Negocio confirma la fecha solicitada o propone otra. Debe elegir FREE/PREPAYMENT,
  indicar el monto si corresponde y confirmar su permiso de contacto otra vez.
  No se copia el monto anterior ni se trasladan consentimientos.
- Tras renovar, se usa la propuesta ordinaria y su tarjeta/conversación existentes.
  El cliente revisa las nuevas condiciones antes de aceptar con oferta/hash nuevos.
  El producto, cantidad y total se conservan. No se crea otra solicitud.
- Se mantienen la retirada/declinación existentes. Antes de una petición pendiente,
  «Ir al local sin reserva» sigue abriendo la confirmación real cuando allowedActions
  permite CONTINUE; durante revisión no se permite aceptar la oferta anterior.
- Se conservan detalles originales y visores reales; el diálogo nuevo tiene foco
  de retorno, Escape y controles de 44 px. No se agregan animaciones permanentes.
- Formularios conservan elecciones editables por usuario/rol/proceso/origen en
  sessionStorage. No se guardan credenciales ni se restaura un consentimiento.

## Archivos y responsabilidades

- `domain/availabilityScheduleReview.ts`: tipos, normalizador estricto y capacidad.
- `api/availabilityScheduleApi.ts`: comandos, validación de recibos, GET por UUID,
  persistencia exacta de intención y bloqueo por participante/proceso.
- `application/useAvailabilitySchedule.ts`: estado operativo, límites de sesión,
  envío explícito, lectura/reintento, publicación del estado actual y categorías.
- `application/availabilityScheduleDraft.ts`: borrador editable acotado al origen.
- `cards/shared/availability/AvailabilityScheduleCard.tsx` y su
  `availability-schedule.css`: tarjeta y formulario canónicos de esta fase.
- `AvailabilityFlowCard.tsx`: conexión con disponibilidad y acciones existentes.
- `shared/reservations/ReservationDecisionDialog.tsx`: prop opcional startWithout,
  false por defecto, para abrir su opción sin reserva sin recrear ese flujo.
- `domain/requestProcess.ts`: acciones nuevas y resumen aditivo validado.
- `domain/requestStatusGrouping.ts`: agrupación por categorías servidor.
- `api/participantContractHeaders.ts`: opt-in por sesión; evita que una lectura de
  capacidad de la sesión anterior sobrescriba la sesión vigente.
- `api/reservationOptions.ts`: conserva el opt-in al verificar condiciones.
- `domain/requestProcessErrors.ts`: errores recuperables específicos de revisión.
- Fixtures y tres archivos de pruebas del nuevo contrato/borrador/transporte.

Los nuevos propietarios están por debajo de 400 líneas; no se duplican los
formularios de propuesta, la aceptación, el comprobante ni las reservas existentes.

## Campos y endpoints

Se consumen `availabilityScheduleReview` (phase, request, canRequest, canRenew,
reservationAvailable, blockingReason, categories), allowedActions, version,
currentProposalId, availabilityConfirmationId, términos y fechas canónicas.

GET capacidad, listas de ambos roles, detalle/propuestas y reservation-options.
POST `actions/request-availability-schedule`:
expectedVersion/proposalId/availabilityConfirmationId/sourceTermsVersion/schedule/note.
POST `actions/renew-availability-schedule`:
expectedVersion/proposalId/availabilityConfirmationId/scheduleRequestId/decision,
schedule solo si propone otra fecha y fulfillment completo explícito.
GET `availability-schedule-result` conserva Idempotency-Key original.
La aceptación sigue en `actions/accept-proposal`, con offerId/termsVersion nuevos.

La intención se persiste ANTES de enviar; doble toque bloqueado. Resultado incierto
mantiene UUID/cuerpo: «Comprobar estado» solo hace GET. Un 404 específico no prueba
que no se haya ejecutado; un reintento explícito usa UUID/cuerpo originales y exige
contexto todavía compatible. Un conflicto/validación exige releer antes de otra
intención. No se reenvía automáticamente al volver a la app o cambiar de versión.
El recibo histórico prueba guardado, pero se publica currentRequestProcess, incluso
si la solicitud ya avanzó o cerró. No se retrocede al snapshot de la petición.

## Verificación y límites

214 pruebas focalizadas aprobadas: 190 de normalizadores, contrato, transporte,
UUID/borrador, listas, permisos, reservas/horario y regresiones, más 23 de diseño
Disponible y elección de reserva y un caso adicional de fallo servidor 503.
Incluyen 30 nuevas de E221. La última repetición del archivo de transporte (11)
incluye diez ya contabilizadas; no se suman dos veces. Se seleccionaron por
la dependencia compartida del parser, cabeceras y agrupación; no se repitió por rutina
la suite global de capacidades no afectadas. No hay TypeScript/tsc ni scripts lint
instalados/configurados: no se afirma que esos controles se hayan ejecutado.

Chromium local con RequestsScreen/componentes reales y HTTP sintético:

- Cliente a 320/360/390/430: aviso exterior, fecha futura/pasada, nota, apertura,
  cierre sin POST y ausencia de scroll horizontal.
- Negocio a los cuatro anchos: modalidad/monto explícitos, FREE y otra fecha,
  foco de retorno, borrador al volver, sin desborde y movimiento reducido.
- Recorrido cliente → En espera → negocio Pendientes → nueva oferta PREPAYMENT
  con $3.000 (antes $2.500) → aceptación real muestra las condiciones renovadas.
- Pérdida de petición y de respuesta: GET no reenvía, recuperación del recibo o
  reintento con mismo UUID y cuerpo. STALE_VERSION bloquea hasta actualizar.
- La opción sin reserva abre su diálogo real sin POST y conserva los guards
  existentes de fecha y confirmación explícita.
- Aceptación explícita comprobada con componentes reales: POST accept-proposal
  usa proposalId/offerId/termsVersion renovados y REQUEST_RESERVATION. No envía
  declaración de comprobante, confirmación de pago/apartado ni MARK_READY.
- Un primer paso del arnés cambiaba credenciales pero no seleccionaba Mi Negocio;
  se corrigió el arnés y se continuaron solo las interacciones pendientes, sin
  alterar el agrupador del producto ni repetir la matriz cliente aprobada.
- Tras reforzar validación del recibo (fecha/monto/plan/hash), se repitió solo el
  recorrido de renovación afectado y las pruebas del contrato/recuperación.

Evidencias ignoradas en `node_modules/.cache/e221/`: capturas, guiones y JSON.
El JSON de interacciones conserva los casos de pérdida; business-evidence los
cuatro anchos del negocio. La matriz cliente se completó antes del ajuste del
arnés de rol y sus comprobaciones/captura quedan en el guion original.

Build QA final aprobado: Vite 8,01 s; PWA posterior correcta, sin tiempo independiente.
Suite de 190: 2,08 s; 23 regresiones visuales: 920 ms; transporte final: 812 ms.
Análisis, implementación,
preparación de navegador, documentación, publicación y esperas no se cronometraron
por separado. No sumar tiempos de procesos solapados ni atribuirlos a rendimiento
físico. Aviso de tamaño de chunk existente, sin nuevas dependencias.

Pendiente: comprobar la capacidad y el pedido real autenticados desde la app QA,
y completar el recorrido físico en Android/iPhone. Las pruebas sintéticas no
acreditan pagos, WhatsApp, push ni acciones reales en Railway. No se crearon
pedidos ni se enviaron mutaciones QA para probarlo. Main y producción intactos.

## 2026-11-22 — Presentación cliente EXPIRED_OFFER entregada por Claude

Clasificación: solo frontend; presentación e interacción local. Tres adjuntos
completos aplicados: AvailabilityScheduleCard.tsx, availability-schedule.css y
AvailabilityFlowCard.tsx. Este último conserva exactamente las tres conexiones
recibidas: compuerta expiredReview, leaving y textos de la confirmación de cierre.
No se modifican hooks, API, borradores, tipos, ProductPreviewControl ni su CSS,
OrderReferencePhoto, AvailabilityDesign o sus consumidores compartidos.

La tarjeta muestra negocio, miniatura real, producto/cantidad, total SOLICITADO,
modalidad, fecha vencida canónica de la oferta y aviso del monto anterior cuando
es PREPAYMENT. No presenta la oferta vencida como reservable. Los chips abren
la solicitud original en una hoja que contiene todos los productos, total, fecha
original del pedido, nota y el visor real de referencia. Ambas fechas pueden
ser diferentes. formatDeliverySchedule no trae el prefijo «Fecha original»;
no se duplica. Otros productos siguen accesibles desde el selector del visor real.

Comparación textual: JSX de Dialog.Root y función send idénticos a la base;
marcado original del negocio/espera y las 13 líneas CSS originales idénticos.
RENEWED_OFFER sigue usando la tarjeta de propuesta ordinaria ya integrada.

Ajustes necesarios sobre los adjuntos, dentro de los archivos autorizados:

- La pausa nueva por data-request-list-scrolling se sustituyó por
  data-request-list-hidden, conservando pausas fuera de pantalla y reduced motion.
  No se restaura la congelación al deslizar que el usuario pidió eliminar.
- La foto se mantiene montada: se quitó key=highlight. El resaltado diferido no
  roba foco si ya se abrió un visor real. Escape del visor conserva la hoja abierta.
- Errores/recuperación se sitúan en host visible fuera del main inerte y la hoja.
  Tras comprobar estado, si el navegador pierde foco al deshabilitar/reemplazar
  controles, se devuelve a la hoja abierta; no se altera el controlador.
- Escape desde controles de recuperación también cierra la hoja; los portales de
  los visores y el diálogo de fecha conservan su propio Escape.
- El único bucle nuevo no finito es el spinner operativo, montado mientras se
  comprueba estado, para que no se pare a los 9,6 s. Reduced motion conserva
  el texto estático. Los adornos mantienen sus ciclos finitos recibidos.

StatusChangeFlow y statusChangePresentation ya cubren cliente CONTINUATION:
usesAvailableDesignExit devuelve true y la CSS compartida evita el colapso doble.
No fue necesario editarlos. Chromium confirmó data-design-exit=true, wrapper con
opacity 1, leaving=true y zipco-asx-leave en la tarjeta después del guardado real
simulado. Cancelar «No, gracias» no envía; confirmar DECLINE_REQUEST lo envía una
vez y el pedido aparece en Historial. No se simula la burbuja +1 del tablero.

Verificación por dependencias/riesgo:

- 51 pruebas focalizadas aprobadas (contrato E221, transporte/UUID, borrador,
  transición de estado y elección de reserva), 5 archivos, duración 1,13 s.
  No se repitió la suite global ni pruebas comerciales no afectadas.
- Chromium local, RequestsScreen y componentes reales, HTTP sintético:
  320/360/390/430, uno/tres productos, nombres y nota largos, con/sin foto,
  nota, pago previo, hora o permiso CONTINUE. Sin desborde. Miniaturas cuadradas
  de 46/52 px con padding cero; detalles completos y foco/retorno al chip correctos.
- Selector del visor real permite abrir los tres productos pese a ocultar las
  miniaturas adicionales. Foto real, apertura rápida antes del resaltado, Escape
  anidado y formulario de fecha original comprobados. Sin POST al navegar.
- Error tras envío incierto y GET de recuperación accesibles con hoja abierta;
  comprobar no reenvía. Confirmación/cancelación y salida a Historial comprobadas.
  Negocio y cliente AWAITING_BUSINESS siguen usando .zipco-as y su diálogo real.
- Animaciones siguen running al establecer scrolling=true, se pausan en segundo
  plano y no hay animaciones activas con movimiento reducido.
- La primera matriz completó 320/360 y avanzó por 390 antes de fallar una igualdad
  exacta de decimales del rectángulo animado. Se midieron CSS y dimensiones reales
  en los cuatro anchos: 46/52 px cuadrados. Se corrigió solo la tolerancia subpíxel
  del arnés y se continuó con 390/430; no se modificó CSS por esa comprobación.
- Un selector mal escapado detuvo los visores, ya completada la matriz. Se corrigió
  el arnés y se repitieron solo esas interacciones. La prueba de recuperación
  detectó foco en body; se corrigió localmente y se repitió el caso antes de
  continuar con cierre/Historial y las variantes compartidas.

Evidencias locales ignoradas: node_modules/.cache/e221-design/. matrix.json contiene
la continuación 390/430; el primer recorrido 320/360 y sus capturas/guion conservan
la evidencia previa. operations-evidence.json registra la salida confirmada.
Sin tsc/lint configurados/instalados; el build no se presenta como un typecheck.
Análisis, implementación, preparación de navegador, documentación y publicación
no se cronometraron por separado. Las esperas/build/navegador solapados no se suman.
Build QA final aprobado: Vite 7,77 s y generación PWA correcta (sin medición
independiente). Se conserva el aviso de tamaño de chunk existente. El estado
Vercel del SHA exacto se reporta al usuario tras verificarlo.

Se utilizan los campos/endpoints E221 y DECLINE_REQUEST ya publicados, sin datos
nuevos ni cambios de contrato. Railway no necesario en este ajuste. Queda pendiente
validación visual/táctil física del diseño con las cuentas reales Android/iPhone.
Main y producción intactos.
