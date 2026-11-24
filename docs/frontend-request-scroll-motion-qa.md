# Animaciones durante desplazamiento de Solicitudes

Fecha: 2026-11-21. Clasificación: solo frontend QA.

El usuario autorizó corregir la pausa durante el desplazamiento en las tarjetas
del cliente y del negocio, independientemente de su categoría. No cambia el
tiempo de repetición original de cada animación ni convierte entradas en bucles.

## Cambio

`application/motion/useRequestListMotion.ts` separa desplazamiento de segundo
plano. Conserva el indicador de scroll y su finalización por scrollend o 160 ms
de inactividad para la ayuda de swipe y la inclinación táctil. Añade el indicador
`data-request-list-hidden` para la visibilidad del documento.

En los 23 CSS afectados se cambió únicamente la condición de pausa por scroll
por la de segundo plano. Se conservan keyframes, layout, número de repeticiones,
pausas fuera de pantalla, controles de diálogos y reduced motion. La ayuda de
swipe sigue pausándose durante el desplazamiento. En ProposalWaitingCard el
conteo animado usa segundo plano/visibilidad, sin detenerse al desplazar.

No cambian APIs, contratos, payloads, permisos, estados, operaciones ni
notificaciones. Railway no es necesario. Main y producción fuera de alcance.

## Verificación

- 50 pruebas en cinco archivos: useRequestListMotion, useCoordinationMotion,
  useReadyTransitions, AvailableDesign y processPresentation. Dos pruebas nuevas
  cubren scroll/momentum, segundo plano independiente, viewport y limpieza.
- Comparación automática de los 23 CSS: solo condiciones de pausa y comentario
  explicativo; no hay cambios de diseño ni de keyframes.
- Navegador Chrome con RequestsScreen, tarjetas y observadores reales, cuentas
  y API sintéticas: agenda con seis pedidos, animación avanzando durante scroll,
  pausa fuera de pantalla, reanudación y pausa en segundo plano; reduced motion.
  Cliente En espera y negocio con contrapropuesta también continúan durante
  eventos de scroll. No hubo POST en esos casos.
- Los primeros intentos del arnés fallaron por filtro aún no renderizado y por
  seleccionar una entrada finita de 500 ms. Se corrigieron los pasos del arnés y
  se repitieron solo los casos afectados. Una lectura concurrente del puerto de
  Chrome también requirió reintento. No fueron fallos del código de la app.
- Build QA aprobado; advertencia existente de tamaño de chunks. Sin comando
  typecheck ni TypeScript instalado en este proyecto; no se declara tsc aprobado.
- Evidencia local ignorada: node_modules/.cache/request-scroll-motion/ y
  node_modules/.cache/business-new-request/scroll-*.mjs.

No equivale a prueba de rendimiento físico. Falta verificar scroll y consumo en
Android y iPhone con la versión publicada; no se promete una tasa de cuadros.

## Tiempos y publicación

Suite focalizada: 3,98 s. Build Vite: 7,58 s; PWA terminó después (sin medición
independiente). Los intervalos de análisis, edición, preparación/reparación del
arnés y documentación no se midieron; no se les asignan tiempos estimados. El
build y las comprobaciones de navegador se ejecutaron parcialmente en paralelo;
no sumar sus tiempos como duración total. Hubo esperas y reintentos del arnés.

La publicación debe verificarse por el SHA exacto de la rama qa. La comprobación
física posterior queda pendiente y no se sustituye por las pruebas sintéticas.
