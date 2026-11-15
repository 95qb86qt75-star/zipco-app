# Diagnóstico: WhatsApp abre, regreso iPhone muestra navegador blanco

2026-11-15, America/Santiago. Clasificación: requiere diagnóstico antes de decidir.
Capturas usuario frontend QA889bf6c; texto de WhatsApp refiere pedido175 y
coordinación del comprobante. Safari blanco muestra Buscar o ingresar sitio web,
no aporta URL/código HTTP ni consola. No prueba fallo de Railway o de guardado.

## Evidencia local

- `application/startReservationPayment.ts:10`: después de una reserva explícita,
  relee pedido, verifica PREPAYMENT/permiso, ejecuta OPEN_RESERVATION_WHATSAPP con
  purpose RECEIPT y relee versión/reserva/acuerdo. Un intento automático por reserva.
- `application/useReservation.ts:39`: apertura manual usa el mismo contrato y
  lectura posterior. Navega mediante window.location.assign(navigation).
- `forms/proposal/ProposalNegotiation.tsx:308`: aceptación seguida de apertura
  automática; fallo posterior no revierte aceptación. Línea311 usa location.assign.
- `application/useAvailability.ts:73`: otro acceso automático usa location.assign.
- `api/coordinationApi.ts:41`: solo admite HTTPS wa.me, número válido y parámetro
  text, sin host alternativo, credenciales, fragmento o parámetros extra.

La navegación sustituye el documento actual; es un punto a investigar en retorno
Safari/PWA, no causa demostrada. No se recrea enlace ni teléfono en frontend.
La captura inicial tiene NONE seleccionado; no permite inferir qué elección se
confirmó posteriormente. Hay que consultar hechos actuales del pedido.

## Contrato que debe comprobar backend (lectura/diagnóstico solamente)

POST /request-processes/:id/actions/open-reservation-whatsapp, JWT e idempotencia
vigentes; expectedVersion, reservationId, purpose RECEIPT. Respuesta existente:
recibo result y navigation autorizada o causa de contacto no disponible.
Revisar pedido175/participante correcto, elección realmente guardada, reserva,
permisos, versiones, resultado de aceptación, apertura y lecturas posteriores.
Si hay trazas retenidas, identificar código/mensaje del error sin exponer tokens,
números, URL completa ni comprobantes. No inventar nuevos campos/endpoints.

## Pruebas y límites

40 pruebas existentes de startReservationPayment y coordinationApi aprobadas:
navegación autorizada, relectura fallida, sesión/cambio de permiso e intento incierto.
Son sintéticas; no validan Safari/WhatsApp físico ni el pedido real. Falta texto
exacto del error y saber si vuelve mediante Safari/ZIPCO o el icono de la PWA.

No código modificado, build no necesario, sin push ni despliegue. Frontend QA
funcional889bf6c sin cambios; Railway, main y producción intactos. Documento local.
Análisis/pruebas/documentación sin cronómetros exclusivos; no atribuir el fallo
al rendimiento gráfico o backend sin evidencia.
