# UI-PROPOSAL-FLOATING-DETAIL-01 — Detalle flotante y pie integrado

2026-10-21. Clasificación: solo frontend, rama qa.

## Antes / Después

Antes: botones de detalle desplegaban dentro de las burbujas, pie separado por
fondo/borde y Actualizar propuestas al final. Después: botones abren un diálogo
flotante Radix sobre la revisión, con fondo difuminado y entrada 3D breve.
Comparación anterior/propuesta, valores conservados visibles en chips y foto.
Cierra por X, Cerrar detalle, toque exterior o Escape sin salir de la revisión.
Pie sobre degradado continuo, Contraproponer/Rechazar de vidrio; actualizar
reubicado al encabezado junto a cerrar, usando el mismo load existente.
AcceptGlassButton, sus props y estilos permanecen intactos.

Fuentes de Downloads aportadas por Bastián, SHA256:

- ProposalChat (2).tsx: C39EC5E04F9A1C25AD663A531AB97F023678254C10CD899900BCEFB0BEF104C2.
- index.css.chat-proposal (2).css: 2F182330683C63470A62295E68AD930328F63F01FF0678BF80841DB376D6414B.
- INSTRUCCIONES_CODEX_revisar_propuesta_H (1).md: 0ADA98B4B9758F6A70CCC3A094D16ABE562B7BB548C1F13626D5B6714AF697AE.

Se adaptan UI/CSS sin ejecutar las indicaciones de main/producción del instructivo.
Publicación solo Vercel QA. Conserva todas las líneas, descripciones (incluida su
eliminación), servicios sin cantidad y actor del snapshot. Textos cortos:
Precio u./Precio total; si cambia la base, Unitario/Total línea en cada columna.
La comparación también usa base de precio y fecha ISO exacta, aunque sus textos
cortos coincidan; basis/signature son datos derivados locales, nunca payload API.
No se divide arbitrariamente por «·» el nombre/descripción. Foto con autor correcto.

Contenido corto probado cabe sin scroll; muchas líneas/textos largos permiten
scroll dentro del detalle para conservar información. No se promete encajar
cualquier pedido completo en cualquier pantalla. Áreas de cierre mínimo 44 px.
Luces decorativas recortadas para evitar ancho fantasma; cierre pointerdown del
overlay explícito ante fallo del cierre táctil implícito en diálogo anidado.
Visor de foto a 1201 sobre detalle 1101 y revisión 1001; mantiene foco/retorno.

## Archivos y contrato

- src/app/screens/requests/ProposalChat.tsx y ProposalChat.test.ts.
- src/app/screens/requests/ProposalNegotiation.tsx: solo presentación/ubicación de refresh.
- src/app/screens/requests/OrderReferencePhoto.tsx: z-index opcional del visor anidado.
- src/styles/index.css; scripts/check-alternative-negotiation.mjs.
- Esta ficha y catálogo UI.

Sin campos/endpoints nuevos o modificados. Conserva GET
/request-processes/:id/proposals y POST /request-processes/:id/actions/:action,
processContract=alternatives-v1, versiones/propuesta exacta/allowedActions,
confirmación, intents/idempotencia, sesión, cargas Cloudinary y avisos existentes.
load/execute, AlternativeDraftDialog y AcceptGlassButton no cambian su lógica.
Abrir/cerrar no escribe pedidos. Backend y Railway no necesarios.
main y producción intactos; avances anteriores conservados.

## Rendimiento y validación

PERF-REQUEST-CARDS-01 se conserva, no se sustituye con el CSS aportado. Fondos de
chat/detalle mediante gradientes, efectos limitados, sin flotación perpetua del
panel y movimiento reducido. Desenfoque estático solo mientras el detalle está
abierto. La lista mantiene cero animaciones infinitas en prueba de 20 tarjetas.

1147 pruebas/98 archivos y build QA/PWA aprobados; advertencia de bundle grande
existente. tsc no disponible como dependencia. 23 recorridos Chrome sintéticos
de negociación aprobados, ahora incluyendo cuatro cierres, foto anidada y vuelta
a revisión, original con nota/foto, modo oscuro, movimiento reducido, 320/393 px,
servicios, múltiples líneas y texto largo. Detalle típico sin scroll; casos largos
con contención dentro de viewport. Capturas inspeccionadas. diff --check aprobado.
Sin API QA, acciones ni uploads reales. Chrome no acredita Safari/WebKit.

Pendiente prueba física Android/iPhone y conformidad de esta UI. No modifica la
aprobación de rendimiento anterior. Reintentos fiables de notificaciones pendientes.

Publicación: registrar SHA y comprobación READY/alias después de desplegar QA.
