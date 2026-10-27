# Nueva hora: recuperación de una propuesta retenida

Clasificación inicial: diagnóstico. Resultado: solo frontend, recuperación local sobre lecturas y controles backend existentes. No cambia campos, endpoints, estados ni permisos.

## Evidencia

Captura en frontend QA feac29a: negocio con respuesta STILL_NEEDED y revisión de una nueva hora. Aparece «Hay una operación sin confirmar…» sin un control para actualizar desde esa ventana. El usuario confirma que no encuentra dónde corregirlo. No se dispone de la primera respuesta HTTP ni del contenido de la intención retenida en ese teléfono.

Comprobado en código: `proposalIntent.run` conserva la huella y clave de un intento previo y bloquea otro cuerpo en la misma versión/propuesta antes del POST. El diálogo de revisión no exponía la recuperación indicada por el mensaje. No demuestra que exista una propuesta guardada ni que se esté ejecutando en backend.

Reproducción local: una intención anterior incierta, seguida de revisión con otra hora, produce ese bloqueo. La causa de retención concreta del teléfono sigue sin acreditarse.

## Contrato actual y compatibilidad

Leídos el contrato backend `late-initial-response-contract-qa.md`, el diagnóstico previo `availability-pending-intent-diagnostic-qa.md` y `src/request-process/proposal.service.ts` solo en lectura. Backend usa transacción, lock, versión y proposalId; una alternativa exige estado y propuesta original vigentes y avanza versión. No puede confirmar dos alternativas sobre la misma versión original.

GET `/request-processes/:id/proposals?processContract=availability-v3&initialResponseContract=late-initial-v1`, JWT y headers `X-Process-Contract: availability-v3`, `X-Late-Initial-Contract: late-initial-v1`. Respuesta normalizada existente `{process,proposals}`. La lectura no crea acciones ni notificaciones.

POST existente `/request-processes/:id/actions/propose-alternative`: cuerpo expectedVersion, proposalId, confirmationAccepted, schedule, totalPriceClp, message, photo/lineChanges y fulfillment según la elección actual. Idempotency-Key conservado para reintentar la misma intención. No se añaden campos ni endpoints. Nunca se envió este POST contra un pedido real en esta tarea.

## Corrección

- Mensaje comprensible al detectar un intento no comprobado.
- «Comprobar pedido» en el error del diálogo de nueva hora, solo para la alternativa inicial del negocio en la rama STILL_NEEDED.
- GET explícito autenticado y normalizado. Si conserva misma versión, propuesta original, AVAILABILITY_V3, AWAITING_BUSINESS_RESPONSE, STILL_NEEDED, sin acuerdo/plan, permiso PROPOSE_ALTERNATIVE y sin operación local en curso/confirmada: permite recuperar la intención local.
- No hay POST al comprobar. El usuario debe revisar y volver a pulsar «Confirmar y enviar». Se conservan borrador, hora, mensaje, foto y elección de retiro/WhatsApp.
- Si el servidor ya cambió de versión/propuesta o retiró la acción, se muestran sus condiciones actuales sin reconstruir recibos ni anunciar éxito inventado. Un fallo de lectura conserva el bloqueo y los campos.
- Red, timeout, 5xx, recibo inválido y conflictos desconocidos no liberan por sí solos la intención. Una respuesta 400 posterior a incertidumbre previa tampoco la libera. Tras recarga, la intención se considera incierta.
- El siguiente POST sigue usando versión/propuesta originales verificadas: si un intento anterior se confirma durante la carrera, backend rechaza el segundo. No se eliminan indiscriminadamente claves ni se reintenta automáticamente.

## Archivos y validación

Modificados: `proposalIntent.ts`, `ProposalNegotiation.tsx`, `PendingAlternativeActions.tsx`, `proposalIntent.test.ts` y `scripts/check-late-initial-flow.mjs`.

- 1.484 pruebas / 119 archivos aprobados. Incluyen restauración, concurrencia, permisos/versión/propuesta incompatibles, confirmación previa e incertidumbre conservada tras 400.
- 18 recorridos de navegador con componentes reales y transporte sintético. Los tres nuevos reproducen bloqueo, fallo del GET y propuesta anterior ya guardada: comprueban preservación del formulario, cero POST al comprobar y envío posterior únicamente explícito.
- Build QA/PWA aprobado; aviso conocido de bundle superior a 500 kB. Sin comandos independientes de lint/TypeScript; no se presentan como ejecutados.
- Captura local de recuperación: `node_modules/.cache/late-initial-flow/late-proposal-recovered-false.png`.

Publicación únicamente rama qa → integración GitHub/Vercel QA. Pendiente prueba física con el pedido del usuario tras recargar la versión publicada. Railway QA, main y producción intactos. Los seis documentos locales previos ajenos permanecen fuera de esta entrega.
