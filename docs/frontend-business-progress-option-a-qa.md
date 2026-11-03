# Negocio · Preparando el pedido · opción A

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
no necesario. Main y producción intactos. Rama qa, publicación solo Vercel QA,
pendiente verificar. Directorio ajeno sin seguimiento preservado; cierre
documental posterior sin push adicional.

Fases en business-progress-a-timing.json dentro de node_modules/.cache.
Lectura inicial anterior al timer sin estimación. Análisis, implementación,
preparación de escenarios, ejecución, ajuste de layout y su repetición,
build, documentación y publicación registrados aparte. Unitarias/navegador
corrieron parcialmente en paralelo, no se suman dos veces. No son mediciones
de rendimiento de la app.
