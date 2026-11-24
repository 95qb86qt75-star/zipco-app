# Adornos visibles en tarjetas plegadas de la agenda

2026-11-14, America/Santiago. Solo frontend/presentación. Base QA ecbf928.
Único archivo de aplicación modificado: screen/components/business-agenda.css.

## Causa y corrección acotada

El controlador existente usa useCoordinationMotion(folded || sheet !== null).
La pausa global de coordinación detenía también la cabecera/invitación visibles
al plegar. Reproducción: retiro y WhatsApp mostraron requestMotion=active,
coordinationMotion=idle y animationPlayState=paused para flecha/manito/reflejo.

Sin cambiar controlador ni sus consumidores, el CSS de la agenda reanuda solo
los adornos existentes de transform/opacity de la cabecera/fila plegada visibles:
manito/ondas, marca de WhatsApp, flecha y reflejo ::after. No cambia nombres,
duraciones o iteraciones: solo play-state, conservando la línea temporal.
No reanuda sombras/resplandores continuos ni animaciones del detalle oculto.

Requiere root requestMotion=active, invitación plegada y lista sin marca de scroll.
No se aplica con diálogos/alertas modales montados ni movimiento reducido.
La lista ya pausa al ocultarse el documento; fuera de vista se usa su observador.
No afecta otras pantallas, transiciones de apertura ni el slider.

## Validación

Arnés real de RequestsScreen/BusinessProgressCardView/miniatura y visor, HTTP
sintético y ninguna mutación real. Antes, ambos adornos estaban pausados aunque
visibles. Después, running y reflejo running; el tiempo de la animación avanza
más de dos segundos durante una espera de 2,4 s. Detalle plegado: cero animaciones
running. requestMotion idle pausa; marca de scroll pausa; al reanudar, misma
instancia Animation y tiempo que continúa. Visor de producto real pausa el fondo.
Reducir movimiento: cero animaciones activas. Cero POST y excepciones JavaScript.
Prueba focalizada 390 px: no se modifican tamaños ni reglas responsive.

Dos pruebas del hook useCoordinationMotion aprobadas (visibilidad, documento
oculto, movimiento reducido, cleanup y cobertura). No se repite batería general
de API/categorías: sus dependencias no cambiaron.
Build QA/PWA aprobado, 2418 módulos, diez precaches; Vite 6,71 s. Sin tsc configurado.
Pendiente comprobar el aspecto y consumo en teléfono; no se acredita FPS/CPU/GPU.

## Herramientas y fases

Inicio UTC 19:46:27; diagnóstico/preparación intercalados hasta 19:49:02.
El primer script reutilizado declaró evidencia dos veces: corregido solo en
.cache. Baseline luego aprobado. CSS y primer lanzamiento posterior constan
a 19:50:03; Chrome agotó la espera sin DevToolsActivePort. Repetición aprobada
a 19:51:11, sin modificar la app por el fallo del arnés. Unitarias: 302 ms,
dos casos (no contar el baseline y la repetición como pruebas distintas).
Build lanzado después de esa verificación, Vite 6,71 s incluido en su comando;
primer punto posterior 19:51:38. Documentación/publicación se registra al cierre.
No hubo cronómetro exclusivo para separar toda implementación/preparación;
no se completan esas duraciones con estimaciones. Son tiempos de desarrollo,
no rendimiento del teléfono.

Campos/endpoints ninguno nuevo o modificado. Railway innecesario; main y
producción intactos. Handoffs locales ajenos conservados fuera del commit.

Publicado en origin/qa: 00e6a8e4c7fec218d161d6975f4565773a7947cd.
Push confirmado 19:52:50 UTC; Vercel success verificado 19:53:30 UTC
(40 s desde push confirmado, incluye espera externa).
https://vercel.com/zipco-s-projects/zipco-app/BeiiE9mAAUNPPuimhp459BtjDqjU
Documentación/commit/push se cerró entre puntos 19:51:38 y 19:52:50 (72 s,
incluye comprobación final PWA); sin sumar como ejecución del build otra vez.
Cierre documental posterior local, sin otro push ni despliegue. No hubo
inspección independiente del bundle protegido ni prueba física del teléfono.
