# Nuevo flujo de disponibilidad: revisión frontend y pedido al chat backend

Fecha: 24 de octubre de 2026. Frontend: `C:\dev\zipco-app-qa`, rama `qa`, referencia `56fb0e97`.

Clasificación: **frontend + backend**. Esta entrega es diagnóstico y documentación; no implementa backend, no cambia código de la aplicación y no ejecuta operaciones contra datos QA.

## Material revisado

En `C:\Users\Basti\Downloads\`: documentos 00, 01, 02, 03, 05 y 06; referencias p1-hoja-solicitud.png, p2-pendiente.png, p4-paso2-retiro.png y p5-disponible-retiro.png.

No se encontró `04_PANTALLA_4_...md`. Tampoco se encontraron las referencias `p3-nuevo-pedido.png`, `p5-disponible-whatsapp.png` ni otra captura p4 que cubra la elección inicial y la rama WhatsApp. La captura p4 recibida cubre solo el segundo paso de retiro. No reconstruir las partes faltantes como si estuvieran aprobadas.

Los documentos adjuntos son especificaciones para contrastar con el código; sus nombres propuestos de acciones/campos no son contrato de API aprobado.

## Contrato actual verificado en frontend

| Operación | Código | Contrato actual |
|---|---|---|
| Crear solicitud | `src/app/screens/CheckoutScreen.tsx:216-233`; `src/app/screens/createOrderApi.ts:10`, `61-77` | POST `/orders`, negocio, ítems con catalogItemId/quantity, nota, necesidad inmediata o fecha/hora y referencia. No existe permiso de WhatsApp en CreateOrderPayload. Respuesta normalizada: id, total, items y proceso opcional. |
| Aceptar original | `src/app/screens/requests/useRequests.ts:290-309` | Aceptación actual finaliza acuerdo y pasa a COORDINATION_PENDING; no es solo confirmar disponibilidad. |
| Autorizar contacto y abrir WhatsApp | `src/app/screens/requests/coordinationApi.ts:7-13`, `40-55`, `88-122` | POST `/request-processes/{id}/actions/authorize-contact` o `open-whatsapp`; cuerpo `{expectedVersion, consentAccepted:true}`; autenticación e Idempotency-Key. |
| Resultado de acción de coordinación | `coordinationApi.ts:100-122` | Recibo con orderId, orderStatus y requestProcess; OPEN_WHATSAPP agrega navigation o CONTACT_NOT_AVAILABLE. No se debe interpretar un GET fallido posterior como POST fallido. |
| Lectura tras acción | `coordinationApi.ts:125-132` | GET `/orders/my-orders?processContract=alternatives-v1` o `/orders/business/{businessId}?processContract=alternatives-v1`. Es una lectura separada de la respuesta del POST. |
| Consentimientos de lectura | `src/app/screens/requests/requestProcess.ts:19-32` | customerContactAuthorized y businessContactAuthorized dentro de coordination. No son un consentimiento anticipado guardado en una solicitud pendiente. |
| Acciones y normalización | `requestProcess.ts:3`, `46-101` | Lista cerrada de acciones conocidas; acciones nuevas requieren adaptar el frontend. Cierres y propuestas también se validan por contrato. |
| Agrupamiento | `src/app/screens/requests/requestStatusGrouping.ts:9-35` | No existe categoría específica para disponibilidad pendiente de decisión. No reutilizar una ronda de negociación solo por semejanza visual. |

No se capturaron nuevas respuestas de la API en vivo; lo descrito es el contrato consumido y validado por el código actual.

## Qué puede hacerse visualmente y qué queda condicionado

| Pantalla | Presentación posible sin cambiar contrato | Dependencias que impiden activar el flujo completo |
|---|---|---|
| 1: Requiero este producto | Composición de hoja y confirmación de envío en vista de desarrollo | Guardar permiso opcional, registrar versión del consentimiento y respetar elección en reintentos. No mostrar un interruptor operativo que luego se ignore al enviar. |
| 2: En espera | Ticket neón, detalle plegable, ubicación del botón de anulación, accesibilidad y movimiento reducido | Línea de permiso solo con dato autoritativo. No inferirlo de localStorage o del aspecto de la maqueta. |
| 3: Nuevo pedido | Estilo compacto, organización de acciones y despliegue de detalle | No sustituir funcionalmente Aceptar pedido por Confirmar disponibilidad usando ACCEPT_FIXED_ORDER actual. La explicación de compartir teléfono depende del camino elegido y de una autorización real. |
| 4: Elegir WhatsApp o retiro | Referencia parcial de diseño, falta documento completo | Nueva acción, estado de espera, persistencia del camino/mensaje/horario y consentimiento del negocio. |
| 5: Disponible | Diseño de referencia, sin resultado real simulado | Estado y lectura nuevos, continuar/cerrar, permiso modificable, navegación protegida y cambios de categorías. |

La Fase A no autoriza anunciar que se guardó un permiso que no existe ni cambiar el significado real de una acción existente. Las vistas de desarrollo deben distinguirse del flujo disponible al usuario QA.

## Discrepancias a resolver

1. **WhatsApp antes de decidir:** documento 05 y captura de retiro muestran Escribir por WhatsApp antes de Sí. El brief exige no compartir teléfonos hasta la decisión del cliente. Con ese requisito, el botón debe aparecer/habilitarse después de la decisión autorizada por servidor, o debe acordarse explícitamente otra regla. No usar un teléfono del listado ni saltarse la acción protegida.
2. **Consentimiento del negocio según camino:** el aviso de pantalla 3 promete compartir el teléfono al confirmar; retiro lo deja apagado por defecto. El consentimiento definitivo debe explicarse y capturarse en la confirmación del camino elegido, no afirmarse universalmente al abrir el diálogo.
3. **Consentimiento del cliente apagado:** pantalla 5 promete Ya pueden coordinar por WhatsApp incluso con permiso apagado. La frase solo es válida si la política y allowedActions devueltos efectivamente lo permiten. Si falta permiso, mostrar el siguiente paso real, sin prometer contacto habilitado.
4. **Retiro directo a En curso:** documento general lo describe como resultado, pero también lo deja abierto; brief pide confirmarlo. Backend debe proponer y producto acordar la transición antes de conectarla.
5. **Tarjeta de espera del negocio no diseñada:** el estado intermedio nuevo no puede usar sin más la tarjeta de coordinación actual, porque esta requiere acuerdo aceptado. Definir representación mínima fiel y datos disponibles hasta diseñar pantalla 6; no mostrar Pedido aceptado para una disponibilidad no aceptada por cliente.
6. **Alternativas/contrapropuestas:** existe Aceptar y autorizar contacto en `AcceptAuthorizeCard.tsx:37-56`, y seguimiento separado en `AcceptedProposalHost.tsx:28-38`, `98-118`. Acordar si el nuevo paso de decisión afecta únicamente a disponibilidad del original o también a esos caminos. No introducir una segunda confirmación accidental.
7. **Permiso inicial marcado:** los documentos lo dejan pendiente de validar. No tratar esa decisión abierta como consentimiento ya confirmado por el servidor.
8. **Texto de envío:** Consulta enviada coincide con documento 01 y captura; no mostrar dos confirmaciones de éxito.

## Mensaje para copiar al chat backend

Se solicita **análisis de impacto y propuesta de contrato, sin implementar todavía**. Leer `06_BRIEF_BACKEND.md` y `00_INSTRUCCION_GENERAL_FRONTEND.md` como contexto; incorporar las discrepancias enumeradas arriba.

El flujo deseado es: cliente consulta disponibilidad con permiso opcional condicionado; negocio confirma disponibilidad y elige WhatsApp o retiro; cliente decide continuar o cerrar; después se habilita coordinación o la transición de retiro acordada. Confirmar disponibilidad no equivale a aceptar la compra ni puede mantener silenciosamente el efecto de ACCEPT_FIXED_ORDER.

Entregar:

1. Matriz de estados, actores, transiciones y allowedActions; nombres definitivos definidos por backend.
2. Acciones/endpoints propuestos, cuerpos y respuestas mínimas para crear con permiso, confirmar disponibilidad, continuar/cerrar y gestionar el permiso. Especificar expectedVersion, idempotencia y errores recuperables.
3. Lectura de ambas listas: camino, mensaje, horario/dirección, permiso propio, permisos que puede conocer la contraparte, referencia exacta de condiciones/precio y acciones disponibles. No exponer teléfonos en listados ni antes del momento acordado.
4. Momento de creación del acuerdo inmutable y significado de sus timestamps; cómo preservar las condiciones que el cliente confirma. No reutilizar createdAt/updatedAt como fecha de disponibilidad o decisión.
5. Persistencia y vigencia de consentimientos por titular/destinatario, versión del teléfono y texto; comportamiento al apagar el permiso, cambiar teléfono o reintentar una operación con elección distinta.
6. Política explícita de retiro con WhatsApp opcional: momento de contacto, consentimiento requerido de cada lado, transición a preparación, aviso y recepción. Resolver la contradicción de mostrar WhatsApp antes del Sí.
7. Compatibilidad de clientes anteriores, registros existentes y propuestas/contrapropuestas; cambios de esquema/migraciones solo si son necesarios. No cambiar el efecto de acciones antiguas sin una estrategia de compatibilidad.
8. Concurrencia con anulación/rechazo, reglas sobre horarios vencidos, posible vencimiento de disponibilidad, eventos y notificaciones.
9. Confirmación de lo reutilizable y de lo que no puede lograrse con el contrato actual. Después de acordar el contrato, seguir orden de implementación y pruebas QA del workspace; no tocar producción.

Frontend no debe adoptar nombres ilustrativos como `path`, `customerMessage` o un estado nuevo hasta recibir el contrato acordado. Tampoco debe inventar una respuesta de servidor para mostrar estas tarjetas.

## Estado de entrega

- Archivos de código modificados: ninguno.
- Archivo añadido: este diagnóstico.
- API/datos: ninguna operación ejecutada; contrato revisado por lectura de código.
- Pruebas/build: no ejecutados; no hay cambio funcional en esta entrega.
- Commit nuevo: ninguno. Rama frontend: qa.
- Vercel QA: sin despliegue nuevo.
- Railway QA: sin cambios; coordinación de contrato pendiente en su chat.
- Main y producción: no modificados.
