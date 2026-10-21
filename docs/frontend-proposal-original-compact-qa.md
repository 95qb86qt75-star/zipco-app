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

Publicación: registrar commit y READY/alias tras publicar Vercel QA.
