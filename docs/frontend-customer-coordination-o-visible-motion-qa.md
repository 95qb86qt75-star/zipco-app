# UI-CUSTOMER-COORDINATION-O-01 — Cliente y animación visible de coordinación

2026-10-22. Clasificación: solo frontend QA, usando el contrato existente.

Antes: el diseño O se aplicaba únicamente a Mi Negocio → Por coordinar. Mis
Pedidos del cliente conservaba la tarjeta anterior. Los brillos O terminaban
tras tres ciclos y Q de contacto autorizado tapaba el progreso bajo el overlay.

Después: ambos participantes comparten el diseño O en COORDINATION_PENDING y
COORDINATING: cabecera Medianoche/Aurora, condiciones en hoja flotante, pasos,
plegado y anulación con motivos reales. En curso/Listos e historial conservan
sus vistas; no cambia el agrupamiento ni las categorías.

## Actor y consentimiento

`BusinessCoordinationCard.tsx` conserva su nombre por compatibilidad con el
bloque anterior, pero recibe `business` explícito y acepta BusinessRequest/MyOrder.
ProcessOrderCard selecciona la presentación y pasa el actor. useCoordination,
coordinationAllowed y contactAuthorized siguen determinando acciones válidas.

Cliente: usa customerContactAuthorized y lecturas de Mis Pedidos. Conserva el
texto/clase del botón «Autorizo iniciar coordinación», la acción local «Ahora
no», volver a revisar consentimiento y Anular solicitud. El permiso de comenzar
trabajo no se muestra al cliente aunque llegue en una lista allowedActions.
Negocio: usa businessContactAuthorized y sus lecturas propias. Nunca se toma
la autorización de la otra parte como autorización del actor actual.

Tras AUTHORIZE_CONTACT se exige lectura actual del mismo pedido, proceso y
acuerdo con consentimiento propio confirmado. La fase decorativa no representa
un POST sin confirmar ni abre WhatsApp automáticamente. Errores, respuesta
incierta, versiones, claves idempotentes, recuperación y anulación se conservan.

## Movimiento y rendimiento

useCoordinationMotion administra data-coordination-motion en el artículo con
IntersectionObserver, document.hidden y prefers-reduced-motion. Solo brillos de
botón, icono, círculo y chevron continúan mientras la tarjeta esté visible y no
esté cubierta por una hoja. No termina arbitrariamente tras tres ciclos.

Los efectos continuos usan transform/opacity. Fondos de la tarjeta y sombras
grandes quedan estáticos; no se restaura el float pesado ni el cambio continuo
de altura. Se pausan al salir de pantalla, ocultar la app o abrir condiciones/
anulación. Se respetan preferencias de movimiento reducido, incluso al cambiarlas.

La carga con chispas empieza después de confirmar el consentimiento: 3,9s
normal/0,5s reducido. Al quedar listo, el botón puede pulsarse y conserva el
crecimiento decorativo breve; no se agrega bloqueo de red. El aviso Q de contacto
se muestra después de esa decoración (2,9s normal/0s reducido), para no taparla.
Si el usuario abre WhatsApp o anula, se cancela ese aviso pendiente. Se comprueba
sesión, proceso, acuerdo y consentimiento actual antes del aviso; desmontar limpia
ambos timers. La aceptación combinada y DealSuccess conservan su comportamiento.

## Archivos y API

- `src/app/screens/requests/BusinessCoordinationCard.tsx`: presentación compartida,
  consentimiento por actor, Ahora no y secuencia de feedback.
- `ProcessOrderCard.tsx`: uso del diseño O en ambos actores.
- `useCoordination.ts`: opción local de feedback por pasos para no superponer Q
  sobre la transición; conserva HTTP, permisos y navegación existentes.
- `useCoordinationMotion.ts`: visibilidad, hojas, preferencias y limpieza.
- `src/styles/index.css`: efectos ligeros visibles, pausa y botón cliente original.
- Pruebas BusinessCoordinationCard, processCardVisualFlow, useCoordinationMotion;
  `scripts/check-order-card-aurora.mjs`, este registro y catálogo UI.

Sin nuevos campos/endpoints. Se utilizan los campos existentes de consentimiento,
allowedActions, version/expectedVersion, agreementPublicId y snapshot del acuerdo;
lecturas `/orders/my-orders?processContract=alternatives-v1` o de negocio por actor
y GET del acuerdo. POST existentes authorize-contact/open-whatsapp/
annul-coordination conservan consentAccepted, motivos e Idempotency-Key.
Ni el progreso ni Ahora no escriben datos adicionales o generan push.

## Validación y publicación

**1.180 pruebas / 102 archivos aprobados**, incluyendo cliente sin permiso,
independencia entre consentimientos, lectura posterior, Ahora no sin POST,
WhatsApp bloqueado, pausas visibles/segundo plano/reducido/hoja, temporización
del aviso posterior y cancelación al navegar. Build QA/PWA aprobado; aviso de
bundle preexistente. Navegador: **234 casos visuales aprobados**, ambos actores,
claro/oscuro, 320/393/400px y 12 estados; hojas a 320/360/393/400px. Comprueba
brillos continuos de transform/opacity visibles, pausa fuera de pantalla/en
segundo plano/cubiertos por hoja, cliente con Ahora no sin POST, detalle con
altura estable CPU4x y los ocho Q con sus tiempos, deduplicación y limpieza de
sesión. Captura del cliente revisada:
`node_modules/.cache/order-card-aurora-browser/customer-coordination-o.png`
(evidencia local ignorada). Cero acciones reales. Publicación pendiente.

Prueba física pendiente, un paso a la vez en iPhone/Android: Mis Pedidos →
Coordinación, comprobar tarjeta y hoja, Ahora no, autorización, chispas y apertura
deliberada de WhatsApp; comparar animación del negocio. No se declara rendimiento
medido ni aprobación física. Sin acciones sobre pedidos reales en la validación.

Railway/backend no requeridos ni modificados. Main y producción intactos.
Reintentos fiables de notificaciones siguen pendientes del cierre general.
