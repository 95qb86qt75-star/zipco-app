# Resumen de reserva del cliente — QA

Clasificación: solo frontend. La vista principal de reservas V3 activas mostraba controles de seguimiento técnico y repetía instrucciones de comprobante que el usuario no había pedido para ese momento.

En la tarjeta del cliente, para reservas activas pendientes o confirmadas, se muestran estado del servidor, monto o modalidad, fecha límite de retiro, plazo de pago si existe y nota. Se omiten Enviar comprobante / Volver a WhatsApp, Retirar mi permiso para esta reserva, Registrar una aclaración, Finalizar mi seguimiento y Actualizar reserva. No hay nueva coordinación ni envío automático de mensajes o comprobantes. Ante un error propio del panel se ofrece reintentar la lectura.

La tarjeta mantiene las instrucciones de retiro del negocio y Cancelar retiro cuando backend lo permite. Se elimina el texto repetido que remitía a un «seguimiento de reserva».

Compatibilidad: se conserva el panel de negocio y su confirmación permanente/holograma. Se conservan los recorridos V2 y la presentación de recuperación cuando la reserva está vencida, rechazada o cancelada, así como el seguimiento en Historial. No cambian consentimientos efectivos, estados, fechas, montos ni permisos de servidor.

Archivos: `ReservationPanel.tsx`, `AvailabilityPostActions.tsx`, `scripts/check-reservation-v3-flow.mjs` y este documento.

Contrato existente: `requestProcess.reservation`, `reservationChoice.note`, `availability.reservationOffer`, `reservation.timing` y `allowedActions`. Se conservan GET de pedidos y acciones de reserva bajo `/request-processes/:id/actions/*`; no se añaden endpoints ni campos. El pago sigue fuera de ZIPCO y abrir WhatsApp no confirma pago ni apartado.

Validación: 30 pruebas de contrato V3, apertura de pago y recordatorio del negocio; build QA/PWA aprobado con aviso previo de tamaño del bundle. 21 escenarios de navegador sintéticos aprobados en ambos roles, incluyendo resumen pendiente y confirmado sin controles técnicos, confirmación de pago y holograma del negocio, variantes gratuitas y sin reserva, negociación y recuperación tras errores. No se modifican datos reales durante las pruebas.

Publicación prevista exclusivamente en `qa`, integración GitHub → Vercel. Railway no requiere cambios. Pendiente revisión real Android/iPhone; `main` y producción intactos.
