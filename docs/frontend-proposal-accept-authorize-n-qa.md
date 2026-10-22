# UI-PROPOSAL-ACCEPT-AUTHORIZE-N-01 — Aceptación, contacto y cierre, diseño N / opción K

2026-10-22. Clasificación: solo frontend sobre contrato backend existente.
Base qa e94cf20. Sin cambios backend, Railway, main o producción.

## Antes / Después

Antes, Aceptar propuesta → Sí, confirmar cerraba la revisión dejando seleccionada
la categoría Por responder. El pedido ya aceptado estaba en Coordinación y el
cliente debía buscarlo para dar consentimiento de contacto.

Ahora, Aceptar propuesta abre el diseño N entregado por Bastián/Claude:
«Todo listo para coordinar tu pedido», resumen de la propuesta exacta, negocio,
disponibilidad y total. Dos elecciones explícitas de la opción K:

- Aceptar y autorizar contacto: confirma la aceptación, vuelve a leer el pedido
  con el contrato alternatives-v1 y, si los permisos actuales lo permiten,
  autoriza contacto con la nueva versión. Son dos POST separados, no una
  transacción ni un nuevo endpoint. No abre WhatsApp automáticamente.
- Solo aceptar · autorizo después: confirma únicamente la propuesta, sin POST
  de contacto. Selecciona Coordinación; permanece el bloque normal de
  CoordinationActions con Autorizo iniciar coordinación / Ahora no / Anular
  solicitud según permisos. Volver, X y cierre sin confirmar no envían acciones.

Tras confirmar una aceptación de propuesta del cliente o contrapropuesta del
negocio, se muestra «Cierre exitoso», sin precio/subtítulo, por 5.7s (estático
2.2s con movimiento reducido). Se selecciona Coordinación y los recibos/listas
actualizan las categorías y contadores. Rechazos y aceptación directa de la
solicitud original por el negocio conservan sus recorridos existentes.

El detalle original propio «Tú pediste» adopta la tarjeta holograma clara del
paquete, con disponibilidad, nota, descripción y foto. Se preservan todas las
líneas, cantidades, precios por unidad/por línea y descripciones; no se pierde
contenido en pedidos múltiples o servicios. La foto conserva el visor anidado.

## Diseño recuperado y adaptaciones

Origen: C:/Users/Basti/Downloads/zip/codex-n/:
AcceptAuthorizeCard.tsx, DealSuccess.tsx, ProposalChat.tsx, ProposalNegotiation.tsx,
sus parches, index.css.deal-flow.css e INSTRUCCIONES_CODEX_aceptar_autorizar_cierre.md.
Se conserva estructura, iconos, paleta, vidrio y hologramas entregados. Se añaden
controles táctiles de 44px, ajuste a 320px y scroll seguro para contenido largo.

El paquete no pudo verificar useCoordination y sugería una bandera local en
ProposalNegotiation. Esa bandera se perdería al filtrar/desmontar la tarjeta;
además el recibo de aceptación tiene allowedActions vacío. Se integra un host
persistente en RequestsScreen, con lectura autorizada antes del segundo POST y
la misma instancia compartida de intenciones de useCoordination. No se agrega
otra cola ni un consentimiento persistido por separado. El host de éxito se
monta una sola vez, deduplica recibos y limpia efectos al cambiar de sesión.

Si falla la lectura posterior a aceptar, se conserva la aceptación y se ofrece
Actualizar pedido / Continuar en Coordinación. Si falla el consentimiento,
permanece la intención original y su reintento con la misma clave, o Actualizar
estado si requiere reconciliación. El bloque habitual sigue disponible en
Coordinación; no se repite la aceptación para corregir un GET o un consentimiento.
Si ya estaba autorizado o perdió permisos, no se envía otra autorización.

Si se perdió la respuesta del POST de aceptar y una lectura posterior de
propuestas muestra ese mismo proposalId ya aceptado, se verifica además el
pedido real por GET (mismo proceso/acuerdo, estado accepted, versión vigente).
Se continúa desde ese estado sin otro POST de aceptación. La lectura confirma
el estado actual, no qué operación concreta lo causó; no se fabrica un recibo
exitoso a partir de datos locales ni se anuncia éxito antes de verificarlo.

Una fecha vencida conserva la confirmación explícita existente y la elección de
contacto, pero nunca autoriza antes de confirmar la aceptación. Se mantienen
expectedVersion, proposalId exacto, confirmationAccepted e idempotencia. Se
bloquea el doble toque y se impiden efectos tardíos de otra sesión.

La sugerencia del documento externo de crear otra rama/mergear producción no
se aplica: el alcance autorizado es exclusivamente qa y Vercel QA.

## Contrato utilizado

Contrato: C:/dev/zipco-backend-qa/docs/testing/business-alternative-proposal-qa.md,
sección Aceptar o rechazar y activación QA confirmada. Operaciones existentes:

- GET /request-processes/:id/proposals: lectura actual y propuesta exacta.
- POST /request-processes/:id/actions/accept-proposal o accept-counter-proposal:
  { expectedVersion, proposalId, confirmationAccepted:true }, opcional
  acceptPastSchedule:true solo tras la confirmación específica. Recibo accepted /
  COORDINATION_PENDING, agreementPublicId y versión +2; allowedActions vacío.
- GET /orders/my-orders?processContract=alternatives-v1: comprobar el mismo
  pedido/proceso/acuerdo, versión al menos igual al recibo y allowedActions.
- POST /request-processes/:id/actions/authorize-contact: { expectedVersion de la
  lectura actual, consentAccepted:true }, JWT y clave de idempotencia propia.

No se crean campos, endpoints, datos, estados, permisos ni notificaciones push.
No hay carga nueva de imágenes; el detalle usa las fotos existentes.

## Archivos

- src/app/screens/requests/AcceptAuthorizeCard.tsx y DealSuccess.tsx: UI entregada.
- src/app/screens/requests/ProposalChat.tsx: detalle propio nuevo y datos completos.
- src/app/screens/requests/ProposalNegotiation.tsx: elecciones y confirmación exacta.
- src/app/screens/requests/proposalAcceptance.ts y AcceptedProposalHost.tsx:
  seguimiento persistente, permisos, sesión y recuperación.
- src/app/screens/RequestsScreen.tsx: hosts únicos y selección Coordinación.
- src/styles/index.css: CSS del paquete y ajustes responsive/accesibilidad.
- proposalAcceptance.test.ts, RequestsScreen.readySelection.test.ts y
  scripts/check-alternative-negotiation.mjs: validación y regresiones.
- Esta ficha y docs/frontend-ui-design-catalog.md.

CoordinationActions, useCoordination, coordinationApi y AcceptGlassButton no se
modifican. Se conserva todo el trabajo de QA anterior.

## Validación y publicación

1153 pruebas / 99 archivos aprobados. Build QA/PWA aprobado, con advertencia
preexistente de bundle grande. Este proyecto no tiene tsc instalado: se reporta
build y pruebas, no una comprobación independiente del compilador TypeScript.
234 casos visuales de tarjetas aprobados; recorrido de aceptación directa
conservado. Presupuesto de lista: 20 tarjetas cliente, 0 animaciones infinitas,
0 fuera de pantalla y 0 decoraciones activas al estabilizar, scroll 900 sin red.
Medición sintética Chrome, no WebKit real.

34 recorridos de negociación Chrome aprobados: envío/foto, rechazo/historial,
contrapropuesta/final, permisos, idempotencia, error de lectura, formulario
conservado, detalle/foto anidada, multítem/servicio; ambas elecciones de aceptación,
autorización tras filtrado/desmontaje y doble toque en 320/393px; respuestas perdidas
de aceptación y contacto; lectura fallida posterior; permiso de contacto retirado;
fecha vencida con consentimiento explícito; cambio de sesión durante aceptación
y antes de autorizar. Duración 5.7/2.2s y deduplicación de hologramas verificadas.
Publicación exacta QA: en cierre.
Pruebas físicas pendientes: un paso a la vez en Android/iPhone, incluyendo
fluidez y holograma, aceptación sola, aceptación con contacto y recuperación.
Sin acciones, uploads, pedidos o datos reales en las verificaciones locales.
Reintentos fiables de notificaciones continúan pendientes del cierre general.
