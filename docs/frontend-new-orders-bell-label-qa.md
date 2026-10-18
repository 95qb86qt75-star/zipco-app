# UI-BUSINESS-NEW-ORDERS-01 — Tarjeta con campana «Nuevos Pedidos»

Clasificación: solo frontend QA. Rama: `qa`.

- Commit de código: `09c049a4878ef4a428f22b9fcac8d017cf426482`.
- Archivo: `src/app/screens/RequestsScreen.tsx`.
- La tarjeta con campana de pedidos pendientes de negocio cambia su título
  a «1 Nuevo Pedido» o «2 Nuevos Pedidos», utilizando el contador real.
- Subtítulo conservado: «Toca para revisar y responder.»
- Colores, tamaño, campana, contador, selección y filtro conservados.
- Las pestañas de categorías y las cotizaciones no cambian de nombre.
- Sin cambios de campos, endpoints, backend o datos de pedidos.
- Validación: 18 pruebas existentes aprobadas en dos archivos y build QA aprobado.
  Se conserva la advertencia habitual del build por bundle superior a 500 kB.
- Commit preparado únicamente con el archivo del cambio; los documentos
  pendientes anteriores permanecen intactos fuera del commit.
- Publicación solo en Preview QA desde Git real y SHA exacto. Mantener el
  diagnóstico temporal anterior mediante override del despliegue, sin ajustes globales.
- Railway QA no requiere cambios; `main` y producción intactos.
- La arquitectura nueva de notificaciones continúa pausada.

Para revisar, actualizar el acceso QA habitual y abrir Mi Negocio/Pedidos:
la tarjeta debe mostrar «Nuevos Pedidos» con el contador correspondiente y
conservar su selección de pendientes. Con cero elementos continúa oculta.
La confirmación visual en celulares queda pendiente.
