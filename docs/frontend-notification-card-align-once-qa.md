# UI-NOTIFICATION-CARD-POSITION-02 — Encuadre puntual de la tarjeta

Fecha: 2026-10-19. Clasificación: solo frontend, navegación local. Rama: `qa`.

## Alcance aprobado

Bastián pidió retomar ahora el encuadre de la tarjeta al abrir una notificación externa. El primer ensayo (`d14e48f`, publicado como `33f824d`) se retiró en `d01b5a5` después del bloqueo informado en iPhone. Esa secuencia no confirma la causa del bloqueo. En `c72ca18`, con el registro temporal del clic pausado, Bastián pudo entrar de nuevo al panel; la estabilidad completa todavía requiere comprobación física.

Esta segunda implementación alinea una sola vez la tarjeta debajo del encabezado, manteniendo sus detalles plegados y su marca azul. Sustituye el centrado anterior. No reinstala el seguimiento continuo retirado.

## Archivos y comportamiento

- `src/app/screens/RequestsScreen.tsx`: identifica el contenedor desplazable existente con `data-requests-scroll`, compartido por cliente, negocio, pedidos y cotizaciones.
- `src/app/notifications/notificationNavigation.ts`: mantiene la espera de sesión, listas y tarjeta enfocable. Una vez obtenido el foco, desconecta el observador existente antes de cambiar el layout; aplica la marca azul antes de medir y ajusta únicamente `scrollTop` del contenedor, dejando 12 px bajo el encabezado. Confirma el destino después de ese ajuste.
- `src/app/notifications/notificationLifecycle.test.ts`: pruebas de tarjetas que caben y que exceden la pantalla, primer elemento, posición antes del ACK y ausencia de movimientos posteriores al desplazamiento del usuario.
- `src/app/screens/RequestsScreen.notificationNavigation.test.ts`: mantiene las regresiones de aceptación y READY con sesión y listas tardías, para ambos roles.

No agrega ResizeObserver, seguimiento de viewport, bucles de requestAnimationFrame, listeners de interacción ni nuevas recargas. El observador de renderización previo sigue existiendo únicamente hasta encontrar y enfocar la tarjeta; no continúa observando para reposicionarla. La eliminación de la marca azul conserva su temporizador visual anterior.

Si la tarjeta cabe en el espacio disponible entre encabezado y navegación inferior, puede verse completa. Una tarjeta más alta no puede mostrarse completa sin reducir u ocultar contenido: en ese caso se muestra desde su inicio y se conserva el desplazamiento manual. Las cargas posteriores que cambien el layout no activan seguimiento automático en esta versión.

## Contrato y límites

Sin campos o endpoints nuevos; sin cambios a payloads, respuestas, estados, permisos, contratos push, service worker, supresión de avisos, listas, contadores o acciones. No se ejecutan START_WORK ni otras acciones de pedidos. Backend/Railway QA no necesita modificaciones. La arquitectura nueva de notificaciones continúa pausada.

## Validación y publicación

**911 pruebas aprobadas en 84 archivos** y build QA aprobado. Las pruebas de geometría son simulaciones; no sustituyen Safari/iPhone reales. Advertencia de tamaño de bundle de Vite sin errores de build.

Publicar el SHA exacto desde Git, rama `qa`, solo Preview, conservando Backend QA y el comando exclusivo por despliegue:

`ZIPCO_QA_LOAD_DIAGNOSTICS=1 ZIPCO_QA_NOTIFICATION_TRACE=0 npm run build -- --mode qa`

El registro temporal del clic sigue pausado. Se mantiene la etiqueta QA con SHA visible y el diagnóstico de fallos de loadOrders. No modificar configuración global, `main`, producción ni documentos pendientes anteriores. Registrar después el commit y despliegue efectivos conservando el historial.

## Comprobación en celulares

1. Abrir QA habitual y comprobar la etiqueta del nuevo SHA junto a Solicitudes; la navegación normal y el desplazamiento deben responder.
2. En una prueba funcional coordinada por Bastián, dejar la PWA en segundo plano en otra sección y abrir una notificación externa de aceptación o Pedido listo.
3. Comprobar que abre Solicitudes en la categoría correspondiente y la tarjeta aparece desde su inicio bajo el encabezado, marcada en azul y sin expandir condiciones automáticamente. Si cabe, comprobar también su borde inferior sobre la navegación.
4. Desplazarse manualmente: la pantalla no debe regresar ni seguir reajustándose. Comprobar Android e iPhone y ambos roles cuando corresponda.
5. No declarar resueltos globalmente los puntos 1 y 4 de notificaciones solo por este ajuste visual. Si reaparece bloqueo, registrar SHA visible y circunstancias; no borrar app, sesiones ni datos como parte de esta prueba.

## Resultado publicado — 2026-10-19

Nombre oficial: **UI-NOTIFICATION-CARD-POSITION-02 — Encuadre puntual**. Código y SHA desplegado: `846e7d3e172c88393c655ceb91658a0745241f7c`, rama `qa`. Commit con los cuatro archivos de código/pruebas y este documento; documentos pendientes anteriores excluidos y conservados. `git diff --cached --check` aprobado, sin divergencia antes del envío.

Preview `dpl_Gr6exD5kDR8n6tpDdMEZc28PhXF3`, **READY**, URL propia https://zipco-nbnjfvhqh-zipco-s-projects.vercel.app. Alias QA habitual https://zipco-app-git-qa-zipco-s-projects.vercel.app verificado apuntando a ese despliegue. Origen Git, SHA, rama `qa`, entorno Preview, Backend QA y comando temporal comprobados. Logs de build QA y despliegue completados, sin auxiliar del recorrido del clic; build global nulo y rama de producción `main` sin cambios.

Etiqueta esperada: `QA 846e7d3`. Comprobación física en iPhone/Android pendiente; no se declara resuelto el bloqueo ni estabilidad global de notificaciones. Este añadido de resultado queda local, como registro posterior al despliegue, sin generar otra publicación automática solo por documentación.
