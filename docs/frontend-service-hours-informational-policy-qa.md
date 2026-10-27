# Horario informativo: avisos y reservas sin vencimiento automático

2026-10-27, America/Santiago. Clasificación: frontend + backend coordinados; esta entrega modifica exclusivamente frontend QA. Contrato leído: `C:/dev/zipco-backend-qa/docs/testing/service-hours-informational-policy-contract-qa.md` y su contrato E160 de aviso al enviar. Backend publicado por su chat en Railway QA `26ee14b9dd18842779260924adada00b94551b74`.

## Comportamiento

Negocio: aviso dentro del formulario de disponibilidad, revisión de alternativas/finales y respuesta a cotizaciones. GET response-advisory evalúa por separado el instante actual del servidor y la fecha/hora solicitada que muestra el formulario. Si cierra a las 17:30 y el retiro es a las 17:35, pero responde a las 17:29, se advierte sobre la hora solicitada, no que esté respondiendo tarde. Las dos advertencias se combinan cuando corresponde. UNKNOWN/fallo de lectura no se presenta como cerrado. No se pide otro campo ni un clic de consentimiento horario. Se actualiza el aviso al volver del segundo plano.

Cliente: antes de un envío nuevo de pedido, servicio o cotización se consulta submission-advisory. Fuera del horario informado se ofrecen «Enviar de todas formas» y «Prefiero buscar otra opción». La primera ejecuta una sola intención existente; la segunda regresa a la pantalla de origen/resultados sin enviar. El borrador se guarda solo en memoria de esta pestaña, por sesión, negocio y tipo de solicitud; se elimina al enviar correctamente. No sobrevive una recarga/cierre de la app. Un envío de pedido incierto conserva su intención original, sin reinterpretarlo como una solicitud nueva por este aviso.

Fallo de consulta cliente: reintentar GET o decidir explícitamente enviar sin verificar; no hay envío automático por el error. Un 401 conserva el manejo de sesión; 403/404 no ofrecen continuar como si fuera solo un horario cerrado. Doble toque, regreso del segundo plano, desmontaje y cambio de token tienen guardas locales. No se persiste aprobación de horario para otra solicitud.

Modalidad nueva: solo una capacidad compatible y activa agrega `hoursPolicy: ADVISORY_ONLY` a FREE/PREPAYMENT. NONE sigue sin ese campo. No se presenta una elección técnica de política. La UI explica reserva gratuita automática, o reserva pagada pendiente hasta la declaración expresa del negocio de haber recibido el monto y apartado el pedido. ZIPCO no verifica transferencias. Se conservan WhatsApp, permisos, cantidades, importes, negociación, Listo y recepción.

Lecturas admiten opensAt/closesAt/holdMinutes null en términos ADVISORY_ONLY y pickupBy/paymentDueAt null en sus tiempos. Las lecturas de proceso/opciones comprueban que la política y sus tiempos correspondan. No se formatean null como fecha, no se programa un refresh de vencimiento, ni se muestra «30 minutos», «hasta el cierre» o un vencimiento inventado en esa modalidad. Se conserva la hora solicitada. Ofertas V2/V3 anteriores siguen mostrando sus propios plazos. Desactivar creación no impide leer/gestionar ofertas nuevas ya guardadas; tampoco convierte sus condiciones a las anteriores. Una nueva propuesta que heredaba ADVISORY_ONLY no se degrada silenciosamente cuando la capacidad está apagada: conserva el formulario y avisa.

## Campos y endpoints

- GET `/businesses/:id/submission-advisory`: contrato request-submission-advisory-v1, businessName, checkedAt, timeZone, status y ventanas del servidor. Bearer y no-store.
- GET `/businesses/:id/response-advisory`: contrato business-response-hours-advisory-v1, current/requested/canContinue. Query requestedDate + requestedTime juntas para programados; ninguna para Ahora. Se usa fecha local Chile, sin decidir abierto/cerrado por reloj del teléfono.
- GET `/request-process-capabilities`: serviceHoursAdvisory.contract = service-hours-advisory-v1 y reservationCreationEnabled, junto con creación V3 compatible.
- GET `/request-processes/:id/reservation-options?processContract=availability-v3`: previewTiming nullable y header técnico nuevo.
- POST de procesos V3 existentes conservan su body/acción y headers previos, más `X-Service-Hours-Contract: service-hours-advisory-v1`, centralizado para disponibilidad, negociación, seguimiento, coordinación, Listo y recepción. FREE/PREPAYMENT creados con capacidad activa incorporan hoursPolicy; NONE no. La creación original de pedido/cotización no recibe campos visuales nuevos.
- SERVICE_HOURS_CONTRACT_REQUIRED / ADVISORY_RESERVATION_HOURS_DISABLED se presentan con texto aprobado y liberan una intención nueva rechazada definitivamente. Un intento que ya era incierto/restaurado conserva protección y requiere recuperación. No hay reenvíos automáticos.

## Archivos

- Nuevos: `requests/serviceHoursAdvisory.ts`, `serviceHoursPolicy.ts`, `BusinessResponseHoursNotice.tsx`, `useSubmissionHoursAdvisory.tsx`, `serviceHoursAdvisory.test.ts` y `scripts/check-service-hours-advisory.mjs`.
- Envío/navegación: `App.tsx`, `CheckoutScreen.tsx`, `ServiceCheckoutScreen.tsx`, `BusinessProfileScreen.tsx`, `ServiceProfileScreen.tsx`, `quotes/QuoteRequestModal.tsx`, `quotes/QuotesPanel.tsx` y `checkoutMomentFlow.test.ts`.
- Formularios/lectura: `requests/AvailabilityFlowCard.tsx`, `availability-design/AvailabilityDesign.tsx`, `ProposalNegotiation.tsx`, `SimpleReservationOfferFields.tsx`, `ReservationOfferSummary.tsx`, `ReservationPanel.tsx`, `CoordinationSheets.tsx`.
- Contrato/recuperación: `simplifiedReservationContract.ts`, `reservationContract.ts`, `requestProcess.ts`, `reservationOptions.ts`, `reservationCapabilities.ts`, `requestProcessErrors.ts`, `availabilityIntent.ts`, `proposalIntent.ts`, `reservationIntent.ts`, `coordinationIntent.ts` y whitelist `loadOrdersDiagnostics.ts`.
- Pruebas de compatibilidad: `simplifiedReservationContract.test.ts`, `scripts/check-reservation-v3-flow.mjs` (incluye las lecturas nuevas con HTTP sintético).

## Validación y publicación

- 1.538 pruebas / 121 archivos aprobados, incluidas 27 pruebas nuevas del contrato, diferencias entre horarios, transporte, capacidad, null, compatibilidad, textos y rechazo definitivo.
- 11 escenarios de Chrome móvil con checkout/tarjetas reales y HTTP sintético: reserva gratuita en ambos roles a 320/390/430 px; solicitud programada fuera de atención con respuesta dentro; declaración manual de pago y cliente confirmado; headers; envío fuera de horario, fallo de consulta, 404; cancelación sin POST con borrador conservado; cotización con decisión explícita.
- 23 regresiones V3 aprobadas: gratuita automática, pagos/recordatorio, consentimientos, WhatsApp, alternativas/contrapropuestas/finales, negativa a reservar, conservación de campos y recuperación de respuesta incierta sin duplicados.
- Build QA/PWA aprobado; permanece el aviso conocido de bundle mayor a 500 kB. No se presentan lint/TypeScript independientes como ejecutados. No se hicieron mutaciones de pedidos reales QA.

Publicación únicamente por rama qa → integración GitHub/Vercel QA. No se activó `ADVISORY_RESERVATION_HOURS_ENABLED`, no se leyeron variables privadas ni se modificó Railway. Backend no necesita otra migración por frontend. Main conserva `8295ab8c6024ab20851ebd371308d2f299b4668f`; producción intacta. Los siete documentos locales previos ajenos a esta implementación quedan fuera del commit.

Pendiente: actualizar ambos celulares a la versión publicada, confirmar versión visible y coordinar activación exclusivamente QA con backend. Después crear una oferta nueva: cierre 17:30 y retiro 17:35, comprobar aviso/continuación/reserva sin plazo ficticio; probar gratuita y pagada, y una reserva anterior que conserva sus condiciones. No usar el aviso para reactivar una solicitud cuya fecha ya pasó: Fuera de hora mantiene su regla independiente.
