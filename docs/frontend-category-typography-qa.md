# UI-CATEGORY-TYPE-01 — Tamaño de categorías y contadores

Fecha: 2026-10-18. Clasificación: solo frontend QA.

- Nombre: tipografía compartida de categorías de Solicitudes, cliente y negocio.
- Commit de código: `9581d3fe520f10ce6249c837d2169a7c6115b416`.
- Rama: `qa`.
- Archivo de código: `src/styles/index.css`, reglas `.zipco-status-tab` y
  `.zipco-status-tab-count`. Se aplican mediante `RequestStatusTab.tsx` en ambas vistas.
- Texto de categorías: **13 px**, reemplazando el tamaño adaptable de 8–11 px.
- Número del contador: **14 px**, reemplazando `0.95em`. Los 14 px mencionados
  inicialmente correspondían al alto mínimo del contador, no al tamaño de letra.
- Se mantienen colores, filtros, datos, área táctil mínima y ajuste por filas.
  Las seis categorías conservan tres columnas y dos filas; con menos categorías
  el ajuste de filas depende del espacio disponible y del texto mayor.
- Validación previa a publicación: 26 pruebas existentes aprobadas en tres
  archivos, build QA aprobado y `git diff --cached --check` aprobado.
- No se requieren campos o endpoints nuevos ni cambios en Railway QA.
- Publicación autorizada por Bastián para revisar en los celulares; todavía
  no equivale a conformidad visual en Android/iPhone ni aprobación final de UI.
- Mantener el diagnóstico temporal anterior solo en el Preview QA mediante
  override de despliegue, sin modificar configuración global ni producción.
- Documentos locales pendientes de otros bloques: conservar íntegros y fuera
  de estos commits. El registro previo de este ajuste en el historial visual
  permanece local y no se incluye junto a cambios anteriores de ese documento.

## Comprobación móvil

Abrir el acceso habitual QA, actualizar y revisar Solicitudes en «Mis Pedidos»
y «Mi Negocio». Los nombres de las categorías deben verse en 13 px y sus
números en 14 px. Comprobar las filas con y sin Listos, textos largos, modo
oscuro y que todas las categorías sean accesibles sin recorte horizontal.

`main`, producción, backend y datos de pedidos: sin modificaciones.
El resultado del despliegue se añadirá después de comprobarlo.
