# UI-BUSINESS-COUNTER-CONTACT-01 — Aceptar contrapropuesta y autorizar al propietario

2026-10-22. Clasificación: frontend + backend coordinados; cambios de esta entrega
solo frontend QA. Backend existente c1f3b57, aclaración contractual aa38e8b.
Base frontend 4a0bc9a. Sin cambios backend, Railway, main ni producción.

## Contrato confirmado antes de integrar

Bastián trasladó confirmación de backend y estado Railway exitoso. Se leyó la
sección «Confirmación para frontend: aceptar contrapropuesta y autorizar contacto»
de C:/dev/zipco-backend-qa/docs/testing/business-alternative-proposal-qa.md.
La aclaración resuelve DIAG-BUSINESS-COUNTER-CONTACT-01: propietario puede autorizar
User.phone propio para este pedido con AUTHORIZE_CONTACT; la lectura usa
coordination.businessContactAuthorized. El consentimiento del cliente sigue
independiente. No endpoint ni campo nuevo, ni dos acciones atómicas.

## Antes / Después y diseño

Antes, la tarjeta N del negocio confirmaba únicamente ACCEPT_COUNTER_PROPOSAL.
Ahora el botón principal dice «Aceptar y autorizar contacto». Descripción:
«Aceptarás esta contrapropuesta y autorizarás compartir el teléfono de tu perfil
con {cliente} para coordinar por WhatsApp los detalles de pago y retiro».
El nombre sale del pedido; no se hardcodea el usuario QA. Mantiene el diseño N,
el resumen exacto, vidrio, entrada180ms, borde estable y revisión cubierta pausada.

El secundario «Solo aceptar · autorizo después» conserva la aceptación sin
enviar consentimiento. Volver/X no actúan. El consentimiento propio puede
completarse en Coordinación con «Autorizar contacto», sin volver a aceptar.
El botón de autorización glass del cliente y su texto se conservan.

La ruta de aceptación directa de la solicitud original no se modifica. Las
acciones de coordinación consumen los permisos existentes del backend por actor;
se agrega al negocio la presentación correcta de autorización propia si la API
la ofrece. No se abre WhatsApp ni se inicia trabajo automáticamente.

## Secuencia y recuperación

1. Lectura actual de propuestas y validación de rol, versión y propuesta exacta.
2. POST /request-processes/:id/actions/accept-counter-proposal con
   { expectedVersion, proposalId, confirmationAccepted:true }, JWT y UUIDv4.
   acceptPastSchedule:true solo tras confirmación explícita de fecha vencida.
3. Recibo accepted / COORDINATION_PENDING, agreementPublicId y versión +2.
   Las listas/contadores se actualizan y se selecciona Coordinación.
4. GET /orders/business/:businessId?processContract=alternatives-v1, ligado al
   mismo proceso/acuerdo, versión al menos igual al recibo y sesión vigente.
5. Si businessContactAuthorized ya es true, omitir la segunda acción. Si no,
   exigir AUTHORIZE_CONTACT en allowedActions; la ausencia no prueba por sí
   sola teléfono inválido. POST /request-processes/:id/actions/authorize-contact
   con { expectedVersion de lectura nueva, consentAccepted:true } y otra UUIDv4.
6. Verificar por lectura actual el consentimiento del propietario. Un recibo
   histórico no reemplaza una lectura más nueva (p. ej., revisión de teléfono).

El host está en la raíz de Solicitudes: filtrar/desmontar la tarjeta aceptada
no pierde el segundo paso. Se reutiliza el almacén compartido de useCoordination,
con scope userId:business, sin nueva cola ni almacenamiento de contacto.

Con la opción combinada, «Cierre exitoso» aparece después de verificar ambos
pasos, también para el cliente. No se anuncia éxito conjunto solo por aceptar.
Si se eligió solo aceptar, se mantiene el holograma tras aceptar. Conserva
duración 5.7s/2.2s reducido y deduplicación.

- Red incierta: queda la intención original; reintentar solo autorización con
  idénticos endpoint/body/expectedVersion/clave. Sin nueva aceptación.
- STALE_VERSION/INCOMPATIBLE_STATE: leer/reevaluar. Tras revisión deliberada,
  presentar autorización manual con versión actual; no forzar ni reenviar
  automáticamente tras el conflicto. No modificar payload bajo la misma clave.
- INVALID_PROFILE_CONTACT: mensaje aprobado de corregir teléfono del perfil.
  Tras corregirlo, Revisar autorización vuelve a leer y permite confirmarla.
- Si POST de contacto se confirma pero GET falla: conservar recuperación con
  Actualizar estado (solo lectura). Sin segundo POST ni éxito conjunto prematuro.
- Si se pierde la respuesta de aceptación: verificar por lecturas la misma
  propuesta aceptada antes de contacto, sin repetir la aceptación.
- Cambio de sesión: abortar y no aplicar efectos tardíos ni autorizar otro actor.

CoordinationActions ofrece al negocio el consentimiento propio pendiente, con
texto del propietario. No muestra la autorización del cliente como si fuera la
propia ni concede consentimiento ajeno. No se añade aviso push; autorización del
propietario no equivale a notificación enviada ni a conversación iniciada.

## Archivos

- requests/AcceptAuthorizeCard.tsx: texto y ambas elecciones de negocio.
- requests/ProposalNegotiation.tsx: opción combinada y fecha vencida por actor.
- requests/AcceptedProposalHost.tsx: lectura/consentimiento por actor,
  revisión manual, recuperación y éxito verificado.
- requests/coordinationApi.ts: guard compatible y helper contactAuthorized.
- requests/useCoordination.ts: reintento/reconciliación por actor, lectura actual
  disponible al host y preferencia de ésta sobre el recibo histórico.
- requests/CoordinationActions.tsx: completar consentimiento propio del negocio.
- src/styles/index.css: extiende la entrada rápida al seguimiento/recuperación.
- coordinationApi.test.ts, useCoordination.test.ts, CoordinationActions.test.ts
  y scripts/check-alternative-negotiation.mjs: cobertura y regresiones.
- Esta ficha, diagnóstico previo y docs/frontend-ui-design-catalog.md.

Los paths requests/ anteriores están en src/app/screens/requests/.
No se modifica el payload de consentimiento, API, estados ni permisos del servidor.
La aceptación del cliente, rechazo y acciones de trabajo conservan sus contratos.

## Validación y publicación

1161 pruebas/99 archivos y build QA/PWA aprobados (advertencia preexistente de
bundle grande; no tsc independiente instalado). Pruebas nuevas de autorización
propietario, claves/cuerpos exactos, consentimiento independiente, reconciliación
del actor correcto, no renovación si vigente y lectura nueva sobre recibo viejo.
No se expone como consentimiento actual una lectura anterior al POST confirmado.
49 recorridos Chrome aprobados en móvil320/393px: cliente y negocio, ambas
elecciones, doble toque, exactitud de proposalId/version/body, UUID independientes,
sin consentimiento ajeno ni navegación a WhatsApp. Se verifican red incierta,
respuesta de aceptación perdida, consentimiento ya vigente, permiso ausente,
INVALID_PROFILE_CONTACT, conflicto con revisión manual, GET fallido tras POST
confirmado con recuperación de solo lectura, fecha vencida y cambio de sesión.
Copias con nombre dinámico y ausencia de éxito conjunto antes de verificar contacto.
Regresión visual aprobada: entrada180ms, 5 efectos pequeños activos y 0 bajo la
revisión cubierta (escena Chrome CPU4x, no Android/WebKit físico).
Publicación exacta: en cierre.

Pendiente prueba física combinada en Android negocio e iPhone cliente, un paso
a la vez. Pruebas locales sintéticas, sin acciones/uploads/pedidos reales.
Railway no requiere cambios: contrato ya confirmado y publicado por backend.
Reintentos fiables de notificaciones siguen pendientes para el cierre general.
