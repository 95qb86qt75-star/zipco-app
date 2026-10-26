# FIX-RESERVATION-PROFILE-HOURS-01

2026-10-26. Clasificación: **solo frontend QA**. Sin cambios de contrato,
persistencia, backend, variables, migraciones ni datos de negocio.

El primer ensayo físico V3 mostró un error genérico al confirmar disponibilidad
con pago. Backend documentó en la sección13 de
`C:/dev/zipco-backend-qa/docs/testing/pickup-reservations-v3-implementation-qa.md`
un día habilitado con apertura vacía y reproducción local400
`INVALID_RESERVATION_TERMS`: «Revisa las horas de apertura y cierre del negocio».
No se capturó aquí la petición privada fallida del celular; no se atribuye a esta
entrega una comprobación autenticada del perfil.

Frontend reemplazaba todos los errores400 por un mensaje genérico del proceso.
Además, groupSchedule mostraba08:00/20:00 aunque esos datos estuvieran vacíos,
tanto en el editor como en el resumen de configuración.

## Cambio

- `requestProcessErrors.ts`: tratamiento específico de400 con código público
  INVALID_RESERVATION_TERMS. Solo mensajes de horario conocidos producen la
  indicación de completar/guardar apertura y cierre en Mi Negocio → Configuración
  → Horario, actualizar el pedido y reintentar. Distingue monto inválido y cambio
  de hora. No muestra mensajes arbitrarios del servidor ni errores internos.
- `ScheduleCard.tsx`: conserva horas originales al agrupar, sin completar datos
  desde constantes de presentación. Horas faltantes/ilegibles dicen Sin configurar;
  avisa que hay horarios incompletos. Los valores sugeridos del formulario nuevo
  siguen siendo un borrador; no cambian el perfil por renderizarse.
- `ScheduleSummaryCard.tsx`: muestra Sin configurar en los datos faltantes.
- `ScheduleCard.test.ts` y `reservationTermsErrors.test.ts`: cubren grupo incompleto
  separado del grupo08:00 real, resumen/editor honestos y propagación segura del
  mensaje desde confirm-availability, incluyendo mensaje-array y rechazo401.

No se rellenan ni guardan horarios automáticamente y no se agregan reglas de
guardado del perfil. La autoridad de plazos/validez de reservas sigue en backend.
El campo opcional Horario o dirección del pedido no reemplaza business.schedule.

## Contrato y verificación

Endpoint existente POST `/request-processes/:id/actions/confirm-availability`.
Payload V3 y consentimientos intactos; se utiliza respuesta400 con campos
`code` y `message` ya existentes. No se modifican endpoints ni campos API.

**1.401 pruebas /117 archivos aprobados**, suite completa; build QA/PWA aprobado
con API QA fijada únicamente para el proceso. Advertencia habitual de bundle
mayor500kB. No comando separado tsc/lint configurado en este repositorio.
Pruebas locales/SSR y API simulada; sin crear pedidos ni modificar datos reales.

Preparado para publicación por GitHub en `qa`. Se conservará identidad Git previa,
sin Vercel CLI deploy ni reescritura. Main y producción permanecen intactos.
Railway no requiere cambios por esta entrega. Pendiente guardar horario real por
el usuario, actualizar pedido y reintentar reserva con pago en Android/iPhone.
