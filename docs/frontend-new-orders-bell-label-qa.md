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

## Publicación comprobada — 2026-10-18

- SHA fuente: `ece3d08de738b94ff24fc88dbb62ee9197e0e3cf` (código
  `09c049a4878ef4a428f22b9fcac8d017cf426482` más informe).
- Preview `dpl_HGRit8JL4XjzXtXD5EWQYc7y5jiq`: **READY**.
- URL propia: <https://zipco-5dz0heuri-zipco-s-projects.vercel.app>.
- Alias habitual verificado apuntando a ese despliegue:
  <https://zipco-app-git-qa-zipco-s-projects.vercel.app>.
- Origen GitHub, rama qa, SHA exacto y entorno Preview comprobados.
- Logs confirman modo QA, build y despliegue completados.
- Diagnóstico temporal anterior conservado mediante override exclusivo:
  `ZIPCO_QA_LOAD_DIAGNOSTICS=1 npm run build -- --mode qa`.
- Backend QA confirmado por configuración pública sin modificarla. Build global,
  protección y rama de producción intactos. Sin cambios de backend o Railway QA.
- Diecisiete documentos pendientes anteriores preservados por hash, fuera de
  estos commits. Staging vacío y HEAD igual a origin/qa tras el push.
- Revisión móvil de Bastián pendiente; actualizar el acceso QA habitual.
- Este registro posterior al despliegue queda local hasta un futuro commit
  documental; no se realizó otro push que reemplazara el Preview comprobado.
- `main`, producción y acciones de pedidos sin cambios. Arquitectura nueva pausada.
