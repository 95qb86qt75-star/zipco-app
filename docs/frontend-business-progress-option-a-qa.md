# Negocio · Preparando el pedido · opción A

## Ajuste de movimiento — 2026-11-03

El usuario precisó sensación de trabado tanto al abrir/cerrar como al arrastrar.
Clasificación solo frontend. Única fuente productiva modificada:
business-progress-motion.css, exclusivamente .zipco-bp.

- El despliegue heredaba altura, opacidad, escala y desplazamiento simultáneos.
  Se conserva duración de 420 ms con otra curva y texto sin escala/traslación.
  Opacidad 220 ms, visibilidad coherente al cerrar y reducción de movimiento.
- El arrastre ya tenía transition:none en la posición del mando: no se atribuye
  el problema a una transición de 450 ms. Mientras .zipco-ec-tr.drag está activo
  se pausan los adornos, se suspende el backdrop blur de condiciones y se
  omiten sombras del mando/relleno. Vuelven al terminar. No se cambia el diseño
  en reposo ni el componente SlideToNotify, umbral, gestos o estados.

Medición con check-business-progress-motion y el runner existente, Chrome local,
CPU limitada x4. Antes del cambio, comparación secuencial con CSS candidato
inyectado, sin publicar. p95 de intervalo RAF en arrastre: 33,3 ms inicial,
16,8 ms candidato. Una ejecución integrada paralela a otro navegador volvió
a 33,3 ms; la ejecución final aislada midió 16,8 ms. Por tanto, no se afirma
mejora estable de FPS ni causa confirmada de la sensación en Android.

Última muestra aislada frente a la inicial:

| Medición local | Inicial | Integrada aislada |
| --- | ---: | ---: |
| Primer cambio de altura al abrir | 116,0 ms | 96,8 ms |
| Primer cambio de altura al cerrar | 136,4 ms | 69,2 ms |
| RAF p95 al abrir | 16,8 ms | 33,2 ms |
| RAF p95 al cerrar | 16,8 ms | 16,7 ms |
| RAF p95 arrastrando | 33,3 ms | 16,8 ms |

La muestra de apertura no demuestra mejora general de frames. Verificación
concreta: cero animaciones activas durante el arrastre, posición sin transición,
avance parcial ~65 % sin POST y transform:none en el pliegue. Son muestras de
desarrollo con CPU limitada, no un benchmark de Safari/Android ni de la app real.
Artefactos originales y finales en node_modules/.cache, sin pedidos reales.

Cinco escenarios existentes reutilizados por dependencia directa: layouts
320/390/430 (abrir/cerrar, foco, inert, ventanas), arrastre parcial/completo con
un solo envío confirmado y campana antes del holograma, y el flujo reducido.
Aprobados. No se repiten unitarias/contrato: solo CSS local; acción y controlador
intactos. Build QA/PWA aprobado, 10,56 s internos, advertencia preexistente de
chunks grandes. Mismos campos/endpoints; Railway no necesario, main/producción
intactos. Pendiente prueba física para valorar la sensación de movimiento.
Publicado solo Vercel QA `42dd79d1e8b0ced174cf79366f7cf813f874ebbd`, rama qa:
[Vercel success](https://vercel.com/zipco-s-projects/zipco-app/Bv9qqo7UKJiJYRBz8Ym72Y6Xdkch).

2026-11-03, America/Santiago. Clasificación: solo frontend, presentación e
interacción local. Cuatro archivos completos entregados por el usuario.

## Composición y alcance

- BusinessProgressCardView.tsx: BusinessInProgressCard para producto IN_PROGRESS,
  no recibido/servicio/embedded y availability.path WHATSAPP. Cabecera con estado,
  fila plegada verde, pregunta, deslizador real, seguimiento compacto,
  condiciones, permisos, aviso legal y ocultar. Guard más preciso que !==LOCAL_PICKUP
  de la entrega, para no atribuir WhatsApp a una modalidad desconocida.
- ProgressCardShell.tsx: variante business-progress y manito decorativa.
  Header por defecto y placeholder de carga/error conservados literalmente.
- business-progress.css y business-progress-motion.css: originales conservados
  y bloques .zipco-bp agregados. La composición anterior del visor se conserva
  literalmente para los demás estados y consumidores. No hay dos diseños
  activos para la misma variante.

READY, recibido, servicios, retiro local y embebidos mantienen su composición.
No se añade etiqueta RETIRO EN EL LOCAL. Textos reales del slider conservados:
Desliza para avisar / Aviso enviado. No se activan textos alternativos ni
rediseño de READY sin otra solicitud.

## Integración con componentes reales

SlideToNotify, useBusinessProgressCardController, notifiedRecently, condiciones,
acuerdo, ProductPreviewControl y AvailabilityPostActions permanecen intactos.
Se conservan arrastre al 85 %, cancelar, teclado, disabled, onComplete y
describedBy. El permiso usa su control real, estilizado como enlace; cantidad
proviene del badge real de ProductPreviewControl, sin inventar una prop.

Adaptaciones visuales: inert nativo por ref en el detalle; overflow:clip con
flow-root para evitar scroll interno de foco y colapso de margen. Padding de
la invitación cerrada en cero cuando está oculta: la regla nueva padding:10px
de la entrega sobrescribía el cierre compartido y dejaba espacio residual.

Efecto A: presentación de paquete que vuela y manilla con campana usando el
DOM real y :has. Se ajustan solo retrasos/duraciones CSS para completar antes
del holograma: ventana real de sent previa al holograma de 700 ms. El paquete
vuela en 300 ms y la campana termina a 600 ms; no se cambian los 1100/700/600 ms
de notifiedRecently ni se muestra éxito antes del recibo verificado. El texto
de estado no parte de opacidad cero. Con movimiento reducido la campana
queda fija; sin :has se conserva la presentación funcional del slider real.

## Validación proporcional

- Parseo/resolución TSX sin errores. 61 unitarias: processCardVisualFlow y
  notifiedRecently. Protegen composición y secuencia verificada del aviso.
- Nueve escenarios nuevos con runner/fixture existentes, sin cambiar herramientas:
  tres layouts 320/390/430, nombre largo, producto/condiciones/revocar reales,
  foco, inert, etiquetas y ancho; toque y arrastre parcial sin envío; arrastre
  completo con un POST retenido, bloqueo y sin éxito anticipado, liberación del
  recibo, campana visible antes del holograma y paso a READY con diseño anterior;
  envío incierto sin éxito/reintentos automáticos y aviso cerrado; permiso
  MARK_READY ausente; flujo reducido; READY inicial conservado; retiro conservado.
- Una regresión existente: receipt-finalization --case business, producto recibido
  pendiente de finalizar, sin nuevas acciones para el negocio. Aprobada.
- Tras quitar padding residual se repiten solo los tres layouts afectados,
  ahora verifican invitación oculta con altura cero. No se cuentan como casos
  distintos. Otras comprobaciones aprobadas no se repiten.
- Fixture progress-a optativa con proceso confirmado y MARK_READY sintético.
  Defaults y escenarios anteriores conservados. Permisos/contrato reales no cambian.
- Captura integrada a 390 inspeccionada y build QA/PWA aprobado, 10,31 s internos.
  Advertencia existente de chunks grandes. Repo sin tsc configurado: no se
  declara typecheck completo ni se cambian package.json/herramientas.

Chrome local no acredita Safari físico. Sin pedidos, mensajes, pushes ni
confirmaciones reales; HTTP restringido a fixture. Pendiente iPhone/Android.

## Contratos, publicación y tiempos

Mismos datos de pedido/acuerdo, estado, consentimiento y allowedActions.
Lecturas de pedidos/acuerdo y MARK_READY, revocación y recuperación existentes;
sin nuevos campos, headers, endpoints, almacenamiento ni transiciones. Railway
no necesario. Main y producción intactos. Rama qa, publicado solo Vercel QA:
`61e0dd90205452f28857892a9654960166e3c7d8`,
[Vercel success](https://vercel.com/zipco-s-projects/zipco-app/2Zh9TZcnzjhxHeL8k1fRp61w8Fhn)
verificado. Directorio ajeno sin seguimiento preservado; cierre
documental posterior sin push adicional.

Fases en business-progress-a-timing.json dentro de node_modules/.cache.
Lectura inicial anterior al timer sin estimación. Análisis, implementación,
preparación de escenarios, ejecución, ajuste de layout y su repetición,
build, documentación y publicación registrados aparte. Unitarias/navegador
corrieron parcialmente en paralelo, no se suman dos veces. No son mediciones
de rendimiento de la app.

| Fase medida | Tiempo de pared |
| --- | ---: |
| analysis | 89.1 s |
| implementation | 54.3 s |
| test-preparation | 74.3 s |
| test-execution | 138.1 s |
| implementation-layout-fix | 4.6 s |
| test-execution-layout | 68.8 s |
| build | 32.8 s |
| documentation | 69.2 s |
| publication | 136.9 s |

Build/PWA interno: 10,31 s. Intervalo exterior incluye espera y lectura de
salida. Ejecución incluye inspección de captura y la regresión reutilizada.
Corte anterior al commit documental final; excluye lectura inicial no medida.
Cierre documental local sin otro push ni despliegue.

## Tiempos del ajuste de movimiento

| Intervalo | Tiempo de pared |
| --- | ---: |
| diagnosis-and-measurement | 122.3 s |
| implementation | 5.3 s |
| test-execution | 208.7 s |
| build | 29.9 s |
| documentation | 51.8 s |
| publication | 125.6 s |

Primer intervalo agrupa diagnóstico y preparación de la comparación; lectura
inicial no medida. Ejecución incluye una repetición aislada con medición de
animaciones activas añadida después de observar variación. Build/PWA interno:
10,56 s; intervalo exterior incluye espera/lectura de salida. Corte anterior al
commit documental final. No se hizo otro push/despliegue por este cierre.
