# Corrección del bucle en reserva con pago pendiente

2026-11-08. Solo frontend: medición/presentación del detalle, sin cambios de negocio.

## Reproducción y causa

El usuario identifica la tarjeta ámbar Esperando al negocio (pago pendiente), no
la tarjeta verde sin reserva. Al cambiar el fixture a PREPAYMENT pendiente en
RequestsScreen real se reproduce: primera tarjeta alterna 574/697 px en 80
muestras de 50 ms; otras cuatro permanecen en 204 px. La prueba de estabilidad
falla antes de corregir. La medición interna alterna --pk-cut entre -17 y 45 px,
con --pk-full=168 px. El max-height negativo no recorta, el bloque crece, se mide
de nuevo y se repite el ciclo. No es un fallo exclusivo de Safari: reproducido
en Chromium con la variante correcta. Los fixtures de la mitigación anterior
usaban NONE y no cubrían este caso; aquella mitigación no resolvía la causa.

## Cambios

- CustomerReceiptDetails.tsx, ReservationFold: mide offsetTop/offsetHeight relativos
  a su caja, sin restar coordenadas de viewport. Limita el corte a [0,full].
  ResizeObserver observa solo el panel natural, no el cuerpo recortado cuyo
  max-height modifica el propio efecto. Conserva errores, inert, estado, nota y
  pestañas montadas; un error sigue abriendo la reserva.
- customer-pickup.css: position:relative en la caja medida para fijar el offset
  parent. Retirada la mitigación general 5347e7a de ocho reglas/comentarios:
  restaura el pliegue suave original y la entrada de panel de otras tarjetas.

Ningún endpoint, campo API, payload, estado, permiso ni acción cambia. No se toca
ReservationPanel ni controladores de envío. No requiere Railway.

## Pruebas

- 19 unitarias de composición, permisos y recuperación aprobadas.
- Mismo caso fallido tras corregir: cinco alturas, scroll y aria-expanded estables
  en 80 muestras tras abrir y 80 tras cerrar.
- Abrir/cerrar el detalle interno de reserva conserva su estado y tamaño.
- Error sintético añadido al panel real mientras la pestaña está oculta: vuelve a
  Cómo retirar, abre la reserva y el error queda visible. No se elimina recuperación.
- Chromium, componentes reales y HTTP simulado. Sin pedidos, pushes ni mutaciones
  reales. Evidencia local ignorada: .cache/pickup-jitter/paid-controls.mjs y results.json.
- Build QA/PWA aprobado: 2408 módulos, Vite 12,75 s, diez entradas precache.
  Sin tsc configurado; pendiente comprobación física en el mismo iPhone/pedido.
- Una repetición del arnés corrigió solamente un texto esperado mal codificado
  (C?mo); la app ya mostraba la pestaña correcta. No se repitió batería general.

## Tiempos y publicación

Análisis/reproducción y preparación inicial: 129 s. Implementación y primera
repetición focalizada: 69 s. Pruebas y reparación de codificación: 81 s.
Build Vite 12,75 s en paralelo, no se suma dos veces. Documentación y publicación
se completan al cierre. No se cambiaron herramientas versionadas.

Rama qa; publicación pendiente al redactar. Main y producción intactos. Esta
corrección sustituye la mitigación anterior; falta validación física para cerrar
el reporte del usuario aunque el bucle reproducido ya no ocurre localmente.
