# iPhone: banner QA a1f6da08 y aviso interno — evidencia física

2026-10-27, America/Santiago. Clasificación: requiere diagnóstico; siguiente cambio de contrato/telemetría o formato push requiere frontend + backend coordinados. Solo se prepara este traspaso, sin implementación funcional nueva.

## Hechos aportados por Bastián

- iOS 26.5.2. Solicitud nueva creada desde cero: no atribuir el caso a un aviso anterior.
- Captura del sistema a las 21:34 muestra «QA a1f6da08 · El negocio confirmó dis…».
- Al tocar el banner del sistema, ZIPCO vuelve al estado previo y no abre la tarjeta.
- El aviso dentro de ZIPCO sí abre la tarjeta. La captura muestra ese aviso sobre Perfil.
- QA confirmado por el usuario. No atribuir a producción ni pedir reinstalar.

## Recorrido recibido

Fuente local: adjunto ee903a32-b770-4a6b-a6de-ae7ccac1e1dd/Pasted text.txt. No se copia el contenido completo al repositorio ni datos de la captura de Perfil. CopiedAt 1793147937383. Frontend/controlador/activo 135e950a14c4d94664da438b8d697e231ba79e9e, revisión notification-click-attempt-v10, instrumentación habilitada. pageFlushCompleted=true, almacenamientos página/worker y lectura del worker disponibles. Standalone y alias QA esperado verdaderos. Un registro enumerado, scope raíz, activo controlador y script esperado.

Recorrido del aviso propio, correlación aleatoria dd4fc1ce-a738-4d33-a447-39deb34e1e6e:

- 1793147650034 notice-delivered.
- 1793147656651 toast-click, destino e identidad reconocidos.
- 1793147656652 app-target-received y app-target-accepted; Solicitudes montada con destino, sesión disponible, espera de carga sin error.
- 1793147657535 screen-target con destino cargado, sin error.
- 1793147657571 card-focused y app-target-ack.

Esto acredita el recorrido interno completo en el dispositivo, además de la confirmación del usuario. Los dos ack-mismatch del worker tienen hasTarget=false y corresponden al intento propio sin destino externo persistido. No confundirlos con un rechazo de navegación del banner ni con una acción comercial fallida.

En el informe no existe la correlación a1f6da08 ni etapas worker push-received/system-shown/click-received/click-failed/target-normalized/target-saved/navigation-posted. El worker consultado devuelve lecturas de recuperación sin destino y ACK del aviso propio. El inventario posterior contiene 19 avisos con destino válido, sin código/build/revisión de presentación; no prueba que el aviso de la captura nunca existiera: un aviso tocado puede desaparecer del inventario.

El código visible de la captura coincide con el prefijo aleatorio introducido por la instrumentación v10; esto vincula el banner a código instrumentado, pero no aporta su UUID completo, build exacto del presentador o almacenamiento accesible al controlador leído. La ausencia de etapas en esta copia no demuestra por sí sola que el handler nunca corrió. Se conserva límite de 50 filas por fuente/una hora; no declarar una causa física definitiva por ausencia.

## Contrato vigente y código revisado

E164/E166: C:/dev/zipco-backend-qa/docs/testing/availability-notification-identity-navigation-contract-qa.md. Backend QA 26ee14b, sin modificación.

- notifyAvailabilityEvent en src/notifications/push-notifications.service.ts envía type=order-availability-event, orderId, processId, processVersion, tag=order-{orderId}-availability-{processVersion}, url=/?open=requests-customer&orderId={orderId}, título y cuerpo aprobados.
- sendToUser selecciona suscripciones por userId y sendToTargets serializa ese payload sin formato declarativo. No se leyeron suscripciones, endpoints, claves o pedidos reales.
- Frontend public/push-sw.js v10: prefijo QA, escrituras diagnósticas incluidas en ciclo del evento, destino en caché, openWindow, navigate y postMessage. App.tsx recupera mensaje/URL/caché y espera sesión; RequestsScreen enfoca la tarjeta antes del ACK. Manifest y registro usan scope raíz. No falta simplemente añadir postMessage o esperar la lista.
- El API comercial y GET de pedidos permanecen sin cambios. No se necesita alterar el pedido para investigar.

## Interpretación y siguiente coordinación

La vía propia queda verificada. La investigación del sistema debe centrarse en vincular ejecución/persistencia del worker que presentó a1f6da08 con el controlador/contexto que lee la app. Considerar contexto distinto o almacenamiento fallido/no compartido como hipótesis; no afirmar una causa de iOS, parser, versión antigua o backend ya demostrada.

Hay reportes de comportamiento semejante en el registro oficial de WebKit, incluyendo ejecuciones push separadas y clic que solo reanuda la app: https://bugs.webkit.org/show_bug.cgi?id=268797#c40 . Son reportes de terceros, no prueba ni resolución del caso ZIPCO.

Para continuar sin repetir pruebas comerciales a ciegas, coordinar con backend un mecanismo QA de correlación de entrega/ejecución independiente del almacenamiento local, si se requiere. Backend debe definir primero los nombres/campos, permisos, acceso y límites; frontend no inventará un endpoint o enviará IDs/tokens/contactos a un registro nuevo. Mantener intactas las suscripciones existentes y las acciones de pedidos.

También puede evaluarse Web Push declarativo, descrito por WebKit en https://webkit.org/blog/16535/meet-declarative-web-push/ y Apple en https://developer.apple.com/videos/play/wwdc2025/235/ . Requiere acordar payload, destino permitido, compatibilidad y deduplicación con el worker existente antes de implementar. No garantiza por sí mismo resolver este caso; el mismo reporte contiene fallos de navegación declarativa en estados suspendidos. No hacer un cambio parcial en frontend o Railway sin contrato.

Mensaje para el chat backend:

> Nueva evidencia física en QA135e950/v10, iOS26.5.2. Solicitud NUEVA. Banner con código QA a1f6da08 visible; clic del sistema solo reanuda. Aviso propio probado físicamente y acreditado por toast-click → destino aceptado → sesión/lista listas → card-focused → ACK, correlación dd4fc1ce. El controlador/activo están sincronizados, scope raíz, un registro y almacenamiento/flush disponibles. No aparece a1f6da08 ni push/shown/click/target del sistema en el recorrido; no atribuir todavía al parser o a un worker viejo. ack-mismatch corresponde al clic propio sin destino externo y no es la causa. Se necesita correlacionar ejecución/almacenamiento del presentador con el contexto leído; evaluar observación QA independiente de Cache Storage y/o alternativa declarativa, definiendo contrato y permisos antes de implementar. Conservar pedido, suscripciones, payload vigente y producción; sin repetir confirmación ni reinyectar notificaciones reales.

## Estado de esta revisión

Solo documento nuevo en frontend QA. Sin pruebas/build nuevos porque no se modificó código. Rama qa, HEAD publicado 135e950a14c4d94664da438b8d697e231ba79e9e, Vercel QA Ready según verificación de la entrega previa; no otro commit/push ni despliegue en esta revisión. Pruebas anteriores de esa entrega son históricas, no una corrección física nueva. Railway, main, producción y pedido intactos. Pendiente coordinación; no se pide otra solicitud al usuario para obtener el mismo resultado.
