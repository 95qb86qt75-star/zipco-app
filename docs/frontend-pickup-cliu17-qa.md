# Retiro local del cliente — integración CliU17

## Integración 2026-11-23 · NegW18 + E225

Clasificación: **frontend + backend coordinados**. Backend ya publicado por su
propio chat: `f019560`, contrato definitivo
`C:/dev/zipco-backend-qa/docs/testing/customer-pickup-closure-contract-qa.md`,
sección 8 y fuentes DTO leídas. No se modificó backend ni Railway. El usuario
autorizó ampliar API, lecturas, agrupación, Historial y ReservationPanel para
preservar sus controles. Sustituye el bloqueo del diagnóstico inicial de abajo.

### Archivos y presentación

Reemplazados íntegros los cinco adjuntos antes de aplicar las conexiones reales:
CustomerPickupCard.tsx, CustomerReceiptDetails.tsx, CustomerReceiptFlowCardView.tsx,
CustomerWhatsappProgressCard.tsx y customer-pickup.css. Marco común NvCardFrame
para A/B/C retiro y D/E WhatsApp; el detalle mantiene datos de condiciones
aceptadas, productos/cantidades, nota, instrucciones y total separado de reserva.
CustomerReceiptFlowCardView selecciona, y su controlador posee el comando nuevo.
Sin modificar los dos CSS de progress excluidos, Side negocio, ReadyPanel,
StatusRail, DetailReveal, CustomerCoordinationCard o localPickupInformation.

Adaptaciones necesarias sobre la entrega de Claude:

- Tres choices reales del servidor; excluidas de WhatsApp. No se conecta el
  diálogo a FINALIZE_REQUEST. READY/recibido conservan el recorrido vigente;
  la nueva ventana se ofrece en las variantes de preparación incluidas.
- Reserva confirmada no dice «Esperando confirmación». Sin reserva no afirma
  que ya esté listo ni ordena ir de inmediato. Éxito distingue «Solicitud
  finalizada» de «Seguimiento cerrado» según scope verificado.
- Contacto/consentimiento no se ocultan. ReservationPanel, con customerDetails
  opcional, entrega sus gestiones, error y WhatsApp CLARIFICATION real; mismo
  elemento montado, sin hooks duplicados. Aclaración, revocación, actualizar y
  seguimiento de reserva permanecen bajo su sección propia con permisos reales.
  El WhatsApp genérico no sustituye OPEN_RESERVATION_WHATSAPP en PREPAYMENT.
- Cancelar retiro permanece en Otras opciones; nunca se renombra como finalizar.
  Condiciones y AgreementSheet siguen reales. Controles mínimos de 44 px,
  miniatura/visor reales sin insignia duplicada y foco/teclado comprobados.
- Decoración finita; pausa fuera de pantalla/segundo plano, sin pausa por scroll.
  Movimiento reducido estático, salvo spinner operativo. Regularización enfoca
  y abre los controles de reserva, sin ejecutar acciones al abrirlos.

### Contrato, persistencia y recuperación

Capacidad `customerPickupClosure`, cabecera
`X-Customer-Pickup-Closure-Contract: customer-pickup-closure-v1` añadida a la
negociación por sesión en participantContractHeaders. Ausente/false no habilita
el comando. requestProcess normaliza acción, opciones, receiptBlock y resumen;
no altera estados ni rellena campos ausentes.

POST `/request-processes/:id/actions/finish-customer-pickup` con
`{expectedVersion,confirmationAccepted:true,choice}`. Choices exactos RECEIVED,
WILL_COLLECT, ACKNOWLEDGED. UUID y cuerpo/endpoint/contratos se guardan en
sessionStorage antes de enviar, sin token. Una intención por usuario/proceso,
bloqueo entre instancias y protección de sesión/desmontaje. Sin POST en mount,
foco, apertura, cierre o vuelta de WhatsApp.

GET `/request-processes/:id/customer-pickup-result` conserva clave original;
distingue recibo histórico `result` y resumen autoritativo `current`. No asume
incremento fijo de versión. recorded:false sigue pendiente, sin reemplazar clave
o cuerpo. Reintento solo explícito. Elección sobrevive cerrar/reabrir y recargar.
Un rechazo explícito del POST inicial se archiva conservando UUID/cuerpo y pide
relectura; otra decisión requiere nueva confirmación del usuario. Fallo de GET,
timeout, respuesta malformada o reintento incierto no descartan la intención.

No éxito simulado: franja y salida solo tras recibo válido. El comando no cambia
pestaña automáticamente; aviso ofrece Ver Historial. Publicación conserva una
versión más reciente si llegó en paralelo y relee listas/detalle.

requestStatusGrouping da Historial al cliente con customerCategory HISTORY,
incluso si sigue IN_PROGRESS/READY. El negocio conserva su agrupación anterior;
RECEIVED/COMPLETED finaliza para ambos. ProcessHistoryCard conserva condiciones
y reutiliza el detalle/acciones reales, sin duplicar ReservationPanel.
El badge histórico vigente sigue contando no leídos; no se confunde con el total
statusCounts.history. No se cambió ese significado por esta integración.

Una notificación posterior puede abrir el detalle histórico. useReadyTransitions
mantiene el aviso y ajusta su texto para Historial, sin seleccionar Listos para
seguimientos cerrados. El callback de pantalla y el enlace Ver del toast respetan
el agrupador canónico. No se suprimen push ni se modifican sus contratos.

### Archivos funcionales adicionales autorizados

- Nuevos: domain/customerPickupClosure.ts y su test,
  api/customerPickupClosureApi.ts, application/useCustomerPickupClosure.ts.
- Modificados: api/participantContractHeaders.ts, domain/requestProcess.ts,
  domain/requestStatusGrouping.ts, shared/reservations/ReservationPanel.tsx,
  cards/customer/progress/application/useCustomerReceiptFlowCardController.tsx,
  cards/shared/history/ProcessHistoryCard.tsx, screen/application/
  useRequestsScreenController.tsx y application/motion/useReadyTransitions.ts.
- Pruebas existentes ajustadas: CustomerReceiptFlowCardView.test.ts,
  processPresentation.test.ts, RequestsScreen.readySelection.test.ts y
  useReadyTransitions.test.ts. Mapa de tarjetas y memoria actual actualizados.

### Evidencia y límites

Pruebas focalizadas de normalización, API, reservas, agrupación, composición y
navegación: 282 pruebas aprobadas en 14 archivos únicos, ejecutadas por grupos
de dependencias y con repeticiones solo tras correcciones. No representan la
suite completa. Última regresión de navegación: 27 pruebas, 4,62 s. El build QA
final terminó con exit 0: Vite 16,38 s y generación PWA correcta. Se conserva
el aviso de tamaño de chunks; no implica un fallo de compilación.
La expectativa anterior de processPresentation prohibía el total original en
todo el HTML, incompatible con el detalle inerte aprobado en NegW17: se acotó
al importe propuesto de cabecera, sin cambiar la tarjeta del negocio.

Chrome con RequestsScreen/componentes/diálogos reales, HTTP sintético y llamadas
externas bloqueadas: matriz de 16 casos A/B/C/D a 320/360/390/430, productos
múltiples y largos, plegado y detalle interno. E probada con controlador y
capacidad reales de coordinación. Consentimiento genérico y de reserva, visor,
condiciones, error real de reserva, alerta plegada y actualización GET probados.
Tres decisiones, doble toque, Historial propio/ambos, negocio aún activo,
respuesta perdida antes/después de commit, UUID/cuerpo originales, recarga sin
POST automático, bloqueo de RECEIVED y alternativa de cierre propio comprobados.
Sin migrar las acciones antiguas de recepción ni enviar mensajes reales.

Arnés/respaldos/logs/capturas ignorados en node_modules/.cache/negw18. Se corrigieron
fixtures inválidas (confirmationSource, actorUserId, nota opcional null, orderType
y capacidad WhatsApp ausentes); no se aflojó el contrato. Un assert confundía el
badge de no leídos con el total histórico. La comprobación posterior también
detectó el temporizador que podía seleccionar Listos, y se corrigió con regresión.

No se recibió tablero navegable, solo código/referencias. No se probaron teléfonos
físicos, transferencia, envío WhatsApp, push real ni operaciones autenticadas
Railway desde frontend. Pendiente ese recorrido tras publicación Vercel QA.
No hay typecheck/lint independientes configurados ni compilador tsc instalado;
no se presentan como ejecutados. Fuente de producción conservada, sin paquetes.
Vercel se publica por rama qa y el cierre verifica success del SHA exacto.
Main y producción no se modifican.

Análisis, implementación, preparación visual, documentación y publicación sin
cronómetro de fase; no se estiman. Unidades/build y navegador se ejecutaron en
parte concurrentemente: no sumar sus duraciones como total ni atribuir esperas
de herramientas a gráficos. Repeticiones motivadas por cambios/fallos concretos,
no por rutina.

---

## Diagnóstico 2026-11-23 · entrega NegW18 pendiente

Clasificación: requiere diagnóstico; la finalización propuesta necesita
coordinación frontend + backend si se mantiene ese comportamiento. Se revisaron
los cinco adjuntos completos de Downloads. No se reemplazaron fuentes de app.

1. **Finalización no disponible en este estado.**
   `api/coordinationApi.ts:90` exige `receiptPending` para FINALIZE_REQUEST;
   `domain/customerReceiptContract.ts:16` exige READY y
   RECEIVED_PENDING_FINALIZATION. Las variantes nuevas se activan sin readyModel,
   antes de esa fase. Incluso añadir allowedActions en servidor no bastaría:
   cliente y normalizador validan también estado y recibo.
   Endpoint actual POST `/request-processes/:id/actions/finalize-request`,
   cuerpo `{expectedVersion, confirmationAccepted:true}`, Idempotency-Key y
   cabeceras de contrato existentes. No recibe RETIRED/GOING ni motivo. Valida
   COMPLETED + recibo FINALIZED. No se hizo petición a QA: no hay respuesta de
   servidor real obtenida para esta auditoría. Las opciones del adjunto no viajan
   al servidor y no deben confundirse con recepción, cancelación o cierre propio.
   Backend debe diagnosticar el significado y contrato de cada opción, permisos,
   categorías de ambos, pagos/reservas, concurrencia y recuperación antes de
   acordar una acción. No se propone habilitar FINALIZE_REQUEST indiscriminadamente.

2. **Contacto y reserva no preservados.**
   Adjunto CustomerReceiptDetails: SHOW_CONTACT_PERMISSION_IN_NV=false y omisión
   de parts.reservation/instructions/contact. Parts.alerts de la View conserva
   avisos de disponibilidad/contacto, no todos los errores/avisos de ReservationPanel.
   `coordinationApi.ts:85` bloquea OPEN_WHATSAPP genérico para PREPAYMENT;
   `shared/reservations/ReservationPanel.ts:236` ofrece el WhatsApp específico
   OPEN_RESERVATION_WHATSAPP y su aviso de permisos. Reemplazarlo solo por
   onContact genérico deja esa variante sin ese acceso. Necesita corrección de
   composición preservando acciones, permisos, errores y recuperación reales.

3. **Presentación pendiente de aclarar.**
   A/B confirmadas dicen «Esperando confirmación»; C afirma «Puedes ir a retirar»
   aunque mantiene el carril Preparando/Retiro. No usar esos textos como nuevas
   reglas de negocio. El estado de reserva y el aviso listo son conceptos distintos.

Controles: 55 pruebas existentes aprobadas en coordinationApi.test.ts y
customerReceiptContract.test.ts, Vitest 0,896 s. Verifican el contrato vigente,
no la integración del nuevo diseño. Sin build ni pruebas visuales de esta entrega.
Análisis/documentación sin cronómetro separado; no se estiman tiempos ausentes.
Sin código funcional, commit/push, Vercel ni Railway nuevos. Main/producción
intactos. Pendiente contrato/decisión backend y corrección funcional del adjunto.

---

Fecha: 2026-10-31, America/Santiago. Clasificación: **solo frontend**, presentación
y navegación local por pestañas. Sustituye el detalle pendiente señalado en el
diagnóstico anterior; no modifica contratos ni transiciones.

## Alcance aplicado

Se integraron los siete archivos entregados desde Downloads sobre las fuentes
canónicas, conservando los controladores actuales:

- `src/app/features/requests/cards/customer/local-pickup/CustomerPickupCard.tsx`:
  producto y estado en elementos propios, sin recortar el carril.
- `src/app/features/requests/cards/customer/local-pickup/customer-pickup.css`:
  tema claro completo, carril apilado, pestañas, instrucciones, contacto y opciones.
- `src/app/features/requests/cards/customer/progress/CustomerReceiptDetails.tsx`:
  export `CustomerPickupDetails`; el default de WhatsApp conserva su presentación.
- `src/app/features/requests/cards/customer/progress/CustomerReceiptFlowCardView.tsx`:
  selecciona esa composición exclusivamente cuando corresponde retiro local.
- `src/app/features/requests/cards/shared/availability/AvailabilityPostActions.tsx`
  y `AvailabilityPostActionsView.tsx`: callback `render` opcional de composición.
  Sin callback mantienen orden/clases anteriores; los diálogos existen una sola vez.
- `src/app/features/requests/cards/shared/availability/PickupInstructions.tsx`:
  única implementación de instrucciones, con presentación default y customer.

Las instrucciones, reserva real, condiciones y aviso de pagos van en «Cómo retirar».
WhatsApp permitido, consentimiento, autorización/revocación y cancelar van en
«Contacto y opciones». Ambas pestañas permanecen montadas; el panel inactivo usa
`hidden`. Si no existen dos áreas con contenido, no aparece una barra vacía.
Los errores generales quedan antes de las pestañas. Un error nuevo de la reserva
revela su panel oculto, sin apropiarse del foco situado fuera del detalle.

Se corrigieron durante la adaptación: clases nuevas acotadas al render optativo,
flechas de teclado con retorno al primer/último tab, detección de cambios del texto
de error además de inserciones, contraste del error real de ReservationPanel,
ajuste de textos largos y pausa de efectos bajo la compuerta real de movimiento.
No se cambió la ventana de Condiciones aceptadas, ReservationPanel, DetailReveal,
StatusRail, ReadyPanel, APIs, controladores, permisos ni recuperación.

## Datos y acciones existentes

Se usan `availability.path`, `customerMessage`, `scheduleOrAddress`, reserva/oferta,
`reservationChoice`, `allowedActions`, coordinación y recepción ya normalizados.
El texto libre no se interpreta como fecha/dirección estructurada.

Lecturas existentes de pedidos y acuerdo; acciones existentes de autorización,
WhatsApp, revocación, cancelar retiro, declarar recepción y finalizar. No se agregan
campos, endpoints, eventos de servidor, migraciones ni variables. Railway QA conserva
el contrato de recepción/finalización publicado por backend (`5d09106`).

## Verificación proporcional al riesgo

- **107 unitarias distintas aprobadas**: 97 de composición, coordinación compartida,
  recuperación y diálogo de recepción; 10 nuevas del render optativo/default,
  fallback null, slots/permisos y composición accesible. El último grupo también
  comprueba que los errores preceden a la barra de pestañas.
- **18 escenarios distintos de navegador aprobados** con componentes reales,
  HTTP sintético y toques por coordenadas: 10 de pestañas/reservas/permisos/diálogos/
  errores/movimiento; tres estados de retiro; tres recorridos recepción-finalización
  en 320/393/430 px; una regresión WhatsApp y otra de controles de negocio.
- Condiciones reales abre/cierra; teclado incluye flechas, Home y End; el motivo de
  cancelación se conserva tras refrescar/cambiar de pestaña. La reserva real detecta
  un fallo de lectura en panel oculto, lo revela y permite recuperar sin POST.
- Capturas revisadas en el arnés existente: tema claro completo y carril sin corte.
- Build QA/PWA aprobado una vez: **9,15 s** del comando, incluido precache. Advertencia
  existente sobre tamaño de chunks; no se alteró la estrategia de bundles.
- Análisis de imports sin errores. El repo no dispone de script/config de typecheck
  independiente ni `tsc`; el build no se presenta como comprobación de tipos.

Se reutilizaron los scripts del piloto. Solo se añadieron escenarios y datos
optativos a su fixture, sin cambiar herramientas compartidas ni dependencias.
La primera preparación de reservas omitía metadata necesaria de prepago; se reparó
el fixture, sin relajar el normalizador. También se corrigió una expectativa de
texto orientativo. Una selección incorrecta repitió cuatro escenarios aprobados:
se registra como repetición innecesaria, no como casos adicionales. Las siguientes
ejecuciones excluyeron explícitamente los escenarios aprobados.
El nuevo test se adaptó al patrón `.test.ts` existente, sin cambiar la configuración.
Los informes de intentos y capturas están en `node_modules/.cache/qa-pilot/` y los
JSON unitarios en `node_modules/.cache/pickup-cliu17-unit*.json` (locales, ignorados).

## Publicación y límites

Publicado **604cb939110d0916d4bece610cf20e0c7670fb02**, rama `qa`,
[Vercel success](https://vercel.com/zipco-s-projects/zipco-app/ErqUFn3f6hTUkqBhCqMpNfyETKkq).
Antes del commit del diseño, un fallo de comillas al guardar el mensaje dejó pasar
primero los tres commits documentales previos (`eedabac`); ese push fue innecesario
y no cambió el código de la app. Se corrigió usando un archivo de mensaje y se
publicó el commit completo. No se oculta ese despliegue intermedio en la medición.
Solo rama qa y Vercel QA. El archivo generado `dist/index.html` se restaura y no se
incluye en el commit. La carpeta de traspaso previa no relacionada queda fuera.

Pendiente: revisión física Safari/iPhone, animaciones/tacto real y reservas con la
API QA. Chrome sintético no acredita esas pruebas. No se afirma verificación de
assets autenticados: el alias Vercel requiere SSO y las credenciales previas fueron
rechazadas. No se repiten esos accesos inválidos.

No hubo pedidos nuevos, pushes artificiales ni confirmaciones reales. El diagnóstico
del clic externo sigue pausado. Main y producción no se modifican.

### Confirmación posterior del usuario

El usuario confirmó: «listo quedó igual» y pidió conservar este método para los
rediseños siguientes. Se registra como aprobación visual del diseño completo.
No equivale a una nueva ejecución acreditada de todos los flujos físicos de reserva,
recepción y finalización. El método queda en la política de trabajo y en la regla
de entrega a Claude para poder consultarlo fuera del historial del chat.
Este cierre solo modifica documentación; no repite tests/build ni publica.

## Tiempos

Medición local desde 01:46:22 hasta 02:06:14 UTC, **19 min 52 s** hasta verificar
Vercel. Fuente: `node_modules/.cache/pickup-cliu17-timing.json`.

| Fase medida | Tiempo transcurrido |
| --- | --- |
| Análisis | 2 min 58 s |
| Implementación de aplicación | 1 min 52 s |
| Preparación inicial de pruebas | 4 min 32 s |
| Pruebas y reparación de fixtures | 5 min 9 s |
| Build y revisión de salida | 28 s; comando QA/PWA 9,15 s |
| Documentación y revisión final | 2 min 47 s |
| Commit, push y verificación Vercel | 2 min 5 s |

La fase de documentación incluye preparación tardía del test `.test.ts` y su
ejecución de 1,4 s; no se dispone de una separación fina de ese intervalo.
La ejecución de pruebas incluye correcciones del fixture, sin medición fina aparte.
Los navegadores corrieron parcialmente en paralelo: no sumar sus tiempos al total.
El cierre documental posterior se mide aparte y no ejecuta otra suite/build ni push.
Estas cifras describen desarrollo, no rendimiento de la app.
