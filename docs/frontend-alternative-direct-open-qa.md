# UI-ALTERNATIVE-DIRECT-OPEN-01 — Acceso directo a Proponer alternativa

2026-10-21. Clasificación: **solo frontend**. Rama `qa`.
Base limpia: `0c9ea7ba08471d31ecdc74ce553e90a9c386ac57`, sincronizada con origin/qa.

## Antes / Después y causa

Bastián reportó en QA 0c9ea7b un cuadro pequeño Proponer alternativa con
Cargando… y Actualizar propuestas antes de abrir el formulario completo.

Causa comprobada: openProposals ejecutaba setOpen(true) antes de load(initial).
El diálogo de comparación/carga se montaba durante GET /proposals. Solo después
de recibir los datos autorizados, setDraftAction abría el formulario.

Después: el acceso inicial del negocio verifica la lectura existente sin abrir
el diálogo de comparación. El botón queda bloqueado y muestra Cargando formulario…
durante la espera. La lectura autorizada abre directamente el formulario aprobado.
Volver/cerrar regresa a la tarjeta, sin mostrar la comparación intermedia.

Si falla la lectura, error dentro de la tarjeta y el mismo botón permite
reintentar. No se abre un editor con datos inventados o sin verificar. Si la
lectura vigente ya no permite PROPOSE_ALTERNATIVE, no se abre el formulario:
se informa el cambio y se solicita la actualización de listas mediante refresh.

La revisión de propuestas existentes, respuestas del cliente/negocio,
contrapropuesta y final conservan su comparación y confirmaciones anteriores.
El diseño del formulario/resumen, precios, fotos, envío, idempotencia y holograma
no cambian. Tampoco plegado, orden ni apertura suave de la tarjeta.

## Archivos y contrato

- `src/app/screens/requests/ProposalNegotiation.tsx`: apertura inicial directa,
  estado de carga en el botón, error visible/reintento y actualización si el
  permiso vigente desapareció. Se conserva readProposals y el bloqueo por ref.
- `scripts/check-alternative-negotiation.mjs`: tres regresiones nuevas con
  lectura retenida, doble clic, error/reintento y permiso retirado. El montaje
  usa la variante Aurora real y mantiene los 12 recorridos de negociación.
- Esta ficha y docs/frontend-ui-design-catalog.md.

Sin campos, endpoints, cuerpos, estados o permisos nuevos/modificados. Se
conserva GET `/request-processes/:id/proposals`, processContract=alternatives-v1,
allowedActions y la comprobación del permiso antes de editar. El envío y su
preflight/version/proposalId/confirmación bajo `/request-processes/:id/actions/*`
no se modifican. Entrar al formulario y cerrarlo no ejecuta ningún POST.

No requiere backend ni Railway QA. Backend QA y avances conservados. Sin cambios
en worker, notificaciones, main o producción. Los pendientes generales de entrega
fiable de notificaciones y la arquitectura pausada siguen igual.

## Validación y comprobación

- **1138 pruebas / 97 archivos aprobados**.
- **Build QA y PWA aprobados**, con aviso habitual de tamaño de bundle.
- **15 recorridos táctiles Chrome aprobados**, datos/respuestas sintéticas,
  sin acciones sobre pedidos reales ni fotos reales.
- Lectura lenta: no aparece ningún diálogo intermedio ni campos antes de la
  lectura autorizada; doble clic produce un solo GET y cero POST.
- Al llegar la lectura, aparece el formulario directamente. Volver cierra hasta
  la tarjeta. Un observador de DOM confirma ausencia del cuadro de comparación.
- Fallo de GET inicial: error sin popup/formulario; reintento abre el formulario.
- Permiso retirado en GET: cero editor/POST y refresh de la lista solicitado.
- Regresión de aceptación/rechazo, contrapropuesta/final, errores, versión,
  expiración confirmada, foto e idempotencia conservada.

Prueba física pendiente en Android/iPhone: negocio → Pendientes → Revisar y
responder → Proponer alternativa. Debe abrir el formulario grande directamente.
En conexión lenta, solo cambia el texto del botón. Volver debe regresar a la
tarjeta sin el cuadro pequeño. No confirmar un envío únicamente para revisar UI.

## Publicación

Commit/push a origin/qa y Vercel Preview QA con Backend QA y override vigente:
`ZIPCO_QA_LOAD_DIAGNOSTICS=1 ZIPCO_QA_NOTIFICATION_TRACE=0 npm run build -- --mode qa`.
Registrar READY y publicar el cierre documental con el mismo código funcional.

## Publicación comprobada — 2026-10-21

Código `6f0605901c658ce87a2f42cff9915a648012bdf7`, enviado a origin/qa.
Preview funcional **READY**, `dpl_C1ZwDkYcK2abzGfNJfFj4LMshQzj`, URL propia
https://zipco-7w2v33n11-zipco-s-projects.vercel.app. GitSource/SHA exacto, rama qa,
target Preview y alias habitual comprobados por API. Backend QA, override de
build, build global null y rama de producción main conservados.

Este resultado y catálogo se guardan en cierre documental posterior, publicado
con idéntico código funcional/opciones. Su SHA identifica la versión final.
Prueba física del acceso directo en Android/iPhone pendiente.

## Conformidad de Bastián — 2026-10-21

Sobre QA `2ae69e883354062f283024aabb41028f8942ae44`, Bastián confirmó
«funcona excelente». Queda aprobado el acceso directo al formulario sin cuadro
intermedio, UI-ALTERNATIVE-DIRECT-OPEN-01, código funcional `6f06059`.

El mensaje no especifica dispositivo ni pruebas de error, lectura lenta o
permisos retirados. No se extiende esa conformidad a ambos sistemas móviles,
a todos los recorridos de negociación o al cierre general de notificaciones.
No se repiten acciones del pedido para registrar la aprobación.

Cierre solo documental: esta ficha y el catálogo. Revisión del diff, commit/push
en qa y publicación con idéntico código funcional y build QA. No requiere
repetir pruebas funcionales ni modificar campos, endpoints, backend, Railway,
main o producción. Los pendientes generales se conservan.

## Regresión S2 y restauración — 2026-10-25

Clasificación: solo frontend. Base `784440f`, rama qa. El usuario reporta que
Proponer alternativa muestra «Cómo seguirá…» en vez del formulario aprobado.
La integración S2 había colocado la elección del camino antes del editor; el
editor y diseño aprobados seguían presentes en AlternativeDraftDialog.

Se restaura la apertura directa del formulario tras GET autorizado de propuestas.
Precio, cantidad, disponibilidad, producto, explicación, foto y revisión conservan
sus componentes y diseño. Para alternativa y propuesta final S2 del negocio,
WhatsApp/retiro se elige después de Revisar alternativa → Confirmar y enviar.
Elegir el camino completa el envío del mismo borrador y snapshot de proceso;
su lectura previa vuelve a comprobar versión/propuesta antes de POST.
Volver/cerrar la elección conserva el formulario revisado y no envía nada.
El formulario permanece montado durante esa elección; su cierre solo ocurre
después de éxito. Cancelar, desmontar o cambiar de sesión resuelve la espera.
Reintentar conserva el cuerpo y la clave según las protecciones existentes.

Archivos: `ProposalNegotiation.tsx`, `PendingAlternativeActions.tsx`,
`availability-design/AvailabilityDesign.tsx` (todos en src/app/screens/requests),
`scripts/check-availability-flow.mjs` y esta ficha. El selector superpuesto se
muestra por encima de la revisión sin sustituirla. La contrapropuesta del
cliente mantiene la preferencia propia e hereda el plan según S2.

Contrato sin cambios: GET `/request-processes/:id/proposals` usa ahora
`?processContract=availability-v1`, tal como quedó publicado con S2; POST
`/request-processes/:id/actions/propose-alternative` y `propose-final` conservan
`expectedVersion`, `proposalId`, revisión comercial, `confirmationAccepted` y
`fulfillment`. No se agregan campos, endpoints, permisos ni transiciones.
Pedidos legacy conservan su envío anterior y no abren selector S2.
No requiere cambios ni despliegue de Railway.

Validación: 1339 pruebas/112 archivos y build QA/PWA aprobados, nueve recorridos
Chrome de S2 con HTTP simulado. Incluyen editor original antes del selector,
volver sin perder precio revisado ni POST, alternativa para retiro, aceptación
de contrapropuesta WhatsApp y propuesta final que cambia a retiro. Captura
inspeccionada: node_modules/.cache/availability-flow/alternative-original-editor.png.
Sin pedidos reales ni uploads en estas comprobaciones; prueba física pendiente.

Commit/push por integración GitHub en qa y verificación READY del alias habitual
pendientes al preparar esta ficha. Main y producción intactos. Los cuatro
documentos locales anteriores sin seguimiento quedan fuera de este commit.

## Contraponer y conservar el camino en la final — 2026-10-25

Clasificación: solo frontend, sobre el contrato S2 publicado. El usuario
confirma dos cambios: mismo editor para Contraponer 1 vez del cliente y no
repetir WhatsApp/retiro al enviar la propuesta final del negocio.

Contraponer utiliza AlternativeDraftDialog y el mismo botón compartido de
vidrio de Proponer alternativa. Título compacto «Contraponer · 1 vez»; precio,
cantidad, disponibilidad, producto, explicación, foto y revisión usan los mismos
componentes. El consentimiento propio del cliente se muestra en la revisión
antes de confirmar, conservando el editor con el diseño aprobado. No cambia
el límite de una contrapropuesta, los permisos ni el consentimiento del otro.

PROPOSE_FINAL toma el plan vigente de la lectura autorizada de propuestas y
reenvía sus campos comerciales (camino, mensaje, horario/dirección y opción
de contacto) sin abrir el selector ni editarlos. La revisión muestra el plan
conservado; si corresponde compartir contacto, conserva el texto explícito del
consentimiento propio del negocio al confirmar. El backend crea el plan propio
de la propuesta final; no se reutiliza artificialmente una FK ni se modifica el
plan anterior. Si falta el plan, no se inventa otro y el envío queda bloqueado.
Se mantiene el preflight de versión/propuesta y la idempotencia existentes.

Archivos: `ProposalNegotiation.tsx`, `PendingAlternativeActions.tsx`,
`availabilityChoice.ts` (src/app/screens/requests),
`scripts/check-availability-flow.mjs`, esta ficha y el catálogo UI.
No hay campos/endpoints nuevos: GET propuestas conserva
`?processContract=availability-v1`; POST counter-proposal conserva la preferencia
del cliente; POST propose-final conserva fulfillment completo y consentimiento
propio del negocio cuando corresponde. Finales legacy siguen su cuerpo anterior.
Sin cambios de contrato, migraciones ni despliegues Railway.

Validación: 1339 pruebas/112 archivos, build QA/PWA y 10 recorridos Chrome con
HTTP simulado aprobados. Comprobado el editor completo de contrapropuesta y
la igualdad de fulfillment inicial/final para WhatsApp y retiro con instrucciones
propias y opción de contacto. Captura inspeccionada:
node_modules/.cache/availability-flow/customer-counter-editor.png.
Sin acciones de pedidos reales. Revisión física Android/iPhone pendiente.

Base da09d1d, rama qa; commit/push GitHub y verificación Vercel READY pendientes
al preparar la ficha. Main y producción intactos. Se conservan fuera de esta
entrega cinco documentos locales de diagnóstico/coordinación sin seguimiento,
incluida la validación de campos de retiro aún pendiente con backend.
