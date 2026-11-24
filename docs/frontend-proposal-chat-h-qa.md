# UI-PROPOSAL-CHAT-H-01 — Detalles plegables y comparación en columnas

2026-10-21. Solo frontend, rama qa.

Antes: original compacto y respuesta del negocio con filas de diferencias.
Después: cada burbuja cerrada por defecto, propia con título/total/icono de foto,
ajena con explicación, título/total y resumen de cambios. Botón de vidrio azul
para pedido y turquesa para propuesta; abre/cierra cada detalle por separado.
Tabla anterior/propuesta con cambios, nueva columna verde animada y checks.
Chips de datos conservados y acceso a sus valores; fotos en detalle compacto.

Fuente aportada por Bastián en Downloads, SHA256:

- ProposalChat (1).tsx: A690F0D2D63E55EA649B819437244CE63CB1DEBE743092789F7C7DC431799D3C.
- index.css.chat-proposal (1).css: 09CF474E6BEAE5E60894755C85FB2A635AD3A2E66BE08C5BBD7A8F25AF94A437.
- INSTRUCCIONES_CODEX_revisar_propuesta_H.md: C53099BECA26AD811B69F97A3631F756AD3587E3661A9AE0453AC051993AB091.

Se adaptan presentación/CSS, no las instrucciones de producción del documento.
Se conserva rama qa y publicación exclusivamente Vercel QA.
El bloque CSS anterior de chat se reemplaza, sin estilos duplicados.

Adaptaciones al contrato actual: conserva todas las líneas y descripciones (también
eliminar descripción), servicios sin cantidad, precio unitario/CUSTOM total
explícitos, actor real authorActor, fechas con año/Chile, datos completos al abrir
las burbujas propias y valores conservados consultables sin depender del hover.
Foto conserva autor y visor Radix anidado; compact solo modifica presentación.
Tablas con encabezados accesibles, botones mínimo 44 px, modo oscuro, foco y
movimiento reducido; destello detenido al abrir. Textos largos hacen wrap.

Archivos: src/app/screens/requests/ProposalChat.tsx, ProposalChat.test.ts,
OrderReferencePhoto.tsx; src/styles/index.css;
scripts/check-alternative-negotiation.mjs; esta ficha y catálogo UI.
ProposalNegotiation, load/execute/intents/sesión, AlternativeDraftDialog y
AcceptGlassButton no modificados. Sin campos ni endpoints nuevos/modificados.
Mismos GET /request-processes/:id/proposals y POST /request-processes/:id/actions/:action,
processContract=alternatives-v1, snapshots/allowedActions/versiones/confirmación/
idempotencia y Cloudinary existentes. Sin acciones al abrir/cerrar detalles.
Backend/Railway QA no necesarios. main y producción intactos. Avances conservados.

Validación: 1146 pruebas / 98 archivos y build QA/PWA aprobados; advertencia
existente de bundle grande. tsc no disponible como dependencia del proyecto.
23 recorridos Chrome sintéticos de aceptación/rechazo/contrapropuesta/final,
historial, permisos, conflictos y recuperación. Detalles independientes,
fotos, 320/393 px, tabla abierta/cerrada, modo oscuro y movimiento reducido.
Verificación de texto completo de Ocultar detalle a 393 px y captura inspeccionada.
Incluye varias líneas/servicio con nombres/descripciones largos.
Sin API QA, uploads ni acciones reales sobre pedidos.

Pendiente conformidad y prueba física Android/iPhone; Chrome no acredita WebKit.
Reintentos fiables de notificaciones siguen pendientes.

Código funcional `9e8fc83377b604f51cc647f19f388755ede3267e`, origin/qa.
Preview `dpl_PVe6iceMX9Hmkgcw3RQVBa8z34er` READY y alias
https://zipco-app-git-qa-zipco-s-projects.vercel.app comprobados por API.
SHA/ref qa exactos, Backend QA confirmado en preflight, build global null y
productionBranch main conservados. Build override:
ZIPCO_QA_LOAD_DIAGNOSTICS=1 ZIPCO_QA_NOTIFICATION_TRACE=0 npm run build -- --mode qa.
Este registro se respalda en cierre documental publicado con el mismo código
funcional y opciones QA. Conformidad física pendiente.
