# UI-PROPOSAL-ORIGINAL-COMPACT-01 — Tú pediste resumido

2026-10-21. Solo frontend, rama qa.

Antes: original del cliente con nota y foto a la vista, ocupando buena parte
del diálogo de propuesta. Después: encabezado con total, producto/cantidad y
disponibilidad; Ver detalle despliega snapshot completo, nota y foto original.
Sin foto, omite la indicación Foto. Nombres largos limitados visualmente a dos
líneas; texto completo disponible al desplegar. Interacción de 44 px conservada.
Solo afecta secuencia original vista por el cliente. Negocio, contrapropuestas,
propuesta final y respuesta del negocio conservan su presentación.

Archivos: src/app/screens/requests/ProposalChat.tsx, src/styles/index.css,
scripts/check-alternative-negotiation.mjs, esta ficha y catálogo UI.
Sin campos ni endpoints nuevos/modificados; mismas lecturas de propuestas,
subjectSnapshot y acciones/versiones/confirmación existentes. Sin escrituras al
plegar/desplegar. Railway QA no necesario; backend, main y producción intactos.

Validación: 1145 pruebas/98 archivos y build QA/PWA aprobados (advertencia existente
de bundle grande). 21 recorridos Chrome sintéticos, con regresión explícita de
original con foto plegado bajo 150 px, abrir detalle con nota/foto y volver a
plegar en 320/393 px. Se mantienen envío, aceptación, rechazo, contrapropuesta,
final, idempotencia, versiones y visor de foto. Sin API/uploads/pedidos reales.
Pendiente prueba física Android/iPhone y conformidad. Reintentos fiables de
notificaciones siguen pendientes. Avances anteriores conservados.

Publicación funcional: `51ef25c27249b89058717c1c10ccf9c52a611592`, origin/qa.
Preview `dpl_D4JwNydN4cFBYqZpReBCKrN53Rvm` READY; SHA/ref qa y alias
https://zipco-app-git-qa-zipco-s-projects.vercel.app comprobados por API.
Backend QA confirmado en preflight; build global null y productionBranch main.
Build override: ZIPCO_QA_LOAD_DIAGNOSTICS=1 ZIPCO_QA_NOTIFICATION_TRACE=0 npm run build -- --mode qa.
Este resultado se respalda en cierre documental publicado con el mismo código
funcional/opciones QA. Conformidad física pendiente.
