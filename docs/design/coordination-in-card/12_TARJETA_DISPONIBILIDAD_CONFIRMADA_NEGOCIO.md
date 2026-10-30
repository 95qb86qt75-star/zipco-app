# 12 · Disponibilidad confirmada del negocio — especificación corregida tras auditoría

Fecha: 2026-10-30. Sustituye las indicaciones desactualizadas del documento 12 del paquete, sin sustituir código. Leer `01_AUDITORIA_Y_TRASPASO_BACKEND_QA.md` antes de implementar.

## Fuente de verdad

Usar los archivos actuales de `C:/dev/zipco-app-qa/src/app/screens/requests/`. Los seis adjuntos de archivos_actuales_del_repo coinciden con el repo en esta auditoría. No copiar versiones anteriores encima ni restaurar comportamientos ya corregidos.

AvailabilityWaitingCard.tsx ya existe; AvailabilityFlowCard.tsx ya la integra. Se conserva la variante D normal, el plegado DetailReveal, la animación suave, el ticket con mask-image, la cantidad fuera del anillo, los degradados estáticos y las compuertas de movimiento. No rehacer la tarjeta como si todavía existiera el artículo anterior de líneas 72–77 del documento original.

## Estados y reutilización

La tarjeta normal del negocio espera la decisión inicial del cliente: AWAITING_CUSTOMER_CONTINUATION, categoría Esperando respuesta. Esa espera no es una ronda de coordinación WhatsApp y no habilita CONFIRM_WHATSAPP_COORDINATION ni RESPOND_WHATSAPP_COORDINATION.

La nueva tarjeta de consulta puede reutilizar su diseño y los bloques de detalle. Se monta dentro del recorrido del pedido que realmente tiene los permisos de coordinación: COORDINATING para declarar primero o IN_PROGRESS/PENDING para responder. No mover esos pedidos a Esperando respuesta por parecido con la maqueta. La tarjeta normal debe permanecer intacta cuando no existe una consulta elegible.

Consultar 14 para la variante de coordinación y 13 para la secuencia. La Parte C consume ahora el contrato definitivo whatsapp-coordination-initial-decline-v1 publicado en Railway QA c3da34e. Consultar 14 para permisos, cuerpos y persistencia de la negativa inicial; la auditoría 01 queda como evidencia histórica.

## Datos, producto y detalle

- Miniatura y ventana del producto: ProductPreviewControl con el ProductPreviewScope/productPreview existente. No usar customerImage para representar un producto ni pedir otra API de imágenes para esta UI. El precio unitario y el total conservan sus significados existentes.
- El toque en la miniatura no abre/cierra el detalle ni responde una consulta.
- Retiro local: conservar customerMessage y scheduleOrAddress solo si tienen texto. scheduleOrAddress es libre: etiqueta «Dónde y cuándo», sin convertirlo en un horario estructurado ni extraer un chip de hora supuesto.
- WhatsApp: chip «Coordinar por WhatsApp», sin filas de mensaje/horario propias de retiro local.
- Conservar nota, referencia, lista de productos y datos de servidor. No usar createdAt/updatedAt con otro significado.
- Retirar disponibilidad conserva su confirmación y WITHDRAW_AVAILABILITY, con allowedActions y recuperación existentes.

## Diseño y accesibilidad

Mantener el alto compacto normal y el detalle plegable aprobado. Controles de 44 px, aria-expanded, detalle cerrado inert/aria-hidden, sin interceptar clics en producto ni barra inferior. Respetar reduced-motion y data-request-motion. Sin interruptores, simuladores de errores ni reinicio del tablero.

## Validación prevista

Normal de disponibilidad: retiro local/WhatsApp, datos opcionales, varios productos, detalle y miniatura independientes, retirada con cancelación/confirmación, errores y recuperación, 320–350 px y movimiento reducido. Las tarjetas del cliente y Confirmar disponibilidad deben conservar sus recorridos y formularios, incluso si se integra después una presentación compartida para los resultados.