# UI-CATEGORY-TYPE-03 — Categorías de 10,5 px y contadores de 11 px

Clasificación: solo frontend QA. Rama: `qa`.

Bastián indicó que los tamaños 11,5/12,5 px seguían siendo grandes y solicitó
texto de **10,5 px** y número de **11 px**, tanto para cliente como para negocio.
Esta es la propuesta actual; TYPE-01 y TYPE-02 conservan las referencias previas.

- Nombre: tipografía compacta compartida de categorías de Solicitudes.
- Commit de código: `77e5a8dc7a7905e5008d01c3c0e68f53524a96e3`.
- Archivo: `src/styles/index.css`, reglas `.zipco-status-tab` y
  `.zipco-status-tab-count`; componente compartido `RequestStatusTab.tsx`.
- Dos cambios de tamaño de letra; se conservan colores, filtros, contadores,
  área táctil y ajuste de categorías por filas.
- Pruebas: 26 aprobadas en tres archivos existentes de categorías y Solicitudes.
- Build QA aprobado; advertencia habitual de tamaño de bundle superior a 500 kB.
- Revisión `git diff --cached --check` aprobada.
- Sin campos/endpoints nuevos, backend, acciones de pedidos, Railway QA,
  `main` ni producción. Publicar solo Preview QA desde Git con SHA exacto.
- Mantener el diagnóstico temporal previo mediante override exclusivo del
  despliegue, sin modificar ajustes globales ni protección Vercel.
- Documentos pendientes anteriores conservados íntegros fuera de estos commits.
- Revisión de Bastián en celulares pendiente; no representa aprobación final de UI.

Comprobar tras actualizar el acceso QA habitual: nombres de categorías en
10,5 px y números en 11 px, en cliente y negocio, con/sin Listos y en ambos temas.
Se añadirá el resultado del despliegue cuando esté verificado.

## Publicación comprobada

- SHA fuente: `6933d0fc73835b2824bde9635a59f01565b5d18b`, que incluye
  código `77e5a8dc7a7905e5008d01c3c0e68f53524a96e3` e informe.
- Preview `dpl_3gwUjhBPxu5oWsEfeCQsxBR9Rk2G`: **READY**.
- URL propia: <https://zipco-ifpd2gw9r-zipco-s-projects.vercel.app>.
- Alias QA comprobado apuntando al despliegue:
  <https://zipco-app-git-qa-zipco-s-projects.vercel.app>.
- Origen GitHub, rama qa, SHA exacto y entorno Preview verificados.
- Logs: modo QA, build y despliegue completados.
- Diagnóstico temporal conservado con override exclusivo del despliegue:
  `ZIPCO_QA_LOAD_DIAGNOSTICS=1 npm run build -- --mode qa`.
- Configuración pública de Backend QA verificada sin modificarla; build global,
  protección y rama de producción intactos. Railway QA no requirió cambios.
- Los catorce documentos pendientes previos conservaron exactamente sus hashes
  y quedaron fuera de estos dos commits. Staging vacío y HEAD igual a origin/qa.
- Revisión visual en celulares pendiente. Actualizar el acceso QA habitual.
- Esta anotación posterior al despliegue queda local hasta un futuro commit documental.
- `main`, producción, backend y datos de pedidos: sin modificaciones.
