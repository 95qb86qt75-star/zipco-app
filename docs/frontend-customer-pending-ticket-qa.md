# Segunda pantalla: tarjeta del cliente «En espera»

Fecha: 2026-10-24. Clasificación: **solo frontend QA**.
Base: `9eaba0b`, primera implementación confirmada por el usuario antes de
autorizar avanzar con esta segunda pantalla.

## Comportamiento

En Mis Pedidos, un proceso del cliente en `AWAITING_BUSINESS_RESPONSE` usa el
ticket oscuro aprobado: reloj de arena, «ENTRADA DE SOLICITUD», negocio, precio
solicitado, «EN ESPERA» y el mensaje de espera existente.

Empieza plegado con «Ver detalle» y «Anular solicitud» dentro del pie. El detalle
conserva artículos, cantidades, subtotales, fecha/hora solicitada, nota, total y
el visor existente de referencia. Los detalles y la imagen se montan al expandir.
Datos ausentes no se sustituyen por productos o precios inventados.

La apertura desde notificaciones conserva el identificador de la tarjeta y su
evento. El detalle admite teclado, `aria-expanded`, `aria-controls`, nombre de
estado accesible y aviso de solicitud sin leer. Se respeta movimiento reducido.

La preferencia inicial S1 aparece solo si existe en el resumen normalizado:
positiva, negativa o necesitada de reconfirmación. Su texto se mantiene
condicionado a la compra; no se presenta como permiso efectivo. Pedidos
antiguos sin preferencia no muestran esa línea. No se abre WhatsApp.

La anulación conserva `PendingCancellationActions`, sus guards, confirmación
«¿Confirmas anulación de tu pedido?», texto de Historial, botones «No» / «Sí»,
reintentos, reconciliación, versiones e idempotencia. Solo se agrega una variante
de presentación compacta. La respuesta del servidor sigue decidiendo el cierre.

La rama negocio, tarjetas posteriores, pedidos históricos sin RequestProcess,
filtros, pestañas y lógica de coordinación conservan su implementación.

## Archivos

- `src/app/screens/requests/CustomerPendingCard.tsx`: presentación del cliente.
- `src/app/screens/requests/ProcessOrderCard.tsx`: selecciona esa presentación
  exclusivamente para el cliente pendiente; conserva hooks y notificaciones.
- `src/app/screens/requests/PendingCancellationActions.tsx`: variante visual ticket.
- `src/app/screens/requests/availability-design/availability-design.css`: estilos
  específicos para la tarjeta real y objetivos táctiles de 44 px.
- `CustomerPendingCard.test.ts`, `PendingCancellationActions.test.ts` y
  `processCardVisualFlow.test.ts`: presentación, permisos, datos y regresiones.
- `scripts/check-customer-pending-card.mjs`: navegador con ProcessOrderCard real
  y HTTP interceptado, sin sesión ni modificaciones de pedidos QA.

## API y backend

Se presentan campos existentes de `GET /orders/my-orders`: negocio, productos,
total, nota, referencia, horario y `requestProcess`, incluida su preferencia S1.
No se agrega ni modifica ningún campo, estado, endpoint o payload.

Anulación existente:
`POST /request-processes/:id/actions/cancel-pending-request`, con
`expectedVersion`, `confirmationAccepted` y `Idempotency-Key` existentes.
La reconciliación conserva `GET /orders/my-orders?processContract=alternatives-v1`.

**Railway QA no requiere cambios ni migraciones para esta pantalla.**
Disponibilidad, continuación y retiro permanecen fuera del alcance.

## Validación

- **1.316 pruebas / 111 archivos**, todas aprobadas.
- Build QA/PWA aprobado. Advertencia habitual de tamaño de bundle.
- Chrome local: **320, 390 y 430 px**, tarjeta plegada/desplegada, datos,
  apertura desde notificaciones, anular → No sin POST, anular → Sí con una sola
  acción y recibo/relectura interceptados. También nombre largo, preferencia
  negativa, preferencia ausente, acción no permitida y movimiento reducido.
- Cero mutaciones reales en las comprobaciones de navegador.
- Capturas fuera de Git: `node_modules/.cache/customer-pending-card/`.

## Publicación

### Ajuste del 25 de octubre tras revisión del usuario

El usuario confirmó el diseño y pidió retirar la frase explicativa bajo la
preferencia y mejorar la percepción de la animación en iPhone. Se elimina
«Esta elección todavía no comparte tu teléfono» y su estilo ya sin uso.
El título de la tarjeta real ahora combina resplandor con un pulso de opacidad
de 1 a 0,62 cada 2,8 segundos. Mantiene el texto legible y sin cambios de layout.
`prefers-reduced-motion: reduce` conserva el título fijo por accesibilidad.
No se acredita un fallo específico de Safari ni una prueba física iPhone local.

Validación del ajuste: 69 pruebas relacionadas aprobadas; navegador móvil en
320, 390 y 430 px; comprobación del cambio efectivo de opacidad entre fases y
de su desactivación con movimiento reducido; build QA/PWA aprobado. El usuario
debe confirmar en el teléfono tras la publicación.

Se publica exclusivamente mediante commit y push de `qa` a su integración
GitHub existente. Se conserva la identidad original, sin cambiar Git global ni
reescribir historial. La confirmación READY debe corresponder al nuevo SHA y
al alias habitual `https://zipco-app-git-qa-zipco-s-projects.vercel.app`.

Al preparar el commit, la publicación todavía debe comprobarse. La revisión
física del usuario queda pendiente. Dos documentos locales anteriores sin
seguimiento no forman parte de esta entrega. `main` y producción no se modifican.
