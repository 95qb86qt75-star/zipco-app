# Diagnóstico iPhone cliente: cargas al salir a WhatsApp y regresar

Informe histórico de b5329f3. La corrección posterior y sus pruebas se registran
en [recuperación de listas](frontend-whatsapp-load-recovery-qa.md); las
reproducciones iniciales se convirtieron en pruebas de regresión.

2026-10-23. Base inspeccionada: b5329f3d97aa677c37688f252dc30e0a052bdd88,
rama qa. **Clasificación: diagnóstico frontend**. Hay defectos de recarga y
observabilidad comprobados en frontend; el origen del fallo de transporte del
iPhone todavía no está determinado. No se implementó una corrección de runtime.

## Evidencia recibida y límites

Usuario informa loadOrders.customer, GET /orders/my-orders, httpStatus:null y
publicCode:null, en iPhone cliente QA b5329f3 al usar Escribir al negocio.
Capturas muestran el toast, una vista de error de lista, la tarjeta READY con
aviso confirmado, navegación externa a WhatsApp y el holograma al volver.
Esto acredita el síntoma; no identifica el tipo de excepción, orden de requests,
cancelación o respuesta del servidor. No se dispone de traza de red del iPhone,
excepción original ni logs correlacionados de Railway.

## Qué significa null en esta versión

loadOrdersDiagnostics.ts: response se asigna solo si `await request()` resuelve.
En catch registra y relanza el error original. El registro usa
`httpStatus: response?.status || null`. No conserva error.name, signal.aborted,
origen de la carga, ID de intento, tiempo o estado de visibilidad.

| Caso | httpStatus | publicCode | Interpretación comprobable |
|---|---|---|---|
| request rechaza con AbortError antes de Response | null | null | Cancelación reportada por la excepción; el registro pierde esa distinción |
| request rechaza con TypeError antes de Response | null | null | Fallo de fetch sin respuesta accesible; el mismo registro que AbortError |
| Response con status 0 | null | null | La expresión `|| null` también colapsa cero; demostrado sintéticamente, no observado en el iPhone |
| HTTP 401/403/500 con cuerpo vacío/no reconocido | código HTTP real | null | No equivale a los anteriores: sí se recibió Response con status |
| JSON inválido después de HTTP 200 | 200 | null | Error al consumir una respuesta recibida |

publicCode solo se extrae de cuerpos de respuestas no OK, con propiedad `code`
string incluida en la lista pública permitida. Vacío, HTML, código desconocido
o fallo antes de Response producen null. No permite inferir ausencia de permisos,
sesión vencida, backend sano o backend caído. En particular, null/null NO prueba
cancelación. Un fallo de red/CORS puede impedir una respuesta accesible al JS;
para atribuirlo a backend/proxy hace falta evidencia adicional.

## Orden de las cargas comprobado en código y prueba

1. CustomerProgressCard llama useCoordination.run(OPEN_WHATSAPP).
2. POST open-whatsapp y GET de reconciliación verifican resultado y permisos.
   Este GET usa signal y NO pasa por loadOrdersDiagnostics.
3. useCoordination emite zipco-process-receipt. El listener de useRequests aplica
   el recibo y llama loadOrders(true): carga A.
4. Emite zipco-requests-refresh. RequestsScreen llama loadOrders(true): carga B
   independiente. También refresca cotizaciones.
5. Muestra holograma y espera 3000 ms.
6. Ejecuta window.location.assign(navigation.url).
7. A continuación llama refresh(). El callback de la tarjeta llega a
   MyOrdersTab → onRetry() → loadOrders() sin argumento: carga C no silenciosa.
   Puede comenzar cuando ya se está abandonando el documento. No se presupone
   que la navegación haya terminado al retornar location.assign.
8. Al regresar, useRequests escucha visibilitychange visible y pageshow.
   Cada evento llama loadOrders(true); si ambos ocurren, inician dos lecturas
   sin coordinación. No todos los retornos tienen necesariamente ambos eventos.
9. BusinessNotificationMonitor también carga al volver a visible y, si su ciclo
   termina correctamente, emite zipco-requests-refresh, otra fuente de lectura.
   El ciclo de recuperación de destinos de App no llama directamente loadOrders;
   no se confunden sus temporizadores con cargas directas de lista.

Las cargas loadOrders no tienen AbortController/signal, deduplicación ni ID de
generación para descartar resultados anteriores. No se cancelan explícitamente
al ocultarse/desmontarse. Por tanto NO hay evidencia de una cancelación
controlada por ese loader. Una cancelación del navegador al salir es compatible
con el contexto, pero todavía no está probada para este incidente.

## Por qué se ve el error y puede persistir

useRequests agrupa cualquier excepción no identificada como OrdersApiError 401
en el mismo loadError y toast, incluso si silent=true. AbortError y TypeError
reciben el mismo tratamiento. RequestsScreen oculta la lista normal cuando
loadError tiene valor; no prueba que se hayan perdido los pedidos en servidor.

Reproducción de carrera: lectura A pendiente, lectura B más nueva termina OK,
después A rechaza. A coloca loadError y toast aunque B ya cargó datos correctos.
También cada load inicia limpiando loadError, sin esperar a verificar éxito.
Una lectura no silenciosa C activa además isLoading y desmonta temporalmente
la tarjeta. Son problemas independientes de un supuesto fallo HTTP de backend.

El holograma global dura normalmente 4300 ms y la navegación comienza a 3000;
no se descarta explícitamente al abandonar la página. Su aparición al regresar
es compatible con estado visual conservado/reanudado, no demuestra repetición
del POST. Los listeners de retorno revisados solo recuperan por GET.

## Pruebas reproducibles y archivos

Se añadieron **8 reproducciones** en archivos de test existentes, sin cambiar
código de ejecución:

- loadOrdersDiagnostics.test.ts: AbortError/TypeError indistinguibles y status 0.
- useRequestsContract.test.ts: mismo toast para cancelación y red, error tardío
  de lectura anterior sobre un éxito nuevo, y dos GET por visibility/pageshow.
- useCoordination.test.ts: recibo + refresh antes del holograma, assign a los
  3 s y callback refresh después; un solo POST, sin recuperación por WhatsApp.

Comando: npm test -- --run src/app/screens/requests/loadOrdersDiagnostics.test.ts
src/app/screens/requests/useRequestsContract.test.ts
src/app/screens/requests/useCoordination.test.ts --reporter=dot.
Resultado: **107 pruebas aprobadas en 3 archivos**. Son pruebas sintéticas del
comportamiento actual; no una reproducción nativa de suspensión de Safari.
Los warnings de fixtures de cancellationReason ya existían. No hubo llamadas
reales a API, WhatsApp o push.

Archivos de ejecución inspeccionados: useRequests.ts, loadOrdersDiagnostics.ts,
useCoordination.ts, coordinationApi.ts, CustomerProgressCard.tsx,
ProcessOrderCard.tsx, MyOrderCard.tsx, MyOrdersTab.tsx, RequestsScreen.tsx,
App.tsx, ActionHologram.tsx, BusinessNotificationMonitor.tsx y whatsappReturn.ts.
El tracker de regreso de WhatsApp es del negocio, no recupera la lista del cliente.

## Contrato y coordinación backend

Actual: GET /orders/my-orders?processContract=alternatives-v1, Authorization
Bearer existente, sin body. Lista normalizada con requestProcess y sus versiones.
Si hay cuenta de negocio, GET /orders/business/:id sigue después de cliente;
si falta nombre, GET /businesses/:id. Los registros normalizan rutas sin IDs.

OPEN_WHATSAPP: POST /request-processes/:id/actions/open-whatsapp con
`{expectedVersion,consentAccepted:true}`, JWT e Idempotency-Key existentes.
Respuesta validada: result.orderId, result.orderStatus, result.requestProcess,
navigation.url o navegación no disponible según contrato existente. Se verifica
por GET antes de redirigir. No se debe repetir este POST para recuperar una lista.

**No se necesita un campo o endpoint nuevo para abordar los defectos frontend
comprobados.** No se propone cambiar estados, permisos o contrato. Si una traza
posterior confirma un 5xx, CORS/proxy o problema de servidor, coordinar primero
en backend con hora del intento, ruta, respuesta accesible y correlación que
ya exista, sin exponer tokens/contactos ni inventar un código HTTP.

## Siguiente paso propuesto, aún sin implementar

Instrumentación QA sanitizada: ID local de carga, disparador, fase
fetch/consumo, tipo de excepción, signal de cancelación controlada y contexto
de salida/regreso; sin cuerpos, URLs de WhatsApp, datos de pedido ni credenciales.
Distinguir HTTP, parseo, cancelación y fallo sin Response. Un AbortError o
documento oculto por sí solos no autorizan ocultar todos los fallos.

Después: coordinar lecturas y descartar resultados obsoletos, evitar refresh
no silencioso después de assign y recuperar al regreso con GET. Mantener errores
reales de cargas vigentes y evidencia de cancelaciones esperadas. No reenviar
OPEN_WHATSAPP como mecanismo de recuperación.

Sin corrección runtime, build nuevo ni despliegue. Tests y documento quedan en
el workspace, sin commit en esta etapa diagnóstica. QA sigue en b5329f3; Vercel
y Railway no se modificaron. Main y producción no fueron modificados.
