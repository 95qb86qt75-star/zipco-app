# Traspaso de avance — Frontend QA, UI y navegación

Nota de lectura 2026-10-19: este traspaso conserva la etapa del 17 de octubre y
su SHA, no el estado completo actual. Los avances posteriores y su respaldo
están referenciados en [QA-DOC-CLOSURE-01](frontend-qa-documentation-closure.md).
Este cierre documental no cambia contratos ni autoriza trabajo backend o producción.

Fecha: 2026-10-17. Fuente: decisiones, capturas y revisiones de Bastián en
esta conversación. Bastián entregará las imágenes directamente a Backend QA.
No se incluyen capturas ni datos personales en el repositorio.

## Mensaje para Backend QA

Recibe este contexto de Frontend QA y contrástalo con el contrato backend.
Se requiere diagnóstico de los pendientes F1 y P1 antes de implementar.
Este traspaso no autoriza código backend, cambios de contratos, migraciones,
commits, despliegues ni acceso a variables o secretos.

El informe registra el avance de esta etapa y las conformidades específicas;
la aprobación global definitiva del diseño sigue pendiente. No equiparar las
capturas y pruebas locales con una validación integral en ambos celulares.

## Versión exacta

- Frontend: `C:\dev\zipco-app-qa`, rama `qa`.
- HEAD y referencia local `origin/qa`: `126a5562bd9321819ac3d75701763997618b1f8b`.
- Mensaje: `fix: preserve requests category when returning from agreement`.
- Despliegue de ese commit confirmado exitoso por Vercel al publicarlo.
- QA: https://zipco-app-git-qa-zipco-s-projects.vercel.app
- Base de esta ronda: `d5204934b1f6b7b5ac360733af4e641292acbe4c`.
- En la base ya estaban las tarjetas recuperadas, las condiciones compactas,
  los textos de fotografía según participante y las pestañas del negocio.
  La ronda siguiente contiene nueve iteraciones; la número 2 fue sustituida
  por la número 5 y no describe el diseño vigente.

## Nueve ajustes realizados y publicados

1. **Orden del cliente.** Pendientes antes de Coordinación. Se conservan
   los filtros, estados, contadores y las demás categorías.
2. **Primera distribución horizontal.** Nombre y contador en una fila con
   desplazamiento lateral. Se publicó y después se reemplazó por el punto 5
   porque Bastián necesitaba todas las categorías visibles.
3. **Jerarquía de la tarjeta del cliente con RequestProcess.** Se retiró el
   precio duplicado de la esquina superior y se puso allí el estado. El precio
   compacto permanece en la barra de color. Después de aceptar, procede del
   acuerdo. La presentación histórica sin proceso conserva su comportamiento.
4. **Cierre del visor.** Se movió el visor de la fotografía a `document.body`
   para escapar del recorte de la tarjeta. X visible y de alto contraste,
   área táctil de 48 px, zonas seguras, cierre por fondo y Escape, gestión de
   foco y retorno al control anterior. Bastián confirmó que quedó bien.
5. **Categorías compactas, todas visibles.** Se eliminó el desplazamiento.
   Las cinco categorías caben en una fila a 375–430 px en las muestras locales;
   a 320 px o con la sexta categoría histórica usan dos filas. No se cortan
   palabras. El mismo componente sirve para futuras categorías, sin crearlas.
   Bastián dio conformidad y aportó captura del iPhone cliente.
6. **Coordinación y consentimiento del cliente.** Presentación compacta con
   icono de WhatsApp y botón verde “Autorizo iniciar coordinación”, efecto
   glass, iluminación del icono y animación de dos ciclos (4,4 s). Se desactiva
   al reducir movimiento o durante una operación. El clic conserva únicamente
   `AUTHORIZE_CONTACT`; no abre WhatsApp ni ejecuta `START_WORK`.
7. **Botones secundarios transparentes.** “Ahora no” y “Anular solicitud”
   tienen glass transparente, borde luminoso y relieve suave; texto verde y
   rojo respectivamente. Se conservan icono, foco, bloqueo y manejadores.
8. **Acuerdo integrado y menos espacio.** Al pulsar “Revisar condiciones”,
   el detalle aparece inmediatamente debajo de la barra, dentro de su mismo
   bloque y antes de la coordinación. Se quitaron la segunda tarjeta y el
   título/total repetidos. Se conservan todos los datos del acuerdo, referencia
   de foto, glow y visor. El candado pasó al título; se retiró su franja repetida
   para subir los botones, conservando íntegro el consentimiento. Las acciones
   no se desmontan al abrir/cerrar el detalle. Negocio e Historial conservan su
   presentación anterior. Bastián confirmó “quedó bueno” con capturas del cliente.
9. **Regreso desde el acuerdo.** “Abrir acuerdo” conserva participante y
   categoría en parámetros locales validados. “Volver a Solicitudes” devuelve
   a Coordinación, En curso o Historial según el origen, sin cambiar de
   participante. Los enlaces antiguos de Historial son compatibles. Se admiten
   solo categorías reconocidas y destinos internos. Publicado; verificación
   posterior de este recorrido en los celulares todavía pendiente.

Trazabilidad de commits:

- Ajustes 1–3: `c20526019d05509f40b652a8897022cf4890cc4a`.
- Ajuste 4: `ad563f0e885b79a90d8306afc9c5c61977e50e07`.
- Ajuste 5: `4ef8bec3835c510b9176c2ca12437decd65ae317`.
- Ajuste 6: `2ed8c2c43635d3db876ab017f6e76afd0b5de9a0`.
- Ajuste 7: `55fccce94f8088a5aa3fc540b530729c602c50b5`.
- Ajuste 8: `6bfc308a1d41e8a2da2eec91e3d338841d27afe6`.
- Ajuste 9: `126a5562bd9321819ac3d75701763997618b1f8b`.

## Comportamiento y contratos conservados

- No se cambiaron campos de API, endpoints, estados, permisos ni transiciones.
- Pedidos sin RequestProcess, incluido `requestProcess:null`: flujo histórico.
  Proceso malformado o desconocido: tratamiento seguro existente.
- Antes de aceptar, nota/foto desde listas. Después, condiciones exclusivamente
  desde `GET /request-processes/:id/agreement`; `:id` es `requestProcess.id`,
  no `agreementPublicId`. Carga, error y reintento sin datos antiguos de respaldo.
- Se conserva versión, propuesta, UUID estable ante resultado incierto,
  protección por identidad/sesión y bloqueo de doble envío.
- Coordinación sigue gobernada por `requestProcess.state` y `allowedActions`.
- Acciones existentes: `ACCEPT_FIXED_ORDER`, `AUTHORIZE_CONTACT`,
  `OPEN_WHATSAPP`, `START_WORK`, `ANNUL_COORDINATION`, según permiso del servidor.
- “Ahora no” no comparte el teléfono ni anula. El botón “Autorizo iniciar
  coordinación” no significa empezar el trabajo. Solo el negocio conserva
  “Coordinación lista — comenzar pedido”, cuando esté permitido.
- Foto de perfil y referencia siguen separadas. No se añadieron teléfonos,
  contactos al acuerdo, persistencia de la URL de WhatsApp ni promesas de envío.
- No se habilitaron Alternativa, Rechazo, Listo u otras fases para RequestProcess.
- “Listo y notificado” sigue siendo condicional para pedidos históricos.
- Se mantiene Coordinación separada de En curso y el acceso al acuerdo en Historial.

## F1 — Pendiente funcional: anular una solicitud inicial

Bastián solicita recuperar “Anular solicitud” para el cliente inmediatamente
después de crear el pedido, mientras está en Pendientes y espera respuesta del
negocio (`AWAITING_BUSINESS_RESPONSE`). No está implementado para ese proceso.

La anulación que ya existe en coordinación es otra acción: el contrato frontend
actual restringe `ANNUL_COORDINATION` a `COORDINATION_PENDING`/`COORDINATING`.
El estilo rojo del botón no amplió esos permisos. Tampoco debe reutilizarse
el PATCH histórico para eludir RequestProcess.

Backend QA debe contrastar lo existente y definir el contrato aplicable:
acción permitida, transición, recibo, concurrencia/idempotencia, historial y
actualización de ambas vistas. No hay nombres nuevos de endpoints, campos ni
estados aprobados aquí. Primero entregar diagnóstico y propuesta; no implementar.

## P1 — Propuesta, posible ajuste 10: avance del pedido

Se solicitó un indicador compacto al principio de “Revisar condiciones”, dentro
del bloque existente. No está implementado y no incrementa los nueve ajustes.

Propuesta de textos todavía por cerrar:

- Solicitud registrada: completada.
- Condiciones aceptadas por ambas partes: completadas.
- Coordinación pendiente: fase actual.

Mostrar únicamente lo acreditado por el proceso y el acuerdo válidos. El acuerdo
ya expone `customerAcceptedAt`, `businessAcceptedAt` y `confirmedAt`; el proceso
distingue `COORDINATION_PENDING`, `COORDINATING` e `IN_PROGRESS`.
Una presentación basada en esos datos podría ser solo frontend.

Bastián también propuso “Negocio confirmó disponibilidad” y “Pedido recibido
por el negocio”. No están confirmados como eventos independientes en los DTO
actuales del frontend. Backend QA debe aclarar si disponibilidad equivale a
aceptar el pedido o si exige otra acción/evidencia. No duplicar una aceptación
en dos hitos distintos, ni afirmar lectura/recepción de notificación sin datos.
No reutilizar `createdAt`/`updatedAt` con otro significado.

No aprobar porcentajes o “3 de 4” sin definir los hitos. No pedir consentimiento
si el cliente ya lo dio; un dato ausente no equivale a `false`. No afirmar que
WhatsApp abrió o se envió un mensaje. No ampliar Alternativas ni otras fases.

## Evidencia y pendientes de validación

- Última validación de código: 753 pruebas aprobadas en 73 archivos;
  69 pruebas afectadas aprobadas para el ajuste 9. Build Vite/PWA correcto.
- Comandos: `npm.cmd test`, pruebas específicas con `npm.cmd test -- <rutas>`
  y `npm.cmd run build -- --outDir node_modules/.cache/visual-review-build`.
- `git diff --check` correcto. `dist/index.html` excluido y sin modificaciones.
- Advertencia previa de bundle superior a 500 kB: permanece; no se amplió el
  alcance para optimización. Build no sustituye typecheck.
- Deuda previa antes de testers externos: faltan scripts/configuración y
  herramientas locales para typecheck/lint, según `frontend-2a-validation-debt.md`.
  No se instalaron herramientas durante la ronda.
- Chrome local usó componentes reales, CSS compilado y datos/acciones simulados;
  tamaños 320, 375, 393 y 430 px, claro/oscuro y movimiento reducido en los bloques
  correspondientes. Estas muestras no prueban backend, push ni WhatsApp reales.
- iPhone cliente: conformidad explícita de categorías y condiciones integradas,
  con capturas. El visor recibió conformidad; no se documentó por separado en
  ambos dispositivos. La preferencia por el modo oscuro es una revisión parcial.
- Android negocio: no hay comprobación independiente documentada de la última
  versión de esta ronda. Debe comprobarse junto al iPhone.
- Falta confirmar en celulares el regreso del acuerdo a la categoría de origen,
  y el recorrido funcional de consentimiento, WhatsApp, retorno a la PWA,
  comienzo exclusivo del negocio y anulación en coordinación.
- El estado de publicación/contrato efectivo de Backend QA no se verificó en
  proveedores durante esta ronda visual. No se abrió el repositorio backend.

## Archivos principales para ubicar el trabajo

- `src/app/screens/RequestsScreen.tsx`.
- `src/app/screens/requests/RequestStatusTab.tsx` y `OrderCardHeaders.tsx`.
- `src/app/screens/requests/ProcessOrderCard.tsx`, `OrderCardPanels.tsx`,
  `AcceptedConditions.tsx`, `CoordinationActions.tsx` y `WhatsAppMark.tsx`.
- `src/app/screens/requests/OrderReferencePhoto.tsx`.
- `src/app/screens/requests/AgreementRoute.tsx` y `agreementNavigation.ts`.
- `src/styles/index.css`, pruebas relacionadas y `frontend-visual-review-log.md`.

En esta ronda solo se publicó Frontend QA, rama `qa`. No se modificaron backend,
`main`, producción ni migraciones. Este informe documental queda local para
compartirlo; no implica una publicación adicional.

## Entrega solicitada a Backend QA

1. Contrastar las capturas que adjuntará Bastián con esta versión y los contratos.
2. Informar si F1 tiene soporte backend actual o necesita un bloque nuevo.
3. Resolver la semántica/evidencia de los hitos de P1 y distinguir qué puede
   presentarse en frontend de lo que exigiría datos/acciones de servidor.
4. Identificar decisiones pendientes de Bastián y proponer el orden de bloques.
5. No implementar ni ampliar contratos o fases por recibir este informe.
# Registro adicional — 2026-10-18: QA-PUSH-NAV-01

El diagnóstico de avisos duplicados y navegación desde notificaciones queda
registrado en [frontend-push-navigation-diagnosis-qa.md](frontend-push-navigation-diagnosis-qa.md).
Incluye SHA revisado, contrato observado, archivos, hallazgos confirmados,
límites de evidencia, pruebas y propuesta pendiente. Bastián confirmó haber
compartido la información con Backend QA. No se implementó ni publicó una
corrección. Este registro documental es local y todavía no tiene commit propio.
