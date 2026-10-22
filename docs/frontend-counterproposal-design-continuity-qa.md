# UI-COUNTERPROPOSAL-CONTINUITY-01 — Contrapropuesta y aceptación sin tarjetas intermedias

2026-10-22. Clasificación: **solo frontend QA**. El usuario pidió mantener el
diseño de la primera alternativa al preparar la contrapropuesta del cliente y
la propuesta final del negocio, y eliminar las dos tarjetas de sus capturas.

## Antes / Después

Antes: los botones de contrapropuesta/propuesta final usaban el estilo genérico
del chat. Revisar propuesta abría inmediatamente un diálogo vacío con Cargando.
Al aceptar y autorizar, otro diálogo reemplazaba la tarjeta aprobada por el
encabezado «Tu propuesta quedó aceptada» durante la lectura de permisos.

Después: las entradas comparten el botón de vidrio de la primera alternativa.
El formulario y el resumen comparten los mismos AlternativeDraftDialog,
AlternativeChangeEditor y AlternativeReviewPanel ya aprobados. Se comprobó la
igualdad de estilos en las tres etapas, conservando la base «Propuesta vigente»
en contrapropuesta/final y la solicitud original en el historial. La restricción
de una contrapropuesta y allowedActions siguen siendo las del contrato.

La revisión se abre cuando termina la lectura autorizada. Mientras espera,
el botón indica carga y bloquea doble toque; si falla, muestra error junto al
botón y permite reintentar. Actualizar una revisión mantiene la conversación
montada, sin insertar el antiguo texto Cargando.

Tras aceptar, la verificación/autorización mantiene el diseño de «Todo listo
para coordinar tu pedido», su icono y el ticket de la propuesta exacta aceptada.
Se elimina la tarjeta antigua de aceptación y se evita repetir la animación de
entrada. Un snapshot **local de presentación** viaja por el evento interno;
no añade campos a la API ni persistencia y debe coincidir con currentProposalId.

No se ocultaron errores ni se eliminaron las opciones de recuperación. Aceptar
y autorizar siguen siendo acciones separadas: una aceptación guardada nunca se
repite al reintentar contacto. No hay autorización sin lectura vigente y permiso;
no se abre WhatsApp automáticamente. El holograma de cierre aparece cuando
corresponde según el comportamiento existente.

## Archivos y contrato

- `src/app/screens/requests/ProposalNegotiation.tsx`: apertura tras lectura y
  botón compartido; captura la propuesta exacta para presentación local.
- `AcceptAuthorizeCard.tsx`, `AcceptedProposalHost.tsx`: diseño compartido durante
  seguimiento; conserva consentimiento, recuperación y seguridad de sesión.
- `proposalAcceptance.ts` y prueba: valida identidad del snapshot local.
- `src/styles/index.css`: evita segunda entrada del seguimiento.
- `scripts/check-alternative-negotiation.mjs`: comprobaciones móviles sintéticas.
- Este documento y `frontend-ui-design-catalog.md`: registro de entrega.

Sin cambios de backend. Lecturas existentes `/request-processes/:id/proposals`
y listas `/orders/my-orders?processContract=alternatives-v1` o
`/orders/business/:businessId?processContract=alternatives-v1`.
POST existentes de contrapropuesta/final/aceptación en
`/request-processes/:id/actions/{counter-proposal,propose-final,accept-proposal,accept-counter-proposal}`:
se conservan expectedVersion, proposalId, confirmationAccepted y cambios/foto
admitidos. `authorize-contact` conserva expectedVersion y consentAccepted.
Claves de idempotencia separadas y reintentos con cuerpo/clave idénticos.
Sin nuevas imágenes persistidas, endpoints, estados, roles ni notificaciones.

## Validación

Suite completa: 1.204 pruebas / 104 archivos aprobados; después se añadió y
aprobó la prueba de identidad del snapshot (6/6 en proposalAcceptance.test.ts).
Build final QA/PWA aprobado; aviso previo de bundle mayor de 500 kB.
No se declara un chequeo tsc independiente, no configurado en este proyecto.

**55 recorridos de navegador aprobados**, con touch y datos sintéticos:
formulario/resumen inicial, contrapropuesta y final en 320/393 px; revisión lenta
sin tarjeta vacía; diseño aprobado durante verificación de contacto para ambos
actores; envío fallido conserva formulario; duplicados, conflictos, permiso
revocado, teléfono inválido, sesión cambiada, fecha vencida, recuperación de
aceptación y reintentos de contacto. El selector sintético de cantidad se ajustó
al control real +/− y se repitió la comprobación completa.

Capturas revisadas en `node_modules/.cache/alternative-negotiation-browser/`:
`draft-parity-1-393.png` y `accept-followup-true.png`. El script genera también
las restantes preparaciones y resúmenes. Cero acciones sobre pedidos reales,
acceso al backend real o carga real de fotos. La eliminación final del indicador
de carga en revisión se verificó en build después de la ejecución de navegador.

Pendiente: comprobación física en Android/iPhone, empezando por Contraproponer
del cliente, luego propuesta final del negocio y aceptación con contacto.
Los reintentos fiables de notificaciones siguen pendientes del cierre general.

## Publicación

Rama `qa`; respaldo GitHub y despliegue exacto Vercel QA al cierre de la entrega.
Railway QA no necesario. Backend, main y producción sin modificaciones.
