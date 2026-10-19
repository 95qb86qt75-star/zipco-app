# UI-NOTIFICATION-CARD-POSITION-01 — Encuadre de tarjeta al abrir notificación

Fecha: 2026-10-19. Clasificación: **solo frontend**. Rama `qa`.
Código: `d14e48f1a0f0cfcd8b3eb989ec2ee9cbf871efe5` (`d14e48f`).

## Solicitud y contexto

Bastián confirmó que una nueva prueba del clic externo llegó correctamente al pedido en iPhone. Observó que el borde azul identificaba la tarjeta, pero su parte inferior quedaba fuera de la vista y tenía que desplazar manualmente la lista. Solicitó presentar la tarjeta completa, conservando su detalle plegado, al abrir una notificación.

La confirmación corresponde a esa prueba física. Este bloque modifica únicamente el encuadre visual; no declara por sí solo estabilidad global ni retira los diagnósticos anteriores. La arquitectura nueva de notificaciones permanece pausada.

## Causa frontend revisada

El foco usaba `scrollIntoView({ behavior: 'smooth', block: 'center' })` una sola vez. La marca azul se añadía después del desplazamiento y su CSS agrega espacio superior. Además, las condiciones aceptadas y las acciones de coordinación se cargan después de las listas: la tarjeta puede crecer cuando ya se confirmó el foco. Centrar el tamaño inicial no garantiza que el contenido posterior quede visible.

Solicitudes tiene su propia lista desplazable, encabezado fuera de ella y barra inferior superpuesta. El ajuste utiliza exclusivamente ese contenedor, sin desplazar la página completa ni cambiar header, navegación, tipografías o dimensiones de la tarjeta.

## Comportamiento nuevo

- La marca azul se aplica antes de medir y posicionar la tarjeta, manteniendo su estilo y animación existentes.
- Se alinea el inicio de la tarjeta con el principio del área útil de la lista, dejando 12 px de separación. El desplazamiento se aplica directamente para evitar competir con un scroll suave aún en curso al reanudar WebKit.
- Se observan cambios de tamaño y de distribución mientras llegan condiciones, fotos, acciones y animaciones de entrada. También se contempla el desplazamiento del viewport visual. Los ajustes se agrupan por frame.
- Ese seguimiento sobrevive al consumo de la URL y a las recargas normales de listas; se elimina al salir de Solicitudes o reemplazar el destino.
- Al detectar toque, puntero, rueda o teclado, el seguimiento se detiene y la persona conserva el control. También se detiene al ocultarse la página.
- Se conserva el estado del detalle: no se simulan clics ni se abren o cierran condiciones. Las confirmaciones de navegación siguen requiriendo sesión, listas disponibles y foco real.
- Funciona para las tarjetas que ya usan el recorrido común de Solicitudes, en cliente y negocio, incluyendo pedidos y cotizaciones. La navegación interna sigue usando el mismo destino y cambia únicamente el posicionamiento visual.

**Límite físico:** una tarjeta que cabe entre el encabezado y la barra inferior puede verse completa al alinearla. Si supera esa altura, se muestra su inicio y sigue permitiendo desplazarse por el resto. No se reducen textos, ocultan acciones ni rediseñan tarjetas para forzar que todas quepan.

## Archivos y contrato

- `src/app/notifications/notificationCardPosition.ts`: posicionamiento y seguimiento del contenedor local, con cancelación por interacción y limpieza.
- `src/app/notifications/notificationCardPosition.test.ts`: seis casos de geometría, crecimiento, control del usuario y salida de pantalla.
- `src/app/notifications/notificationNavigation.ts`: marca antes de medir y delegación del posicionamiento, conservando el control del destino y ACK.
- `src/app/screens/RequestsScreen.tsx`: identificación de la lista desplazable y vida del seguimiento independiente de las recargas.
- Este documento: decisión visual, código asociado, pruebas y límites.

Sin campos ni endpoints nuevos. No se cambian peticiones, permisos, estados, acciones, lógica de push ni service worker. No se ejecutan acciones de pedidos o START_WORK. Backend/Railway QA no requieren cambios.

## Validación

**913 pruebas aprobadas en 85 archivos** y build QA aprobado. Los casos nuevos verifican una tarjeta que cabe debajo del header y sobre la navegación, crecimiento tardío de condiciones, cambios de layout anteriores a la tarjeta, detención por toque/rueda/teclado y una tarjeta demasiado alta. Se comprueba que no se activa un clic ni se desplaza otro contenedor. Las pruebas existentes conservan la espera de sesión/listas, aceptación, READY, repeticiones idempotentes, ACK, navegación y contadores.

Build local en carpeta generada de `node_modules/.cache`, sin alterar `dist`. Advertencia existente por tamaño de bundle. Prueba visual del nuevo encuadre en iPhone y Android pendiente de Bastián.

## Publicación QA y comprobación móvil

Publicar desde Git real y SHA exacto de `qa`, proyecto `zipco-app`, equipo `zipco-s-projects`, Preview. Conservar el override por despliegue existente:

```text
ZIPCO_QA_LOAD_DIAGNOSTICS=1 ZIPCO_QA_NOTIFICATION_TRACE=1 npm run build -- --mode qa
```

Alias habitual: `https://zipco-app-git-qa-zipco-s-projects.vercel.app`. Sin cambios globales, `main` ni producción. Todos los documentos locales pendientes anteriores permanecen fuera de este commit.

En el mismo acceso QA instalado, actualizar normalmente, dejar la app en segundo plano y abrir una notificación nueva del flujo normal. Comprobar tarjeta alineada bajo el header, borde azul y detalle conservado, incluyendo carga posterior de las condiciones. Si cabe en el espacio útil, comprobar que se ve hasta su final por encima de la navegación. Después, desplazar manualmente: la app debe dejar de corregir la posición. No forzar START_WORK para probar esta UI.
