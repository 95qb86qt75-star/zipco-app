# NegW10 · En curso del negocio · Retiro local

Fecha: 2026-11-21. Clasificación: frontend, presentación y navegación local.

## Archivos y alcance

Se reemplazaron completos los cuatro adjuntos del usuario y se aplicaron ajustes
de integración dentro de esos mismos archivos:

- cards/business/progress/BusinessProgressCardView.tsx: ramas A/B, nivel principal,
  hoja de detalle y portales de errores. 400–500 líneas: se mantiene como unidad
  coherente de esta entrega; no se comprime ni se reorganizan archivos protegidos.
- cards/business/progress/business-progress.css: bloque nuevo acotado a zipco-pk.
- cards/shared/availability/AvailabilityPostActionsView.tsx: piezas reales con
  presentación acotada y retorno de foco al cerrar sus diálogos en esta variante.
- shared/reservations/ReservationPanel.tsx: selector A/B y piezas de reserva
  confirmada; opciones, permisos y operaciones existentes.

A exige IN_PROGRESS, LOCAL_PICKUP, PREPAYMENT y effectiveStatus CONFIRMED, sin
cancelación de retiro ni continuación sin reserva, y fuera de etapa de espera.
B exige IN_PROGRESS, LOCAL_PICKUP y ausencia de registro reservation. Cancelada,
expirada, gratuita o en aclaración conservan su ruta anterior. No se selecciona
una variante por texto libre ni por el importe.

## Ajustes frente a los adjuntos

1. Se monta CloseRequest real también en la nueva composición. El adjunto
   declaraba el swipe disponible pero no montaba el receptor de su evento.
   No se añade un botón dentro del detalle.
2. En ofertas simplificadas se muestra scheduledFor como «Retiro solicitado».
   Cuando solo existe un plazo pickupBy se distingue como «Retirar hasta».
   El adjunto omitía la fecha en ofertas informativas. No se usa fecha de creación.
3. El callback de AvailabilityPostActions admite null, conforme al wrapper real.
4. Los diálogos existentes de reserva y cancelación devuelven el foco al botón
   de la hoja solo en esta variante. Sin ese ajuste, tras cerrar la ventana el
   siguiente Escape no cerraba la hoja por quedar el foco fuera de ella.
5. Se declara la familia de fuente sobre zipco-pk para heredar una tipografía
   consistente en el contenido nuevo; no se añaden fuentes ni reglas globales.

AvailabilityPostActions ya reenviaba render: no se modificó ese wrapper.
La hoja conserva montados los consumidores reales y usa hidden/inert para su
estado local; errores y recuperación se presentan en un host exterior.

## Contrato y límites

Sin APIs ni datos persistidos nuevos. Se usan scheduledFor de la oferta simple,
requiredAmountClp, reserva confirmada, paymentReceiptDeclaration, nota y total
del acuerdo. Las piezas nuevas son props de presentación, no campos de API.
Acciones existentes, MARK_READY, reserva, contacto y cierre conservan handlers,
payloads, permisos e idempotencia. No requiere Railway.

No se rediseñan las ventanas de acciones: permanecen las reales. En esta entrega
se cambia su retorno de foco solo para la nueva composición. Tampoco se cambian
cliente, WhatsApp, pago/apartado pendientes, reserva gratuita, READY, recibido,
servicios, embebidas, carga ni Historial.

## Verificación real realizada

- 64 pruebas focalizadas aprobadas en seis archivos: AvailabilityPostActionsView,
  reservationContract, processPresentation, reservationTermsErrors, useAgreement
  y pickupDetailVariant. Las tres nuevas comprueban selección y exclusiones.
- RequestsScreen, tarjetas, reserva, instrucciones, resumen de oferta, slider y
  ventanas reales con HTTP/cuentas sintéticos: A/B a 320/360/390/430 px, plegado,
  expansión, hoja, separación total/reserva, fecha informativa, opciones, foco y
  Escape. Sin desbordes ni POST en apertura/cierre.
- Interacciones adicionales: Condiciones aceptadas, Finalizar mi seguimiento sin
  confirmar, Escape de ventana anidada sin cerrar la hoja y luego cierre de hoja,
  receptor real del evento de cierre lateral, reduced motion sin animaciones.
- useReservation real con GET fallido y demora: botón bloqueado durante lectura,
  error y recuperación visibles con hoja abierta, cerrada y tarjeta plegada.
- El arnés requirió corregir límites de textos, campos requeridos del seguimiento
  y coherencia del total del acuerdo. También se corrigió una aserción que
  esperaba el texto del sustituto de ReservationOfferSummary. No se alteró la
  validación de la app para aceptar datos simulados inválidos.
- Se repitió el caso de cierre tras esperar el montaje de los manejadores Radix.
- Build QA correcto; advertencia previa de tamaño de chunks. No existen scripts
  typecheck/lint ni TypeScript instalado en este proyecto: no se declaran aprobados.

Evidencia ignorada: node_modules/.cache/pickup-negw10/ (capturas, matrix-evidence,
casos y pruebas de interacción/errores). Los JSON de cada bloque se conservan por
separado; el genérico evidence.json corresponde al bloque de interacción final.

Pendiente: validación física en Android/iPhone y flujo autenticado contra QA.
Chrome local con API simulada no acredita transferencias, WhatsApp ni backend real.

## Tiempos y publicación

Suite final: 5,20 s. Build Vite final: 7,57 s; PWA terminó después sin medición
independiente. Hubo un build previo de 11,02 s antes de corregir foco/tipografía.
Preparación y reparación del arnés, análisis, edición, documentación y esperas no
tienen tiempos independientes medidos. Varias comprobaciones se solaparon; no
sumar duraciones como tiempo total.

Publicación solo en qa/Vercel QA con verificación del SHA exacto. Main, producción
y Railway quedan fuera de alcance. La revisión física permanece pendiente.

## Acabados de las dos hojas · segunda entrega

El usuario entregó BusinessProgressCardView (4).tsx, business-progress (4).css y
AvailabilityPostActionsView (4).tsx sobre QA 9e08a3d. Se reemplazaron completos,
idénticos a los adjuntos según SHA-256, sin tocar PickupInstructions ni
ReservationPanel. Se mantiene pickupLabel y el acceso real de CloseRequest.

Los cambios son de presentación: contacto separado en contactText/contactActions
opcionales (props locales, no API), orden del DOM texto/Ver más/botón con icono,
hechos en línea, recuadros azules, reserva verde, WhatsApp degradado, cancelar
centrado al fondo, fondo menta y título de instrucciones integrado. El aviso azul
depende del p.mt-1 real de PickupInstructions default; si cambia ese marcado,
debe revisarse el selector acotado de zipco-pk.

Validación específica por el riesgo del cambio:

- 37 pruebas focalizadas de AvailabilityPostActionsView, pickupDetailVariant,
  reservationTermsErrors y processPresentation. No se repitió la suite de contratos
  o comandos porque no cambiaron esas dependencias.
- A y B a 320/360/390/430 con RequestsScreen y piezas reales: sin desborde,
  fondos y resaltados calculados correctos, valores inline, cancelación centrada,
  icono y orden DOM de contacto; foco de hoja y Escape conservados. Sin POST.
- En el primer escenario B no se ofrecía OPEN_WHATSAPP, por lo que el controlador
  no mostraba el consentimiento. Se corrigió el fixture para representar ese
  permiso y se repitieron solo los cuatro casos B; no se alteraron los permisos
  del producto. El permiso retirado conserva su confirmación real.
- Comparación de capturas A-reference-390 y B-reference-390 con las referencias
  entregadas. Ventanas reales de seguimiento y retirar contacto: Escape vuelve
  a la hoja y devuelve el foco; luego Escape cierra la hoja. Reduced motion sin
  animaciones activas. No se repitieron escrituras de cierre o pago no afectadas.
- Build QA y diff check correctos. Sin tsc/lint disponibles en el proyecto.
- Evidencia ignorada: node_modules/.cache/pickup-negw10-finish/. Los casos A se
  completaron antes de corregir el fixture B. El JSON final de matrix-evidence
  contiene los cuatro B; las capturas A y el guion conservan el bloque A comprobado.

Tiempos medidos: suite 4,10 s; build Vite 15,10 s (PWA posterior sin medición
independiente). Análisis, edición, preparación del arnés, documentación y espera
de Vercel no se cronometraron por separado. Build y navegador se solaparon; no
sumar sus duraciones. Sin conclusiones de rendimiento físico.

Solo frontend QA; sin endpoints, datos persistidos o payloads nuevos. Railway,
main y producción intactos. Pendiente comprobar ambos detalles en los teléfonos
con el SHA publicado y confirmar visualmente con el usuario.
