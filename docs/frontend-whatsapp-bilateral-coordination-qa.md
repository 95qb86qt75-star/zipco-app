# Coordinación WhatsApp bilateral — entrega frontend QA

Fecha: 2026-10-29. Clasificación: frontend + backend coordinados.
Contrato aprobado: `whatsapp-coordination-v1`, backend Railway QA `23d173e`.
Fuente: `C:/dev/zipco-backend-qa/docs/testing/whatsapp-coordination-confirmation-contract-qa.md`, incluida su sección 9.

## Comportamiento implementado

Cliente y negocio reutilizan el holograma de coordinación. Un regreso verificado desde WhatsApp puede mostrar la pregunta; el regreso, cerrar el diálogo y «No, aún no» nunca envían una declaración. También existe un acceso visible para confirmar.

- Primer «Sí, ya coordinamos»: POST explícito, recibo validado y lectura actual antes de mostrar En curso.
- Contraparte: «Cliente/negocio indicó que ya coordinaron. ¿Es correcto?», con Sí y No reales. Sí mantiene En curso; No devuelve a Por coordinar.
- El pendiente se recupera del GET y mantiene un botón visible aunque se cierre el holograma. La clave de la pregunta distingue acuerdo y confirmationId. Un cambio de versión o ronda invalida el diálogo abierto.
- El negocio conserva MARK_READY. Una pregunta pendiente no bloquea Listo; una pregunta expirada no permite responder ni retroceder el pedido.
- Se conservan retiro local, servicios, reservas, acuerdos aceptados y recorridos anteriores. La tarjeta del cliente no requiere identidad de negocio para recordar el regreso.
- ZIPCO no declara recibir ni verificar pagos.

## API utilizada

GET autenticados existentes:

- `/request-process-capabilities`: `whatsappCoordination.contract`, `enabled`; lectura compartida por sesión. Falta, false, contrato diferente o error no habilitan las nuevas acciones.
- `/orders/my-orders` y `/orders/business/:businessId`, conservando las consultas de disponibilidad y respuesta inicial vigentes.
- GET de acuerdo existente sin cambios.

POST:

- `/request-processes/:id/actions/confirm-whatsapp-coordination`: `{expectedVersion, confirmationAccepted:true}`.
- `/request-processes/:id/actions/respond-whatsapp-coordination`: `{expectedVersion, confirmationId, coordinationAccepted:boolean}`.
- Se conservan OPEN_WHATSAPP y las acciones anteriores dentro de sus permisos vigentes.

Cabeceras: Bearer, JSON, Idempotency-Key, `X-Whatsapp-Coordination-Contract: whatsapp-coordination-v1`, más las cabeceras existentes de `processContractHeaders`, incluidas disponibilidad v3, respuesta inicial y horario informativo cuando corresponden.

Resumen aditivo: `requestProcess.whatsappCoordination` con contract, confirmationId, initiatedBy, initiatedAt, status, respondedBy y respondedAt. Se reconocen PENDING, CONFIRMED, DECLINED y EXPIRED; fechas del servidor. Permisos: CONFIRM_WHATSAPP_COORDINATION y RESPOND_WHATSAPP_COORDINATION en allowedActions. Order.status permanece accepted: las categorías se obtienen de requestProcess.state.

Cada intención conserva su UUID y body exacto, incluso una respuesta false. Envíos inciertos no se repiten automáticamente. Los conflictos llevan a lectura y revisión. Un recibo histórico no sustituye el GET actual: si falla esa lectura, se ofrece Actualizar estado y no se publica el estado antiguo del recibo.

## Avisos

Se integran `order-whatsapp-coordination-confirmed`, `order-whatsapp-coordination-accepted` y `order-whatsapp-coordination-declined`. Las lecturas distinguen los cambios de ronda y respuesta aunque ambos mantengan IN_PROGRESS. Copia y destinatario se obtienen del resumen, con destinos del pedido concreto.

El worker conserva revisión v11. Se amplía únicamente el reconocimiento de los tres tipos y sus tags/versiones, compartido con el receptor vigente. No se retomó el diagnóstico del clic externo iPhone ni se declara resuelto. No se enviaron pushes reales, no se crearon pedidos QA y no se repitieron confirmaciones reales durante el desarrollo.

## Archivos

UI:
- `src/app/screens/requests/WhatsappCoordinationPanel.tsx` (nuevo).
- `src/app/screens/requests/ProcessOrderCard.tsx`.
- `src/app/screens/requests/BusinessCoordinationCard.tsx`.
- `src/app/screens/requests/CoordinationSheets.tsx`.
- `src/app/screens/requests/whatsappReturn.ts` y `useStartWorkPrompt.ts`.

Contrato y operaciones:
- `src/app/screens/requests/whatsappCoordinationContract.ts` y `whatsappCoordinationCapability.ts` (nuevos).
- `src/app/screens/requests/requestProcess.ts`, `coordinationApi.ts`, `coordinationIntent.ts`, `useCoordination.ts`.

Avisos:
- `src/app/notifications/whatsappCoordinationNotice.ts` (nuevo).
- `src/app/notifications/orderNotice.ts`, `BusinessNotificationMonitor.tsx`, `notificationDelivery.ts`, `notificationLifecycle.test.ts`.
- `public/push-sw.js`.

Pruebas:
- `src/app/screens/requests/whatsappCoordinationContract.test.ts` (nuevo).
- `src/app/screens/requests/BusinessCoordinationCard.test.ts`, `whatsappReturn.test.ts`, `useStartWorkPrompt.test.ts`, `useCoordination.test.ts`.
- `scripts/check-whatsapp-bilateral.mjs` (nuevo).

## Validación y publicación

Suite completa: 1.669 pruebas aprobadas en 127 archivos. Incluye cuarenta comprobaciones nuevas de contrato, recuperación, roles, permisos y avisos. No sumar las pruebas focalizadas, que son subconjuntos.

Chrome local con React, tarjetas, hooks y diálogos reales; HTTP completamente simulado. Casos: ambos iniciadores y respuestas Sí/No, cierre sin mutación y pendiente recuperable, capacidad deshabilitada, envío incierto con clave/body originales e invalidación al pasar a Listo. Capturas y registros locales en `node_modules/.cache/whatsapp-bilateral-browser`.

Regresión de navegador: diez recorridos aprobados con Checkout y tarjetas reales (`scripts/check-availability-flow.mjs`): retiro a 320/390/430 px, WhatsApp sin consentimiento del cliente, declinar sin acuerdo, retiro de disponibilidad y alternativas/contrapropuestas/propuesta final en ambos caminos. Cero mutaciones reales.

Build Vite QA y PWA aprobados. Advertencia conocida de bundle mayor de 500 kB. El repositorio no define scripts independientes de lint/typecheck; no se presentan como ejecutados. `git diff --check` aprobado.

API QA: GET no autenticado de capacidades responde 401, sin mutaciones. Esto verifica que el servicio responde y protege la ruta; no sustituye la validación autenticada ni la prueba física.

Rama de implementación: qa. Publicación: solo Vercel QA mediante push de esta rama; estado y SHA definitivos se entregan al confirmar el despliegue. Alias QA: https://zipco-app-git-qa-zipco-s-projects.vercel.app

Railway QA: se utiliza la publicación de backend ya entregada; no se modifica código, variables ni despliegue de Railway. Sin migraciones ni activaciones adicionales.

Main y producción no modificados. Main comprobado de solo lectura en `8295ab8c6024ab20851ebd371308d2f299b4668f`. Documentos previos no relacionados y diagnósticos sin seguimiento preservados fuera de este bloque.

## Pendiente: comprobación física coordinada

Actualizar ambos teléfonos a la versión frontend entregada. Cliente iPhone y negocio Android: primer Sí en ambos sentidos; contraparte Sí y No; regreso de WhatsApp, cierre y «No, aún no» sin cambio de estado; recuperar el pendiente al consultar la lista; Listo mientras hay una respuesta pendiente. Usar el pedido autorizado por el usuario para el ensayo, sin pruebas artificiales del clic externo. No atribuir a estas pruebas locales un éxito físico todavía no observado.