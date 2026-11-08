# Reserva gratuita confirmada — cliente QA

Fecha: 2026-11-08. Clasificación: solo frontend, presentación e interacción local.

## Alcance e integración

Tres fuentes completas recibidas de Claude, integradas sobre la composición vigente:

- CustomerPickupCard.tsx: prop confirmedFreeDesign y cabecera verde Pendiente de retiro.
- CustomerReceiptDetails.tsx: CustomerPickupConfirmedDetails, boleto con panel real,
  nota, condiciones y pestañas siempre montadas; avisos fuera de las pestañas.
- customer-pickup.css: reglas acotadas a data-pickup-tone=confirmed.
- CustomerReceiptFlowCardView.tsx: calcula y pasa la prop a tarjeta y detalle.

Guardia: pickup && !lineDesign && !model && state IN_PROGRESS && reservation.mode
FREE && effectiveStatus CONFIRMED && isAdvisoryOffer. FREE está confirmado en
domain/reservationContract.ts. No cambia API, payloads, contratos, permisos ni
transiciones. Se conservan reserva con pago, reservas históricas con plazo,
pedido listo/recibido y WhatsApp. ConditionsSheet y ReservationPanel son reales.

Única adaptación visual al paquete: retirado el fundido adicional de los hijos del
boleto y eliminada la opacidad cero inicial del sello. Chromium reprodujo contenido
transparente porque la política decorativa pausaba la entrada al inicio. La entrada
la controla DetailReveal; permanecen el halo y el aro, con las pausas y reducción de
movimiento existentes. No se cambió la herramienta ni la política de animación global.

## Validación

- 10 pruebas existentes de AvailabilityPostActionsView: orden, permisos, recuperación,
  pestañas montadas y composición por defecto.
- 8 pruebas nuevas de CustomerReceiptFlowCardView: conexión a ambas piezas y
  exclusión de PREPAYMENT, CANCELLED, READY, CLOSED, ofertas históricas y WhatsApp.
- Siete grupos Chromium con ProcessOrderCard, normalización, panel de reserva,
  ConditionsSheet y confirmación de cancelación reales; HTTP simulado y red externa
  bloqueada. 320/390/430 px sin desborde; coordenadas y elementFromPoint para toques,
  ambas pestañas, condiciones, cancelar sin confirmar, pliegue, exclusión de pago,
  listo y oferta con plazo, contenido visible en reposo y movimiento reducido.
- Cero POST en esos escenarios. No se crearon pedidos ni enviaron pushes reales.
- Build QA/PWA aprobado: 2408 módulos, Vite 10,35 s, diez entradas precache.
  El repo no dispone de tsc configurado: el build no acredita tipado completo.
- No ejecutada suite general: cambio acotado a composición visual; se reutilizó el
  arnés de reservas y se seleccionaron dependencias afectadas.
- Pendiente Safari/iPhone y Android físicos, errores reales de servidor. El caso
  sintético no acredita contacto WhatsApp ni comportamiento del backend real.

Evidencia local ignorada: node_modules/.cache/confirmed-free-design/ (runner,
results.json y capturas confirmed/contact a tres anchos). No se versionan herramientas.

## Tiempos y publicación

Intervalos registrados, sin sumar esperas paralelas dos veces:

- Análisis: 238 s.
- Integración: 121 s.
- Preparación inicial del arnés: 45 s. La primera ejecución quedó dentro de este
  intervalo; su separación exacta no se instrumentó.
- Verificación y corrección focalizada: 192 s, incluye reparación de la entrada
  transparente y del escenario que intentaba tocar el detalle todavía plegado.
- Build y espera de lectura de resultado: 60 s; ejecución Vite 10,35 s.
- Documentación y publicación: se completan al cierre.

Rama qa. Publicación pendiente al redactar. Railway no necesario. Main y producción
no modificados. Carpeta ajena de design-handoffs conservada. Dist generado se excluye.
