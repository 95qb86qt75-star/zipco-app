# UI-ORDER-CARD-AURORA-01 — Diseño Aurora en los estados del pedido

Fecha: 2026-10-21. Clasificación: **solo frontend**. Rama `qa`.
Base revisada: `44743c9eff76df50199589d6496ec42a1a0d56c5`, sincronizada con origin/qa.

## Solicitud y resultado

Bastián entregó cuatro archivos de diseño y pidió conservar esa apariencia al
cambiar de estado, con los textos y acciones propios de cada etapa.

Antes: tarjetas claras en el recorrido del pedido. El diseño entregado aplicaba
Aurora únicamente durante la negociación.

Después: tarjeta Aurora nocturna compartida por cliente y negocio, con avatar,
nombre, etiqueta del estado, importe y acceso al detalle o a la propuesta. Se
conservan acciones, permisos, confirmaciones y resguardos existentes. Se aplica
también a pedidos anteriores sin requestProcess; las cotizaciones conservan su
presentación. No se cambia el estado de ningún pedido para implementar o probar.

| Etapa existente | Presentación |
| --- | --- |
| Pendientes / AWAITING_BUSINESS_RESPONSE | Nuevo pedido en negocio; Pendiente de respuesta en cliente. Importe solicitado, productos originales y revisar pedido/responder. |
| AWAITING_CUSTOMER_DECISION | Alternativa por responder; importe propuesto y botón para revisar propuesta/responder. |
| AWAITING_BUSINESS_COUNTER_RESPONSE | Contrapropuesta y respuesta según participante; mismo diseño y permisos existentes. |
| AWAITING_CUSTOMER_FINAL_DECISION | Propuesta final y respuesta según participante; mismo diseño. |
| COORDINATION_PENDING / COORDINATING | Estado de coordinación, condiciones acordadas y autorización/contacto según permisos. |
| IN_PROGRESS | Preparación; negocio conserva Notificar pedido listo cuando está permitido. |
| READY | Pedido listo o Pendiente de retiro según readyNoticeAcknowledged; confirmar aviso/recepción solo cuando corresponde. |
| Historial | Completado, anulado, rechazado o cierre de negociación; solicitud original o acuerdo, según el cierre. |

Los rótulos de estado siguen proviniendo de processStatusLabel y los mapeos
existentes. No se inventan estados, categorías o transiciones. Los controles
específicos siguen en sus componentes actuales, dentro de la tarjeta común.

## Archivos entregados y adaptación

Origen: Downloads de Bastián, sin modificar esos originales. SHA256:

| Archivo | SHA256 |
| --- | --- |
| OrderCardAurora.tsx | CC950EFCAA325E0B9CC8D4E27099E2BFF71290FDF17430850BFEE50513447B62 |
| ProposalNegotiation.tsx | 1F8EBE8F8C9C04FB147BE2C881DFA6285DE81F706DDF639C8F14F150F1A0B174 |
| ProcessOrderCard.tsx | FDDD10EBB9DFBE274A512F66E6E91E560B2510E36E8D3509B42BEAD1DBB5EE03 |
| index.css.additions (1).css | 0551DCE949ABC031165E8510E8EFEA4C77331A9F6FE7DCFF89836DC4E05FBBFF |

Se recuperaron el fondo violeta/azul con luces turquesa, avatar, etiqueta de
cristal, precio luminoso y botón con reflejo y luces animadas. Adaptaciones:

- Encabezado compartido en todos los estados; por debajo de 380 px el precio
  pasa a otra fila. Nombres y etiquetas largos no empujan el importe fuera.
- Productos originales únicamente antes de aceptar; después se usa el acuerdo
  inmutable. En negociación se conserva el resumen autorizado, sin sustituirlo
  por el pedido original. Si el acuerdo de Historial aún no se leyó y no existe
  resumen, se muestra «—»; nunca el total original como supuesto acuerdo.
- En tarjeta plegada el total está una vez en el encabezado. El detalle conserva
  su desglose, notas, fotos y acuerdo. Se mantienen carga, error y reintento.
- Estilo de acceso al detalle consistente; contraste de paneles y botones de
  rechazo/anulación sobre el fondo oscuro, con soporte de ambos temas.
- Se mantiene id del pedido, teclado, marca Nueva, apertura de detalle y
  resaltado azul por notificación. El pseudo-elemento decorativo no reemplaza
  el rótulo «Abierta desde la notificación». Movimiento reducido conservado.
- En Historial antiguo se desactiva la animación de entrada que usa transform,
  para que Motion conserve el control del gesto lateral. Selección, archivo,
  restauración y apertura de detalle no cambian.
- ProposalNegotiation solo recibe la variante visual Aurora; envío, foto,
  versión, idempotencia, permisos y holograma aprobado no cambian.

Código:
`src/app/screens/requests/{OrderCardAurora,ProcessOrderCard,ProcessHistoryCard,
ProposalNegotiation,MyOrderCard,BusinessOrderCard,CompactHistoryList,
CoordinationActions}.tsx` y `src/styles/index.css`.
Regresiones: `processCardVisualFlow.test.ts`, `orderCardCharacterization.test.ts`.
Matriz de navegador: `scripts/check-order-card-aurora.mjs`.

## Contrato y backend

Sin campos, endpoints, payloads o datos nuevos. Se conservan las lecturas
`GET /orders/my-orders?processContract=alternatives-v1`,
`GET /orders/business/:id?processContract=alternatives-v1`,
`GET /request-processes/:id/agreement` y `/request-processes/:id/proposals`.
Se presentan state, readyNoticeAcknowledged, proposalSummary.totalPriceClp,
allowedActions, snapshots del acuerdo y datos de identidad/productos existentes.
Las acciones bajo `/request-processes/:id/actions/*` siguen en sus componentes;
ninguna se ejecutó contra pedidos reales para este trabajo.

No requiere cambios o despliegue en Railway QA. Se conserva Backend QA
`https://zipco-backend-qa.up.railway.app`. Sin cambios en autenticación, contratos,
notificaciones push, worker, main o producción. Arquitectura nueva de
notificaciones y reintentos fiables siguen con sus pendientes anteriores.

## Validación

- **1137 pruebas / 97 archivos aprobados**, incluidas las regresiones de
  acciones, acuerdo exacto, importes, navegación y cierres. Dos casos nuevos
  comprueban que Historial no muestra el precio original como acuerdo faltante.
- **Build QA aprobado**, con PWA generada. Aviso habitual de tamaño de bundle;
  no es fallo de compilación. No se afirma un tsc independiente.
- Matriz visual Chrome con React real y CSS compilado: **228 combinaciones** de
  estados/participantes/tamaños/temas, con pedidos actuales y antiguos.
  320/393/400 px, claro/oscuro, nombres largos y precio de visualización de
  $50.000.000. Sin contenido del encabezado fuera de la tarjeta.
- Borde/rótulo por notificación, movimiento reducido y apertura de condiciones
  sin POST comprobados. Capturas locales en node_modules/.cache, no versionadas.
- **12 recorridos táctiles de negociación aprobados**: propuesta con foto,
  respuestas, única contrapropuesta y final, errores, versión e idempotencia.
  Datos sintéticos y fetch interceptado; sin acceso al backend ni cargas reales.
- Diff revisado; los archivos descargados no se reemplazan ciegamente.

Prueba física pendiente: desde QA, cliente y negocio deben revisar una tarjeta
existente en cada categoría, abrir/cerrar detalle, revisar propuesta, verificar
importe y texto del estado. En Android/iPhone comprobar 320–400 px y apertura
desde notificación nueva. No repetir una acción ya confirmada para validar estilo.
No se acredita el flujo integrado móvil por las pruebas sintéticas.

## Entrega

Commit y push a origin/qa; publicar en Vercel Preview QA, con las mismas opciones
por despliegue (`ZIPCO_QA_LOAD_DIAGNOSTICS=1 ZIPCO_QA_NOTIFICATION_TRACE=0 npm run
build -- --mode qa`) y alias QA habitual. Registrar resultado READY en el cierre.
Conservar todos los avances anteriores y no dejar documentación pendiente local.

## Publicación comprobada — 2026-10-21

Código `7f735502fdf30b34118ebb4e276ad46d960bf931`, enviado a origin/qa.
Vercel Preview funcional **READY**, `dpl_F3j2TMNJi7f1Uu3VBNJAis2nPXtC`, URL propia
https://zipco-7uc66dnpk-zipco-s-projects.vercel.app. GitSource GitHub/qa/SHA exacto
y alias https://zipco-app-git-qa-zipco-s-projects.vercel.app comprobados por API.
Logs de build QA y Build Completed comprobados. Backend QA verificado en
configuración de Preview. Build global null y rama de producción main conservados.

La consulta pública sin sesión redirige a Login de Vercel; no se toma ese HTML
como una prueba de carga de ZIPCO ni se modifica la protección del Preview.
La validación visual se realizó en el navegador local con la compilación QA;
prueba física desde el acceso habitual instalado todavía pendiente.

Este resultado, catálogo y registro de revisión se guardan en un commit
documental posterior a la publicación. Mantiene el mismo código funcional y
se publica con el mismo override de build QA; su SHA será la versión visible
final. Sin cambios adicionales en comportamiento, backend, main o producción.
