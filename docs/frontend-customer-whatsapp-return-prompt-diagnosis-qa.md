# Cliente: aviso «¿Coordinación lista por WhatsApp?» al regresar

2026-10-29. Clasificación actual: **frontend + backend, pendiente de definir contrato**. El usuario aclaró que busca avisar al otro participante y cambiar realmente el estado de la solicitud al confirmar. No se implementa una mitad visual que aparente una confirmación no registrada.

## Solicitud y contrato actual

El usuario quiere que el cliente vea al regresar de WhatsApp la misma hoja que el negocio: «¿Coordinación lista por WhatsApp?», con las opciones «Sí, comenzar» y «No, aún no».

La hoja actual no es un aviso puramente visual. `StartWorkSheet` de `CoordinationSheets.tsx` dice que el negocio pasará a preparar el pedido. Su confirmación ejecuta START_WORK y cambia COORDINATING a IN_PROGRESS. El contrato `C:/dev/zipco-backend-qa/docs/testing/availability-continuation-contract-qa.md`, §estados, reserva esta transición al negocio.

`coordinationAllowed` comprueba allowedActions, acuerdo y rol. START_WORK requiere business=true. La tarjeta habilita la hoja únicamente para negocio, estado COORDINATING y permiso del servidor. El seguimiento de regreso también está limitado al negocio y no permite inferir que una conversación concluyó por abrir WhatsApp.

## API existente, payload y respuesta

- Abrir WhatsApp: POST `/request-processes/:processId/actions/open-whatsapp`; Authorization Bearer del participante, Idempotency-Key y headers de contrato existentes. Body: expectedVersion, consentAccepted=true y consentTextVersion cuando corresponde al flujo de disponibilidad. La respuesta autorizada incluye result y navigation; se valida/relee el estado y los permisos antes de navegar.
- Iniciar preparación: POST `/request-processes/:processId/actions/start-work`, mismos headers existentes. Body `{ "expectedVersion": <versión vigente> }`. El recibo normalizado incluye orderId, orderStatus y requestProcess actualizado a IN_PROGRESS. No es una declaración del cliente.
- Esta revisión no envió ninguno de esos POST ni hizo una lectura autenticada de un pedido. No se aporta como observada una respuesta de producción/QA; las formas anteriores provienen del código y contrato local.

Archivos involucrados: BusinessCoordinationCard.tsx (compartido por roles), CoordinationSheets.tsx, whatsappReturn.ts, useStartWorkPrompt.ts, useCoordination.ts y coordinationApi.ts, dentro de src/app/screens/requests. `whatsappReturnKey` exige actualmente contexto de negocio y el tracker marca salidas de esa cuenta; no sirve copiar solo la hoja al cliente.

## Decisión pendiente y coordinación requerida

Se preguntó al usuario si el cliente debe **confirmar y avisar al negocio** o **solo cerrar un recordatorio visual**.

1. Si debe declarar que ya coordinaron y avisar al negocio: **frontend + backend**. Backend debe definir antes la acción y permiso del cliente, payload/recibo, persistencia, visibilidad para ambos, idempotencia, aviso y si cambia algún estado. No se inventa un endpoint ni se concede START_WORK al cliente desde frontend. La confirmación de preparación del negocio debe distinguirse de la declaración del cliente, salvo nueva regla expresamente acordada. Si se solicita que cualquiera inicie IN_PROGRESS, requiere modificar la regla/contrato y validar backend primero.
2. Si es solo recordatorio visual: **solo frontend**. Puede reutilizar el diseño con texto acorde al rol y opciones que cierren/pospongan el aviso local, sin afirmar que se informó al negocio ni que cambió el pedido. El tracking debe aislar cliente/negocio, cuenta, proceso y acuerdo; aparecer tras una navegación autorizada a WhatsApp y su regreso, respetando exclusiones del camino local/comprobantes de reserva. No copiar «Pasarás a preparar el pedido» ni un «Sí, comenzar» que parezca ejecutar una operación inexistente.

La opción con efectos de servidor exige acordar el contrato, implementar/probar/publicar backend QA, confirmar la API y luego integrar frontend. Regla aplicable de [AGENTS.md](../AGENTS.md): detenerse y coordinar cuando implique «cambiar estados o transiciones» o «autenticación, permisos o roles»; no inventar campos ni implementar solo la mitad visual sin advertirlo.

Compatibilidad: conservar confirmación del negocio y pedidos existentes, allowedActions, consentimientos, reservas y exclusión de regreso de WhatsApp de comprobantes. No deducir pago, reserva efectiva, preparación o acuerdo a partir de visibilidad de la página, un clic o un marcador local.

## Estado de esta revisión

Solo se escribió este diagnóstico local. Sin cambios funcionales, pruebas de código nuevas, build, commit o despliegue para esta solicitud. Rama qa permanece en a7b3cc658c6960673a244ae8a8dada2b5c789828. No se modificó Railway, main, producción o pedidos; no se enviaron notificaciones ni mensajes externos. El diagnóstico del clic de notificaciones sigue pausado.

## Aclaración posterior del usuario

El usuario pide explicar su idea a backend y evaluar qué es mejor: que el holograma aparezca también al cliente, que confirmar pueda avisar al negocio o viceversa y que **«Sí» cambie el estado de la solicitud**. La opción de un recordatorio que solo se cierra deja de representar su intención.

### Mensaje listo para el chat de backend

**ZIPCO QA — confirmar coordinación por WhatsApp desde ambos participantes. Analizar regla y proponer contrato antes de implementar.**

Queremos reutilizar para cliente y negocio el diseño del holograma «¿Coordinación lista por WhatsApp?» que hoy ve solo el negocio al volver de WhatsApp. La idea es que quien confirme explícitamente que ya acordaron los detalles pueda producir un avance real del pedido, visible en ambos teléfonos, y avisar a la otra parte. No queremos un modal decorativo ni un cambio de categoría solo en frontend.

Recorrido deseado:

1. Cliente o negocio abre WhatsApp mediante el acceso autorizado de ese pedido y vuelve a ZIPCO. Abrir/regresar no significa que hayan coordinado y no debe cambiar automáticamente el pedido.
2. ZIPCO puede mostrar la misma hoja visual, con textos adecuados para cada rol. Propuesta de texto: «¿Ya coordinaron por WhatsApp?» / «Confirma que acordaron los detalles del pago y la entrega». Botones propuestos: «Sí, ya coordinamos» y «No, aún no». No presentar la declaración como un pago recibido.
3. «Sí» debe ejecutar una operación validada por backend, conservar quién confirmó y notificar/reflejar el resultado al otro participante. Ambos deben ver el estado real devuelto por servidor, conservando el pedido concreto y su acuerdo.
4. «No, aún no» o cerrar la hoja no debe confirmar ni avanzar el pedido. Se conserva el recorrido para continuar coordinando.

**Decisión que necesitamos de backend:** hoy START_WORK/start-work es exclusivo del negocio y significa iniciar preparación, con COORDINATING → IN_PROGRESS. La nueva confirmación del cliente no debe reutilizarlo sin revisar expresamente esa regla. Recomendamos distinguir «ya coordinamos» de «el negocio comenzó a preparar». Evalúa y recomienda si basta la confirmación de una parte, si se necesitan ambas o si la del cliente debe quedar pendiente de validación del negocio, indicando qué estado real y qué categoría verá cada uno en cada caso. El objetivo del usuario es avanzar el proceso; si una declaración individual no debe bastar para pasar a En curso, explica el estado intermedio o el acuse necesario. No imponer una regla nueva únicamente por el diseño del modal.

Entregar una propuesta concreta con tabla rol/estado/acción/resultado, semántica de avisos, campos y endpoints necesarios, allowedActions, recibos, expectedVersion, idempotencia, concurrencia (ambos confirman a la vez), reintentos inciertos sin duplicar avisos, pérdida/revocación de permisos y compatibilidad con pedidos/acuerdos existentes. Definir qué ocurre si uno ya confirmó, si vuelve a WhatsApp, si el pedido ya avanzó/cerró o si cambia de sesión; no repetir el holograma innecesariamente ni confirmar por el otro participante.

Mantener separados retiro local y WhatsApp de comprobantes/reservas: no introducir este holograma en variantes que hoy los excluyen. La coordinación no prueba pago, reserva, entrega ni inicio de preparación por sí sola. No inventar timestamps ni derivar confirmaciones de un GET, visibilidad de página, un marcador local o un enlace abierto.

Primero acordemos la regla y el contrato. Después, si se autoriza, backend implementa/prueba/publica solo Railway QA y entrega el contrato exacto; frontend integra el holograma y las acciones y publica solo Vercel QA. No habilitar al cliente desde frontend una acción de negocio ni simular estados/avisos. No enviar pushes artificiales, repetir confirmaciones, crear pedidos reales, alterar main/producción o retomar el diagnóstico pausado del clic externo para este análisis.

Archivos frontend de referencia: BusinessCoordinationCard.tsx, CoordinationSheets.tsx (StartWorkSheet), whatsappReturn.ts, useStartWorkPrompt.ts, useCoordination.ts y coordinationApi.ts. El contrato actual y el payload/recibo existentes están descritos arriba. **Este mensaje solicita análisis y propuesta; no declara acordado ningún nombre nuevo de endpoint, estado o acción.**
