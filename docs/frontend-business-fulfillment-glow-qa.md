# Negocio: modalidad e instrucciones de retiro con Glow

Fecha: 2026-11-08. Clasificación: solo frontend, presentación e interacción local.

## Alcance y decisiones conservadas

Entrega de Claude integrada en los dos archivos completos autorizados:
shared/availability-design/AvailabilityDesign.tsx y availability-design.css.
Modal tiene una variante optativa pickup con cuerpo desplazable y pie fijo;
ConfirmAvailabilityDesign la usa para choice/pickup y availability/proposal.
Reserva al principio, mensaje, horario/dirección plegable, interruptor de contacto,
vista previa y resumen en pie fijo. No hay una segunda versión de la pantalla.

La entrega cambiaba dos reglas que el traspaso había pedido conservar:
mensaje obligatorio sin predeterminado y activación/bloqueo automático de
WhatsApp por pago previo. No se incorporan esas decisiones de producto.

- Mensaje opcional: vacío envía DEFAULT_PICKUP_MESSAGE como antes. Etiqueta,
  ayuda, placeholder y vista previa reflejan el texto real enviado; no se promete
  que el producto quede apartado sin reserva.
- Contacto se habilita exclusivamente por el interruptor explícito. Con pago
  previo y contacto apagado no se permite confirmar; el usuario puede activarlo
  o desactivarlo. Se conserva BUSINESS_CONTACT_COPY y no se deduce consentimiento
  del DOM ni de seleccionar pago previo.
- Los componentes reales de reserva siguen validando importes, políticas y
  plazos. Oferta nula bloquea confirmar, como antes. No se incorpora el bloqueo
  nuevo por mensaje ni su halo obligatorio. Errores/recuperación visibles en pie.
- Horario/dirección sigue siendo texto libre opcional de hasta 80 caracteres;
  mensaje hasta 120. No cambia la fecha del pedido. Conservado el conteo por
  Array.from, sin un maxLength UTF-16 adicional que restrinja caracteres Unicode.

No se modificaron archivos protegidos, APIs, permisos, estados, migraciones ni
configuración. Props y forma AvailabilityDesignChoice/PickupDesign conservadas.
onChoose usa el controlador existente; purpose proposal puede ejecutar el envío
pendiente y availability confirma disponibilidad. GET de capacidades/avisos y
POST de disponibilidad/propuesta existentes, con los mismos campos/headers/UUID.
Railway no necesario. Main y producción intactos.

## Aislamiento y validación

- Comparación de fuentes: contenido anterior a Modal (salvo imports), Modal por
  defecto, confirmaciones, consulta y todo desde BusinessDesignActions permanecen
  idénticos. El CSS original se conserva como prefijo completo; nuevo bloque
  exclusivo zipco-pk. TSX 425 líneas; CSS compartido supera 500 y se mantiene
  como entrega coherente de dos archivos, sin fragmentación ni reescritura global.
- 73 unitarias aprobadas: availabilityContract, reservationContract y
  serviceHoursAdvisory. Se seleccionan por los componentes consumidos, no por
  rutina sobre todo el repo.
- 13 grupos Chromium con React/Radix, formularios de reserva y aviso reales;
  cuentas/transporte sintéticos. Responsive y toques por coordenadas a 320/390/430;
  mensaje predeterminado; texto/dirección/contacto al volver; propuesta; reserva
  gratuita; pago previo con importe inválido/válido y consentimiento explícito;
  reservas anteriores con plazos/pago; aviso horario/error/recuperación/pie fijo;
  busy/checking/cierre; fallo de capacidades y reintento; WhatsApp; sin contrato
  de reserva; movimiento reducido; regresión de Modal en la consulta del cliente.
- Recorrido adicional de ProposalNegotiation y RequestsScreen reales hasta
  POST único, recibo y holograma. Reutiliza escenario anterior con nuevos
  selectores. Cero pedidos, notificaciones, uploads o mutaciones QA reales.
- Escenarios/evidencias temporales ignorados en node_modules/.cache/pickup-design/.
  Se corrigió un nombre reservado de Window en el arnés, sin cambiar herramientas
  del repo ni repetir unitarias/build ya aprobados.
- Build QA/PWA aprobado, 2407 módulos, 10 entradas precache, bundling 10,19 s;
  aviso conocido de chunks grandes. Repo sin configuración/compiler tsc: build
  no equivale a comprobación completa de tipos. git diff --check aprobado.
- Pendiente iPhone/Android físicos y backend real; no se afirma fluidez física
  a partir de Chromium local ni entrega push/WhatsApp.

## Tiempos y publicación

Lectura inicial anterior al cronómetro no estimada. Ventanas de pared: análisis
91 s; implementación 137 s; preparación 237 s; ejecución/revisión 135 s. Build y
unitarias (976 ms runner) solapados con ejecución, sin sumar de nuevo. Cierre y
publicación se registran al verificar. No son mediciones de rendimiento de la app.

Rama qa; publicación en preparación. Verificación de artefactos independiente
limitada por acceso local 403 previo; no se cambia protección ni credenciales.
