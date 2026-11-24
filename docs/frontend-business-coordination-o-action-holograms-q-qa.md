# UI-COORDINATION-O-Q-01 — Por coordinar del negocio y hologramas de acción

2026-10-22. Clasificación: solo frontend QA, sobre contratos existentes.

Antes: bloque holograma claro dentro de Aurora, condiciones desplegables en
la tarjeta y avisos de propuesta en un recuadro oscuro.
Después: tarjeta O Medianoche/Aurora, franja de condiciones con hoja flotante,
pasos de autorización/WhatsApp, plegado a fila resumida y anulación en una hoja.
Los avisos de alternativa/propuesta final y acciones confirmadas usan el diseño Q.

Fuente visual: paquete del usuario `Downloads/Nuevo 1/codex-o/codex-o`,
instrucciones `INSTRUCCIONES_CODEX_coordinar_pedido_negocio_hologramas.md`,
cuatro componentes/datos y `index.css.coordinacion-o.css`, referencias O-1 a
O-4, O-hoja-anular, O-hoja-condiciones y Q-hologramas-de-accion. Los parches se
adaptaron a mano. No se ejecutan las instrucciones del adjunto para publicar en
producción ni su ruta antigua `src/index.css`; se usa `src/styles/index.css` y `qa`.

## Revisión de los ocho puntos del paquete

| Punto | Resolución |
| --- | --- |
| Consentimiento | Se usa AUTHORIZE_CONTACT existente del propietario, confirmado en el contrato backend c1f3b57/aa38e8b. Sin desbloqueo local si falta permiso. Requiere lectura actual con businessContactAuthorized=true. Después, otro clic ejecuta OPEN_WHATSAPP si allowedActions lo permite. El cliente conserva su consentimiento independiente. |
| Aviso de pagos | Se conserva «ZIPCO no procesa ni verifica pagos». El paso de autorización explica qué teléfono y con quién se comparte. |
| Acuerdo | Tipo real AgreementReadDto, scheduledFor/confirmedAt, subjectSchemaVersion y subjectSnapshot. No existe acceptedAt en el DTO: la fecha del paso usa confirmedAt. No se reutiliza createdAt/updatedAt con otro significado. |
| Pedido/propuesta | subjectSchemaVersion distingue el acuerdo original del negociado. Título neutral «Pedido aceptado» o «Propuesta aceptada» junto al cliente: no atribuye falsamente la aceptación al cliente cuando el negocio aceptó una contrapropuesta. |
| Recuperación | Conserva useCoordination, idempotencia, bloqueo ocupado, reintento exacto, reconciliación y Actualizar estado. Una respuesta POST exitosa con lectura fallida no produce autorización visual ni holograma de éxito verificado. |
| Anulación | Motivos de ANNUL_REASONS sin renombrar; OTHER exige texto no vacío de hasta 1000 caracteres. X, Escape, exterior, campos y botones quedan bloqueados mientras se confirma. |
| WhatsApp | Sin window.open nuevo ni URL calculada. useCoordination conserva location.assign solo tras respuesta navigation validada y lectura compatible. Q aparece en ese punto; no anuncia apertura si falla la acción o el contacto no está disponible. |
| Notificaciones/accesibilidad | Conserva id order-{id}, foco por teclado, resaltado zipco-notification-target y marcado de lectura al inspeccionar. Enter/Espacio pliegan/abren sin POST. No cambia push ni navegación remota. |

## Adaptaciones necesarias al diseño

- Se mantiene «Coordinación lista — comenzar pedido» si START_WORK está permitido;
  no se elimina una acción comercial válida por copiar la captura.
- Hoja de condiciones: precios por unidad vs total de línea CUSTOM, subtotales,
  múltiples productos/servicios y fecha reales. «Ver acuerdo completo» abre el
  detalle existente bajo la tarjeta, con notas, explicación, fotos y enlace.
- La animación de carga de 3,9s (0,5s con movimiento reducido) empieza solo tras
  comprobar la autorización. Antes se muestra «Autorizando contacto…», sin check
  de éxito. Plegar no reinicia esa transición ni envía otra acción. No se añade
  un segundo bloqueo artificial durante el crecimiento decorativo del botón.
- Fondos estáticos sin blur móvil en la lista, efectos de atención limitados a
  tres ciclos; no se ocultan textos durante una entrada lenta. Hojas con entrada
  breve 180ms y sin float continuo. Se conserva PERF-ACCEPTED-CONDITIONS-01:
  el detalle completo aparece por opacidad 120ms sin animar su altura.
- Q: 4,3s normal/2,2s reducido, ocho variantes visuales, reemplazo del aviso
  anterior y deduplicación por operación. Un host estable junto a DealSuccessHost
  para acciones; alternativa/final usan el mismo renderer desde la raíz, con los
  textos y validación de proposalSentFeedback.ts. Sin avisos duplicados.
- Contrapropuesta: texto real de categoría del negocio «Esperando respuesta».
  Contacto autorizado no afirma que la otra parte ya autorizó. Pedido listo no
  afirma entrega fiable de push. Rechazo Q se dispara por rechazo de propuesta/
  contrapropuesta confirmado, conservando el flujo distinto de rechazo inicial.
- Cotizaciones y otros avisos heredados conservan su renderer y CSS; no se borran
  clases aún usadas. AcceptGlassButton y DealSuccess no fueron modificados.

## Archivos y contrato

Nuevos: BusinessCoordinationCard.tsx, CoordinationSheets.tsx, coordinationSparks.ts,
ActionHologram.tsx, coordinationFeedback.ts y pruebas de tarjeta/feedback, todos
en `src/app/screens/requests/`.

Integración: ProcessOrderCard.tsx, CoordinationActions.tsx, useCoordination.ts,
ProposalNegotiation.tsx, proposalSentFeedback.ts, `src/app/screens/RequestsScreen.tsx`,
`src/styles/index.css`; pruebas existentes de presentación/navegación/feedback,
`scripts/check-order-card-aurora.mjs` y catálogo UI.

Sin endpoints ni campos nuevos. GET de acuerdo por process/agreement actuales;
lecturas de pedidos con processContract=alternatives-v1; acciones existentes POST
`/request-processes/:id/actions/{authorize-contact,open-whatsapp,start-work,mark-ready,annul-coordination}`.
Usa allowedActions, version/expectedVersion, consentAccepted, reasonCode/reasonDetail,
Idempotency-Key, coordination.businessContactAuthorized/customerContactAuthorized,
agreementPublicId y navigation del contrato. Hologramas de negociación consumen
recibos validados de sus acciones existentes, sin nuevo POST, push o persistencia.
Las llamadas de aceptación combinada no activan otro Q encima de Cierre exitoso.

## Validación y límites

Build QA/PWA aprobado; aviso de tamaño de bundle preexistente. El proyecto no
tiene un chequeo tsc independiente configurado; no se declara realizado.
Suite completa: **1.172 pruebas / 101 archivos aprobados**. Pruebas nuevas cubren
permiso ausente, POST sin lectura, consentimiento propio/cliente independiente,
progreso plegado, doble clic, recuperación y apertura de hojas sin POST; helper
de feedback prueba estado/actor/versiones y no inventa navegación.

Navegador sintético: **234 casos visuales** sobre 12 estados, ambos actores,
temas claro/oscuro y 320/393/400px; además hojas O en 320/360/393/400px, plegado,
anulación OTHER sin explicación bloqueada, cierres, ocho variantes Q, deduplicación,
reemplazo, duración normal/reducida y limpieza al cambiar sesión. CPU 4x:
condiciones de altura estable, controles montados y cero lecturas adicionales.
**49 recorridos de negociación aprobados**, incluidos consentimiento combinado,
errores, conflictos, reintentos idempotentes y pérdida de respuesta. Capturas
locales ignoradas en `node_modules/.cache/order-card-aurora-browser/` (condiciones,
anulación por ancho, tarjeta y ocho Q). Se revisaron las capturas del diseño;
los hologramas contienen una entrada animada antes de mostrar sus textos.

Los fallos iniciales fueron expectativas del diseño anterior y sincronización/
codificación de controles en el script de navegador; se actualizaron y repitieron
las comprobaciones. También se corrigió una regla CSS de pseudoelemento que no
limitaba un destello continuo. Validación final aprobada.

Respaldo GitHub `qa`: integración `a1c366c`; estilos `36c15db`.
El primer commit omitió el CSS: se corrigió con el segundo commit y se verificó
su presencia antes del cierre. Publicación completa: Vercel QA READY
`dpl_CC2nQa7ZGm7bfGGP3a1hMX9z7wFB`, SHA exacto
`36c15dbe86be9425b2fa9ce7e746d31a501045d4`, con alias habitual confirmado:
`https://zipco-app-git-qa-zipco-s-projects.vercel.app`.
Este cierre también se respalda en Git y publica en QA, conservando código/estilos.

Datos sintéticos exclusivamente: sin acciones sobre pedidos reales ni cargas
reales de fotos. Queda pendiente probar en Android/iPhone: entrar a Por coordinar,
abrir condiciones, plegar/abrir, autorizar, revisar el progreso, abrir WhatsApp y
anular con motivo; además los avisos Q después de alternativa/final/contrapropuesta.
Probar cada paso por separado con el usuario. No se declara aprobación física.

Railway/backend no modificados ni requeridos para este despliegue. Main y
producción intactos. Reintentos fiables de notificaciones siguen pendientes del
cierre general; los hologramas locales no garantizan entrega de push.
