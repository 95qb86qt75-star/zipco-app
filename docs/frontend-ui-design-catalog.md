# Catálogo de diseño UI — Frontend QA

Este catálogo vincula nombres de diseño, código y commits para recuperar lo
revisado en QA y comprobar un futuro pase a producción. Es un registro inicial;
no declara que todas las pantallas estén inventariadas ni finalmente aprobadas.
Las notas de revisión locales anteriores se conservan por separado.

Actualización 2026-10-19: el cierre y respaldo de aquellas notas, las fichas más
recientes y la regla vigente de guardar cada avance y su resultado se consultan
en [QA-DOC-CLOSURE-01](frontend-qa-documentation-closure.md). Los estados de las
entradas anteriores son históricos; no deben interpretarse como el estado actual
de todas las pantallas.

## Regla de registro acordada con Bastián

Cada cambio de UI debe registrar nombre estable de pantalla/componente, ruta,
commit completo que contiene el diseño, capturas de referencia/aprobación,
dispositivo comprobado y estado de revisión. Antes del commit se marca local;
después se registra el hash real. La documentación debe quedar también en Git.
Publicado en QA no equivale a aprobado por Bastián. No inventar capturas ni
validaciones de celulares. Cualquier cambio posterior de paleta se registra
explícitamente; el historial anterior se conserva.

## UI-READY-PALETTE-01 — Solicitudes cliente: resumen Listos

- Nombre: **Resumen Listos — naranja/ámbar al seleccionar**.
- Componente: `ReadyOrdersSummary`.
- Código: `src/app/screens/requests/ReadyOrdersSummary.tsx`.
- Pantalla visible: `src/app/screens/RequestsScreen.tsx`, mapa
  `customerAttentionCards`; no depender del bloque JSX oculto.
- Commit de restauración del diseño:
  `66a85a1198e6e1cd4ef45b87e1beda0ffe83bdd3`,
  `fix: restore orange amber ready summary palette`.
- Commit que conectó el componente a la tarjeta visible y probó la selección:
  `683576b7f536ccba0f7171c30ed004837d037e65`. En esa versión se introdujo teal;
  la restauración posterior conserva su funcionamiento y recupera la paleta.
- Referencia anterior recuperada:
  `dbf5bd96f3f4ccfa99cbf59d873c43b87e5556e0`, bloque de resúmenes de actividad
  en `src/app/screens/RequestsScreen.tsx`.
- Seleccionado: `from-orange-500 to-amber-500`, borde `border-orange-400`, texto
  e icono blancos, fondo translúcido del icono y sombra naranja
  `rgba(245,158,11,0.25)`.
- Sin seleccionar: `from-amber-50 to-orange-50`, borde ámbar y texto oscuro;
  variantes oscuras de la misma familia para modo nocturno.
- Conserva selección accesible `aria-pressed`, categoría Listos, contadores,
  textos y las acciones existentes. No cambia campos ni endpoints.
- Estado: implementado y probado localmente; Bastián solicitó el commit para
  visualizarlo en QA. Publicación y revisión móvil se registran posteriormente;
  esta ficha no acredita aprobación final del diseño.
- Capturas: referencias conversadas con Bastián; no se han incorporado archivos
  de capturas a este catálogo. Captura y comprobación del color restaurado en
  Android/iPhone: pendientes tras la publicación.

## UI-PALETTE-01 — Paleta de referencia de resúmenes de actividad

Fuente exacta:
`dbf5bd96f3f4ccfa99cbf59d873c43b87e5556e0:src/app/screens/RequestsScreen.tsx`.
Se registra para mantener la familia visual; no modifica la lógica de estados
ni todos los componentes que usan nombres similares.

| Nombre visual | Degradado seleccionado | Degradado sin seleccionar |
| --- | --- | --- |
| Pendientes | `from-amber-400 to-orange-500` | `from-amber-50 to-orange-50` |
| Esperando respuesta | `from-violet-600 to-purple-500` | `from-violet-50 to-purple-50` |
| En curso | `from-emerald-500 to-cyan-500` | `from-emerald-50 to-cyan-50` |
| Listos | `from-orange-500 to-amber-500` | `from-amber-50 to-orange-50` |

Texto seleccionado blanco; subtítulo blanco al 85 %. El teal oscuro introducido
en Listos no es la referencia recuperada. En el cliente antiguo, el resumen
visible tenía color fijo: no se afirma que entonces ya cambiara correctamente.
Su bloque oculto incluía otra variante ámbar/naranja. Esta tabla aplica a
resúmenes grandes, no redefine pestañas compactas, tarjetas de pedido o glass.

## Validación de UI-READY-PALETTE-01

838 pruebas en 78 archivos correctas. Incluyen seleccionar el resumen en la
pantalla visible, recuperar el resaltado tras cambiar de categoría y confirmar
que seleccionar no envía peticiones ni ejecuta acciones de pedidos.

Build QA correcto, con diagnóstico temporal activo y salida ignorada en
`node_modules/.cache/ready-palette-restoration-qa-build`. Advertencia habitual
de bundle superior a 500 kB. Sin cambios en `dist/index.html`, dependencias,
configuración global o instrumentación de loadOrders.

Publicación prevista exclusivamente en rama qa y Vercel Preview del proyecto
zipco-app, equipo zipco-s-projects, conservando Backend QA y el acceso habitual:
`https://zipco-app-git-qa-zipco-s-projects.vercel.app`.
Override de ese despliegue:
`ZIPCO_QA_LOAD_DIAGNOSTICS=1 npm run build -- --mode qa`.
No se cambia backend, Railway QA, main ni producción. No se ejecutan acciones
de pedidos para verificar el color.

### Resultado de publicación QA — 2026-10-17

Nombre UI-READY-PALETTE-01 y commit visual
`66a85a1198e6e1cd4ef45b87e1beda0ffe83bdd3` quedaron respaldados en Git mediante
el commit documental `73f5bfd181dcd6b22d4034ec3554509f6a6abc1e`. Ambos se
publicaron exclusivamente en origin/qa. Cuatro rutas verificadas entre ambos
commits; seis documentos locales anteriores preservados fuera de ellos.

Preview READY: `dpl_EH5YLARDgp6NCYN5EYtoF4HVgyfQ`.
SHA efectivo `73f5bfd181dcd6b22d4034ec3554509f6a6abc1e`, GitHub real, rama qa,
entorno Preview. URL propia: `https://zipco-c4ngpsz0h-zipco-s-projects.vercel.app`.
El alias QA habitual apunta a este despliegue y es su único alias asignado.
Build QA correcto, diagnóstico temporal conservado mediante el override del
despliegue. Build global y rama de producción sin cambios.

Revisión de colores en Android/iPhone pendiente de Bastián. No se ejecutaron
acciones de pedidos ni se cambió backend, Railway QA, main o producción.
Esta anotación del resultado se añade localmente después del despliegue; la
ficha del diseño, su hash visual y la regla de registro ya están en el commit
documental indicado. Staging vacío y sin cambios de código pendientes.

## UI-TODAY-TIME-PROMPT-01 — Hora para hoy con indicación visible

Nombre: **Resumen del pedido — Seleccionar hora para Hoy**. Componente compartido
`src/app/screens/OrderMomentSelector.tsx` (producto y servicio). Código:
`dce11f38634240c0fb0f4f87a1718b8c1c951e6f`. Muestra texto y reloj mientras
la hora está vacía; conserva selector nativo y valores reales. Publicado en QA,
42 pruebas y build aprobados; comprobación física y aprobación pendientes.
Detalle y resultado versionado en [frontend-today-time-prompt-qa.md](frontend-today-time-prompt-qa.md).

## UI-REQUEST-SUMMARY-SCROLL-01 — Campanitas hacia sus tarjetas

Código: `723674f51e0189d8e9bc6432591a7c22177f982f`. En
`src/app/screens/RequestsScreen.tsx` y `requests/requestSummaryScroll.ts`,
unifica la selección/scroll de las campanitas de negocio y cliente y añade
únicamente el recorrido inferior que falta en listas cortas. Sustituye el
alcance y medida iniciales de UI-BUSINESS-COORDINATION-SCROLL-01 y
UI-CUSTOMER-COORDINATION-SCROLL-01, conservados como historial.
933 pruebas, build QA y 18 casos táctiles en Chrome aprobados; Preview READY,
comprobación física de Android/iPhone pendiente. Fuente y cierre versionado:
[frontend-request-summary-scroll-qa.md](frontend-request-summary-scroll-qa.md).

## UI-REQUEST-SUMMARY-SMOOTH-01 — Transición suave de campanitas

Código: `a45884eab738214dfb42a2b2e73cf095d0572d75`. Conserva el destino
y recorrido inferior de UI-REQUEST-SUMMARY-SCROLL-01, que Bastián confirmó
funcionando, y añade scroll suave nativo para cliente/negocio. Respeta movimiento
reducido con desplazamiento instantáneo. 934 pruebas, build QA y 24 casos táctiles
en Chrome aprobados; Preview READY. Aprobación visual de esta transición pendiente.
Archivos y resultado versionado en
[frontend-request-summary-smooth-qa.md](frontend-request-summary-smooth-qa.md).

Conformidad posterior, 2026-10-20: Bastián confirmó «Funciona excelente» para
la transición suave entregada como `a0a65db1574cea16893e81626d6fd93c3b0a83cd`
(código `a45884eab738214dfb42a2b2e73cf095d0572d75`). Estado del ajuste:
**conforme según Bastián**. No especificó dispositivo/rol ni prueba de movimiento
reducido; no se extiende la conformidad a toda la app o a producción.

## UI-CUSTOMER-PENDING-CANCEL-01 — Cliente: Anular solicitud inicial

Código: `be2614aa3c1fd174966a142b4f8229e8ae12c88d`, rama qa.
Botón Anular solicitud antes de la primera respuesta, sujeto a allowedActions;
popup «¿Confirmas anulación de tu pedido?» con Sí / No. No cierra sin acción;
Sí utiliza CANCEL_PENDING_REQUEST y muestra el cierre confirmado en Historial.
Sin motivo, borrado o nueva notificación. Contrato backend publicado en 577c0c7.
975 pruebas y build QA aprobados; 24 regresiones táctiles del scroll anterior.
Preview funcional READY; integración y aprobación móvil pendientes.
Archivos, contrato y resultado: [frontend-customer-pending-cancellation-qa.md](frontend-customer-pending-cancellation-qa.md).

## UI-BUSINESS-PENDING-REJECT-01 — Negocio: Rechazar solicitud inicial

Código `6778c2ad4ff8b72647f44ea12db75a105bfb4be0`, rama qa; contrato backend
REQ-BUSINESS-REJECT-PENDING-01 publicado en 772b78a. Se reconoce la acción nueva
sin descartar el proceso válido: permanece en Pendientes con aceptación y rechazo.
Botón Rechazar solicitud solo con permiso, seis motivos, Otro motivo con explicación
obligatoria, selección y confirmación separadas. Historial muestra Rechazada,
motivo y solicitud original sin acuerdo inexistente. Diseño y scroll conservados.
1021 pruebas, build QA y 24 regresiones táctiles aprobados; Preview funcional READY.
Integración y conformidad física Android/iPhone pendientes.
[Archivos, evidencia y publicación](frontend-business-pending-rejection-qa.md).

Conformidad posterior, 2026-10-20: Bastián confirmó «LISTO FUNCIONÓ» para
UI-BUSINESS-PENDING-REJECT-01 entregado como
`cee5746228614d388fc7c6bfc0567f0edbca27e0` (código
`6778c2ad4ff8b72647f44ea12db75a105bfb4be0`). **Conforme según Bastián para
el flujo probado**. No especificó dispositivo ni matriz de escenarios; no se
declaran comprobados todos los motivos o notificaciones Android/iPhone ni
aprobada producción. La ficha conserva el alcance y evidencia.

## UI-BUSINESS-ALTERNATIVE-DRAFT-01 — Negocio: preparar alternativa

Código `f2a4ccf453d6afbcf0f27fcb581ea548d5b1cc81`, rama qa.
Diseño recuperado del commit `e386b2c450bdbfa883331f382ce61c39b81f0e70`:
AlternativeProposalFields reutilizado, modal de BusinessOrdersTab y botón violeta.
Conserva solicitud original, cuatro opciones en dos columnas, campos desplegables,
cantidad +/−, explicación y foto. Agrega edición por línea, opción escrita con total
explícito, límites/horario Chile y revisión. Foto local, sin subir ni persistir.
**Envío bloqueado** hasta integrar cliente, confirmar Backend QA y negociar
alternatives-v1; no es una alternativa guardada. Contrato backend c1f3b57 con
activación QA aún pendiente de confirmar.
1050 pruebas y build QA aprobados, 6 escenarios táctiles Chrome del formulario;
regresión campanitas 24 casos aprobados en repetición aislada, primer resultado
de medición de animación conservado en la ficha. Preview funcional READY.
Conformidad del diseño en celulares y recorrido integrado pendientes.
[Diseño recuperado, archivos y evidencia](frontend-business-alternative-draft-qa.md).

### UI-BUSINESS-ALTERNATIVE-NOTICE-01 — Formulario sin aviso de preparación

2026-10-20. Código `2e745f0b918f0f46adc61f86a4ae76b816d74bfd`, rama qa.
Solo se retira el párrafo amarillo «Solo preparación…» del modal de alternativa.
Se conservan diseño restante, validaciones, descarte y envío bloqueado.
28 pruebas, build QA y 6 escenarios táctiles Chrome aprobados; Preview funcional
READY. Revisión física pendiente. [Archivos y resultado](frontend-business-alternative-draft-qa.md).

### UI-BUSINESS-ALTERNATIVE-SELECTION-01 — Opciones independientes

2026-10-20. Código `243ef4e332b27ceac6ce51673c6e6f78902833c3`, rama qa.
Producto o servicio no marca Precio automáticamente; cada tarjeta se alterna por
separado. La opción escrita pide su precio total obligatorio en sus propios campos,
sin eximirlo al desmarcar Precio. Mantiene diseño restante, validaciones y envío
bloqueado. 1051 pruebas, build QA y 6 escenarios táctiles Chrome aprobados; Preview
funcional READY. Revisión física pendiente.
[Archivos, contrato conservado y resultado](frontend-business-alternative-draft-qa.md).

### UI-BUSINESS-ALTERNATIVE-EDITOR-01 — Cuadritos y cambios guardados

Código `fde40c6124b3a0e1ddd4eff35b60cb50fa7f1a3d`, rama qa. Adaptación de
AlternativeChangeEditor.tsx y PendingAlternativeActions.tsx aportados por Bastián:
cuatro opciones en fila, editor con Guardar/Quitar, checks, resumen, motivo con
contador y pie fijo. Disponibilidad se abrevia Horario hasta360px. Conserva reglas
de CUSTOM, selección independiente, foto local/global y envío bloqueado. Se mantiene
el componente anterior para cotizaciones y pedidos legacy. 1067 pruebas y build
QA aprobados, 8 escenarios táctiles Chrome; Preview funcional READY. Revisión y
conformidad física pendientes. [Archivos, origen y publicación](frontend-alternative-change-editor-qa.md).

### UI-BUSINESS-ALTERNATIVE-REVIEW-01 — Resumen visual de alternativa

2026-10-20. Código d79de228fc3be9046e33d90c29ffba9a54bec770, rama qa.
Adaptación del panel y CSS aportados por Bastián: comparación por línea,
disponibilidad, motivo y total con diferencia. Pie fijo, resumen desde arriba,
animaciones finitas y movimiento reducido. Sin el aviso amarillo solicitado;
envío bloqueado y renombrado del botón pausado. 1074 pruebas, build QA y nueve
escenarios táctiles Chrome aprobados; Preview funcional READY. Prueba física
pendiente. [Archivos y publicación](frontend-alternative-review-qa.md).

### REQ-FRONTEND-ALTERNATIVES-V1-01 — Alternativas y respuestas con acuerdo exacto

2026-10-20. Código `10170537180383b7c3544978006f63e9269e99ea`, rama qa.
Conserva formulario/resumen aprobados; conecta envío, foto, comparación cliente,
aceptación/rechazo, contrapropuesta única y propuesta final según permisos.
Acuerdo schema2 y total negociado; avisos con identidad por propuesta/acción.
1125 pruebas, build QA y 12 recorridos táctiles sintéticos +9 regresiones del
diseño aprobados. Preview funcional READY; cierre añade precisión de rótulo
«Propuesta vigente» al editar contrapropuesta/final. Prueba integrada física y
reintentos fiables de notificaciones pendientes.
[Contrato, archivos, pruebas y publicación](frontend-alternative-negotiation-qa.md).

### UI-ALTERNATIVE-REVIEW-SHEEN-01 — Brillo visible del total propuesto

2026-10-20. Código `7c296c5ee76caca77f196c1c65d3a4ade442a33c`, rama qa.
Franja35%, intensidad50%, ciclo3,6s continuo en el resumen, según CSS aportado
por Bastián. Conserva movimiento reducido y comportamiento del formulario/envío.
Solo src/styles/index.css y documentación. Build QA y nueve escenarios táctiles
de regresión aprobados; captura del brillo inspeccionada. Preview funcional READY;
comprobación física pendiente. [Registro y publicación](frontend-alternative-review-qa.md).

### UI-ALTERNATIVE-SENT-HOLOGRAM-01 — Confirmación de alternativa y ubicación

2026-10-20. Código `0ef735603d90b8a9945ad5aa15e3fa52bc86a7f6`, rama qa.
Reutiliza el holograma de Solicitudes tras el envío confirmado de alternativa o
final: indica Esperando respuesta en negocio y Por responder en cliente. Dura
2800ms, sobrevive a la salida de la tarjeta de Pendientes, no se repite por evento
ni se emite ante fallo. Sin cambiar API, categorías, envío ni notificaciones.
1135 pruebas, build QA y12 recorridos táctiles sintéticos aprobados. Prueba física
del holograma pendiente. [Archivos y publicación](frontend-alternative-sent-hologram-qa.md).
