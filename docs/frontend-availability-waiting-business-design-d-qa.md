# Negocio: disponibilidad confirmada, tarjeta variante D

2026-10-29. Clasificación: **solo frontend QA**, diseño e interacción local. Se revisaron los cinco archivos aportados desde Downloads, incluida la referencia visual y el documento 12. Se integró la rama nueva mediante cambios puntuales, sin reemplazar indiscriminadamente el archivo del repositorio ni ejecutar la petición documental de cambios backend.

## Resultado y ajustes al paquete

- Nueva tarjeta compacta «Esperando al cliente» para Mi Negocio, después de confirmar disponibilidad. La superficie abre/cierra el detalle mediante botón accesible, con nombre, total solicitado, miniatura, cantidad, indicador confirmado y manito. El retiro queda dentro del detalle.
- Retiro en el local muestra su chip, productos, pedido para, cómo continúan y los textos opcionales. Se confirmó en el formulario existente y el contrato availability-continuation que scheduleOrAddress es texto libre de horario o dirección: se usa **«Dónde y cuándo»** y se omite el chip que lo interpretaba únicamente como hora. No se extraen fechas desde ese texto.
- WhatsApp muestra chip y fila Cómo continúan, sin los campos exclusivos del retiro local. Nota y foto de referencia existentes se conservan.
- Las muescas del ticket son transparentes mediante máscaras en los dos paneles de fondo. Muestran el degradado real de la lista y no requieren adivinar un color fijo ni medir posiciones con JavaScript.
- ProductPreviewControl conserva el producto de la propuesta y su modal con descripción, cantidad, precio unitario y subtotal. El toque no cambia expanded. La miniatura nunca sustituye una foto de producto ausente por customerImage; usa la bolsa. El contador exterior suma las cantidades; con varios productos el modal mantiene el selector existente. No se inventan imágenes.
- El backend de vista previa ya está integrado en este repositorio mediante requestProcess.productPreview y order-product-preview-v1. El comentario del paquete que pide una nueva API de fotos está desactualizado para este workspace: se usan los campos existentes; si el pedido no los trae, funciona el icono neutro.
- Se mantienen allowedActions/WITHDRAW_AVAILABILITY, busy, comprobación de errores y el diálogo existente de retiro. La nueva tarjeta solo se usa con negocio y un plan válido. Un estado inesperado sin plan muestra Actualizar pedido, sin atribuir al cliente que confirmó disponibilidad.
- No se incorporan el interruptor local/WhatsApp ni reiniciar de la maqueta. La decoración respeta reduced-motion y los controles existentes para detener animaciones durante scroll/fuera de pantalla.

## Archivos y contrato

Nuevos `src/app/screens/requests/AvailabilityWaitingCard.tsx` y `availability-waiting.css`; integración en `AvailabilityFlowCard.tsx`. `scripts/check-availability-flow.mjs` actualiza el nombre visible, el estado expandido de la prueba, el paso de horario ya existente y las comprobaciones del rediseño. Esta ficha documenta la entrega.

Campos existentes: customerName, total, products.items (name/quantity/price), needNow/deliveryDate/deliveryTime, note/referencePhoto, requestProcess.availability (path/customerMessage/scheduleOrAddress), allowedActions y productPreview. Las cantidades y precios provienen de datos normalizados. No hay campos, endpoints, estados, permisos, reservas o datos nuevos de servidor. Se conserva el mismo transporte de disponibilidad/retiro y diálogo; no se hace ninguna acción real para verificarlo.

## Validación y publicación

- **1.629 pruebas aprobadas en 126 archivos**, suite completa con --maxWorkers=2.
- **Diez escenarios de navegador aprobados** con checkout, tarjetas y hooks reales y HTTP sintético: retiro local 320/390/430 px; WhatsApp; rechazo sin acuerdo; retiro del negocio; alternativas, contrapropuestas y propuestas finales por ambos caminos. Se comprueban altura compacta, toque físico sobre miniatura, modal sin toggle, precio unitario, abrir desde el nombre, opcionales vacíos, dirección y horario en texto libre, ausencia de filas locales en WhatsApp y ausencia de llamadas API al abrir el producto/detalle. Cero pedidos, notificaciones o mutaciones reales.
- Capturas revisadas en `node_modules/.cache/availability-flow/availability-waiting-pickup-{320,390,430}.png` y `availability-waiting-whatsapp.png`; artefactos locales ignorados, sin datos reales.
- Build QA/PWA aprobado con TEMP/TMP dentro del workspace; el intento inicial con el temporal del perfil falló por permisos al generar PWA y se corrigió usando el directorio autorizado. Advertencia habitual de bundle mayor de 500 kB; no se afirma lint/tsc independiente ni prueba física en teléfonos.
- Publicación exclusivamente desde rama qa mediante git push origin qa y despliegue automático Vercel QA. SHA y Ready se verifican en la entrega final.
- Railway no fue necesario y no se modifica. `main` conserva 8295ab8c6024ab20851ebd371308d2f299b4668f; producción intacta y documentos locales ajenos excluidos. El diagnóstico del clic externo permanece pausado, sin cambios de código de notificaciones.

Pendiente: revisión visual en los celulares actualizados con solicitudes existentes y sus datos disponibles; no se requiere activación o migración backend.
