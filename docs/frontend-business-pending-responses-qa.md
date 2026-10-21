# UI-BUSINESS-PENDING-RESPONSES-01 — Respuestas plegadas y cierre visible

2026-10-21. Clasificación: **solo frontend**. Rama `qa`.
Base limpia y sincronizada: `b5369eff5defdb33437cb9939f481753e77e113c`.

## Antes / Después

Antes: en Mi Negocio → Pedidos, la tarjeta nueva plegada mostraba Proponer
alternativa y Rechazar solicitud. Al desplegar, Ocultar detalle quedaba entre
Aceptar pedido y esas otras dos acciones.

Después: en AWAITING_BUSINESS_RESPONSE del negocio, Proponer alternativa y
Rechazar solicitud están ocultos mientras la tarjeta está plegada. Revisar y
responder despliega el detalle y los controles en este orden:

1. Aceptar pedido, cuando esté permitido.
2. Proponer alternativa, cuando esté permitido.
3. Rechazar solicitud, cuando esté permitido.
4. Ocultar detalle, al final, con flecha ascendente, borde y brillo estático.

Se conserva el mismo toggle, incluido teclado/clic de la tarjeta. Ocultar
detalle vuelve al resumen plegado. El brillo no introduce una animación continua.
No se habilita ninguna acción que el contrato no permita.

## Archivos y decisiones

- `src/app/screens/requests/ProcessOrderCard.tsx`: agrupa las respuestas en un
  contenedor con hidden para la solicitud inicial del negocio; coloca el cierre
  después de las respuestas y mantiene la aceptación dentro del detalle.
- `src/styles/index.css`: presentación del cierre, foco visible y contraste de
  avisos de recuperación/error dentro del grupo sobre el fondo Aurora.
- `src/app/screens/requests/processCardVisualFlow.test.ts`: regresión de
  plegado/desplegado, orden, permanencia de componentes y ausencia de acciones.
- `scripts/check-order-card-aurora.mjs`: añade seis recorridos de plegado con
  formularios reales sobre datos sintéticos y robustez del lector de Chrome.
- Esta ficha y catálogo; conformidad anterior del botón rojo registrada aparte.

Se usa hidden en lugar de desmontar ProposalNegotiation/PendingRejectionActions.
Así se conservan referencias, borradores, motivo elegido, bloqueos y recuperación
de operaciones ante un plegado del padre. No se cambian sus handlers ni permisos.
Los diálogos mantienen sus portales y comportamiento actual.

No se ocultan las respuestas de negociación posteriores del cliente o negocio,
ni la autorización de contacto o acciones de coordinación. Se preservan los
diseños verdes/rojos aprobados, Aurora, acordeón del cliente, historial y pedidos
legacy. No se cambia el posicionamiento o la navegación de notificaciones.

## Contrato y validación

Sin campos, endpoints, payloads, estados o permisos nuevos/modificados.
Se conservan state/allowedActions, alternativas-v1, lecturas de propuestas y
las acciones existentes accept-fixed-order, propose-alternative y
reject-pending-request bajo `/request-processes/:id/actions/*`. Plegar/desplegar
no ejecuta esos POST. No requiere backend ni Railway QA.

- **1138 pruebas / 97 archivos aprobados**.
- **Build QA y generación PWA aprobados**; aviso habitual de bundle grande.
- Chrome local con React real/CSS compilado: **234 comprobaciones**, incluidas
  228 regresiones de tarjetas y seis recorridos nuevos (320/393/400 px,
  claro/oscuro): botones ocultos al inicio, orden de los cuatro controles,
  cierre con brillo, motivo y borrador conservados al plegar, cero POST.
- Regresiones de cliente/negocio, estados, historial, enfoque por notificación,
  movimiento reducido y gesto de historial conservadas.
- Solo datos y respuestas sintéticas; sin acciones o lecturas contra Backend QA,
  ni fotos reales. Capturas en node_modules/.cache/order-card-aurora-browser.
- Diff revisado: código de envío, formularios, API y configuración sin cambios.

Prueba física pendiente: negocio → Pedidos → Pendientes; comprobar tarjeta
plegada, pulsar Revisar y responder, revisar detalle y orden, pulsar Ocultar
detalle y abrir de nuevo. No confirmar pedidos/propuestas/rechazos únicamente
para revisar el diseño. No se acredita todavía conformidad móvil de este bloque.

Sin cambios en backend, Railway QA, worker, main o producción. Arquitectura nueva
de notificaciones pausada y reintentos fiables mantienen sus pendientes previos.

## Publicación

Commit/push a origin/qa y Vercel Preview QA con Backend QA y override vigente:
`ZIPCO_QA_LOAD_DIAGNOSTICS=1 ZIPCO_QA_NOTIFICATION_TRACE=0 npm run build -- --mode qa`.
Registrar READY en cierre documental posterior, también respaldado y publicado.
