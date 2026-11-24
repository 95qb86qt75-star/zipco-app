# FIX-WHATSAPP-LOAD-RECOVERY-01

2026-10-23. Clasificación: **solo frontend QA**. Autorización: «sí, por favor haz
el siguiente paso», tras diagnóstico de cinco registros null/null en iPhone
cliente b5329f3. [Diagnóstico de esa versión](frontend-iphone-whatsapp-load-diagnosis-qa.md).
No se atribuye a backend un fallo sin respuesta accesible ni se afirma haber
reproducido la suspensión nativa de Safari.

## Corrección

useRequests coordina una carga vigente por instancia y sesión. Los disparadores
ordinarios comparten su promesa; un recibo de acción sustituye la lectura previa
para comprobar el resultado nuevo. Todas las lecturas de cliente, negocio y
nombres usan AbortSignal. Al ocultar la página, pagehide o limpiar el efecto se
cancela la carga; al regresar, visibilitychange/pageshow se agrupan durante
150 ms y recuperan por GET. No se agrega polling ni se repite OPEN_WHATSAPP.

Cada resultado verifica instancia, sesión, señal y vigencia antes de modificar
listas o errores. Una carga sustituida no puede sobrescribir un éxito posterior,
aunque el transporte ignore abort(). El error anterior se limpia tras completar
la lectura correctamente. Los recibos confirmados y merge por versión siguen
protegiendo el estado del pedido ante GET antiguos.

Se conserva el error para fallos vigentes: HTTP, conexión, parseo y AbortError
sin cancelación propia. No se deduce cancelación de null, nombre AbortError o
visibilidad por sí solos. La supresión corresponde a señal cancelada por el
loader o resultado que ya no pertenece a la instancia/sesión/carga actual.
Un error HTTP de una lectura obsoleta conserva su registro HTTP aunque no
interrumpa la interfaz actual. El manejo de sesión vencida sigue existiendo.

useCoordination mantiene POST y GET de verificación previos a WhatsApp y sus
tres segundos de holograma. Justo antes de assign descarta el holograma global;
si inicia la navegación, retorna sin ejecutar el refresh no silencioso que
antes arrancaba al abandonar el documento. El regreso solo consulta las listas.
El POST, su clave, permisos, resultado y URL validada conservan el contrato.

## Diagnóstico ampliado, exclusivamente QA

Se conservan operation, method, route normalizada, httpStatus, publicCode y
frontendVersion. Se añaden metadatos locales, no campos API:

| Campo | Significado |
|---|---|
| loadId | Número local por carga, compartido entre sus GET; no ID de pedido |
| trigger | initial, manual, receipt, refresh-event, resume o unspecified |
| failureKind | cancelled, unexpected-abort, network, http, parse o unknown |
| errorName | Nombre limitado a categorías conocidas; nunca mensaje original |
| cancellationReason | page-hidden, pagehide, unmount/limpieza o superseded, solo con señal propia abortada |
| phase | fetch o consume |
| startedAt / elapsedMs | Hora y duración locales del intento; no timestamps de servidor |
| visibility | visible, hidden o unknown al observar el fallo |

Sin Response: status sigue null; status 0 ahora se conserva como 0. Una
cancelación controlada queda identificada sin inventar HTTP. Un AbortError
externo queda unexpected-abort y mantiene el error de la interfaz. TypeError
sin cancelación se clasifica network; no determina si fue DNS, CORS u otra
causa. SyntaxError identifica parseo. HTTP real conserva código y extracción
permitida de publicCode. Los registros no reintentan y no incluyen credenciales,
teléfonos, URL de WhatsApp, mensajes privados o cuerpos. Límite de 20 en memoria;
limpiar invalida publicaciones diagnósticas pendientes. Gate QA de build intacto.

## Archivos y contrato

Runtime: src/app/screens/requests/useRequests.ts, useCoordination.ts,
loadOrdersDiagnostics.ts y src/app/screens/RequestsScreen.tsx. Pruebas:
useRequestsContract.test.ts, useCoordination.test.ts y loadOrdersDiagnostics.test.ts.
Navegador: scripts/check-whatsapp-load-recovery.mjs. Se respaldan diagnóstico,
este informe y el catálogo UI.

Endpoints existentes: GET /orders/my-orders?processContract=alternatives-v1,
GET /orders/business/:id?processContract=alternatives-v1 y GET /businesses/:id;
se conserva Authorization. GET no envía body. Listas y requestProcess/version
no cambian. POST /request-processes/:id/actions/open-whatsapp conserva
`{expectedVersion,consentAccepted:true}`, JWT e Idempotency-Key y su respuesta
result/navigation. Ningún campo, estado, permiso, endpoint, entidad, imagen,
push o persistencia de servidor nuevos. Railway QA no necesita cambios.

## Validación y límites

**1.286 pruebas / 108 archivos aprobados**. Cubren cancelación por salida,
regreso agrupado, errores inesperados, sesión sustituida, desmontaje y transporte
que ignora cancelación, sin repetir POST. Build QA/PWA aprobado; conserva el
aviso preexistente de bundle >500 kB. No se declaran lint/tsc independiente,
porque el proyecto no configura esos scripts.

Chrome móvil: **6 recorridos nuevos** con hooks reales, fetch y navegación
sintéticos, HTTPS externo bloqueado. A 360/393 px verifica tres segundos, un
POST, GET de verificación, una recarga compartida antes de salir, cancelación
registrada sin toast y un GET al regresar, sin redirigir otra vez. Otros casos
mantienen error para TypeError, AbortError inesperado, HTTP 503 y JSON inválido,
y se recuperan por GET. El shim de navegación solo existe en el bundle de
prueba; no se añade a la app. No es una prueba en iPhone físico.

Además, **20 recorridos S/T y 13 de coordinación/notificación/errores** aprobados.
Solo datos sintéticos; ningún pedido, WhatsApp ni push reales. Artefactos locales
en node_modules/.cache/whatsapp-load-recovery y customer-progress-s.

## Publicación y pendiente

Código respaldado en GitHub, rama qa:
0b456a03c9e322c41dbc9427fd42a480b969db8f. Vercel QA READY:
dpl_8rhdbCgHFUPeZQrBwkRHWCqhcgqv. Alias
https://zipco-app-git-qa-zipco-s-projects.vercel.app y SHA exacto comprobados por API.
ProductionBranch sigue main y configuración global de build intacta. Este cierre
documental también se respalda y publica, con el mismo código funcional.
Railway QA no requirió cambios. Main y producción no fueron modificados.
Pendiente validar en el mismo iPhone:
Escribir al negocio → regresar, revisar que se recupere sin toast por cancelación
esperada y copiar diagnóstico nuevo si persiste un error. Sin esa evidencia
no se da por cerrada la causa de transporte específica del dispositivo.
