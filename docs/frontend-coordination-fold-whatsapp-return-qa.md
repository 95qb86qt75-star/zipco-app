# UI-COORDINATION-FOLD-RETURN-01 — Cierre suave y regreso de WhatsApp

2026-10-22. Clasificación: **solo frontend QA**, sobre contrato existente.
Fuente: paquete `Downloads/Nuevo 2/codex-o/codex-o`. El usuario autorizó
expresamente incluir la confirmación al regresar de WhatsApp además del cierre.

## Antes / Después

Antes: Ocultar tarjeta desmontaba el contenido inmediatamente; el negocio tenía
un botón separado para comenzar el pedido.

Después: la tarjeta de coordinación compartida por cliente y negocio se contrae
durante 650 ms, conserva su contenido montado y presenta el resumen. El contenido
oculto queda inert y fuera del árbol accesible; el foco pasa al resumen. Al abrir,
recupera los controles y su estado. Movimiento reducido elimina la transición.
Las animaciones decorativas ocultas se pausan. No se añadieron filtros animados
al cuerpo ni se cambió la apertura rápida de condiciones aceptadas.

Solo para el negocio, con proceso COORDINATING y START_WORK permitido por la API,
se pregunta «¿Coordinación lista por WhatsApp?» tras cuatro segundos en primer
plano, al regresar o al recuperar un proceso elegible. Se elimina el botón
separado de comenzar de esta tarjeta. «Sí, comenzar» ejecuta START_WORK;
«No, aún no», X, Escape o cierre exterior no ejecutan acciones y silencian la
pregunta 30 minutos. El cliente no recibe esta pregunta ni puede iniciar trabajo.
Se evita superponerla con hojas u hologramas. Cambiar cuenta invalida la pregunta.

La marca local de intento/regreso se identifica por cuenta, negocio, pedido,
proceso y acuerdo; no almacena teléfono, URL de WhatsApp ni token. Los tiempos
locales solo controlan la UI, no sustituyen timestamps del servidor. Hay fallback
en memoria si el almacenamiento está bloqueado. Una marca de otra vida de página
no bloquea la recuperación. Volver de WhatsApp no acredita conversación, pago ni
coordinación: siempre se exige la confirmación del propietario.

La marca se crea después de POST y lectura verificados, justo antes de navegar;
se limpia al comenzar/anular confirmado o si falla la navegación. Un tracker
único en RequestsScreen sobrevive al filtrado/desmontaje de la tarjeta. Solo una
pregunta puede reclamar la pantalla; los temporizadores se cancelan al ocultar
la app y no se reinician continuamente por eventos de foco.

## Contrato, seguridad y archivos

Backend ya soporta START_WORK del propietario, COORDINATING → IN_PROGRESS.
Evidencia leída: `C:/dev/zipco-backend-qa/docs/operations/decision-log.md`, sección
de coordinación alrededor de la línea 1458. No se crearon estados ni permisos.

- POST `/request-processes/:id/actions/start-work`: `{ expectedVersion }`, JWT y
  `Idempotency-Key` propios de la operación existente. Respeta allowedActions.
- OPEN_WHATSAPP conserva POST `/request-processes/:id/actions/open-whatsapp`,
  `{ expectedVersion, consentAccepted: true }` y lectura posterior existente.
- Lecturas existentes de listas con `processContract=alternatives-v1` actualizan
  proceso, listas, categorías y contadores. Sin nuevos campos ni endpoints.
- Se conservan consentimiento independiente, snapshot del acuerdo, control de
  versión/sesión y recuperación idempotente. Respuesta incierta: misma clave y
  cuerpo; confirmación pendiente de lectura: Actualizar estado sin otro POST.
- Nuevo holograma «Pedido en curso» solo tras respuesta y lectura coincidentes
  con IN_PROGRESS. No garantiza notificación push ni envío de mensajes.

Archivos modificados: `RequestsScreen.tsx`; en `src/app/screens/requests/`,
`BusinessCoordinationCard.tsx`, `CoordinationSheets.tsx`, `ActionHologram.tsx`,
`coordinationFeedback.ts`, `useCoordination.ts` y sus pruebas. Nuevos
`whatsappReturn.ts`, `useStartWorkPrompt.ts` y sus pruebas. Estilos en
`src/styles/index.css`; comprobaciones en `scripts/check-order-card-aurora.mjs`.
Este documento y `frontend-ui-design-catalog.md` registran la entrega.

## Validación

- Suite final: **1.204 pruebas / 104 archivos aprobados**.
- Build QA y PWA aprobados. Persiste aviso previo de chunk mayor de 500 kB.
  No se declara chequeo tsc independiente, no configurado en este proyecto.
- Navegador sintético: 234 casos base; cierre intermedio y final en
  320/360/393/400 px, nueve hologramas, movimiento reducido y pausa visual.
- Regreso: no pregunta antes de salir; espera cuatro segundos al volver; No no
  envía POST y silencia; error mantiene hoja; reintento conserva clave/cuerpo;
  confirmación actualiza IN_PROGRESS y muestra holograma pese al cambio de lista.
  Dos solicitudes START_WORK **sintéticas** para probar pérdida/reintento;
  cero acceso a backend real o acciones sobre pedidos reales.
- Captura revisada: `node_modules/.cache/order-card-aurora-browser/start-work-return-sheet-393.png`.
  Las comprobaciones de navegador precedieron al último refuerzo de invalidación
  de sesión, cubierto por la suite final. No equivalen a validación física Safari.

Pendiente en Android/iPhone, un paso a la vez: plegar/abrir; abrir WhatsApp real,
volver y comprobar pregunta; No; después Sí y cambio de categoría/contador;
recuperación tras pérdida de red y recarga. Sin aprobación física declarada.
Los reintentos fiables de notificaciones siguen pendientes del cierre general.

## Respaldo y publicación

Rama `qa`. Publicación exacta y respaldo GitHub se registran al cerrar la entrega.
Railway QA no requirió cambios ni despliegue. Backend, main y producción intactos.
No se ejecutaron comandos de integración a producción incluidos en el paquete.
