# Propuestas del cliente — tarjeta, conversación y confirmación

2026-11-08. Clasificación: solo frontend, presentación e interacción local.

## Integración de la entrega

Seis fuentes de Claude revisadas contra el repo vigente:

- ProposalWaitingCard.tsx y proposal-waiting.css: rama cliente y selectores zipco-pw.
- ProposalChat.tsx y proposal-chat.css: línea de tiempo, comparación breve,
  condiciones vigentes y presentación zipco-pz.
- ProposalNegotiation.tsx: presentación del diálogo y boleto de decisión del cliente.
- ReservationOfferSummary.tsx: texto nuevo solo mediante customerProposal opcional.

Puente mínimo adicional: AvailabilityPlanSummary.tsx recibe customerProposal y
showReservation, ambos opcionales con salida original por defecto. Evita cambiar
los textos de negocio y otras pantallas; en confirmación omite el resumen repetido
porque ReservationChoiceFields real ya lo muestra. No es una copia del formulario.

Adaptaciones al paquete:

- Resumen por defecto mantiene Reserva sin pago previo y Se confirma automáticamente
  al solicitarla; la presentación nueva solo se activa en el resumen de conversación
  del cliente. La elección de reserva conserva su resumen real.
- ReservationChoiceFields no se modifica. Su advertencia sin reserva sigue visible
  como antes, también con Solicitar reserva. No se implementa el cambio value===NONE
  planteado por Claude ni se agrega una etiqueta ficticia TU ELECCIÓN.
- Se retiraron las cantidades superpuestas añadidas junto a ProductPreviewControl;
  el control real ya posee insignia por producto. Evita duplicar o usar la cantidad
  del pedido original para representar la propuesta.
- Las decoraciones de botones compartidos se acotan dentro de zipco-pw/zipco-pz:
  blobs estáticos y reflejos de dos ciclos, sin afectar al negocio ni spinners.
  La comprobación detectó tres reflejos aún infinitos por pseudo-elementos dentro
  de :is(); se corrigieron sus selectores y se repitió solo ese caso.

Auditoría: cuerpo de execute desde su declaración hasta el retorno JSX idéntico
al original; rama return del negocio de ProposalWaitingCard idéntica. Hooks,
efectos, contratos y validaciones conservados. No se modificó index.css ni package.json.
ProposalNegotiation queda en 457 líneas aproximadamente: responsabilidad mixta
existente; no se fragmenta la lógica durante un rediseño visual.

## Contrato conservado

GET /request-processes/:id/proposals y /reservation-options; POST existentes de
accept-proposal, reject-proposal y counter-proposal. expectedVersion, proposalId,
confirmationAccepted, reservationChoice, customerContactPreference y
acceptPastSchedule conservan su significado. No cambia API, permiso, transición,
notificación, persistencia ni backend. Los hologramas siguen dependiendo del recibo.

## Verificación

- 48 unitarias: comparación del chat, aceptación, transporte, intents y tres pruebas
  de presentación de oferta/default/omisión del duplicado. Prueba adicional de
  orden del plan entre turno y aviso de contrapropuesta.
- Chromium con ProcessOrderCard, ProposalNegotiation, Radix, ReservationChoiceFields,
  resúmenes y botones reales; HTTP simulado. Se reutilizó el arnés de reservas.
- Reserva gratuita: 320/390/430 px sin desborde, conversación y decisión, nota
  recortada, una sola oferta visible y un solo POST de aceptación por caso.
- NONE y WHATSAPP aceptados por el flujo real; reconocimiento sin reserva correcto.
- Rechazo: diálogo previo sin envío, volver, formulario real de contrapropuesta;
  rechazo confirmado con un POST. La contrapropuesta no se envió en este bloque.
- Pago previo sin permiso: control desactivado por toque real y bloqueo sin POST.
- Propuesta final sin contrapropuesta, error de lectura/reintento, fecha vencida
  requiere confirmación explícita y añade acceptPastSchedule en el segundo intento.
- Envío retenido: controles bloqueados y barra visible; tras liberar un solo POST.
- Perspectiva de negocio sin marcadores del diseño cliente en tarjeta y conversación.
- Presupuesto gráfico en reposo: cero animaciones infinitas activas; movimiento
  reducido sin decoración activa. Último caso repetido tras el ajuste CSS.
- Build final QA/PWA: Vite 7,12 s, 2408 módulos y diez entradas precache. El primer
  build de 7,13 s se repitió por el ajuste CSS final. No hay tsc configurado.

Fallas del arnés corregidas: proposalId de modalidad apuntaba al original; selector
con comillas inválidas; texto Rechazar distinto del aria-label; prueba de pago no
había desactivado realmente el contacto por codificación del script. Este último
caso abrió una URL sintética de WhatsApp con número de fixture; no se enviaron
mensajes ni se contactó al backend QA. La ejecución final bloquea también navegación
HTTPS mediante Fetch interception. No hubo pedidos ni notificaciones reales.

Evidencia ignorada .cache/customer-proposal-redesign/: capturas y run.mjs,
reject-counter.mjs, edges.mjs, perf-only.mjs. Los seis grupos principales completan
results.json; los grupos de borde pasaron sus aserciones hasta la comprobación
gráfica, corregida y repetida por separado en edge-results.json. No se presenta el
arnés simulado como prueba del backend ni como prueba física de Safari.

Pendiente: iPhone y Android reales, fotos reales del servidor y revisión física
de modo oscuro/contraste. Los visores y metadata no cambian; fotos neutras en fixtures.

## Medición y publicación

Análisis 83 s (tras lecturas iniciales no instrumentadas). Integración y primeras
pruebas/preparación 274 s. Preparación/reparación y ejecución focalizada 588 s.
No se separan retrospectivamente intervalos sin instrumentación independiente.
Builds se solapan con pruebas; no sumar dos veces sus 7,13/7,12 s Vite.
Documentación/publicación se completan al cierre. Sin herramientas versionadas nuevas.

Rama qa; publicación pendiente al redactar. Railway no necesario; main y producción
intactos. Dist excluido; carpeta de handoff ajena conservada.
