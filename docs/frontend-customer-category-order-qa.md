# UI-CUSTOMER-CATEGORY-ORDER-01 — Orden de categorías del cliente

2026-10-22. Clasificación: solo frontend QA.

Antes: Pendientes → Coordinación → Por responder → En curso.
Después: Pendientes → Por responder → Coordinación → En curso.
Listos e Historial conservan su posición posterior. Coordinación conserva su
visibilidad condicional cuando hay pedidos en esa categoría.

Archivo funcional: `src/app/screens/RequestsScreen.tsx`. Solo se mueve la
posición de la pestaña; conserva claves, selección, filtros y contadores.
Las categorías de Mi Negocio y Cotizaciones conservan su orden.

Campos/endpoints nuevos: ninguno. No cambia estados, acciones, permisos ni
pedidos guardados. Railway QA no fue necesario. Main y producción intactos.

Validación: 56 pruebas aprobadas en cinco archivos (selección, navegación desde
notificaciones, agrupación, pantalla y pestañas). Se actualizó la expectativa
del orden anterior en `RequestsScreen2A.test.ts`. Build QA/PWA aprobado; aviso
de tamaño de bundle preexistente.

Código respaldado en GitHub, rama `qa`: `d776291b573adcd6e15686b8bceb1b13a194cae9`.
Vercel QA READY: `dpl_Cc7d3PZxFbxZYmwhsEYUWV1hdv25`, commit exacto verificado;
alias habitual `https://zipco-app-git-qa-zipco-s-projects.vercel.app` confirmado.
Build con modo QA, diagnóstico de lecturas activo y trazas push desactivadas.
Este registro de cierre también se respalda en Git y se publica en QA.

Prueba en celular pendiente: entrar a Mis Pedidos con pedidos Por responder y
Coordinación; comprobar ese orden y seleccionar ambas categorías para revisar
sus pedidos y contadores. Repetir en Android e iPhone.
