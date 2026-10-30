# Coordinación compartida dentro del pedido — frontend QA

Fecha: 2026-10-30. Rama qa, base 612d059.
**Clasificación: frontend + backend coordinados; esta entrega modifica solo frontend.**
Contrato publicado previamente en Railway QA dd00391:
C:/dev/zipco-backend-qa/docs/testing/whatsapp-shared-access-contract-qa.md.

## Resultado

- Antes del primer acceso autorizado: se presenta la tarjeta existente «Ya puedes coordinar por WhatsApp», con sus condiciones y botón Iniciar. No se rehace el diseño aprobado.
- OPEN conserva su recibo, lectura posterior, holograma de redirección de tres segundos y destino autorizado. La tarjeta que ejecuta la salida permanece montada mientras termina; la llegada del permiso CONFIRM no interrumpe el controlador.
- Al regresar, aparece la consulta dentro de la tarjeta asociada. El otro participante la recibe al actualizar su lectura aunque no tenga un marcador local de apertura.
- El permiso CONFIRM del servidor habilita la primera consulta. COORDINATING o DECLINE solos no acreditan acceso compartido; no se muestran botones de declaración para sortear un permiso ausente.
- Se conservan la pregunta y Sí/No de la contraparte dentro de su pedido, la espera sin autorrespuesta, Falta → Devolver/Cancelar, negativa persistida, nuevo intento autorizado, salida/avisos/contadores, animaciones y detalle ya aprobados. No se presenta además un holograma flotante de consulta en este flujo bilateral.
- El retorno es presentación local. Nunca manda un Sí ni modifica un estado automáticamente. No se resetean pedidos antiguos: un acceso previo válido sigue siendo válido.

## Implementación

- ProcessOrderCard.tsx monta el controlador de coordinación desde COORDINATION_PENDING para que la actualización del primer OPEN no destruya el componente que prepara la navegación.
- WhatsappCoordinationPanel.tsx usa CONFIRM/RESPOND y resúmenes existentes como autoridad; elimina la exigencia de apertura propia del realce de retorno.
- whatsappReturn.ts incorpora una retención transitoria por pedido/acuerdo/participante en memoria. Conserva la presentación anterior durante OPEN y hasta la salida registrada. No crea un campo de API, permiso, prueba compartida o evento de negocio. El marcador local de navegación existente conserva su esquema y recuperación tras reiniciar.
- useCoordination.ts libera esa retención al terminar/cancelarse la operación y conserva el holograma, el destino validado y las intenciones exactas. Una reapertura desde una consulta ya visible conserva esa consulta sin desmontar el controlador; sus respuestas se bloquean mientras sale.
- coordinationApi.ts actualiza el mensaje de CONTACT_REQUIRED al significado de acceso compartido, sin exigir que ambos abran personalmente WhatsApp.

Archivos fuente: los cinco anteriores, bajo src/app/screens/requests/.
Pruebas: whatsappReturn.test.ts y scripts/check-coordination-inline.mjs.
Documentación: este informe y el diagnóstico histórico frontend-whatsapp-first-access-sequence-handoff-qa.md.
Los documentos ajenos previamente no rastreados quedan fuera del commit.

## Campos, endpoints y recuperación

Sin campos, endpoints, capacidades, headers ni flags nuevos.
Se usan state, version, allowedActions, agreementPublicId, consentimientos, whatsappCoordination y whatsappCoordinationInitialDecline.

- GET /request-process-capabilities y lecturas actuales /orders/my-orders, /orders/business/:id.
- POST /request-processes/:id/actions/open-whatsapp.
- POST /request-processes/:id/actions/confirm-whatsapp-coordination.
- POST /request-processes/:id/actions/respond-whatsapp-coordination.
- POST /request-processes/:id/actions/decline-whatsapp-coordination.

Se mantienen Bearer, Idempotency-Key, expectedVersion, contratos de proceso, whatsapp-coordination-v1 y whatsapp-coordination-initial-decline-v1, cada uno en su cabecera correspondiente. No se fabrican confirmationId ni timestamps.

La UI no confunde recibo con navegación física ni con mensajes/pagos realizados. Los errores conservan intención/cuerpo/clave; no hay reintentos automáticos ni conversión de un conflicto en RESPOND. Sesión, acuerdo y fases posteriores siguen invalidando las acciones que correspondan.

## Validación

- 1.715 pruebas unitarias aprobadas en 130 archivos.
- 28 escenarios de coordinación en Chrome local aprobados. Diez nuevos cubren ambos iniciadores, retención de tarjeta/holograma, regreso, Sí de contraparte sin OPEN propio, consulta por lectura sin marcador propio, estado histórico/DECLINE sin CONFIRM, fallo sin reintento y reapertura desde una consulta existente.
- Los escenarios anteriores conservan negativa/Cancelar/doble toque/recarga/nuevo intento, Sí/No bilateral, envío incierto con misma intención, recibo seguido de lectura fallida, varias tarjetas/Ver, producto independiente, capacidades, Listo, detalle/condiciones/anulación/revocación, movimiento reducido y navegación inferior.
- Diez regresiones de disponibilidad aprobadas: retiro local a 320/390/430 px, WhatsApp sin consentimiento, rechazo, retirada y aceptación de alternativas/contrapropuestas.
- Build QA/PWA aprobado, 2.313 módulos. Advertencia conocida del bundle principal mayor de 500 kB. No hay scripts separados de lint/typecheck y no se declara su ejecución.
- Captura de la consulta del cliente revisada tras el retorno; diseño y CSS aprobados conservados.

HTTP y navegación externos simulados en las pruebas locales. El fixture intercepta exclusivamente la llamada a location.assign para comprobar el destino sin abrir WhatsApp real; no sustituye el controlador, los recibos o los componentes de la aplicación. El conteo no suma otra vez la ejecución parcial de los mismos casos.

Preparación: Chrome necesitó ejecutarse fuera del sandbox; el build PWA usó un directorio temporal dentro del workspace. Las primeras ejecuciones detectaron un desmontaje al insertar el controlador tras OPEN y esperas frágiles del fixture al cambiar de rol; se corrigieron antes de la validación completa.

No se crearon pedidos, confirmaciones, mensajes ni pushes reales. Las pruebas no acreditan comportamiento físico de iOS/Android.

## Publicación y pendientes

Publicación exclusivamente por la rama qa en Vercel QA; el SHA y estado Ready se comprueban antes de entregar.
Alias: https://zipco-app-git-qa-zipco-s-projects.vercel.app.
El cierre incluye el commit exacto que incorpora este informe.

Railway no se modifica: se consume el contrato ya publicado dd00391.
Sin migraciones, variables nuevas, cambios en main, C:/dev/zipco-app o producción.
Pendiente: prueba física de ambos iniciadores y participantes en iPhone/Android tras actualizar frontend QA.
El fallo del clic externo del iPhone continúa pausado.
