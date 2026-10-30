# Prompt para backend: reservas de retiro y coordinación por WhatsApp

Necesito primero un análisis de impacto y una propuesta de contrato. NO
implementes todavía: no cambies código de aplicación, no generes ni ejecutes
migraciones, no publiques ni modifiques frontend, Railway, main o producción.
Puedes preparar documentación del diagnóstico en tu repositorio según sus reglas.
Antes de una futura implementación, debemos cerrar diseño, contrato y decisiones.

Clasifica este trabajo como frontend + backend. Verifica el código actual,
contratos y despliegues; distingue lo existente de lo propuesto y de las dudas
pendientes. No interpretes nombres de pantallas como estados/endpoints ya aprobados.

## 1. Objetivo del usuario

El negocio confirma disponibilidad de un producto, pero el cliente puede tardar
15 minutos en llegar y encontrarlo agotado. Queremos que el negocio ofrezca:

- Sin reserva: el cliente compra por orden de llegada, sujeto a existencias.
- Reserva sin pago previo: solicitud de que le guarden el producto hasta un plazo.
- Reserva con pago previo: abono o pago completo exigido por el negocio para
  guardarlo; el cliente envía el comprobante por WhatsApp y el negocio lo revisa.

ZIPCO no procesa ni verifica pagos bancarios, no lee WhatsApp y no sabe si se
adjuntó un comprobante. Solo puede registrar decisiones y declaraciones de los
participantes. No debemos presentar abrir WhatsApp como pago realizado, mensaje
enviado, reserva confirmada o producto recibido.

En el camino de reserva con pago, el WhatsApp para enviar el comprobante ya forma
parte de la coordinación de esa reserva. No pedir después «Iniciar coordinación»
otra vez ni mostrar el diálogo genérico «¿Coordinación lista por WhatsApp?».
La siguiente decisión real es que el negocio confirme pago recibido y producto
guardado. Esa confirmación no debe figurar como una acción realizada por el cliente.

## 2. Base actual que debes comprobar

Frontend QA aprobado: c598ac0354463b202f4b428d5104d91149e92e9d, rama qa.
Backend S2 cuya publicación se confirmó previamente: 41f62ed; verifica tu HEAD
y despliegue actuales, sin asumir que no hubo avances posteriores.

Documentos:

- C:/dev/zipco-backend-qa/docs/testing/availability-continuation-v1-implementation-qa.md
- C:/dev/zipco-app-qa/docs/frontend-availability-continuation-s2-qa.md
- C:/dev/zipco-app-qa/docs/frontend-alternative-direct-open-qa.md
- C:/dev/zipco-app-qa/docs/frontend-required-pickup-fields-handoff-qa.md
- C:/dev/zipco-app-qa/docs/frontend-customer-whatsapp-return-diagnosis-qa.md

Situación funcional actual:

1. POST /orders/availability-requests crea productos de precio fijo con marcador
   AVAILABILITY_V1 y customerContactPreference explícita. S1 por sí sola no activa
   permisos efectivos. Servicios/cotizaciones siguen fuera de esta creación.
2. Proceso AWAITING_BUSINESS_RESPONSE, pedido pending y sin acuerdo. Cliente ve
   EN ESPERA; negocio ve NUEVO PEDIDO en Pendientes.
3. Confirmar disponibilidad solo abre el selector local WhatsApp/retiro.
4. Elegir WhatsApp envía confirm-availability directamente. Elegir retiro abre
   mensaje, horario/dirección y permiso opcional propio del negocio; guardar
   envía esa acción. No se guardan decisiones al solo abrir/cerrar el selector.
5. POST /request-processes/:id/actions/confirm-availability guarda un plan
   inmutable: estado AWAITING_CUSTOMER_CONTINUATION, versión +1, pedido pending
   y sin acuerdo. Cliente: Por responder/DISPONIBLE; negocio: Esperando respuesta.
6. El cliente continúa con continue-request sobre versión/propuesta/plan exactos:
   versión +2, crea acuerdo. WHATSAPP -> COORDINATION_PENDING; LOCAL_PICKUP ->
   IN_PROGRESS, etiqueta D48 Pendiente de retiro en el local. Hoy el retiro NO
   implica reserva, pago verificado ni garantía de inventario físico.
7. Decline-request y withdraw-availability cierran sin acuerdo; cancel-pickup
   permite cancelar retiro antes de READY con motivo y conserva el acuerdo.
8. Ambos consentimientos efectivos son necesarios para obtener navegación de
   WhatsApp. No se entrega teléfono/URL antes de la decisión que crea el acuerdo.
9. OPEN_WHATSAPP puede pasar COORDINATION_PENDING a COORDINATING. START_WORK
   actual solo lo permite al negocio en COORDINATING y pasa a IN_PROGRESS.
   El cliente está bloqueado con 403; su confirmación independiente sigue pendiente.
10. Las lecturas de listas, propuestas y acuerdo usan
    ?processContract=availability-v1. Pedidos legacy conservan su contrato.

Payload actual ilustrativo de retiro, con IDs sintéticos:

```json
{
  "expectedVersion": 1,
  "proposalId": 901,
  "fulfillment": {
    "path": "LOCAL_PICKUP",
    "customerMessage": "Acércate al local a pagar y retirar.",
    "scheduleOrAddress": "Hasta las 19:00",
    "allowCustomerWhatsapp": false
  }
}
```

Si permite contacto se añade businessContactConsent propio y explícito, versión
availability-business-whatsapp-v1. Continue-request añade la referencia exacta
availabilityConfirmationId, conditionsAccepted:true y la preferencia final propia
del cliente con versión availability-customer-whatsapp-v1. No autoriza por el otro.

Recibos actuales: orderId, orderStatus y requestProcess, con versión, estado,
propuesta/acuerdo, flowContract y availability cuando corresponda; las acciones
nuevas devuelven allowedActions vacío y frontend relee las acciones autorizadas.
Conservar idempotencia, exactitud de versiones y recuperación de respuestas perdidas.

Frontend en C:/dev/zipco-app-qa/src/app/screens/requests:
AvailabilityFlowCard.tsx; availability-design/AvailabilityDesign.tsx;
availabilityChoice.ts; availabilityApi.ts; availabilityContract.ts;
useAvailability.ts; ProposalNegotiation.tsx; proposalContract.ts; agreement.ts;
useCoordination.ts; BusinessCoordinationCard.tsx; requestStatusGrouping.ts.
También CheckoutScreen.tsx y RequestsScreen.tsx en src/app/screens.

En backend revisa DTO, planes, propuestas/acuerdos, políticas y servicio de
coordinación. Existen columnas reservationAmountClp en propuesta/acuerdo; su
existencia no prueba que soporten este caso. El normalizador frontend de
propuestas actual exige reservationAmountClp nulo. Audita usos, invariantes y
compatibilidad antes de reutilizar ese concepto o devolverlo con valor.

## 3. En qué momento aparece lo nuevo

No agregar una pantalla antes de WhatsApp/retiro. La configuración de reserva
se integra dentro del formulario Retiro en el local del negocio:

- Mensaje e indicaciones de retiro actuales.
- «¿Ofreces reservar este producto?» con Sin reserva / Sin pago previo / Con pago.
- Si ofrece reserva: plazo explícito de vigencia.
- Si exige pago: monto, si es abono o pago completo, e instrucciones de pago.

Todo es borrador hasta confirmar disponibilidad o enviar la propuesta comercial.
Ofrecer la posibilidad de reservar todavía no significa que el cliente reservó
ni que el negocio haya apartado existencias.

En DISPONIBLE del cliente se muestran las condiciones exactas ofrecidas:

- Sin reserva ofrecida: conservar continuar/no gracias, aclarando que ir al local
  está sujeto a disponibilidad al llegar.
- Si ofrece reserva: Solicitar reserva / Iré sin reserva / No, gracias.
- Reserva con pago: puede usar «Solicitar reserva con pago previo».
- Llegada estimada (15/30/60 minutos) y nota opcional dentro de la misma vista;
  solo admitir llegadas compatibles con el plazo ofrecido. No reutilizar un
  campo comercial de fecha con otro significado para guardar esta estimación.

## 4. Recorridos que deben quedar diferenciados

A) Compra sin reserva, WhatsApp: mantener coordinación actual. Posible texto de
diseño «Acordar pago y entrega por WhatsApp». No promete producto guardado.

B) Retiro sin reserva: continuar por el camino actual de retiro, sin inventar
reserva. Que el negocio ofrezca reservar no obliga al cliente a hacerlo.

C) Reserva sin pago: el cliente solicita; muestra «Reserva solicitada, esperando
confirmación del negocio». El negocio confirma que guardará producto/cantidad
hasta el plazo acordado. Entonces mostrar «Reserva confirmada hasta…».
No declarar la reserva confirmada al solo enviar la solicitud. No exigir un
comprobante inexistente en esta modalidad. Define qué contacto necesita.

D) Reserva con pago previo:
1. Cliente ve monto, condiciones y plazo antes de confirmar su solicitud.
2. Acepta y solicita la reserva; respetar las condiciones de creación del acuerdo
   y consentimientos antes de entregar contacto.
3. Botón «Enviar comprobante por WhatsApp». Navegación autorizada por servidor,
   con texto contextual del pedido/reserva; adjuntar el archivo es manual.
4. Al volver: «Reserva pendiente de confirmación del negocio» y «Volver a WhatsApp».
   No afirmar que el comprobante se envió ni volver a pedir iniciar coordinación.
5. Negocio: acción explícita para declarar que recibió el pago requerido y que
   guardará el producto. No confundir declaración del negocio con verificación
   bancaria de ZIPCO. Rechazar o indicar incidencia requiere tratamiento definido.
6. Tras confirmación: «Reserva confirmada hasta… · Pendiente de retiro»; contacto
   posterior contextual, por ejemplo «Consultar sobre mi retiro por WhatsApp».
   Continuar hacia Listo/recepción usando reglas compatibles que tú propongas.

Los textos anteriores son funcionales/descriptivos: propone estados, acciones
y endpoints técnicos; no los declares implementados ni aprobados.

## 5. Privacidad, pago y WhatsApp

La reserva con pago necesita WhatsApp para el comprobante, pero eso NO autoriza
automáticamente teléfonos. Cada titular consiente únicamente su propio número.
Analiza qué ocurre si falta un permiso, el número cambia o no es válido:
la UI debe explicar qué falta y ofrecer continuar sin reserva cuando corresponda,
sin filtrar teléfonos ni simular WhatsApp habilitado.

No introducir una pasarela, integración bancaria, WhatsApp Business API,
webhooks de mensajes, OCR o almacenamiento de comprobantes como si ya fueran
necesarios. Primero evalúa si bastan las acciones/datos propios y la navegación
existente. Cualquier integración adicional se propone y justifica por separado.
El mensaje preparado no dice «adjunto comprobante» como hecho ya acreditado.

## 6. Reglas y dudas que tu análisis debe cerrar

- Cuándo se crea el acuerdo y qué compromiso existe en cada instante.
- Separación entre ofrecer reserva, solicitarla, declarar pago recibido y confirmarla.
- Cómo representar la reserva frente al estado global existente y sus categorías
  de cliente/negocio. No convertir OPEN_WHATSAPP en pago ni en START_WORK automático.
- Qué reemplaza START_WORK en la rama con reserva para evitar doble coordinación
  y cuándo se habilitan preparar/Listo/recepción. El camino actual sin reserva
  debe conservar su funcionamiento. No generalizar el permiso del cliente para
  START_WORK sin cerrar el contrato independiente que sigue pendiente.
- Plazo para solicitar, plazo para pagar y plazo máximo de retiro: no asumir que
  son la misma fecha. Propón una solución mínima comprensible y marca las
  decisiones pendientes. Horas canónicas de servidor; America/Santiago al mostrar.
- Vencimiento automático e idempotente, concurrencia confirmar/vencer/cancelar,
  trabajos reiniciados/reintentados y avisos. No reutilizar createdAt/updatedAt
  como si fueran la hora de llegada, pago, confirmación o vencimiento.
- Si vence una reserva, definir si termina solo la reserva o también el pedido;
  no cancelar ni borrar silenciosamente un acuerdo o pedido pagado.
- Si se declaró pago recibido, cancelación, vencimiento y no presentación no
  deben inventar devolución automática ni afirmar reembolso. Proponer el
  tratamiento y las decisiones comerciales que necesitan aprobación.
- Stock: revisar si existe inventario transaccional. Diferenciar compromiso
  declarado del negocio de bloqueo/descuento real de existencias; no afirmar que
  se libera stock automáticamente si solo se cambia un indicador.
- Cantidades y pedidos con varias líneas: precisar reserva de todo el pedido o
  por producto y evitar reservar solo parte sin decisión explícita del cliente.
- Monto CLP válido, relación abono/total, pago completo, texto y límites. Nunca
  cambiar precios/propuestas aceptados para representar la reserva o su pago.
- No mostrar disponibilidad/pago/reserva como realizados por la otra parte sin
  su acción correspondiente. Auditoría por actor y allowedActions fiables.

## 7. Alternativas, compatibilidad y trabajo pendiente

Incluir alternativas y contrapropuestas desde el diseño del contrato. La primera
alternativa del negocio elige camino al final del formulario; contrapropuesta
del cliente hereda el plan; la propuesta final conserva camino e instrucciones
sin volver a preguntar (comportamiento frontend aprobado). Analiza cómo se
conservan las condiciones de reserva, qué ocurre si cambia el precio y cómo
se obtiene una nueva aceptación exacta sin editar un plan/acuerdo inmutable.

No migrar por inferencia pedidos viejos a reserva. Conservar legacy, S1, S2 sin
reserva, lectores antiguos y recibos/reintentos de acciones ya confirmadas.
Evaluar si se requiere nuevo opt-in/versionado para que frontend viejo no oculte
datos ni permita saltarse condiciones nuevas. No activar a medias en QA.

La obligatoriedad de mensaje y horario/dirección de retiro fue solicitada antes
y sigue en un diagnóstico separado: verifica su estado real. No declararla
implementada ni mezclarla silenciosamente con las nuevas condiciones de reserva.
Servicios y cotizaciones quedan para un bloque posterior; no ampliar el alcance
de reservas de productos sin una decisión explícita.

## 8. Entregables de esta fase, sin implementación

1. Inventario verificado: qué existe, qué se puede reutilizar y qué falta, con
   archivos y líneas. Contrato actual, payload enviado y respuesta/proyección.
2. Comparación actual/propuesto y mapa de momentos visibles para cada actor:
   categoría, texto, estado global, estado de reserva y acciones disponibles.
3. Diagrama de estados/transiciones por actor; distingue sugerencias de contrato.
4. Campos/entidades/acciones/endpoints/lecturas/notificaciones necesarias con
   ejemplos JSON sintéticos, errores, versiones, idempotencia y recuperación.
5. Matriz de compatibilidad y análisis de impacto en S2, legacy, alternativas,
   contactos, Listo/recepción, cancelación y vencimiento.
6. Persistencia: si requiere migraciones, alcance, riesgos, estrategia de
   despliegue/reversión y autorización necesaria. No prepararlas ni ejecutarlas aún.
7. Plan de pruebas: concurrencia, reintentos, vencimiento, límites, permisos y
   ausencia de duplicados o confirmaciones falsas. No afirmar pruebas ejecutadas.
8. Decisiones que necesita tomar el usuario antes de implementar, separadas de
   decisiones técnicas que puedes proponer. Recomienda un flujo mínimo completo.
9. Handoff frontend con contrato y orden de publicación: backend probado y QA
   confirmado primero, luego integración frontend compatible y prueba en celulares.

Entrega el análisis documental primero y espera aprobación del contrato y diseño.
Este prompt no autoriza implementar, aplicar migraciones o desplegar cambios.
