# Cliente · WhatsApp · esperando respuesta del negocio

2026-11-03, America/Santiago. Clasificación: solo frontend, presentación e
interacción local. Rama qa. Entrega de cinco fuentes completas de Claude.

## Alcance

CustomerWhatsappProgressCard selecciona la nueva composición .zipco-wa-w cuando
no existe readyModel y preparing es false. Representa el primer Sí del cliente,
con pedido En curso y respuesta del negocio pendiente. No representa retiro ni
una nueva confirmación. CustomerReceiptFlowCardView pasa waitingDesign solo a
WhatsApp cuando coordinationPending y sin modelo de pedido listo.

Cabecera con modalidad, pastilla ámbar, mano SVG, miniatura real, negocio,
producto, total ACORDADO y StatusRail real. Abrir muestra estado, condiciones,
contacto opcional, permiso real y aviso de pagos. Ocultar devuelve el foco al
control superior. Nombre, franja y carril alternan el detalle; la miniatura y los
controles conservan sus acciones propias. No hay diseños duplicados para esta
variante. Preparando, listo, recibido, finalización y retiro mantienen su diseño.

Fuentes modificadas, todas en cards/customer/progress:

- CustomerWhatsappProgressCard.tsx.
- CustomerReceiptDetails.tsx.
- CustomerReceiptFlowCardView.tsx.
- customer-receipt-card.css.
- customer-receipt-details.css.

Integración adicional a la entrega: carril en posición estable entre estados;
controles de AvailabilityPostActions bajo el mismo árbol React y contenedores
estables. Fuera de waitingDesign, estos contenedores neutros usan display:contents
sin reordenar el DOM. Evita desmontar controladores al actualizar el estado.
El cuerpo aplica la propiedad nativa inert durante busy, en lugar del atributo
vacío. Se oculta solo el badge interno repetido de cantidad de la miniatura.
Los componentes de retiro existentes no se reescribieron.

Protegidos intactos: StatusRail, ProductPreviewControl, ReadyPanel,
CoordinationSheets, AvailabilityPostActions/View, controladores y API.
Sin nuevos campos, headers, endpoints, persistencia, permisos o transiciones.
Se conservan lecturas de pedidos/acuerdo y POST existentes de OPEN_WHATSAPP y
contacto, con sus cuerpos, recuperación e Idempotency-Key. Railway no necesario.
Main y producción no modificados. El diagnóstico de push sigue pausado.

## Validación según dependencias

- 72 unitarias: processCardVisualFlow, AvailabilityPostActionsView y
  CustomerReceiptDialog, sin modificarlas. Parseo/resolución TSX sin errores.
- Ocho escenarios nuevos en check-whatsapp-waiting-design.mjs: tres anchos
  320/390/430 con toques físicos por coordenadas, condiciones y foto reales,
  revocación cancelada, foco, plegado y barra inferior; permiso de contacto
  ausente; OPEN_WHATSAPP con bloqueo/inert y un solo POST; paso a preparando
  conservando carril y controles; movimiento reducido; envío incierto con
  recuperación fuera del plegado y sin reintento automático.
- Dos regresiones existentes reutilizadas por dependencia directa:
  check-pickup-line-design --focus-only (reserva y condiciones reales del retiro)
  y check-receipt-finalization --case whatsapp --width 393 (listo, recibido,
  finalización y contadores). Aprobadas. No se repitieron suites no afectadas.
- Fixture coordination: señales optativas waiting-design para permisos y
  respuesta sintética de la contraparte. Predeterminados y runner intactos.
- Inspección de captura a 390 px con los componentes reales del repo.
- Build QA y PWA aprobados; advertencia existente de chunks grandes. No hay
  tsc ni TypeScript configurado en este repo: no se declara typecheck completo
  ni se instalaron herramientas o se modificó package.json.

Las pruebas usan Chrome y transporte sintético restringido al origen local.
No se crearon pedidos ni enviaron pushes, mensajes o confirmaciones reales.
La foto se comprobó con la ventana real y fallback de la fixture, no con una
imagen de catálogo remota. Pendiente Safari/iPhone y Android físicos.

## Publicación y tiempos

Pendiente publicar y verificar únicamente Vercel QA. Se conservará el directorio
ajeno sin seguimiento docs/design-handoffs/claude-cliente-coordinacion-whatsapp-c5f3c85.

Medición de fases secuenciales en node_modules/.cache/wa-wait-timing.json.
Build/PWA interno: 11,06 s. Pruebas unitarias: 2,85 s. Navegadores reutilizados
se ejecutaron parcialmente en paralelo; sus duraciones no se suman al tiempo
de pared. La tabla final se completa después de verificar publicación. Los
tiempos de desarrollo no miden el rendimiento de la app.
