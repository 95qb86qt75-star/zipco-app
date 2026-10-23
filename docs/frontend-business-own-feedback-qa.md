# UI-BUSINESS-OWN-FEEDBACK-01 — Acciones propias con hologramas

2026-10-22. Clasificación: **solo frontend QA**. El usuario confirmó 06d2422
en Android y todavía observó el toast «Pedido aceptado. Coordinación pendiente».
Solicitó hologramas para acciones propias del negocio y conservar errores y
avisos recibidos por acciones de otras personas.

## Evidencia y alcance

La cadena exacta observada ya no figura en src. Se comprobó que Vercel compiló
06d2422 y que raíz/proyecto/alias corresponden a QA. La inspección HTTP del bundle
estuvo limitada por la protección de Vercel (respuesta Login), sin desactivar
protección ni crear secretos. No se atribuye la causa a caché del teléfono ni se
declara reproducido el toast exacto con la versión del usuario.

Se refuerza la entrega: un único ActionHologramHost pasa de RequestsScreen a
App, montado junto al receptor de toasts y fuera de tarjetas/listas/pestañas.
La confirmación de aceptación usa el Q verde existente «Pedido aceptado».
La variante de propuestas/contrapropuestas no cambia.

Se completó además el aviso faltante de Rechazar solicitud inicial:
PendingRejectionActions activa feedback y coordinationFeedback solo devuelve
rejected para actor negocio y lectura autoritativa coincidente con CLOSED y
rechazo pendiente validado. Título «Solicitud rechazada», destino Historial.

Para pedidos legacy, aceptar/rechazar/anular/marcar listo dejan de emitir el
toast genérico de éxito y usan Q después de PATCH validado, con sesión vigente.
La alternativa legacy deja su toast y usa Q tras su transporte existente.
Se retira el overlay legacy que se activaba antes de confirmar accept/mark-ready.
Las categorías no se cambian ante un error de la operación legacy.

En los pedidos con contrato de procesos ya existentes se conservan hologramas
de alternativa/final, rechazo de propuesta, anulación, contacto y pedido listo.
No se añade un filtro global para todos los toasts: errores, nuevos pedidos,
acciones de la contraparte, permisos, archivo/restauración y recepción conservan
su comportamiento. No se modificó el módulo separado de cotizaciones.

## Archivos y contrato

- `src/app/App.tsx`, `screens/RequestsScreen.tsx`: host único global y retiro
  del overlay prematuro legacy del negocio.
- `screens/requests/useRequests.ts`: feedback de acciones propias legacy.
- `PendingRejectionActions.tsx`, `coordinationFeedback.ts`, `useCoordination.ts`:
  Q de rechazo inicial y texto correspondiente; pruebas de helper y hook.
- `scripts/check-business-own-feedback.mjs`: flujo real de hook, BusinessOrdersTab,
  OrderActionModal, ActionHologramHost y Toast con HTTP sintético.
- Este registro y el catálogo de diseño.

Sin nuevos campos, endpoints, estados, permisos ni datos persistidos. Conserva
POST accept-fixed-order (expectedVersion/proposalId), reject-pending-request
(expectedVersion/confirmationAccepted/reasonCode/reasonDetail opcional),
anulaciones/propuestas y claves de idempotencia existentes. GET de listas mantiene
processContract=alternatives-v1. Legacy usa PATCH `/orders/:id/status` y
`/orders/:id/alternative` ya existentes. No se declara entrega push por un Q.

## Validación

**1.212 pruebas / 104 archivos aprobados**, incluidos monitor de avisos entrantes,
errores, consentimiento y recuperación idempotente. Build QA/PWA aprobado; aviso
preexistente de bundle mayor de 500 kB. No hay tsc independiente configurado.

**Cuatro recorridos Chrome móvil con touch aprobados**, 360/393 px: abrir detalle,
Aceptar pedido, confirmar, un POST sintético, Q visible después de cambiar lista,
cero toasts de éxito; caso de red fallida conserva error y no muestra Q.
Se espera el final de la apertura animada antes de medir/tocar el botón.
Captura revisada: `node_modules/.cache/business-own-feedback/accepted-393.png`.
Sin acciones sobre pedidos reales, acceso al backend real o cargas de imágenes.

Pendiente físico Android/iPhone: comprobar versión publicada y aceptar un pedido;
después rechazo inicial, alternativa, anulación y recepción de aviso de otra
persona, un paso por vez. El fallo exacto observado en Android requiere confirmar
el resultado de esta entrega; no se da por verificado en el teléfono.
Reintentos fiables de notificaciones siguen pendientes del cierre general.

Rama qa; publicación y respaldo al cierre. Railway/backend no necesarios.
Main y producción sin cambios.
