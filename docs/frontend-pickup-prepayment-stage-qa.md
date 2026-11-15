# E209: reserva con pago previo, espera antes de preparación

2026-11-15, America/Santiago. Clasificación: frontend + backend; integración
frontend del contrato backend ya publicado8d9a4bb (publicación informada por
backend; no se ejecuta despliegue Railway desde este workspace).

Contrato leído: backend docs/testing/pickup-prepayment-stage-contract-qa.md,
sección9. Sin nuevos campos/endpoints inventados, migraciones ni flags.

## Implementación

- `domain/pickupPrepayment.ts`: reconoce contrato, siete fases, monto y reserva;
  valida categorías/mensaje. Capacidad habilitada aislada por token autenticado.
- `api/participantContractHeaders.ts`: aprovecha la consulta existente de
  capacidades para reconocer pickupPrepaymentStage; no añade otra consulta ni
  cabecera. Ausente/deshabilitada/desconocida conserva comportamiento anterior.
- `domain/requestProcess.ts`: conserva la proyección opcional validada, liga ID
  y monto con la reserva real; los recibos históricos sin el campo son válidos.
- `domain/requestStatusGrouping.ts`: mapea fase no preparable a waiting negocio
  y awaiting-business cliente. READY_FOR_PREPARATION a active. Cierre, recepción
  e información de retiro tienen prioridad. No usa reloj local para la fase.
- `cards/shared/reservations/PickupPrepaymentCard.tsx`: composición funcional
  única para espera de ambos roles, reutiliza cabecera, reserva, instrucciones,
  permisos, confirmación y ventanas de condiciones reales. Sin slider/Listo.
- `ProcessOrderCard.tsx`: selecciona esa composición solo para fase no preparable
  reconocida, fuera de tarjetas embebidas. Tras lectura preparable vuelve a la
  composición En curso existente. Sin copias antiguas/nuevas de un mismo estado.
- `ReservationPanel.tsx`: bloque visible con pregunta de pago/apartado y control
  existente según canConfirmPaymentAndHold Y allowedActions. No abre recordatorio
  automático para esta etapa. Incidencias conservan estado, motivo, cancelación
  y declaraciones previas; controles de WhatsApp del cliente permanecen accesibles.
- `useRequestsScreenController.tsx`: texto vacío En espera abarca confirmaciones,
  además de contrapropuestas. La pestaña ya se oculta con contador cero.
- `BusinessAttentionSummary.tsx`: evita afirmar que solo falta decisión del
  cliente cuando hay una reserva cuya confirmación corresponde al negocio.

Presentación funcional con componentes existentes, no un rediseño aprobado de
Claude. El siguiente trabajo visual debe seguir los tres pasos de handoff y
partir de estas fuentes vigentes.

## Campos, acciones y recuperación

GET /request-process-capabilities: pickupPrepaymentStage enabled y contrato
pickup-prepayment-stage-v1. GET /orders/my-orders y /orders/business/:id:
requestProcess.pickupPrepayment; se conservan query/cabeceras vigentes.

Se reutiliza POST /request-processes/:id/actions/confirm-pickup-reservation:
expectedVersion, reservationId, entireOrderHeldDeclared:true y
requiredPaymentReceivedDeclared:true, Idempotency-Key original. El monto no
se envía como editable. useReservation/intent no cambiaron: confirma recibo,
relee lista y recién entonces publica los hechos/categorías. Sin éxito local
simulado, sin deducir pago de WhatsApp ni usar MARK_READY como confirmación.

Incidencia de permisos tras cierres de sección7 backend fuera de alcance.

## Validación y límites

73 pruebas dirigidas aprobadas: contrato/fases, normalizador, filtros/contadores,
capacidad y sesión, compatibilidad, pestaña dinámica/deep links existentes,
recordatorio bloqueado. Se añadió regresión que impide el recordatorio automático
cuando la tarjeta ya presenta la confirmación.

RequestsScreen y paneles reales con HTTP sintético a320/390/430: cliente En espera,
negocio Esperando respuesta, mensaje/monto real, WhatsApp permitido, confirmación
de una sola acción con ambas declaraciones, recibo sin campo nuevo y relectura
preparable, ambos En curso, pestaña cliente vacía desaparece y sin desborde ni
excepciones. Los botones se activan por coordenadas y elementFromPoint.
Primer intento no seleccionó En espera en el arnés: contador1 correcto, lista
Pendientes vacía. Corregida navegación de prueba; no cambio de producto por ello.
Captura ignorada: node_modules/.cache/business-closure/prepayment-stage-business.png.

Regresión adicional95 pruebas aprobadas de reservas, términos vencidos,
recepción, cierre, contrapropuestas y avisos:168 pruebas en11 archivos en total.
Se seleccionaron por dependencia del agrupador/normalizador; sin suite global.
Comprobación final dirigida390 tras ajustar textos del resumen también aprobada.
Build QA/PWA inicial11,80s y final10,53s aprobados; repetido por esos últimos
cambios de presentación. Advertencia previa de bundle. No tsc
independiente. Revisión física Android/iPhone y recorrido autenticado contra
Railway pendientes. Ningún pedido, transferencia ni push real usado en pruebas.

## Tiempos y publicación

Análisis/implementación/preparación se hicieron sin cronómetros exclusivos.
No se inventan mediciones por fase; la ejecución incluye diagnóstico del fixture.
Build y navegador parcialmente paralelos: no sumar dos veces sus intervalos.
Publicación/verificación se registran al cierre. Solo rama qa; main/producción
intactos. Rediseño fino con Claude pendiente, sin bloquear integración funcional.
