# Cliente · retiro con reserva de pago previo pendiente · B Línea

2026-11-02, America/Santiago. Clasificación: solo frontend, presentación y
navegación local. Cuatro archivos entregados por Claude, más el puente visual
mínimo en CustomerReceiptFlowCardView para delimitar la variante real.

## Alcance y composición

El diseño se selecciona exclusivamente para retiro local IN_PROGRESS con reserva
PREPAYMENT, effectiveStatus AWAITING_BUSINESS_CONFIRMATION y oferta ADVISORY_ONLY.
«Esperando al negocio» proviene de esa selección estructurada, no de buscar
palabras dentro del texto del panel. No cambia estados, permisos ni reglas.

- CustomerPickupCard.tsx: cabecera B, pastilla, mano y carril StatusRail real.
  Otros estados conservan la composición previa. DetailReveal mantiene clave
  estable para conservar los controladores del detalle.
- CustomerReceiptDetails.tsx: CustomerPickupDetails selecciona la composición
  Línea o la estándar según el indicador visual. Línea usa pestañas con iconos,
  instrucciones, reserva plegable real, condiciones y opciones. Default WhatsApp
  queda igual. Los paneles permanecen montados; teclado/ARIA y detección de errores
  ocultos se conservan. Ocultar detalle devuelve foco al control de cabecera.
- PickupInstructions.tsx: nueva variante local customer-line; customer y default
  conservan su markup. Se clona el nodo de instrucciones real para seleccionar
  esa presentación, preservando mensaje y texto libre de horario/dirección.
- customer-pickup.css: estilos recibidos acotados íntegramente a
  .zipco-pickup-c[data-pickup-design=line]. Se preservan las reglas originales para
  otros estados. Corrección de abreviaturas font inválidas de la entrega para
  aplicar sus tamaños/pesos reales. Respeta pausas y movimiento reducido.
- CustomerReceiptFlowCardView.tsx: lee estado/modo/oferta existentes y pasa
  lineDesign a cabecera y detalle. Sin cambios del controlador ni API.

ReservationFold conserva el ReservationPanel real, montado y sin copiar datos.
Mide su estado/importe para plegar el contenido posterior. Conserva cualquier
inert original al aplicar/restaurar su propio bloqueo. El aviso nuevo de error
abre el panel y la pestaña correspondiente; no oculta Reintentar.

Reservas sin pago previo, sin reserva, confirmadas, con plazo, pedidos listos y
recibidos conservan el diseño estándar. No hay dos versiones activas para una
misma variante. Esta separación evita extender silenciosamente el rediseño a
todos los consumidores, como sucedía en la entrega aislada.

## Componentes y contratos protegidos

ReservationPanel, ReservationOfferSummary, AvailabilityPostActions y su vista,
StatusRail, ReadyPanel, ventanas reales, controladores y APIs no se modifican.
Se conserva el importe repetido por el panel/oferta: no se autorizó eliminar esa
línea y no se oculta por CSS. La miniatura sigue como icono; no se agrega una
fotografía ni se cambia el snapshot del producto en este bloque.

Datos existentes: estado del pedido, modo/estado efectivo de reserva, oferta
advisory, importe requerido, importe acordado, instrucciones y nota. Las fechas
siguen siendo del servidor. Sin nuevos campos, headers, endpoints o persistencia.
Se conservan lecturas de pedidos/reserva/acuerdo y acciones existentes de
contacto, cancelación y recepción. Las pruebas de este bloque no envían POST reales.
Railway no necesario. Main y producción intactos.

## Validación proporcional

- **72 unitarias** aprobadas: processCardVisualFlow, AvailabilityPostActionsView
  y CustomerReceiptDialog. Sin cambios en esas pruebas.
- **10 escenarios existentes** check-pickup-tabs: layouts 320/393/430, free,
  paid con plazo, advisory gratuito, permisos, formularios/diálogos, error real
  del ReservationPanel con transporte sintético y movimiento reducido.
- **3 escenarios existentes** check-pickup-rendering: preparando sin reserva,
  listo y recibido. Conservan diseño y ventana de condiciones.
- **5 nuevos escenarios** check-pickup-line-design: reserva advisory pagada a
  320/390/430 con pliegue, condiciones, pestañas y motivo de cancelación conservado;
  error nuevo en pestaña oculta/nombre largo; movimiento reducido.
  El error nuevo del escenario Línea se inserta en el DOM sintético del panel:
  acredita presentación/recuperación visible, no un fallo real del servidor.
- Caso 390 repetido de forma acotada tras ajustar foco y especificidad CSS;
  no se cuenta como escenario nuevo. Sin repetir la suite completa.
- Capturas revisadas con componentes reales. Parse/imports y build QA/PWA
  aprobados. Advertencia previa de chunk grande. No se ejecuta tsc independiente:
  el repo no dispone de esa comprobación configurada.

El primer intento detectó una cadena TSX inválida producida al integrar el
bloque estándar; se corrigió antes del build y se repitieron los casos que no
habían podido iniciar. El caso nuevo detectó el tono neutral inicial y se cambió
por el tono de la variante estructurada. No se relajan las aserciones para
aprobar. Se añade solo paid-advisory a la fixture existente; runner sin cambios.

Chrome local con transporte restringido a localhost. No hubo cambios en pedidos,
reservas ni notificaciones reales. Pendiente iPhone/Android con el usuario.

## Medición y publicación

Evidencia local ignorada: pickup-line-timing.json, pickup-line-unit.json y
qa-pilot/pickup-line-design bajo node_modules/.cache. Se separan análisis,
implementación, preparación, pruebas, build, documentación y publicación.
Pruebas/build se solapan y sus comandos no se suman dos veces. Los ajustes
intercalados se identifican como tales, no como ejecución exclusiva.
Versión y Vercel se completan al verificar la publicación QA.
