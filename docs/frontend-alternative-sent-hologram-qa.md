# UI-ALTERNATIVE-SENT-HOLOGRAM-01 — Confirmación de alternativa y ubicación

2026-10-20. Clasificación: **solo frontend**. Base conservada 7cae07c.
Continuidad de [REQ-FRONTEND-ALTERNATIVES-V1-01](frontend-alternative-negotiation-qa.md).

## Antes / Después

Antes: al confirmar el envío se cerraba el formulario y se actualizaban listas,
sin explicar visualmente dónde continuaba el pedido. El formulario nuevo no usaba
el holograma del envío legacy.

Después: solo tras validar el recibo exitoso del POST de alternativa inicial o
propuesta final se muestra el holograma existente de Solicitudes durante 2800ms.
Título «Alternativa enviada al cliente» o «Propuesta final enviada al cliente».
Mensaje común:

> En Mi Negocio queda en «Esperando respuesta». El cliente la encontrará en «Por responder».

Son los nombres actuales de las pestañas; no se renombra la vista del cliente ni
se cambia el estado/categoría. No se fuerza cambiar de pestaña al negocio.

## Diseño recuperado y archivos

Se reutiliza directamente activeTransfer de RequestsScreen.tsx: tarjeta violeta
sobre fondo oscuro, icono Check, clases zipco-hologram-card y zipco-flow-hologram,
animación/duración existente y preferencia de movimiento reducido. Referencias
adicionales: holograma legacy de BusinessOrdersTab.tsx y otros de Solicitudes.
No se copia el antiguo momento de emisión durante la petición: aquí se exige
primero el recibo confirmado, para no anunciar un éxito si el envío falla.

- src/app/screens/requests/proposalSentFeedback.ts: validación del recibo, mensaje,
  evento local, deduplicación por pedido/proceso/propuesta/acción y limpieza.
- src/app/screens/requests/ProposalNegotiation.tsx: emite feedback después del
  recibo confirmado, junto a la actualización existente de listas/contadores.
- src/app/screens/RequestsScreen.tsx: conecta el evento con el holograma existente
  en el nivel de pantalla. No desaparece al desmontarse la tarjeta filtrada.
- proposalSentFeedback.test.ts y RequestsScreen.notificationNavigation.test.ts:
  cobertura de éxito/error/repetición, temporizador, otras confirmaciones y filtro.
- scripts/check-alternative-negotiation.mjs: verifica que el evento salga solo al
  negocio tras alternativa/final confirmada; nunca por fallo ni contrapropuesta cliente.

La suscripción sigue viva al cambiar la lista. Los mensajes duplicados no reinician
la duración. Al desmontar Solicitudes se eliminan listener/timer. Un temporizador
de esta confirmación no borra otro holograma que lo haya reemplazado.
No se agregan esperas al POST ni se ralentiza la actualización de listas.

## API conservada

No hay campos ni endpoints nuevos, carga de datos ni transición adicional.
Se lee el recibo ya validado: orderId, orderStatus y requestProcess con id,
currentProposalId, state y agreementPublicId. Acciones existentes PROPOSE_ALTERNATIVE
y PROPOSE_FINAL. El evento zipco-proposal-sent es solo comunicación local de UI,
no un evento de servidor, push, toast ni notificación adicional al cliente.
Se conservan allowedActions, confirmación, versiones, UUID de reintento y envío
del contrato. Backend/Railway no requieren modificación.

## Validación

1135 pruebas en97 archivos aprobadas,10 casos nuevos. Build QA/PWA aprobado;
advertencia existente de tamaño de bundle >500kB. Doce recorridos táctiles Chrome
sintéticos de integración/regresión: incluyen clic repetido, envío fallido sin
feedback de éxito, primera alternativa y final con un único evento; sin acciones
QA reales ni cargas reales. El test de RequestsScreen comprueba que el holograma
sigue visible al salir el pedido de Pendientes y respeta el filtro seleccionado.

Pendiente ver este holograma en Android/iPhone: enviar una alternativa QA nueva,
observar título y ubicación, comprobar Esperando respuesta en negocio y Por
responder en cliente. No repetir la alternativa ya confirmada para probarlo.
Pruebas físicas restantes de negociación y reintentos fiables de notificaciones
siguen pendientes; este feedback no los resuelve.

## Entrega

Commit/push qa y Vercel Preview QA, conservando el override temporal de build y
Backend QA. Guardar nombre/código y resultado al comprobar READY. Sin modificar
backend, Railway, main, producción ni avances anteriores.

## Publicación comprobada — 2026-10-20

Código `0ef735603d90b8a9945ad5aa15e3fa52bc86a7f6` enviado a origin/qa.
Preview funcional **READY**, `dpl_4ejeKr2upMVYSRcwEcYrt2U4g1hb`, URL propia
https://zipco-li4t79iyn-zipco-s-projects.vercel.app. Fuente GitHub/SHA exacto, build
QA completo y alias habitual comprobados. Backend QA configurado conservado;
build global null y rama de producción main sin cambios.

Este resultado, el catálogo y el paso reportado por Bastián se guardan en un cierre
documental posterior de qa, cuya publicación mantiene el mismo código funcional
y override QA. Su SHA será la versión visible final. No se acredita aún la prueba
física del holograma nuevo; el resto de validaciones integradas sigue pendiente.

## Comprobación confirmada por Bastián — 2026-10-21

Bastián confirmó: «listo funcionó el holograma», después de la publicación QA
`a7a08bfbee9ee24b571e601879f8b1dce7f34e84` y de explicar el recorrido de envío.
Queda aprobada la aparición del holograma de alternativa enviada, código
`0ef735603d90b8a9945ad5aa15e3fa52bc86a7f6`, UI-ALTERNATIVE-SENT-HOLOGRAM-01.
Esta comprobación sustituye el pendiente general del holograma anterior.

El mensaje no especifica dispositivo ni acredita por separado la propuesta final,
fallos/reintentos o todas las respuestas de negociación. No extender esa aprobación
a ambos sistemas móviles ni cerrar los reintentos fiables de notificaciones.
No repetir acciones del pedido ya confirmadas para registrar la comprobación.

Cierre solo documental: esta ficha y catálogo. Sin cambios en código, campos,
endpoints o comportamiento. Validación: revisión del diff y referencias; sin
repetir pruebas de código para documentación. Commit/push qa y publicación QA
con el mismo código funcional y opciones de build; backend, Railway, main y
producción conservados.

Cada publicación debe explicarse brevemente al usuario con qué cambia en la app,
dónde se ve y cómo se comprueba, además del commit y versión QA. En una subida
documental se debe indicar claramente que el comportamiento permanece igual.
