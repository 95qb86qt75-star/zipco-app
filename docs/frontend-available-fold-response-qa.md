# Respuesta al abrir/cerrar Disponible

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

Solo Vercel QA y rama qa; versión/estado se completan en el cierre. Sin pedidos
ni notificaciones reales. No se reabre el diagnóstico de clic externo.
Fases medidas en `node_modules/.cache/available-fold-timing.json`: análisis,
implementación, preparación, pruebas, build, documentación y publicación.
