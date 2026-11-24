# Cliente: cerrar una solicitud conserva la categoría

2026-10-29. Clasificación: **solo frontend QA**, navegación y presentación de confirmaciones existentes.

## Resultado

Al anular/cerrar/rechazar una solicitud desde Mis Pedidos, la solicitud conserva su estado terminal e ingresa a Historial según los datos ya confirmados por backend, pero la pantalla permanece en la categoría elegida por el cliente. Se mantienen los hologramas existentes que explican dónde quedó. La anulación de pendientes confirma «Solicitud anulada / La solicitud quedó en Historial». Los pedidos anteriores sin requestProcess muestran un aviso superior con el mismo destino tras completar la operación y recargar sus datos.

Se elimina el salto local a Historial para recibos de anulación/rechazo pendientes del cliente, cierres de disponibilidad/fuera de hora y acciones de anulación/rechazo de pedidos y cotizaciones anteriores. Se conservan la selección manual de Historial, las rutas explícitas desde notificaciones y la navegación positiva al continuar/aceptar. El comportamiento de Mi Negocio y la confirmación de recepción no se alteran.

No cambia el estado ni la transición de ninguna solicitud; tampoco se eliminan datos del servidor. Las operaciones, permisos, allowedActions, recibos, claves y recuperación de envíos inciertos conservan su contrato. El nuevo holograma de pendientes utiliza el recibo normalizado y coincidente con el pedido; no se anuncia éxito por un clic o una respuesta sin validar.

## Archivos y API

- `src/app/screens/RequestsScreen.tsx`: conservar categoría cliente en cierres, informar Historial y mantener selección manual.
- `src/app/screens/requests/useRequests.ts`: aviso de Historial para anulación/rechazo de pedidos anteriores, solo tras la confirmación y lectura existentes.
- `src/app/screens/RequestsScreen.notificationNavigation.test.ts`: regresión de categoría elegida, holograma, Historial manual con lectura fallida y rutas positivas existentes.

No se añaden ni modifican campos/endpoints. Se siguen usando los recibos ya existentes orderId/orderStatus/requestProcess y las operaciones de pedidos/cotizaciones del repositorio. No se modifica su transporte ni se realizan operaciones comerciales reales para probar.

## Validación y publicación

- **1.625 pruebas aprobadas en 126 archivos**, `vitest run --maxWorkers=2`.
- Casos nuevos: anulación desde pending/waiting/active, cierre por disponibilidad/fuera de hora conservando esas categorías, aviso de Historial, acceso manual posterior y anulación de pedido anterior. Se mantiene la regresión de negocios y notificaciones con destino explícito.
- Build QA/PWA comprobado antes de publicar. Advertencia habitual de bundle mayor de 500 kB; no se afirma lint/tsc independiente ni prueba física en iPhone.
- Entrega mediante commit de esta ficha en rama `qa` y push exclusivamente a `origin qa` para despliegue automático GitHub → Vercel QA. El informe final identifica SHA, estado Ready y verificación de artefactos.
- Railway QA no es necesario ni se modifica; sin cambios de flags, pedidos o suscripciones reales. `main` conserva `8295ab8c6024ab20851ebd371308d2f299b4668f`, producción intacta y documentos locales ajenos excluidos.

Pendiente: comprobar la interacción física en el iPhone actualizado, al realizar la siguiente acción de cierre que el usuario necesite. El incidente separado del clic de notificación del sistema conserva su estado y evidencia previos; este ajuste no lo da por resuelto.
