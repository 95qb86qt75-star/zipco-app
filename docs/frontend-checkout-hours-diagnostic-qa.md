# Diagnóstico de aviso horario y selección de fecha

Actualización posterior: respuesta backend E217 recibida y defecto local de error
obsoleto reproducido/corregido. Ver frontend-checkout-selection-error-fix-qa.md;
este diagnóstico conserva las evidencias y límites de su primera revisión.
E219 modifica después la regla de horario: ver
frontend-requested-moment-hours-advisory-qa.md. La evaluación v1 de envío descrita
abajo no es el comportamiento nuevo del formulario migrado a v2.

2026-11-18, America/Santiago. Clasificación: requiere diagnóstico antes de decidir.
Sin cambios funcionales ni solicitud de cambio de contrato.

## Evidencia

- `api/serviceHoursAdvisory.ts:18`: GET autenticado
  `/businesses/:id/submission-advisory`, sin fecha/hora solicitada en query/body.
- `application/useSubmissionHoursAdvisory.tsx:25`: consulta el aviso anterior;
  líneas53–56 muestran el horario actual y próxima apertura, no la fecha del pedido.
- Backend `src/businesses/submission-advisory.ts:40`: función informativa evalúa
  `now` en America/Santiago; su comentario distingue la evaluación de la hora
  solicitada. Controlador `businesses.controller.ts:197` no recibe horario cliente.
- `checkout/domain/orderMoment.ts:35` y
  `checkout/api/createOrderApi.ts:18`: «Selecciona una fecha y hora» es un error
  local por fecha/hora incompleta o formato distinto de YYYY-MM-DD y HH:mm.
- `checkout/product/application/useCheckoutScreenController.tsx:211`: consulta
  el horario antes de validar la selección dentro de la intención. El mensaje
  de selección solo se limpia al iniciar otro envío, no al corregir los campos;
  podría mantenerse un error anterior. No se reprodujo el caso exacto del móvil.

## Pruebas ejecutadas

69 pruebas existentes aprobadas: orderMoment, checkoutMomentFlow y
serviceHoursAdvisory. Sin necesidad de build por diagnóstico de solo lectura.

Función pura **real** del backend evaluada en memoria, sin base de datos/API,
con calendario ficticio L–V02:00–17:30:

- 18nov21:03 Santiago → OUTSIDE_SERVICE_HOURS / AFTER_CLOSING.
- 20nov11:10 Santiago → IN_SERVICE_HOURS / WITHIN_WINDOW.
- 20nov11:30 Santiago → IN_SERVICE_HOURS / WITHIN_WINDOW.

Reproducción local ignorada: node_modules/.cache/diagnose-submission-hours.mjs.
No equivale a verificar el horario persistido ni la API autenticada de Railway.
La captura muestra11:10 en el resumen; el usuario menciona11:30. Ambas están
dentro de la ventana indicada. El resumen de configuración muestra también
sábado/domingo: comprobar calendario realmente guardado antes de asumir L–V.

## Coordinación propuesta

Preparar para backend comprobación acotada del calendario guardado, zona horaria,
checkedAt/status/reason/todayWindow/nextWindow de submission-advisory y creación
con deliveryDate2026-11-20, deliveryTime11:10/11:30, needNow:false. No pedir cambiar
el contrato ni desplegar automáticamente. El aviso actual es compatible con
envío nocturno de una solicitud para otra fecha.

Mensaje preparado no equivale a entrega confirmada ni respuesta backend.
Pendiente reproducir por qué el cliente mostró error local con un resumen
aparentemente completo; no atribuir ese error al backend sin una petición HTTP.
Main, producción, frontend desplegado y Railway permanecen intactos.

Medición: Vitest1,66s; evaluación pura0,76s según herramientas. Lectura/análisis
sin timer exclusivo; no se inventa un reparto de tiempos. Primer intento de
ejecución inline falló por comillas de PowerShell; se usó archivo local ignorado
sin cambiar fuentes ni instalar herramientas.
