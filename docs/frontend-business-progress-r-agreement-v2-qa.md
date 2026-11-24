# UI-BUSINESS-PROGRESS-R-01 / UI-AGREEMENT-TIMELINE-V2-01

2026-10-23. Clasificación: solo frontend QA. Pendiente conformidad visual de
Bastián con la implementación; las referencias entregadas no acreditan una
prueba posterior en teléfono.

## Fuente y alcance

Paquete recibido desde Downloads: BusinessProgressCard.tsx, SlideToNotify.tsx,
AgreementSheet.tsx, agreementTimeline.ts, notifiedRecently.ts, CSS en-curso-r,
cuatro parches manuales y el documento de instrucciones. Referencias R-1 a R-12.
Se adaptan a los archivos reales; no se sustituyen archivos completos del
proyecto por los parches externos. Se conserva rama qa y src/styles/index.css
según el proyecto y las instrucciones vigentes de la sesión.

Negocio IN_PROGRESS/READY: tarjeta violeta oscura, tracker, condiciones flotantes,
deslizador y estado del aviso. Navegación normal inicia plegada; la notificación
dirigida permite abrir la tarjeta. READY recién notificado puede abrirse y
plegarse después del holograma. Al completar el aviso desde En curso, la vista
selecciona Listos detrás del holograma, si la persona sigue en esa categoría.
No cambia la selección si ya navegó a otra categoría o participante.

Hoja Acuerdo completo V2 en el negocio: resumen inmutable, rondas desplegables,
detalle de líneas, mensajes y fotos con el visor existente. La propuesta elegida
se identifica por acceptedProposalId y se compara con el acuerdo; nunca se toma
la última propuesta arbitrariamente como acuerdo. Aceptación por autorActor/tipo
validados, con businessAcceptedAt/customerAcceptedAt reales. No se usa createdAt
de propuestas como fecha de aceptación. El resumen conserva el acuerdo incluso
si el historial falla y permite reintentar solo la lectura.

Cliente conserva su tarjeta y diálogo de recepción; el CTA nuevo y la hoja V2
se habilitan solo para negocio. El título global ready cambia a ¡Pedido
notificado!, como solicita el parche; conserva la descripción existente.

## Contrato verificado y adaptaciones

- MARK_READY: POST /request-processes/:id/actions/mark-ready con expectedVersion,
  JWT y la clave de idempotencia propia existente. Mismo body/clave al reintentar.
- GET /orders/business/:id?processContract=alternatives-v1 confirma el resultado;
  conserva las lecturas existentes de listas del cliente.
- GET /request-processes/:id/agreement: AgreementReadDto, acceptedProposalId,
  agreementPublicId, subjectSnapshot, totalPriceClp, scheduledFor y fechas reales.
- GET /request-processes/:id/proposals: ProposalRead normalizado; id, sequence,
  type, authorActor, createdAt, subjectSnapshot, totalPriceClp, scheduledFor.
- readyNoticeAcknowledged se lee únicamente desde requestProcess, su ruta real.
  true/false/ausente se representan por separado. Servicios no simulan ACK ni
  recepción del cliente; conservan la presentación informativa correspondiente.

Se revisó en lectura el backend local: RequestProcessReadService.proposals usa
readConsistent con participación e integridad, sin restricción a negociación.
Frontend normalizeProposals admite esos estados. No se realizaron acciones
reales, ni se acredita aquí una lectura autenticada de producción o Railway QA.
Si QA devuelve un historial no disponible, muestra resumen real y error/reintento.

El proxy de refresh del paquete no era suficiente: useCoordination publica
recibos y eventos globales que desmontan tarjetas. Se añade un callback opcional
de presentación solo después de MARK_READY + lectura READY verificada, antes
de publicar el recibo. Conserva bloqueo, intenciones durables y recuperación.
La secuencia visual vive fuera de la tarjeta: mínimo de envío 1100 ms, Aviso
enviado, 700 ms, holograma global, 600 ms, publicación/navegación/refresh.
Sobrevive a desmontajes; comprueba sesión antes de anunciar o refrescar.
Un envío activo conserva el deslizador; la intención en vuelo no se presenta
como un reintento pendiente. POST confirmado + GET fallido conserva recuperación
sin holograma de éxito y sin repetir el POST.

El deslizador requiere arrastre >=85%; toque o arrastre parcial no envían.
Cancelación, pérdida de foco o salida de ventana reinician sin completar.
Enter/Espacio y activación de lector de pantalla permiten completar; bloqueo
contra doble envío. Contenido plegado inert/aria-hidden y foco restaurado.
Brillos estáticos por gradientes y acentos pausados al plegar, cubrir u ocultar;
respeta movimiento reducido. No hay métricas ni persistencia nueva en servidor.

## Archivos

Nuevos: BusinessProgressCard, SlideToNotify, AgreementSheet, agreementTimeline,
notifiedRecently y sus pruebas bajo src/app/screens/requests; comprobación
scripts/check-business-progress-r.mjs. Adaptados: ProcessOrderCard,
BusinessCoordinationCard, CoordinationSheets, ActionHologram, useCoordination,
RequestsScreen, pruebas de integración y src/styles/index.css. Este documento
y catálogo UI completan el registro.

## Validación, publicación y pendientes

Suite final: **1.236 pruebas / 106 archivos aprobados**. Build QA/PWA aprobado,
con el aviso preexistente de bundle mayor de 500 kB. Navegador: **19 recorridos
R/V2 aprobados** (320/360/393 px, touch real por CDP, teclado, estados del aviso,
cuatro acuerdos, historial fallido/reintento, intención restaurada, error de
envío con reintento idéntico, servicio, cliente y movimiento reducido).
Además, **13 recorridos anteriores de aceptación/errores/coordinación y apertura
dirigida aprobados**. La navegación local a Listos se prueba con el efecto real
de RequestsScreen y solo para el mismo acuerdo/categoría. Se revisaron capturas
de la tarjeta, el envío estabilizado y la hoja V2; artefactos locales bajo
node_modules/.cache/business-progress-r.

Código respaldado en GitHub, rama qa: 36c827e80e8e702622673fabb229ad8bd63b4fc4.
Vercel QA READY dpl_5wvwf5jSaUef6LbvaLw1Rirt9yzZ, SHA exacto y alias
https://zipco-app-git-qa-zipco-s-projects.vercel.app comprobados por API.
Este cierre documental también se respalda y publica con código idéntico.
Solo HTTP sintético en Chrome, sin pedidos, mensajes o notificaciones
reales. Se conservan los checks anteriores de aceptación y notificación dirigida.
No hay scripts lint ni tsc independiente configurados; no se declara su ejecución.

Pendiente Android/iPhone, un paso por vez: abrir En curso, arrastre parcial y
completo, observar Avisando/Aviso enviado/holograma/Listos, abrir detalle READY,
confirmación del cliente y hojas de condiciones/acuerdo con fotos. Red lenta,
fallos y recuperación deben probarse también en QA real antes de aprobar el flujo.
Reintentos fiables de notificaciones continúan pendientes del cierre general.

Railway QA no requiere cambios. Main y producción no fueron modificados.
