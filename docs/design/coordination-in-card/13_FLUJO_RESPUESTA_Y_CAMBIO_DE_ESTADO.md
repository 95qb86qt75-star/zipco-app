# 13 · Respuesta y cambio de estado — contrato e implementación QA

Fecha: 2026-10-30. Clasificación: frontend + backend coordinados. Backend publicado en Railway QA c3da34e; frontend consume el contrato definitivo `whatsapp-coordination-initial-decline-v1` junto con `whatsapp-coordination-v1`. La auditoría 01 conserva la situación anterior como evidencia histórica.

## Secuencia compartida

1. La consulta identifica el pedido, producto, contraparte y precio. Los permisos proceden de allowedActions y de la capacidad real.
2. Falta abre Devolver/Cancelar dentro de la misma tarjeta, sin POST. Cancelar restaura la consulta, sin guardar ni notificar. Devolver ejecuta DECLINE_WHATSAPP_COORDINATION antes del primer Sí, o RESPOND_WHATSAPP_COORDINATION con false cuando existe una ronda ajena pendiente.
3. Guardando: spinner, controles bloqueados y la misma intención UUID/body. Doble toque no crea otro envío.
4. El resultado se presenta unos 1,5 segundos después de comprobar una lectura actual autorizada, con versión igual o posterior al recibo. Un POST confirmado seguido de un GET fallido conserva la recuperación y no muestra éxito visual ficticio.
5. Solo al cambiar de categoría se pliega el espacio unos 0,5 segundos. El snapshot de salida es exclusivamente visual: las listas reales siguen determinando los contadores. La pestaña seleccionada se conserva; Ver es navegación explícita al destino verificado.
6. Cuando el resultado permanece en la misma categoría, no se elimina la tarjeta ni se fuerza un cambio de contador. DECLINE inicial sigue Por coordinar. RESPOND true sigue En curso. RESPOND false vuelve a Por coordinar.
7. Aviso inferior compartido durante unos 4,5 segundos, encima de la navegación, role=status y botón Ver. Los destinos proceden del agrupador real. La negativa inicial dice Sigue en Por coordinar; la respuesta negativa de la contraparte dice Volvió a Por coordinar.
8. Chispeo unos 0,8 segundos únicamente al cambiar el número real del chip, tanto aumentando como disminuyendo. Carga inicial y valor desconocido no producen un cambio inventado.

## Implementación reutilizable

- `StatusChangeFlow.tsx`, `statusChangePresentation.ts` y `status-change.css`: presentación del resultado, snapshot de salida y aviso inferior mediante StatusChangeHost.
- `useChipBump.ts` y RequestStatusTab: cambios reales de valor, sin temporizadores que finjan cifras.
- La confirmación, los formularios y sus errores permanecen en sus componentes de origen, montados durante la presentación. No se reemplazan las reglas de servidor por animaciones.
- Se aplica a las acciones versionadas integradas en useAvailability, useCoordination, ProposalNegotiation, useLateInitial y a cancelar retiro en useReservation. Las autorizaciones de contacto, abrir WhatsApp, ACK, subestados restantes de reserva, cotizaciones y recorridos legados no versionados conservan sus mecanismos existentes.

## Recuperación y accesibilidad

Conservar sesión, UUID, body, expectedVersion y confirmationId cuando corresponda. En transporte incierto se comprueba el estado o se reintenta exactamente el mismo envío por decisión del usuario. Un recibo definitivo con lectura pendiente pide actualizar, sin repetir la mutación. STALE_VERSION invalida la consulta anterior; una ronda nueva, cambio de rol o cierre de sesión no reutilizan su confirmación.

Los controles tienen al menos 44 px, detalle cerrado inert/aria-hidden, foco conservado o trasladado a la lista cuando desaparece la tarjeta, y prioridad para la navegación inferior. Movimiento reducido elimina las animaciones; las compuertas de scroll/visibilidad detienen el movimiento ornamental. No se incluyen interruptores de demostración ni datos simulados en la UI publicada.

## Validación

Ver `docs/frontend-coordination-in-card-qa.md`: pruebas de contrato, intenciones, presentación, navegador real con transporte sintético y regresión de los recorridos de disponibilidad. La validación física en ambos teléfonos sigue pendiente.
