# Disponibilidad por WhatsApp: clic de notificación que no abre Solicitudes

2026-10-27. Incidente durante pruebas físicas finales. Frontend publicado: qa `790c8cd158c66d84276fbfe07d5ba3ad2470cb33`. Clasificación: requiere diagnóstico antes de decidir. No se modifica el protocolo push sin coordinar conforme a AGENTS.md.

## Caso recibido

Cliente iPhone crea solicitud; negocio confirma disponibilidad con camino WHATSAPP. La notificación llega, pero tocarla conserva la pantalla anterior (Inicio, Perfil o catálogo). El usuario reporta ambos accesos: notificación del sistema con app en segundo plano y aviso recibido dentro de la app. No es una consulta Fuera de hora ni una confirmación LOCAL_PICKUP.

No se repite CONFIRM_AVAILABILITY, no se consulta una acción por POST, no se modifica el pedido y no se generan notificaciones reales para reproducirlo.

## Contrato existente leído

Backend, solo lectura: `src/notifications/push-notifications.service.ts`, método notifyAvailabilityEvent. Payload conocido por código, NO capturado de este teléfono:

```text
type: order-availability-event
orderId: ID del pedido
processId / processVersion: ID y versión existentes
tag: order-{orderId}-availability-{version}
url: /?open=requests-customer&orderId={orderId}
```

No se necesita inventar otro endpoint/campo para describir ese destino. La lectura autorizada actual de cliente es GET `/orders/my-orders?processContract=availability-v3&initialResponseContract=late-initial-v1`, con estado AWAITING_CUSTOMER_CONTINUATION y availability.path WHATSAPP. Los permisos de acciones siguen viniendo de servidor.

Frontend: `notificationDelivery.ts` canonicalPresentationKey acepta claves alfabéticas y propuestas numeradas, pero no el formato availability-{version}. `public/push-sw.js` tiene el mismo límite en systemEventKey y puede omitir eventKey para este evento. Cuando el destino contiene notificationEvent con esa clave, `notificationNavigation.ts` rechaza el destino completo. Sin ese parámetro, debería aceptar el enlace relativo del pedido. Por ello la diferencia comprobada NO acredita todavía que el clic físico esté llegando con esa clave rechazada.

Además, `orderNotice.ts` customerOrderNotice no ofrece aviso propio para AWAITING_CUSTOMER_CONTINUATION. No confundir la notificación visible del sistema en iPhone con un toast generado por ese monitor; hace falta identificar cuál recibió/tocó realmente el teléfono.

## Reproducción local y límite

`scripts/check-whatsapp-notification-click.mjs` se prepara como diagnóstico con App/RequestsScreen/tarjetas reales y cuentas/HTTP/worker sintéticos. Se adapta el harness anterior a availabilityWaiting WHATSAPP, AVAILABILITY_V3.

- Un destino sintético con notificationEvent `requests-customer:order-20-availability-2` reproduce permanencia en Inicio. Ese parámetro fue añadido expresamente para probar el parser; no se afirma que el teléfono lo haya recibido.
- Omitir notificationEvent permite abrir, enfocar y expandir el pedido en siete escenarios: segundo plano, clic repetido, otro pedido, URL de lanzamiento, recuperación de caché, lista tardía y sesión tardía. Ningún POST de acciones.
- Se agrega comprobación del toast real con toque por coordenadas para distinguir emisión del aviso de navegación del aviso.

## Dato pendiente y coordinación

### Recorrido físico recibido después del diagnóstico inicial

El usuario entregó readClickTrace de iPhone. frontendVersion, controllingWorker.build y activeWorker.build coinciden con `790c8cd158c66d84276fbfe07d5ba3ad2470cb33`; ambos workers declaran notification-click-attempt-v8 y traceEnabled=true. Cachés de página/worker y lectura de recorrido disponibles. No corresponde pedir otra actualización suponiendo un worker viejo.

En los registros retenidos:

- worker push-received en epoch 1793136933280 = 2026-10-27 18:35:33 America/Santiago; system-shown en 1793136933310, hasEvent=false. Se acredita recepción/presentación de ese push.
- No aparecen click-received, target-normalized, target-saved, launch-requested ni navigation-posted. Tampoco aparecen app-worker-target, app-target-received/accepted ni card-focused.
- Todos los worker-target-request/sent y app-cache-read conservados declaran hasTarget=false. La página reanuda con sesión/controller disponibles y sin destino.
- Las reanudaciones de la página cercanas a las capturas empiezan a las 19:10 (ejemplo 1793139035771). Las capturas marcan 19:10/19:12; no hay otro push-received de esa hora en el conjunto recibido. No se puede vincular inequívocamente el push de 18:35 con el aviso tocado.
- currentContext=false en filas antiguas indica otra ejecución del registro; no significa una versión vieja. El lector conserva como máximo 50 filas por origen durante una hora, por lo que ausencia de una etapa en este extracto no demuestra que nunca haya ocurrido.

Conclusión corregida: el teléfono vuelve a ZIPCO sin un destino recuperado, pero el extracto NO acredita que el click de la captura entrara al handler notificationclick. La hipótesis del parser rechazando availability-{version} se mantiene como incompatibilidad comprobada por código/simulación, no como causa física confirmada. hasEvent=false tampoco significa que faltara orderId/url: son indicadores distintos.

El aviso de las capturas es del sistema iOS, no un mensaje recibido dentro de WhatsApp ni prueba de un toast propio ZIPCO. La segunda vía dentro de la app sigue requiriendo comprobar emisión/clic independiente. En código customerOrderNotice no emite para AWAITING_CUSTOMER_CONTINUATION; no cambiar ese comportamiento sin acordar semántica/deduplicación.

### Traspaso listo para backend/chat principal

> Diagnóstico de clic de disponibilidad WHATSAPP en iPhone, QA790c8cd. App y worker activos/controladores coinciden y tienen trazas. Push retenido de 18:35:33 se presentó con hasEvent=false. Capturas de 19:10/19:12 muestran ZIPCO conservando catálogo; no hay click-received/target-normalized/target-saved/navigation-posted en el recorrido recibido y caché/worker responden hasTarget=false. No atribuir todavía a parser, horario, pedido ni Railway. Revisar conjuntamente entrega/identidad de la notificación y registro que la presentó frente al que recibe el clic. Confirmar payload vigente order-availability-event, tag order-{orderId}-availability-{version}, url /?open=requests-customer&orderId={orderId}. Revisar si es el mismo aviso/registro sin exponer credenciales ni endpoints privados de suscripción. Para vía propia de la app, acordar aviso de AWAITING_CUSTOMER_CONTINUATION y deduplicación con el sistema: hoy falta en customerOrderNotice. Se comprobó incompatibilidad del formato availability-{version} en reconocimiento de identidades, pero no que fuera la causa del clic físico. Primero coordinar este contrato de notificaciones; después ajustar frontend/worker QA y probar ambos caminos. No repetir CONFIRM_AVAILABILITY, modificar el pedido, activar flags, migrar ni publicar producción.

No se identifica un campo/endpoint nuevo necesario por ahora. Se necesita confirmar el destino/identidad existentes y correlación entre presentación y clic. Compatibilidad: conservar notificaciones anteriores, consultas Fuera de hora, propuestas, Listo y ACK solo tras tarjeta visible. No inferir el pedido a abrir por el último estado ni por el último push recibido; eso podría abrir otra tarjeta.

Solicitado al usuario: tocar un aviso ya recibido que falle, entrar manualmente a Solicitudes → Diagnóstico temporal QA (también con 0 fallos) → Recorrido del clic externo QA → Copiar recorrido. El recorrido existente contiene etapas y versiones saneadas, sin pedido ni contactos. Si no aparece, confirmar versión frontend visible. No crear de nuevo la consulta ni confirmar disponibilidad otra vez.

Ese registro debe distinguir: worker controlador/activo, recepción del clic, destino normalizado, entrega a App, parser aceptado/rechazado, cambio de ruta y foco de tarjeta. Después acordar la compatibilidad de la identidad versionada si aplica; mantener separación entre presentación y cada clic físico, y ACK solo tras tarjeta visible. No cambiar reglas de negocio, estados, permisos ni entrega push a ciegas.

## Estado

Solo diagnóstico y harness local; sin cambios funcionales publicados ni nuevo commit/build/despliegue. Vercel QA sigue en 790c8cd. Railway, main y producción sin modificaciones. Pendiente recorrido físico y definición del ajuste exacto; no se declara arreglado el incidente del iPhone con las pruebas sintéticas.
