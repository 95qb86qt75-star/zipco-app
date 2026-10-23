# UI-PROPOSAL-ACCEPTED-Q-01 — Holograma Propuesta aceptada

2026-10-22. Clasificación: **solo frontend QA**. Integra el paquete solicitado
`Downloads/codex-q-accept/codex-q-accept`, conservando los contratos existentes.

## Antes / Después

Antes: el cliente recibía «Cierre exitoso» al concluir la aceptación.
Después: recibe el diseño Q **Propuesta aceptada**, documento con check y orbe
verde. Aplica a la alternativa inicial y a la propuesta final del negocio,
tanto Solo aceptar como Aceptar y autorizar contacto.

El negocio conserva Cierre exitoso al aceptar la contrapropuesta del cliente.
La selección se hace en AcceptedProposalHost, el dueño real del seguimiento
actual, y no en execute de ProposalNegotiation como suponía el parche externo.
Así no se disparan los dos hologramas. El host Q ya está montado una vez en
RequestsScreen y sobrevive al cambio de categoría/desmontaje de la tarjeta.

Se conserva el momento de confirmación existente: Solo aceptar muestra el aviso
tras el recibo verificado; Aceptar y autorizar mantiene el seguimiento visible
hasta verificar el contacto. Si la autorización falla, conserva recuperación,
sin anunciar éxito combinado ni repetir la aceptación guardada. La variante
authorized no se dispara adicionalmente dentro de este flujo.

El texto del diseño se adaptó a los permisos reales:
«Ya están de acuerdo. Revisa la autorización de contacto en Coordinación para
continuar por WhatsApp». No afirma que Solo aceptar autorice contacto, ni abre
WhatsApp o envía mensajes. El consentimiento de la otra parte es independiente.

Se reutilizan CSS Q, dibujo progresivo, entrada, deduplicación y limpieza por
sesión existentes. Duración 4,3 s; movimiento reducido estático y 2,2 s. Sin CSS
nuevo. Se añadió solo la variante; no se reemplazó el emisor de eventos por la
versión anterior del parche, que perdería claves y protección de sesión.

## Archivos y contrato

- `src/app/screens/requests/ActionHologram.tsx`: tipo accepted, icono y variante.
- `src/app/screens/requests/AcceptedProposalHost.tsx`: selección por participante
  en los dos puntos existentes de finalización.
- `scripts/check-alternative-negotiation.mjs`: host real Q, expectativas del
  cliente y nuevas comprobaciones de alternativa/final, ambas decisiones y red.
- Este documento y `frontend-ui-design-catalog.md`: registro de diseño/entrega.

No cambian campos, endpoints, permisos, persistencia ni transiciones. Se
conservan POST `/request-processes/:id/actions/accept-proposal` y
`accept-counter-proposal`: expectedVersion, proposalId, confirmationAccepted,
acceptPastSchedule cuando corresponda e Idempotency-Key. Autorizar sigue usando
`authorize-contact` con expectedVersion/consentAccepted y clave propia.
Lecturas existentes de propuestas y listas con processContract=alternatives-v1.
El holograma es feedback local; no implica entrega push.

## Validación y pendientes

Suite: **1.205 pruebas / 104 archivos aprobados**. Build QA/PWA aprobado; aviso
previo por bundle mayor de 500 kB. No hay chequeo tsc independiente configurado.
Captura sintética revisada: `node_modules/.cache/alternative-negotiation-browser/proposal-accepted-360.png`.
**59 recorridos sintéticos de navegador aprobados**: alternativa y final, ambas
decisiones del cliente, falla y reintento con la misma clave, una sola variante
visible, deduplicación del recibo, duración 4,3/2,2 s, movimiento reducido,
sesión invalidada, fecha vencida y Cierre exitoso del negocio. Verificación en
320/360/393 px. Sin acceso al backend real, acciones sobre pedidos reales ni
cargas reales de fotos. La publicación exacta se registra al cerrar.

Pendiente física Android/iPhone: aceptar alternativa, aceptar propuesta final,
Solo aceptar y con contacto; icono/texto, cierre automático y movimiento reducido.
Negocio: confirmar que conserva Cierre exitoso. Probar un paso por vez.
Los reintentos fiables de notificaciones siguen pendientes del cierre general.

Código respaldado en GitHub, rama `qa`:
`abfaee9d2e395d965ea1681c733f33877c8eb0c6`.
Vercel QA READY `dpl_CVxY2nTWmkRT9hEgientLmmLeGhR`, SHA exacto y alias
`https://zipco-app-git-qa-zipco-s-projects.vercel.app` comprobados.
Este cierre documental también se respalda y publica en QA con código idéntico.
Railway QA no necesario. Backend, main y producción intactos.
