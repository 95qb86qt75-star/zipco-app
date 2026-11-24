# UI-ALTERNATIVE-REVIEW-TICKET-01 — Comparación agrupada

2026-10-21. Solo frontend. Rama qa.

Antes: resumen por productos, total al final y foto desplegada.
Después: total original/vigente y propuesto arriba, grupos «Cambió» y
«Se mantuvo», mensaje y ficha opcional Ver imagen/Ocultar.
Formulario aprobado, pie fijo y envío operativo conservados.

Diseño de Downloads aportado por Bastián, SHA256:

- AlternativeReviewPanel (1).tsx: C459C04FE548874CB13BCD7C7A5FCBBD32806DAE4BF880ABB30B448A444CD835.
- index.css.additions-review.css: 302C29EAF4C4AF82D7EF3AF2334F8701589880785BBC539442F82CD8489D0FA4.
- INSTRUCCIONES_CODEX_revisar_alternativa.md: 4AA2FEED88BAE73157C3A1B182008FF6781301F3717AA1B95D560F23AF5C22AB.

La indicación de envío bloqueado del instructivo es anterior al contrato integrado.
Se adapta el diseño conservando el envío vigente. Foto preparada localmente,
carga solo al confirmar; animación decorativa sin acreditar persistencia.
Contrapropuesta/final compara contra propuesta vigente. Servicios omiten cantidad;
CUSTOM usa total de línea y catálogo precio por unidad. Textos escapados,
movimiento reducido y brillo anterior conservados.

Archivos: AlternativeReviewPanel.tsx, PendingAlternativeActions.tsx y
AlternativeReviewPanel.test.ts en src/app/screens/requests/; src/styles/index.css;
scripts/check-business-alternative-draft.mjs y catálogo documental.

Sin campos/endpoints nuevos o modificados. Conserva processContract=alternatives-v1,
allowedActions, versiones, propuesta exacta, confirmación, idempotencia y carga
existente de ProposalNegotiation. Variante aislada sin contrato sigue bloqueada.
Sin acciones reales sobre pedidos, notificaciones ni backend. Railway no necesario.

Validación: 1140 pruebas/97 archivos; build QA/PWA aprobado (advertencia existente
de bundle grande). tsc no disponible en dependencias. Nueve escenarios Chrome
DOM/React/touch de formulario: 320/393/400 px, servicios, varias líneas, pantalla
corta y movimiento reducido; foto plegada/abrir/cerrar. Quince recorridos de
negociación sintéticos: envío autorizado/foto, cliente, contrapropuesta/final,
conflictos y recuperación con idempotencia. Sin API/uploads reales.
Captura 320 px inspeccionada, sin desborde y pie visible. diff --check aprobado.

Pendiente revisión física de diseño Android/iPhone; Chrome no acredita WebKit.
Reintentos fiables de notificaciones siguen pendientes. Avances conservados.
main, producción, backend y Railway no modificados.

Publicación comprobada por API: commit funcional
`a6f2aa93e4c051739345826dff34e7e6e75bf685`, origin/qa.
Preview `dpl_ABaGzMHbhMY7MghfHfEgBaJj2qkx` READY, SHA/ref qa exactos y alias
habitual confirmado: https://zipco-app-git-qa-zipco-s-projects.vercel.app.
Build: ZIPCO_QA_LOAD_DIAGNOSTICS=1 ZIPCO_QA_NOTIFICATION_TRACE=0 npm run build -- --mode qa.
Backend QA confirmado en preflight; build global null y productionBranch main.
Este registro y catálogo se guardan en cierre documental y se publican con
idéntico código funcional/opciones. La revisión física sigue pendiente.
