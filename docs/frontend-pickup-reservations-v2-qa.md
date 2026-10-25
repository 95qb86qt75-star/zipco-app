# PICKUP-RESERVATIONS-V2-01 — Integración funcional de reservas

2026-10-25. Clasificación: **frontend + backend**, consumiendo el contrato ya
publicado en Railway QA `92341e9`. No se modificó backend, migraciones ni variables
del proveedor desde frontend. El diseño reutiliza las pantallas aprobadas; la
revisión visual detallada queda para después del recorrido funcional en celulares.

Contrato de referencia leído y contrastado con los recibos reales del servicio:
`C:/dev/zipco-backend-qa/docs/testing/pickup-reservations-v2-implementation-qa.md`.

## Activación y compatibilidad

- GET autenticado `/request-process-capabilities`, sin caché. Solo
  `reservationCreationEnabled: true` junto con soporte `availability-v2` habilita
  crear V2. Una respuesta inválida o fallida no habilita nada.
- Con la capacidad desactivada, checkout conserva POST
  `/orders/availability-requests` y `AVAILABILITY_V1`. Con ella activa utiliza
  `/orders/availability-reservation-requests` y `AVAILABILITY_V2`.
- Se conserva la selección de contrato y la clave/cuerpo en reintentos inciertos.
  Un fallo no cambia silenciosamente de contrato ni duplica pedidos.
- Las lecturas de listas, acuerdos y propuestas solicitan
  `?processContract=availability-v2`, compatible con registros legacy/V1.
- Las mutaciones de procesos V2 añaden `X-Process-Contract: availability-v2`.
  JWT, UUID de idempotencia, versión y propuesta conservan sus verificaciones.
- No se convierten pedidos existentes. La activación de nuevas reservas sigue
  pendiente de backend; publicar frontend no cambia el flag de Railway.

## Recorrido conectado

Dentro de Retiro en el local, el negocio elige Sin reserva, Reserva sin pago o
Reserva con pago previo. Define plazos de confirmación/retiro y, para pago, plazo
de pago, abono/completo, monto e instrucciones. Las fechas se ingresan en hora de
Santiago y se envían UTC; no se imponen diez minutos. Una propuesta final conserva
el camino anterior y permite corregir explícitamente condiciones incompatibles
con el nuevo total, sin ajustar montos o fechas silenciosamente.

El cliente ve condiciones y plazos antes de decidir solicitar reserva, ir sin
reserva o declinar. Puede agregar una nota. La reserva con pago exige su propio
permiso y el del negocio; la elección inicial por sí sola no comparte teléfonos.
Las alternativas, contrapropuestas y propuesta final conservan la elección
condicionada sin afirmar que aceptar una negociación apartó existencias.

Después de solicitar, el negocio confirma expresamente que apartó todo el pedido.
Con pago declara además que recibió el monto requerido. Solicitar, abrir WhatsApp
o volver a la app no acreditan mensaje, pago ni apartado. La app usa el estado y
los permisos de la lectura autorizada, no un estado de reserva calculado localmente.

La gratuita permite declinar el apartado y, tras su terminación, continuar sin
reserva mediante decisión expresa del cliente. No cancela automáticamente el pedido.
En la pagada, WhatsApp lleva a comprobante/aclaración y no repite Iniciar
coordinación. Tras cancelar, el pedido permanece cancelado en Historial; el acceso
específico de aclaración respeta permisos vigentes. Finalizar mi seguimiento solo
cierra el indicador propio y conserva el historial del otro participante.

Listo mantiene las reglas anteriores para pedidos sin reserva/legacy. Una reserva
solicitada necesita lectura confirmada y, si corresponde, declaración de pago;
backend sigue siendo la autoridad. Se conserva la eliminación de los controles
persistentes de retirar permiso en Listos que pidió el usuario.

## Campos y endpoints

Campos nuevos consumidos: `serverNow`, `availability.reservationOffer`,
`reservationChoice`, `reservation` y `reservationFollowUp`. Se conservan solo los
campos públicos documentados; no se persisten teléfonos ni URLs de WhatsApp en
intentos. El antiguo `reservationAmountClp` sigue vacío.

`fulfillment.reservationOffer` viaja con confirm-availability y las propuestas
del negocio. `reservationChoice: {offerId, choice, note?}` viaja con
continue-request, accept-proposal y counter-proposal del cliente para retiro V2.
Las demás acciones de disponibilidad, coordinación y negociación conservan sus
endpoints y contrato base.

Nuevos POST bajo `/request-processes/:id/actions/`, todos con `expectedVersion`
y `reservationId`, además de los campos específicos documentados:

- `confirm-pickup-reservation`: `entireOrderHeldDeclared`, y en pago
  `requiredPaymentReceivedDeclared`.
- `decline-pickup-reservation`: `reasonDetail`.
- `continue-without-reservation`: `confirmationAccepted`.
- `report-reservation-issue`: `reasonDetail` y declaración de monto opcional del
  negocio según contrato.
- `finish-own-reservation-follow-up`: `confirmationAccepted`.
- `open-reservation-whatsapp`: `purpose: RECEIPT | CLARIFICATION`.
- `authorize-reservation-contact`: `consentAccepted`,
  `consentTextVersion: availability-contact-v1`.
- `revoke-reservation-contact`: solo campos base.

Los recibos de mutación son mínimos: no contienen el seguimiento completo.
Después de confirmar un POST se relee el pedido antes de publicar permisos o
navegar. Si falla esa lectura, el intento confirmado no se reenvía. Los reintentos
inciertos conservan clave y huella del cuerpo. Nunca se construye un enlace con
teléfono local; solo se admite la URL validada que devuelve backend.

## Archivos

- `reservationContract.ts`, `reservationCapabilities.ts`, `reservationApi.ts`,
  `reservationIntent.ts`, `useReservation.ts`: contrato, capacidad, acciones y
  recuperación de resultados.
- `ReservationOfferFields.tsx`, `ReservationOfferSummary.tsx`,
  `ReservationChoiceFields.tsx`, `ReservationPanel.tsx`: configuración, elección,
  confirmaciones y seguimiento de ambos roles.
- `CheckoutScreen.tsx`, `createOrderApi.ts`: selección de creación V1/V2.
- `AvailabilityFlowCard.tsx`, `availability-design/AvailabilityDesign.tsx`,
  `AvailabilityPlanSummary.tsx`, `AvailabilityPostActions.tsx`,
  `ProcessHistoryCard.tsx`: integración en las tarjetas y modales reales.
- `ProposalNegotiation.tsx`, `PendingAlternativeActions.tsx`,
  `availabilityChoice.ts`: negociación y conservación del camino.
- `requestProcess.ts`, `agreement.ts`, `availabilityContract.ts`,
  `proposalContract.ts`, `availabilityApi.ts`, `proposalApi.ts`,
  `coordinationApi.ts`, `useAgreement.ts`, `useCoordination.ts`, `useRequests.ts`,
  `requestProcessErrors.ts`, `BusinessNotificationMonitor.tsx`: lectores y
  escrituras compatibles con V2.
- `reservationContract.test.ts`, `reservationFixtures.ts`, pruebas existentes
  actualizadas, `scripts/check-reservation-flow.mjs`, scripts de checkout y
  disponibilidad: comprobaciones sintéticas y regresiones.

## Validación y límites

**1.364 pruebas / 113 archivos aprobados**, suite completa. Build QA/PWA aprobado
con API QA fijada solo para el proceso; advertencia habitual de bundle mayor de
500 kB. No hay un comando TypeScript/lint independiente configurado en este repo;
no se declara que se haya ejecutado uno.

**25 escenarios de navegador aprobados con datos sintéticos**: nueve de reservas
(incluyendo anchos 320/390/430, gratuita, pago, regreso de comprobante, cancelación,
seguimiento individual, revocación/autorización, contrapropuesta y capacidad OFF),
diez de disponibilidad/negociación S2 y seis de pantallas 1/2. Cero pedidos reales
creados o modificados y sin cargas reales de imágenes.

GET público Railway QA raíz respondió 200 y capacidades sin sesión respondió 401.
Esto verifica disponibilidad/protección de la ruta, no el valor del flag ni el
recorrido funcional autenticado. Backend reportó flag no configurado y OFF por
defecto. Pendientes: activación coordinada, actualización de ambos celulares y
prueba real gratuita/con pago, plazos, cancelación, WhatsApp y Listo/recepción.
No se acreditan transferencias, entregas, push real ni inventario apartado.

## Publicación

Preparado para commit en rama `qa` y publicación por la integración GitHub
existente. Completar aquí SHA, Vercel READY y comprobación del bundle tras publicar.
Identidad Git previa conservada; sin Vercel CLI deploy ni reescrituras.
`main` conserva `8295ab8c6024ab20851ebd371308d2f299b4668f` y producción intacta.
