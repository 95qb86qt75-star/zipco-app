# RESERVATION-HOURS-DIAGNOSTIC-02 — Jornada no disponible y formulario conservado

2026-10-26. Clasificación: **solo frontend para orientación y presentación**;
**frontend + backend pendiente** para distinguir con precisión fuera de atención
y calendario ambiguo. No implementar códigos candidatos antes de acordarlos.

## Evidencia y alcance real

El usuario reporta ensayo iPhone cliente / Android negocio sobre frontend0e5e8f4
y backend2e67444. Producto12.000, Ahora, retiro local, reserva pagada5.000 y permiso
WhatsApp. Primero apertura persistida vacía; después horario08:00–20:00 mientras
se probaba aproximadamente01:50; al ajustar el calendario QA para incluir la hora
actual, la disponibilidad con condiciones de pago llegó al iPhone.

Solo se acredita por reporte el envío de disponibilidad; no pago, apartado, Listo
ni recepción. Frontend no leyó la petición autenticada ni alteró el horario QA.
El primer defecto de fallback y error400 ya fue publicado en7800581/b98b05f.

## Contrato actual verificado

Backend `src/request-process/simplified-reservation.ts`, serviceWindow:
- Horario incompleto/horas inválidas:400 INVALID_RESERVATION_TERMS con mensajes
  públicos conocidos. Frontend los orienta a configurar apertura/cierre.
- matches.length distinto de1:409 RESERVATION_HOURS_UNAVAILABLE. Es el mismo
  código para0 jornadas (fuera de sesión/día cerrado) y varias jornadas
  (solapamiento). No demuestra por sí solo negocio cerrado.
- Margen insuficiente:409 RESERVATION_PAYMENT_WINDOW_UNAVAILABLE, menos30min
  hasta el cierre. Frontend conserva este aviso específico.

Endpoint POST `/request-processes/:id/actions/confirm-availability`, header V3,
JWT/Idempotency-Key. Payload comercial sin cambios:
expectedVersion, proposalId y fulfillment con LOCAL_PICKUP, customerMessage,
scheduleOrAddress, allowCustomerWhatsapp, consentimiento propio explícito y
reservationOffer PREPAYMENT/requiredAmountClp. Respuesta fallida tiene code/message;
no debe presumirse cambio de estado o compra confirmada por ese rechazo.

Los mismos errores pueden aparecer en opciones de reserva y negociación. No se
puede inferir cierre desde texto libre, fecha del móvil, campos opcionales del
pedido o mensajes internos del servidor.

## Mejora frontend segura

`requestProcessErrors.ts` explica que no hay una jornada única para la fecha/hora.
Para Ahora invita a comprobar atención vigente; también menciona revisión de
horario/solapamiento y elección explícita sin reserva. No afirma negocio cerrado
cuando el contrato no lo demuestra. Conserva respuestas distintas para datos
incompletos y margen inferior30min. No cambia permiso, monto, horario ni fechas.

Se comprueba en navegador que un rechazo409 conserva mensaje, horario/dirección,
modalidad pagada, monto5.000 y WhatsApp autorizado. No hay reintento automático ni
conversión a NONE; reintentar conserva el cuerpo de la intención.

## Pedido concreto a backend — análisis de contrato

Separar la razón pública de matches.length===0 de matches.length>1 sin cambiar
los cálculos ni la política de reserva. Propuesta de nombres, **no implementados
ni aprobados como contrato**:
- RESERVATION_OUTSIDE_SERVICE_WINDOW: fecha/hora solicitada fuera de atención.
- RESERVATION_AMBIGUOUS_SERVICE_WINDOW: más de una jornada aplicable.

Puede elegir otros nombres o un campo público reason. Debe entregar status/code
exactos y ejemplos para Ahora, programada, día cerrado y cruce de medianoche.
No devolver el calendario completo ni información privada en errores. Mantener
INVALID_RESERVATION_TERMS para datos inválidos y PAYMENT_WINDOW_UNAVAILABLE para
margen de pago insuficiente; no colapsarlos en negocio cerrado.

Compatibilidad: conservar fallback de HOURS_UNAVAILABLE para servidores/clientes
anteriores. Si se agregan campos o códigos, publicar backend QA primero y después
conectar el mensaje específico de frontend. No pedir al frontend que adivine la
causa leyendo horarios o que reprograme automáticamente la solicitud.

Sin backend, migraciones, cambios de datos ni variables desde frontend. Main y
producción intactos. Revisión precisa de negocio cerrado pendiente del contrato;
el recorrido de pago/apartado/Listo/recepción aún requiere ensayo físico.

## Archivos y validación de esta entrega

`requestProcessErrors.ts`: solo texto de la rama409 existente.
`reservationTermsErrors.test.ts`: comprueba separación de motivos y que no se
afirme cierre desde un código ambiguo. `scripts/check-reservation-v3-flow.mjs`:
dos casos adicionales de rechazo/reintento explícito preservando el cuerpo.
Este documento es el diagnóstico y solicitud de coordinación a backend.

1.403 pruebas/117 archivos aprobados; build QA/PWA aprobado (aviso habitual de
bundle mayor500kB),15 escenarios de navegador V3 con HTTP y cuentas sintéticas,
incluidos los dos errores con todos los campos conservados. No acciones sobre
pedidos reales ni comprobación de pagos físicos. Sin tsc/lint independiente
configurado en frontend. Publicación por integración GitHub en ramaqa; registrar
el despliegue verificado al cierre. Railway no necesita cambios para este texto.

Publicado por GitHub `qa`: `8c3086d564d6518c9d08666c1ab6bc6c6b40cb74`.
Vercel READY `dpl_3CG5icfhRGpkBKH4JTDsstL3TYve`, alias habitual QA y bundle
servido verificados: SHA exacto, orientación neutral, margen30min y API QA.
El cierre documental se respalda aparte con código idéntico. Identidad Git
anterior conservada, sin Vercel CLI deploy ni reescrituras. Main conserva
8295ab8c6024ab20851ebd371308d2f299b4668f; producción sin cambios.
