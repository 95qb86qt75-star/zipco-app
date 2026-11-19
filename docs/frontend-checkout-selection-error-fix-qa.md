# Corrección del error de selección obsoleto — checkout producto

2026-11-18, America/Santiago. Clasificación final: solo frontend QA.

## Coordinación recibida

Se leyó la respuesta backend E217 y
`C:/dev/zipco-backend-qa/docs/testing/checkout-hours-2026-11-20-diagnostic-qa.md`.
QA publica02:00–17:30 todos los días. Backend verificó26 pruebas y creaciones
locales válidas para20nov11:10/11:30; no creó pedidos en Railway. Su diagnóstico
no requería cambiar contrato y separaba el aviso al enviar fuera del horario
actual del error local «Selecciona una fecha y hora».

## Fallo reproducido y corrección

En el checkout real de producto, un intento sin fecha/hora dejaba submissionError.
Corregir los campos y reabrir la revisión actualizaba el resumen, pero mantenía
el error anterior. Una prueba reprodujo literalmente resumen2026-11-20·11:10
con error «Selecciona una fecha y hora». No confirma que esa haya sido la
secuencia exacta del iPhone original; sí acredita un defecto de frontend.

`useCheckoutScreenController.tsx` ahora vincula exclusivamente errores locales
OrderSelectionError al modo/fecha/hora que fallaron. Editar esa selección evita
mostrar un error obsoleto; no borra errores del servidor/red ni una intención
incierta. También usa el validador existente antes de consultar horarios cuando
no hay un envío pendiente. La intención sigue validando al enviar, por lo que
no se acepta una hora pasada durante la espera del diálogo. Reintentos pendientes
siguen usando payload y UUID originales, sin exigir los nuevos campos editados.

El aviso de horario actual permanece intacto: enviar a21:03 puede advertir
cierre17:30 aunque se solicite11:10/11:30 del viernes. No se cambian horarios,
zona horaria, reglas comerciales, permisos ni el checkout de servicios.

## Archivos y contratos

- `src/app/features/checkout/product/application/useCheckoutScreenController.tsx`.
- `src/app/features/checkout/tests/checkoutMomentFlow.test.ts`.
- Este informe y la memoria central; diagnóstico anterior conserva su contexto.

Sin campos/endpoints nuevos. Se mantienen GET `/businesses/:id/submission-advisory`,
GET `/request-process-capabilities` y POST de creación según capacidad V1/V2/V3.
Payload needNow/deliveryDate/deliveryTime y resto de datos existentes sin cambio.

## Pruebas

- Dos pruebas rojas antes del cambio: error obsoleto tras corregir y consulta
  horaria antes de validar selección incompleta.
-74 pruebas focalizadas aprobadas en checkoutMomentFlow/orderMoment/
 serviceHoursAdvisory. Incluyen ambos horarios del20nov, error de red conservado,
 misma intención/UUID al reintentar, doble toque, Hoy/Ahora/Programar y regresión
 de servicio. Un fallo adicional era del nuevo fixture: al reabrir un envío
 incierto debe pulsar «Reintentar envío», no «Requiero este producto»; corregido.
-Chrome/CDP con checkout y diálogo horario reales, React/CSS reales y HTTP
 simulado,320/390/430. Toques por coordenadas y elementFromPoint: campos vacíos
 no consultan horarios ni hacen POST; corrección quita error; aceptar el aviso
 mantiene deliveryDate2026-11-20/deliveryTime11:10. Cero excepciones JS.
-Build QA/Vite y PWA aprobados. Advertencia existente de chunk>500kB. Sin tsc/lint
 independientes disponibles/configurados; build no sustituye comprobación TS.

Fixture/capturas locales ignorados: node_modules/.cache/checkout-selection-error/,
prepare-checkout-selection-browser.mjs y checkout-selection-browser.mjs.
Pendiente iPhone/Android reales y sesión autenticada; no se mutaron pedidos QA.

## Publicación y tiempo

Publicación frontend QA pendiente al escribir; Railway no requiere cambio.
Main8295ab8c6024ab20851ebd371308d2f299b4668f y producción intactos.

Primer reloj conservado00:31:58UTC; análisis previo sin timer exclusivo.
Reproducción Vitest1,43s; ejecución final2,13s (la intermedia falló por el fixture).
Vite final12,10s, PWA sin timer separado. Implementación y preparación/pruebas
intercaladas, sin medición exclusiva que permita repartir minutos sin inventar.
Documentación/publicación se registran al cierre; no sumar fases superpuestas.
