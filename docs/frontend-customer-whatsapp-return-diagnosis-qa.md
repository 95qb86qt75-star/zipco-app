# Regreso de WhatsApp del cliente — diagnóstico QA

Clasificación: frontend + backend. Solo lectura de código y documentación;
sin cambios de aplicación, contrato, backend, Git o despliegues.

El usuario confirmó el recorrido S2 y reportó que al volver de WhatsApp el
cliente no recibe «¿Coordinación lista por WhatsApp? / Sí, comenzar / No, aún no».

## Contrato actual y causa comprobada

- `src/app/screens/requests/useCoordination.ts:170`: registra el regreso solo
  para negocio, después del recibo/navegación verificados de OPEN_WHATSAPP.
- `src/app/screens/requests/whatsappReturn.ts:16`: el espacio de seguimiento
  requiere businessId. Línea 22: la clave exige un pedido con customerName,
  propio de la lectura del negocio. El cliente no genera esa clave.
- `src/app/screens/requests/BusinessCoordinationCard.tsx:83`: returnKey solo
  business; línea 84: canStart exige business, COORDINATING y START_WORK.
- `src/app/screens/requests/coordinationApi.ts:76`: START_WORK permitido solo
  al negocio en coordinación. `useCoordination.ts:108` añade la protección de rol.
- `src/app/screens/requests/CoordinationSheets.tsx:83`: diálogo existente;
  línea 84: el texto actual dice «Pasarás a preparar el pedido», propio del negocio.
- Backend, solo lectura:
  `C:/dev/zipco-backend-qa/src/request-process/coordination-policy.ts:44` expone
  START_WORK solo al propietario en COORDINATING.
  `request-coordination.service.ts:219` rechaza al cliente con ForbiddenException
  y al negocio lo pasa a IN_PROGRESS.
  `coordination.postgres.spec.ts:169` comprueba HTTP 403 para el cliente.

No hay evidencia de un fallo específico de iPhone: las condiciones de rol
impiden el diálogo del cliente en cualquier dispositivo.

## Payload y respuesta actuales

- OPEN_WHATSAPP S2: POST `/request-processes/:id/actions/open-whatsapp`,
  `{ expectedVersion, consentAccepted: true,
  consentTextVersion: 'availability-contact-v1' }`, con Idempotency-Key.
- Respuesta verificada por frontend: `result` con orderId, orderStatus y
  requestProcess, más navegación proporcionada por servidor cuando corresponde.
  No se reproducen teléfonos, enlaces con teléfono ni respuestas completas.
- START_WORK: POST `/request-processes/:id/actions/start-work`,
  `{ expectedVersion }`, con Idempotency-Key. Negocio: recibo orderStatus
  accepted y proceso IN_PROGRESS. Cliente: HTTP 403, mensaje exacto del código:
  «Solo el propietario del negocio participante puede comenzar el pedido».
- Esta revisión no ejecutó ninguna de esas mutaciones ni reprodujo el 403
  sobre un pedido real; evidencia de implementación y prueba backend local.

## Solicitud concreta para backend

Definir el contrato para que cada participante pueda confirmar por separado
que terminó su coordinación por WhatsApp. El usuario había establecido que
cada lado controla solo su propia pantalla e indicadores: la confirmación
del cliente no debe presentarse como una confirmación del negocio.

Backend debe decidir/documentar la acción autorizada del cliente, su payload,
el dato persistido por actor, su proyección de lectura/allowedActions,
versionado e idempotencia. Aclarar expresamente cuándo cambia el estado global
a IN_PROGRESS y qué ocurre si confirma uno solo. No basta con quitar el
403 ni habilitar el diálogo sin una acción con resultado real.

Conservar consentimientos independientes y bloqueo de contacto previo al
acuerdo. «No, aún no» debe mantener el proceso sin confirmar. Acordar la
compatibilidad con legacy y con retiro (que ya entra a IN_PROGRESS sin este
paso). No inventar campos ni endpoints desde frontend.

Con contrato probado/publicado en Railway QA, frontend puede extender el
seguimiento de regreso con identidad/rol propios, adaptar el texto del cliente
y conectar Sí/No a las acciones reales sin modificar la decisión del otro.

## Estado de entrega

Sin cambios funcionales: 0 pruebas nuevas y ningún build por ser diagnóstico.
Rama qa, HEAD `4f4b9e6`; Vercel QA último verificado READY para ese SHA.
Railway requeriría un bloque posterior coordinado; no se tocó en esta revisión.
Pendiente acuerdo backend y luego integración/prueba Android/iPhone.
Main y producción permanecen intactos. Documento local, sin commit ni push.
