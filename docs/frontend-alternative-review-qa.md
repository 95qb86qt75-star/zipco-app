# UI-BUSINESS-ALTERNATIVE-REVIEW-01 — Resumen visual de alternativa

2026-10-20. Clasificación: solo frontend. Rama qa. Base conservada:
54b8140ab03a7553d4e7ed0988bdd740b9fd9c11. Continúa el diseño
[UI-BUSINESS-ALTERNATIVE-EDITOR-01](frontend-alternative-change-editor-qa.md).

## Origen y adaptación

Archivos aportados por Bastián desde Downloads, originales sin modificar:

- AlternativeReviewPanel.tsx, SHA256
  26fa904ed2ca35aabbd629bfd64118c7fe507f0c0cae33b678ea5620279f2618.
- PendingAlternativeActions (1).tsx, SHA256
  4fdb9b3c9c97fbb782a1a50a39a3c896dc355426aaecf72973dab53900c0c983.
- index.css.additions.css, SHA256
  1f6088190e6d6d9e78ee6f9c8054a7fa302309f6850b76ee3f669fb1389c5cff.

Integra tarjetas de comparación, cantidades/precios, disponibilidad, explicación,
total y diferencia con el original, conservando violeta y modo oscuro. Animaciones
finitas y contador visual de 850 ms; cancelación al desmontar y respeto a movimiento
reducido. Lectores de pantalla reciben el total exacto, sin contar importes.

Adaptaciones respecto al aporte: fecha con año; cantidades explícitas también en
líneas CUSTOM; encabezado «Resumen de tu nueva propuesta» y texto «Revisa los
cambios antes de confirmar», sin afirmar que existe una vista cliente implementada.
Al alternar formulario/resumen, el cuerpo vuelve arriba; pie permanece separado.
No se incorpora el aviso amarillo «El envío aún no está habilitado: esto es un
borrador para revisar», por indicación expresa de Bastián.

El cambio de nombre a «Enviar Nueva Propuesta» sigue pausado por su instrucción.
Se conservan «Revisar alternativa», «Volver al formulario» y «Confirmar y enviar»;
este último permanece deshabilitado y sin manejador de envío.

## Archivos y contrato conservado

- src/app/screens/requests/AlternativeReviewPanel.tsx: nuevo resumen.
- src/app/screens/requests/PendingAlternativeActions.tsx: integración y posición
  inicial del cuerpo.
- src/styles/index.css: solo estilos/animaciones .zipco-review-*.
- AlternativeReviewPanel.test.ts y PendingAlternativeActions.test.ts: cobertura
  del resumen y bloqueo de envío.
- scripts/check-business-alternative-draft.mjs: comprobación DOM táctil adaptada.

alternativeDraft.ts no cambia: mismos campos locales source/draft/review,
cantidades y precios enteros CLP, CUSTOM como total de línea explícito, motivo,
fechas Chile, permiso/versiones y validaciones. No hay campos API ni endpoints
nuevos; no se ejecutan acciones del pedido, uploads, persistencia ni propuestas.
canSubmitAlternative sigue devolviendo false. No se activa alternatives-v1.
Railway QA no es necesario para este cambio visual. El envío integrado sigue
pendiente de backend QA confirmado y visualización/respuesta del cliente.

## Validación

1074 pruebas en 93 archivos aprobadas (7 nuevas del panel). Cubren importes
CUSTOM sin división, líneas sin cambios, escape de mensaje, diferencias de total,
fecha/año Chile, movimiento reducido y finalización/cancelación del contador.
Build QA aprobado, incluida generación PWA/service worker. Advertencia existente
de tamaño de bundle >500 kB. El primer intento del build encontró restricción
local EPERM en carpeta temporal; completado con acceso autorizado, sin cambios
de configuración.

Comprobación Chrome con datos sintéticos y red hacia backend bloqueada: productos,
servicios, varias líneas, anchos 320/393/400, altura reducida y movimiento reducido.
Verifica pie fijo, ausencia de desborde, resumen desde arriba, contador exacto,
selecciones independientes, envío bloqueado, descarte al cerrar y foto solo local.
Capturas regenerables en node_modules/.cache/business-alternative-browser/
review-panel-393.png y review-panel-320.png, fuera de Git.

Pendiente prueba física Android/iPhone: Mi Negocio → solicitud nueva → Proponer
alternativa → guardar cambios y motivo → Revisar alternativa. Comprobar comparación,
desplazamiento del cuerpo y pie fijo, volver conserva cambios, cerrar los descarta.
Confirmar y enviar permanece deshabilitado. No declarar propuesta enviada/guardada.

## Publicación

Solo Vercel Preview QA desde Git, conservando Backend QA y override temporal
ZIPCO_QA_LOAD_DIAGNOSTICS=1 ZIPCO_QA_NOTIFICATION_TRACE=0 npm run build -- --mode qa.
Registrar SHA y despliegue comprobados en cierre documental posterior.
Sin modificar backend, Railway, main ni producción. Avances previos conservados.
