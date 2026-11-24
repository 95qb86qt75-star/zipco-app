# Ajustes visuales final4 del cliente — QA

Fecha: 2026-10-30. Rama qa, base d2378e2. **Clasificación: solo frontend.**

Se reemplazaron completos CustomerCoordinationCard.tsx y coordination-v2.css por los dos adjuntos nuevos de Downloads, normalizando BOM/finales de línea. Se conserva su contenido; no se reinterpretó el diseño.

## Cambios

- Fondo azul Aurora del adjunto.
- Píldora Detalle/Ocultar de 28 px, con pseudo-elemento que amplía el área táctil a 44 px; pregunta a 13 px.
- Mano SVG en lugar del emoji.
- Mayor especificidad para el anillo y la contra-rotación del badge, conservando el estado detenido en declined/ownPending y movimiento reducido.
- Paso WhatsApp con círculo claro.

No se modificaron availability-waiting.css, CustomerCoordinationDetail.tsx, estado/acciones, callbacks, permisos, recuperación, aviso inferior, contadores ni destello. Permanecen declinedBySelf, aria-busy, inert, ids por requestProcessId y Autorizada: Confirmada.

## Campos y endpoints

Sin cambios. Se sigue presentando la información que ya recibe CustomerCoordinationCard mediante sus props/model y el ProductPreviewControl existente. No se añade ni modifica un campo o endpoint de API.

## Verificación focalizada

- Build QA/PWA aprobado: 2313 módulos y precaché generado. Advertencia conocida de bundle principal mayor de 500 kB.
- Render de componentes/hooks reales con HTTP sintético en Chrome local, sin POST ni pedidos/notificaciones reales.
- Viewports de 393, 437 y 320 CSS px: tarjetas de 361, 405 y 288 px respectivamente. No hay desbordamiento horizontal.
- En todos: píldora medida de 28 px, zona táctil de 44 px, mano SVG y badge con animationName zipco-query-counter. Anillo de 62 px; 52 px en la variante estrecha.
- Se probó el clic en la zona invisible superior de la píldora y abrió el detalle.
- Se inyectaron después las reglas antiguas conflictivas del anillo/badge: las nuevas reglas conservaron el tamaño y la animación previstos.
- Paso actual: rgb(226,232,240). Movimiento reducido desactiva la animación.
- Revisión visual de tarjeta cerrada/abierta a 405 px y cerrada a 361 px.

Capturas locales, datos sintéticos:

- node_modules/.cache/final4-visual/cliente-405px-cerrada.png
- node_modules/.cache/final4-visual/cliente-405px-abierta.png
- node_modules/.cache/final4-visual/cliente-361px-cerrada.png
- node_modules/.cache/final4-visual/cliente-361px-abierta.png

Estas capturas fijan el ancho de comparación; no son una prueba física en Safari/iPhone ni una garantía de igualdad de cada píxel entre sistemas.

## Publicación y cierre

La entrega indica el SHA exacto del commit en qa y el estado Ready de Vercel, tras comprobar los archivos publicados.
Alias: https://zipco-app-git-qa-zipco-s-projects.vercel.app

Pendiente: comparar las capturas con Claude y comprobar el resultado físico en iPhone/Android.

No se modificaron Railway, flags, migraciones, main ni producción; C:/dev/zipco-app permanece intacto. Los diez documentos ajenos no rastreados se conservaron fuera del bloque. No se reanudó el diagnóstico del clic externo del iPhone.
