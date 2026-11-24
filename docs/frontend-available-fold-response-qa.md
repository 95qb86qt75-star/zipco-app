# Respuesta al abrir/cerrar Disponible

## Revisión posterior: punto intermedio de 420 ms

El usuario consideró 280 ms demasiado rápido y pidió suavidad sin volver al efecto
pegado. Se ajustan únicamente las mismas reglas CSS: **420 ms**, curva
`cubic-bezier(.25,.8,.25,1)`, opacidad de 220 ms sin espera inicial y ocultamiento
al terminar el cierre. Sustituye la preferencia de 280 ms descrita como antecedente
abajo; no altera acciones, reservas, APIs ni salida posterior al holograma.

Tres escenarios reutilizados aprobados a 393 px: WhatsApp, reserva gratuita y
reserva con pago previo. Cada uno registra 0,42 s al abrir/cerrar/reabrir. Se conserva
inert/ARIA y se verifica diálogo de reserva y movimiento reducido. No se repite
la suite funcional ni los tamaños aprobados: solo cambió la duración/curva del
pliegue, sin layout nuevo. Build QA/PWA aprobado una vez.
Publicado QA **3a35e3d692d2fb6bf3b4ace7581c9118e5ce4df2**, rama qa,
[Vercel success](https://vercel.com/zipco-s-projects/zipco-app/BLVKtizQ3rXyuYhqcpKxh29m4rHu).
Pendiente preferencia táctil del usuario en iPhone.
Medición local: `node_modules/.cache/available-fold-smooth-timing.json`. Análisis
inicial no cronometrado por separado; preparar el test fue actualizar su duración
esperada durante la implementación. No se presenta como prueba FPS/CPU/Safari.

Tiempos transcurridos de esta revisión: implementación/preparación 5 s; pruebas
34 s; build/revisión de salida 48 s (comando QA/PWA 10,27 s); documentación inicial
10 s; intervalo de publicación/verificación 3 min 49 s. Este último incluye
espacios entre llamadas y no mide solo ejecución de Vercel. Total desde primer
registro hasta cierre de la medición: 5 min 25 s; cierre documental posterior
local, sin push ni repetición de pruebas/build.

## Antecedente: primera corrección de 280 ms

Fecha: 2026-11-01, America/Santiago. Clasificación: solo frontend, animación CSS.
El usuario aprobó el aspecto CliU19, pero reportó lentitud al desplegar/plegar,
especialmente con reserva. El turno interrumpido anterior solo leyó archivos.

## Cambio acotado

Único archivo productivo: `src/app/features/requests/shared/availability-design/availability-design.css`,
reglas `.zipco-avwa-fold`, compartidas por Disponible WhatsApp y retiro.

- Duración de expansión/contracción: 650 → **280 ms**.
- Se elimina la demora de 150 ms antes de iniciar la opacidad al abrir.
- Opacidad: 350 → 160 ms. Curva de expansión con respuesta inicial rápida.
- El ocultamiento de visibilidad acompaña el nuevo tiempo de cierre.
- Se mantienen inert, aria-hidden, campos montados, modo de movimiento reducido,
  diseño y efectos, recuperación, botones y diálogo real de reserva.

No se cambia JavaScript productivo, APIs, campos, payloads, estados, permisos,
persistencia ni lógica de reservas. No cambia la salida posterior al holograma.
Railway no fue necesario; main y producción sin modificaciones.

## Validación por riesgo

Se reutilizó el arnés y los datos aprobados. Cinco escenarios únicos aprobados:
WhatsApp 393 px; reserva gratuita 393/320 px; reserva con pago previo 393/430 px.
Cada uno abre, cierra y vuelve a abrir por toque físico simulado. Los eventos
transitionend del detalle registraron **0,28 s** en las tres transiciones de cada
caso. Sin demora CSS al abrir, sin desborde, foco/ARIA/inert coherentes y cero POST.
Se comprobó apertura del diálogo real de reserva y movimiento reducido sin transición.

El primer intento mantuvo la emulación de movimiento reducido al navegar al caso
siguiente. Se corrigió el aislamiento del test y se repitieron solo los tres casos
pendientes. No fue un fallo de la app. No se repite la suite funcional ya aprobada:
este bloque cambia únicamente dos declaraciones CSS y su comentario.

Build QA/PWA aprobado una vez; advertencia existente de tamaño de chunks.
Evidencia local ignorada: `node_modules/.cache/qa-pilot/available-fold/`, con
resultados históricos y duraciones medidas. El script reproducible es
`scripts/check-available-fold.mjs`.

La medida acredita la duración de la transición en Chrome local; no es un perfil
FPS/CPU/GPU ni una prueba física Safari. No se atribuye el tironeo observado a un
motor gráfico o animación concreta sin ese perfilado. Pendiente sensación táctil
del iPhone del usuario después de actualizar QA.

## Publicación y tiempos

Publicado **c0754aa3292308b13c8a05740cd7444cd81feb94**, rama qa,
[Vercel success](https://vercel.com/zipco-s-projects/zipco-app/2VssW9jxm9oeG2jrS5X8whYDKa3e).
Solo Vercel QA. Sin pedidos
ni notificaciones reales. No se reabre el diagnóstico de clic externo.
Fases medidas en `node_modules/.cache/available-fold-timing.json`: análisis,
implementación, preparación, pruebas, build, documentación y publicación.

| Fase | Tiempo transcurrido |
| --- | --- |
| Análisis desde primer registro | 27 s |
| Ajuste CSS | 3 s |
| Preparación del escenario | 50 s |
| Pruebas y corrección de aislamiento | 1 min 35 s |
| Build/revisión de salida | 57 s; comando QA/PWA 11,14 s |
| Documentación inicial | 10 s |
| Commit, push y verificación de publicación | 1 min 29 s |

Total desde primer registro hasta Vercel success: **5 min 31 s**. Los intervalos
incluyen coordinación y esperas; no suman dos veces subfases. El cierre documental
posterior queda local y no ejecuta otra suite, build ni despliegue.
