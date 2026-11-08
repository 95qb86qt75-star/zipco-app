# Movimiento continuo después de abrir retiro — mitigación QA

2026-11-08. Clasificación inicial: requiere diagnóstico. Implementación acotada:
solo frontend, CSS de pliegue local. Usuario precisa que empieza después de abrir
la tarjeta, moviendo visualmente toda la lista.

## Evidencia y decisión

No se reprodujo el bucle en Chromium con la tarjeta aislada, ni al integrarla en
RequestsScreen real con cinco pedidos sintéticos. Scroll y alturas estabilizados
después del despliegue. Por tanto no hay evidencia para atribuir la causa al CSS,
a Safari, a las animaciones decorativas o al servidor. El diagnóstico físico sigue
abierto; las pruebas anteriores de una tarjeta no cubrían esta situación de lista.

Se publica una mitigación verificable, no una afirmación de causa resuelta:
customer-pickup.css sustituye únicamente la interpolación grid 0fr/1fr por cambio
de altura inmediato y fundido de opacidad en la composición pickup-design=line.
Desactiva la entrada transformada del panel y excluye la tarjeta del anclaje
automático mediante overflow-anchor:none donde el navegador lo soporta.

DetailReveal sigue montado, con su inert/aria-hidden; ninguna pestaña, formulario,
botón, permiso, llamada API, estado ni recuperación se modifica. No se toca el
pliegue compartido de WhatsApp u otras modalidades ni se desactiva toda la app.
Este ajuste prioriza estabilidad sobre animar la altura. Requiere validar iPhone.

## Verificación

- 19 unitarias de selección de variante y piezas/recuperación/permisos aprobadas.
- Siete grupos Chromium existentes repetidos por tocar el pliegue: tres anchos,
  pestañas, condiciones y cancelar reales, mini navegación, exclusión de otras
  variantes, movimiento reducido y contenido visible. Cero mutaciones.
- Dos grupos nuevos en RequestsScreen real con cinco tarjetas: 80 muestras a
  intervalos de 50 ms tras abrir y otras 80 tras cerrar. Scroll, altura de todas
  las tarjetas y aria-expanded no cambian durante cada periodo de observación.
- HTTP simulado y red externa bloqueada; no se crearon pedidos ni pushes.
- Build QA/PWA aprobado, Vite 9,79 s, 2408 módulos y diez entradas precache.
- No se dispone de Safari/iPhone físico ni tsc configurado en este repo.

Evidencia local ignorada: node_modules/.cache/pickup-jitter/results.json y
screen-run.mjs; escenarios reutilizados en .cache/arrival-pickup-design/.

## Tiempos y cierre

Análisis y preparación inicial/reproducción: 281 s (no separados retrospectivamente).
Implementación y primera ejecución: 44 s. Verificación/reparación del arnés: 52 s.
Build 9,79 s Vite en paralelo a las pruebas, no se suma dos veces.
Documentación/publicación se completan al cierre. La reparación del arnés eliminó
una declaración duplicada; no cambió herramientas versionadas.

Rama qa. Publicación pendiente al redactar. Railway no necesario. Main y producción
intactos. No se declara el fallo resuelto: pedir comprobación física del mismo
abrir/cerrar después de actualizar QA, sin crear solicitudes ni repetir acciones.
