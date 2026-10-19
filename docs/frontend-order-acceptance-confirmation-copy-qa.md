# Punto 3 — UI-BUSINESS-ACCEPT-COPY-03

Fecha: 2026-10-19, America/Santiago. Clasificación: solo frontend QA.

**Nombre:** Confirmación de aceptación — autorización previa del cliente.

- Commit de código: `8f301fc70a4d6281b9cccaba724462c59ff7ebd9`.
- Rama: `qa`.
- Pantalla: Mi Negocio → Pedidos → solicitud nueva → Aceptar pedido.
- Ubicación: mensaje del modal de confirmación, antes de confirmar la aceptación.

## Texto acordado

Antes:

> Al aceptar, el pedido pasará a Coordinación pendiente con estas condiciones.

Después, usando la redacción final enviada por Bastián:

> Al aceptar, el pedido pasará a «Por coordinar». El cliente deberá autorizar compartir su contacto contigo antes de que puedan coordinar los detalles, el pago y la entrega.

## Alcance y archivos

- `src/app/screens/requests/OrderActionModal.tsx`: únicamente el texto de
  `processAcceptance`; se conserva la condición que seleccionaba ese mensaje.
- `src/app/screens/requests/processPresentation.test.ts`: se actualiza la
  expectativa del texto en una prueba existente de presentación de aceptación.
- Botones, confirmación, acciones, transiciones, permisos y funcionamiento conservados.
- Sin campos, endpoints, datos o código backend nuevos. Railway QA no requiere cambios.
- Sin acciones reales de pedidos, incluida aceptación o START_WORK.
- No se modifica la arquitectura pausada de notificaciones ni el diagnóstico temporal.

## Validación

75 pruebas aprobadas en los tres archivos existentes de presentación,
flujo visual de tarjetas y recuperación de aceptación. Build QA aprobado;
advertencia habitual por tamaño de bundle superior a 500 kB. Revisión de diff aprobada.

El código se guarda con su nombre e identificador para recuperarlo al preparar
el pase a producción. No se incluyen los documentos locales pendientes de otros
bloques en el commit de este cambio.

## Comprobación móvil prevista

Después de publicar, actualizar el acceso QA habitual, ir a Mi Negocio → Pedidos,
abrir una solicitud nueva y pulsar Aceptar pedido. Revisar que el modal muestre
la redacción acordada. Puede cerrarse con Volver sin aceptar realmente el pedido.
La comprobación visual de Bastián queda pendiente; no implica aprobación final de UI.

Publicar únicamente Preview QA desde Git real y SHA exacto, manteniendo el
diagnóstico temporal previo por override del despliegue. `main`, producción,
backend y configuración global permanecen sin modificaciones.
