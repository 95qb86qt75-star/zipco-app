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

### 2026-11-22 — Selector horario compartido solicitado por el usuario

Clasificación: solo frontend, presentación e interacción local. Se extrajo el
TimePicker existente de AlternativeChangeEditor a shared/time/TimePicker.tsx,
con sus estilos en time-picker.css. Se mantiene una sola implementación; no se
copió el resto de Proponer alternativa. Su confirmación TimeConfirm permanece
en el editor original. Props value/onChange conservan HH:MM y se agregó disabled
para bloquear botones/teclado durante el envío de E221.

En AvailabilityScheduleCard solo el formulario del cliente utiliza el selector;
fecha nativa a ancho completo arriba, hora debajo y nota existente intacta.
CSS acotado a zipco-as-customer-schedule evita que las reglas genéricas del
diálogo aplasten los botones de 44 px. Formulario del negocio, borrador, payload,
permisos, envío y recuperación no cambian. Los mismos campos E221 siguen usando
actions/request-availability-schedule; no requiere backend ni cambios Railway.

Archivos de aplicación: AvailabilityScheduleCard.tsx, availability-schedule.css,
AlternativeChangeEditor.tsx, alternative-proposal.css, shared/time/TimePicker.tsx
y time-picker.css. No se modifica index.css ni la tipografía compartida.

Verificación seleccionada por extracción compartida:

- 46 pruebas aprobadas en 4 archivos: AlternativeChangeEditor, contrato E221,
  transporte/recuperación y borrador. Duración 986 ms.
- Chromium con RequestsScreen/componentes reales y HTTP sintético: cliente
  320/360/390/430, botones ±, flechas del teclado, nota conservada, fecha pasada
  bloqueada/futura válida, cuatro controles de 44 px y sin desborde horizontal.
  Seleccionar hora no envía ni abre un pop-up de propuesta.
- Envío explícito con nota conserva schedule.time=09:05 y el texto de la nota;
  el selector se bloquea mientras guarda. Sin escrituras QA reales.
- Proponer alternativa original a 320/390: mismo selector, Guardar abre su
  confirmación existente y Cambiar hora vuelve sin POST.
- La primera comprobación del diálogo original usaba scrollWidth. Sus halos
  preexistentes right:-50/left:-60 suman ancho de scroll aunque ningún control
  sobresalga. Se midieron los controles dentro del diálogo y se continuó solo
  esa regresión; no se cambió el diseño original por el halo ni se repitieron
  los cuatro casos del cliente ya aprobados.
- Build QA aprobado, Vite 12,25 s y PWA correcta. Sin tsc/lint disponibles.
  Análisis, implementación, preparación de navegador, documentación y publicación
  no medidos por separado. Build/navegador solapados no se suman.

Evidencia local ignorada: node_modules/.cache/e221-time-picker/, capturas cliente
320/390 y alternativa original. Falta verificación física en iPhone del campo
nativo de fecha y revisión Android. Main y producción intactos.

### 2026-11-22 — Cliente En espera, diseño entregado por Claude

Clasificación: solo frontend, presentación e interacción local. Reemplazados
AvailabilityScheduleCard.tsx, availability-schedule.css y AvailabilityFlowCard.tsx
por los adjuntos completos. Una sola tarjeta/hoja atiende EXPIRED_OFFER y
AWAITING_BUSINESS; negocio y las demás fases conservan su composición.

La nueva fecha y nota proceden de availabilityScheduleReview.request.requestedFor
y request.note; la hoja distingue fecha/nota originales y retiro anterior vencido.
Importe siempre SOLICITADO, no pago. Se conserva el selector compartido TimePicker,
formulario, borrador, validación, UUID, errores y recuperación E221. Cancelar abre
DesignConfirmation y usa el POST actions/decline-request existente, sin nuevos
campos/endpoints ni cambios Railway. Volver no ejecuta nada.

La prueba de cancelación de la última tarjeta detectó que el controlador ocultaba
En espera al recibir contador cero antes de terminar StatusChangeFlow. El usuario
autorizó expresamente modificar useRequestsScreenController.tsx y su prueba
RequestsScreen.notificationNavigation.test.ts. El contador visual de En espera
usa la proyección existente mientras dura la presentación; los demás contadores
siguen leyendo datos reales. No se altera StatusChangeFlow, acciones ni tiempos.

Verificación seleccionada por reutilización de tarjeta, controles y capas:

- 51 pruebas aprobadas en cinco archivos E221, recuperación, borrador,
  statusChangePresentation y ReservationChoiceFields; 1,09 s.
- Tras el cambio autorizado de controlador, 63 pruebas aprobadas en dos archivos:
  navegación/notificaciones y presentación de cambios; 4,28 s. Incluye mantener
  la última tarjeta/pestaña hasta liberarla. Repetición de presentación justificada
  por la nueva dependencia de sus registros visuales; no sumar como casos únicos.
- Chromium con RequestsScreen y componentes reales, HTTP sintético: doce casos
  320/360/390/430, uno/tres productos, textos largos, foto, notas presentes/ausentes,
  sin desborde, hoja original, Escape/foco y ningún POST al abrir/cerrar.
- Se corrigió una nota sintética superior al máximo contractual de 300 caracteres;
  la API se rechazaba correctamente. También se ampliaron esperas de carga del
  arnés y se esperó el cierre de 600 ms antes de capturar. No son fallos de la app.
- No hay tsc ni lint configurados/disponibles en este checkout; no se afirman
  aprobados ni se instalaron herramientas nuevas.
- Recorrido restante aprobado en Chromium: Cancelar abre la confirmación real,
  Volver sin POST, confirmar envía una vez, salida con data-design-exit y
  data-leaving, solicitud visible en Historial. Regresión de EXPIRED_OFFER con
  TimePicker compartido, formulario del negocio y movimiento reducido aprobados.
  No se repitieron los doce casos visuales tras corregir el controlador; se
  repitió únicamente cancelación y comprobaciones restantes.
- Build QA final aprobado: Vite 10,39 s y generación PWA correctos. El primer
  build previo al ajuste del controlador también pasó (9,50 s); repetido por
  dicho cambio. Se conserva el aviso de tamaño de bundles preexistente.

Evidencia ignorada: node_modules/.cache/e221-waiting/. Imágenes remotas bloqueadas
en el navegador de prueba: visor/miniaturas reales con fallback, sin acreditar
descarga de fotos en QA. Pendiente comprobar físicamente en iPhone y Android.
Análisis, implementación, preparación del arnés, documentación y publicación no
medidos individualmente. Build y navegador solapados no se suman. Main y producción
intactos.

### 2026-11-22 — NegW14, negocio con oferta de retiro vencida

Clasificación: solo frontend, presentación/interacción local. Adjuntos completos
AvailabilityScheduleCard.tsx y availability-schedule.css integrados. Activación
limitada expresamente a business + AWAITING_CUSTOMER_CONTINUATION + EXPIRED_OFFER.
Se añadió la comprobación explícita de estado al if entregado; el padre ya la
aplicaba. Sin cambios en AvailabilityFlowCard ni componentes de referencia.

Resumen de cliente, productos/cantidad y total SOLICITADO; retiro ofrecido vencido
o fecha no disponible; detalle local con chips y Retirar disponibilidad dentro.
Hoja original con fecha/nota/foto del pedido y oferta anterior identificada como
vencida. formatDeliverySchedule no agrega prefijo, por lo que no se duplicó
«Fecha original». Los datos provienen del pedido y de la oferta simplificada:
scheduledFor y requiredAmountClp. No se registra pago ni reserva.

Retirar abre el DesignConfirmation real, variante withdraw; confirmar usa el POST
/request-processes/:id/actions/withdraw-availability existente con expectedVersion,
proposalId, availabilityConfirmationId e Idempotency-Key. Volver no envía nada.
Contrato E221, capacidad, UUID, permisos y recuperación intactos. Railway no fue
necesario; ninguna mutación real QA en las pruebas.

Compatibilidad de salida: StatusChangeFlow sí emite exiting y la tarjeta recibe
data-leaving. Para el negocio se conserva el feedback/colapso compartido de 500 ms,
sin data-design-exit (es del recorrido del cliente). El CSS adjunto pedía 900 ms:
solo se ajustó animation-duration a .5s para esta raíz del negocio, para que no
quedara cortado. No se modificó el motor compartido ni la salida de 900 ms del
cliente. Movimiento reducido conserva el comportamiento del sistema.

Verificaciones seleccionadas por los cambios de capas, controles y estilos:

- 51 pruebas aprobadas en 5 archivos: contrato/normalizador E221, API y recuperación,
  borrador, presentación de cambios y ReservationChoiceFields. Duración 1,31 s.
- RequestsScreen/componentes reales en Chromium, HTTP sintético: 12 casos, anchos
  320/360/390/430, uno/tres productos, texto largo, foto, sin nota, FREE y sin fecha.
  Tarjeta cerrada, abierta y hoja sin desborde; inert, Escape, foco, toggle de 44 px,
  total etiquetado y cero POST al abrir/cerrar comprobados.
- Confirmación real: Volver sin POST, retirar envía una vez y llega a Historial.
  Ambas fases del cliente conservan su raíz; negocio AWAITING_BUSINESS y su diálogo
  siguen operativos. Movimiento reducido sin animaciones propias.
- Tras ajustar la duración se repitió solo salida: animación calculada de .5s.
  También visor real de foto (Escape no cierra la hoja), error sintético de retiro
  visible con hoja abierta y Comprobar pedido sin reenvío. Sin errores de consola.
- El arnés inicialmente intentó pulsar el botón de fondo porque confirmación y
  tarjeta usan «Retirar disponibilidad». Se corrigió para priorizar alertdialog;
  se repitió solo el recorrido restante, no los doce casos visuales ya aprobados.
  Después del límite de uso se corrigió un paréntesis del generador de pruebas;
  sin cambios de app asociados ni repetición de la matriz visual.
- Build QA final aprobado: Vite 8,19 s, PWA correcta. Build anterior 11,71 s aprobado,
  repetido por el ajuste de CSS. Aviso preexistente de tamaño de bundles.
- No hay typecheck/tsc ni lint configurados/disponibles; no se afirman aprobados.

Evidencia local ignorada en node_modules/.cache/e221-business-expired/, capturas
cerradas/abiertas de los cuatro anchos, original y error. Imágenes remotas bloqueadas:
se usaron componentes reales con fallback, sin validar descarga de fotos de QA.
Pendiente revisión física iPhone/Android. Análisis, implementación, preparación,
documentación y publicación no medidos por separado; build y navegador solapados
no se suman. La revisión automática no pudo ejecutar una prueba por límite de uso;
se retomó tras la indicación del usuario, sin eludir el control. Main y producción
intactos.

### 2026-11-22 — Negocio Pendientes, cliente solicita otra fecha

Clasificación: solo frontend, presentación e interacción local. Reemplazados
completos AvailabilityScheduleCard.tsx y availability-schedule.css por los adjuntos
actuales. Rama exclusiva business + AWAITING_CUSTOMER_CONTINUATION +
AWAITING_BUSINESS + request no nulo. NegW14, cliente, formulario y restantes
consumidores conservan su composición. No se modificó ningún otro archivo de app.

Tarjeta compacta con cliente, producto/cantidad/total SOLICITADO, requestedFor y
requestedAt formateados en Santiago, aviso de fecha pedida pasada, CTA y detalle.
Nota de fecha request.note y nota original order.note separadas. La hoja conserva
visores reales, foco, inert y datos originales. Permisos, borrador, UUID, envío,
errores y recuperación intactos. La fecha pasada solo agrega feedback; no altera
las validaciones ya existentes del formulario.

Tras advertir que el contrato no acredita transferencias externas, el usuario
aprobó cambiar «Aún no hay reserva ni pago» por «Aún no hay reserva. ZIPCO no
verifica pagos». Es el único ajuste al TSX adjunto. Se conserva la fuente heredada
de la app mediante --zipco-asx-font/inherit; no se instala ni carga Nunito.

Campos/endpoints existentes: availabilityScheduleReview.request (requestedFor,
requestedSchedule, requestedAt y note), canRenew, oferta anterior scheduledFor /
requiredAmountClp y pedido original. POST actions/renew-availability-schedule,
GET availability-schedule-result para recuperar UUID, POST actions/withdraw-availability
y lecturas actuales. No cambios de contrato, estados, permisos o Railway.

Verificación proporcional, con los escenarios previos reutilizados:

- 51 pruebas seleccionadas aprobadas, cinco archivos: contrato E221, transporte,
  recuperación, borrador, presentación y ReservationChoiceFields; 1,16 s.
- Chromium con RequestsScreen y componentes reales, HTTP sintético: 15 casos en
  320/360/375/390/430, uno/tres productos, nombres/notas largos, foto, sin notas,
  FREE y fecha solicitada pasada. Tarjeta, detalle y hoja sin desborde, CTA/Detalle
  de 44 px sin solape, apertura del formulario existente, Escape y retorno de foco,
  cero POST al abrir/cerrar. A 390 de viewport la tarjeta mide 358 px y 255,30 px
  de altura en el caso básico; conserva la fuente heredada del navegador/app.
- El fixture original sobrescribía serverNow al emitir respuestas, por lo que el
  caso de fecha pasada no simulaba lo previsto. Se corrigió el reloj del fixture
  y se retomó ese caso y los restantes; no se repitieron los dos casos ya aprobados.
- Permiso ausente oculta el CTA; guardando lo deshabilita. Envío explícito FREE
  usa CONFIRM_REQUESTED_SCHEDULE y un único POST, sin heredar monto PREPAYMENT.
  Resultado incierto conserva recuperación con hoja abierta; Comprobar estado no
  reenvía. Retirar: Volver sin POST, confirmar lleva a Historial y activa .5s.
- Cliente EXPIRED_OFFER/AWAITING_BUSINESS y negocio NegW14 conservados; movimiento
  reducido sin animaciones propias. Sin errores de consola.
- Renovar mantiene la navegación existente de useAvailabilitySchedule a la oferta
  nueva; ese hook no usa StatusChangeFlow. No se añadió una salida nueva al renovar.
  El data-leaving/500 ms comprobado corresponde a Retirar disponibilidad.
- Build QA aprobado: Vite 8,06 s y PWA correcta. Aviso preexistente de bundles
  grandes. Sin typecheck/tsc ni lint configurados/disponibles en este checkout.

Evidencia ignorada: node_modules/.cache/e221-business-requested/. API simulada e
imágenes remotas bloqueadas con fallback real; no acredita API autenticada ni
revisión física en iPhone/Android, ambas pendientes. Análisis, implementación,
preparación de pruebas, documentación y publicación no cronometrados por separado;
build y navegador solapados no se suman. Main y producción intactos.
