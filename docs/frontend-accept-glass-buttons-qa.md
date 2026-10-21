# UI-ACCEPT-GLASS-01 — Botones de aceptación con cristal verde

2026-10-21. **Solo frontend**, rama `qa`.
Base: `046b2f3248b7a85d75d240e89893a762b52b264a`, Git limpio al iniciar.

## Antes / Después

Antes: Aceptar pedido usaba el botón rectangular turquesa; las aceptaciones de
propuestas y su confirmación compartían los botones neutros del diálogo.

Después: diseño verde de cristal entregado por Bastián, con check, reflejo,
luces y precio en cápsula, aplicado a:

- Aceptar pedido del negocio en ProcessOrderCard.
- Aceptar propuesta del cliente y Aceptar contrapropuesta del negocio.
- Sí, confirmar en esos dos tipos de aceptación, en variante compacta.

Rechazo y su confirmación, Volver, edición de propuestas, autorización de
contacto y el resto de la pantalla conservan su diseño. No se modifica el
popup OrderActionModal de aceptación inicial ni los botones de pedidos legacy
en BusinessOrderCard/MyOrderCard: el alcance corresponde a los tres reemplazos
indicados en el documento entregado. Aurora y holograma anteriores se conservan.

## Origen y archivos

Se revisaron los tres archivos de Downloads sin modificar los originales:

| Archivo entregado | SHA256 |
| --- | --- |
| AcceptGlassButton.tsx | 350525BEE6F7BD0D5478D5E787717F92DA44C9381898C9F530AF9139CC9AC0F3 |
| index.css.accept-all.css | 10C24EC6EB92407898320BC1850705E62566B12E4AA7CBD03C97053DD731CEED |
| INSTRUCCIONES_CODEX_botones_aceptar.md | 42EBCDE0518713246E29AE1787EF21D295D87767FAE24CD5F11BF49272FBE2A1 |

Código modificado:

- `src/app/screens/requests/AcceptGlassButton.tsx`: componente visual nuevo.
- `src/app/screens/requests/ProcessOrderCard.tsx`: sustituye únicamente el botón
  de aceptación; mismos permisos, stopPropagation, onAccept y disabled.
- `src/app/screens/requests/ProposalNegotiation.tsx`: variante visual para
  ACCEPT_PROPOSAL y ACCEPT_COUNTER_PROPOSAL; los demás botones siguen neutros.
  Mismos handlers, choices, bloqueo, execute, versión, propuesta e idempotencia.
- `src/styles/index.css`: CSS nuevo con nombres específicos. Los estilos
  antiguos zipco-accept-icon se conservan para los botones legacy existentes.
- Pruebas existentes de tarjetas adaptadas al componente y nombre accesible:
  processCardVisualFlow, processPresentation y orderCardCharacterization.
- `scripts/check-accept-glass-button.mjs`: comprobaciones visuales/DOM locales.
- `scripts/check-alternative-negotiation.mjs`: localiza la etiqueta separada
  del precio y comprueba que los rechazos no reciben el diseño verde.

Adaptaciones al material: etiqueta accesible con acción/precio; ancho mínimo,
salto de texto y tamaños responsive para evitar recorte en 320 px y en la
confirmación de dos columnas. Foco dentro del botón para evitar que lo corte
su contenedor. Se conservan las animaciones y movimiento reducido del CSS.

## Contrato, validación y límites

Sin campos, endpoints, payloads, estados, permisos o datos nuevos. Se presenta
el total ya existente de pedido o de la propuesta vigente. Se conservan las
lecturas alternatives-v1, GET /request-processes/:id/proposals y los endpoints
de aceptación bajo /request-processes/:id/actions/*; no cambian sus cuerpos.

No requiere backend ni despliegue Railway QA. Backend QA configurado conservado.
CoordinationActions y su autorización no se modifican, tampoco notificaciones,
worker, main o producción. Reintentos fiables de notificaciones siguen pendientes.

- **1137 pruebas / 97 archivos aprobados**.
- **Build QA y PWA aprobados**; aviso habitual de bundle grande. No se ejecuta
  tsc independiente ni se agregan dependencias para este cambio visual.
- **8 combinaciones visuales**: 320/360/393/400 px, claro/oscuro, importe de
  $50.000.000 y confirmación compacta; sin texto recortado. Clic táctil una vez,
  disabled, propagación y movimiento reducido comprobados.
- **12 recorridos táctiles de negociación**, con datos y respuestas sintéticas:
  aceptación, contrapropuesta/final, rechazos, errores, versión e idempotencia.
  No se envían acciones a Backend QA ni se suben fotos reales.
- Capturas en node_modules/.cache/accept-glass-browser, no versionadas.

Prueba física pendiente en Android/iPhone: abrir una solicitud pendiente como
negocio, desplegarla y revisar Aceptar pedido. Como cliente, abrir una propuesta
y revisar Aceptar propuesta y su confirmación. No confirmar pedidos reales solo
para comprobar el diseño. Verificar que Autorizo iniciar coordinación sigue igual.

## Publicación

Commit/push en origin/qa y Vercel Preview QA. Conservar Backend QA, alias
habitual y override por despliegue:
`ZIPCO_QA_LOAD_DIAGNOSTICS=1 ZIPCO_QA_NOTIFICATION_TRACE=0 npm run build -- --mode qa`.
Registrar READY y código en el cierre documental; sin configuración global o
producción. Conservar avances anteriores y toda la documentación en Git.

## Resultado de publicación — 2026-10-21

Código `4aa115f5663d20768c6633ee0869f93ed3f43e30` enviado a origin/qa.
Vercel Preview **READY**, `dpl_BWPJimdw7MbjQbrvwN4ANLvQP8qK`, URL propia
https://zipco-53lgmmuyz-zipco-s-projects.vercel.app. Por API se comprobaron
GitSource GitHub/qa/SHA exacto, target Preview y alias habitual
https://zipco-app-git-qa-zipco-s-projects.vercel.app apuntando a este despliegue.
Backend QA conservado en la configuración de Preview, override de build QA
comprobado, build global null y rama de producción main sin cambios.

El cierre documental guarda este resultado y actualiza el catálogo en un nuevo
commit de qa, publicado con el mismo código y opciones. El SHA de ese cierre
será la versión visible final. Las comprobaciones DOM/visuales fueron locales;
la revisión física de estos botones en Android/iPhone queda pendiente.
