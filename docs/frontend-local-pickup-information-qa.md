# E200: retiro local sin reserva, consulta informativa

Fecha: 2026-11-04, America/Santiago. Clasificación: frontend + backend, contrato
ya publicado por backend Railway QA `eaffcff1f8bb12037f1132edfd06bb68675d130d`.
Fuente: `C:/dev/zipco-backend-qa/docs/testing/local-pickup-information-contract-qa.md`.
Este bloque modifica únicamente frontend QA. No cambia Railway ni su variable.

## Resultado y límites de adopción

- Negocio: Historial «Disponibilidad informada» inmediatamente después de
  confirmar LOCAL_PICKUP con oferta NONE, únicamente si backend admite la nueva
  solicitud y devuelve el resumen negociado. No espera al cliente.
- Cliente: tarjeta Disponible actual para continuar/declinar. Al continuar,
  «Indicaciones para ir al local» y «Confirmo recepción». El acuse es únicamente
  de las indicaciones: no producto recibido, compra completada ni pago.
- ACKNOWLEDGED: Historial del cliente con instrucciones, productos, nota, fecha
  y foto existentes. El negocio ya estaba en Historial. No se fabrica estado
  COMPLETED ni fechas de cierre. No ofrece eliminar/archivar derechos nuevos.
- Se conserva el aviso inicial al cliente; no se añade aviso de preparación,
  Listo o producto recibido al negocio. Se mantienen los avisos de otras ramas.
- Ninguna deducción por precio cero, LOCAL_PICKUP o elección NONE del cliente.
  Reserva FREE/PREPAYMENT, propuestas, V1 y pedidos anteriores no se convierten.

## Contrato y recuperación

GET autenticado `/request-process-capabilities`, capacidad
`localPickupInformation.{contract,enabled,creationEnabled}`. Cabecera
`X-Local-Pickup-Information-Contract: local-pickup-information-v1` junto a contratos
vigentes en lecturas y comandos. Negociación por token, fallo seguro; enabled
permite leer/acusar existentes aunque creationEnabled sea false. El frontend no
escribe la admisión ni hace conversiones. La creación ya depende de la marca
REQUEST_CREATED del backend; no se añade un campo inventado al checkout.

Normalización estricta de `requestProcess.localPickupInformation`: contrato,
estado, plan NONE, identificación de disponibilidad, fechas e identidad del acuse.
Resumen incoherente no cae silenciosamente al flujo de preparación anterior.
La agrupación central aplica primero resumen + rol a pestañas, banners y conteos.
Se corrigieron también dos llamadas de badge/historial que omitían el rol y el
conteo general del monitor que solo miraba accepted/pending.

POST `/request-processes/:id/actions/ack-local-pickup-information`:
`{expectedVersion,confirmationAccepted:true}`, JWT y UUID idempotente. Se comprueban
orderId, processId, proposalId, acuerdo, disponibilidad, versión y ACKNOWLEDGED.
No usa los endpoints de recepción física ni finalizar producto. Persistencia,
doble toque, versión/estado cambiado y recuperación usan los adaptadores actuales.
Red incierta conserva intención/UUID; Actualizar es GET, el reintento es manual
y conserva el mismo cuerpo/UUID. Lectura ACKNOWLEDGED resuelve sin otro POST.

Confirmar disponibilidad, continuar, declinar y retirar mantienen sus endpoints,
cuerpos, diálogos y significados actuales. Lecturas de listas, acuerdo y propuesta,
y transportes existentes llevan las cabeceras negociadas mediante el mismo helper.

## Fuentes cambiadas y composición

- Dominio: `domain/localPickupInformation.ts` nuevo; `requestProcess.ts` y
  `requestStatusGrouping.ts` integran el resumen/acción/agrupación.
- API: `api/participantContractHeaders.ts` nuevo; `availabilityApi.ts`,
  `coordinationApi.ts`, `requestProcessApi.ts`, `proposalApi.ts` y `reservationApi.ts`
  conservan transportes, ampliando negociación compatible. El acuse está en
  coordinationApi para reutilizar intención segura y recuperación.
- Aplicación: `application/useRequests.ts`, `useAvailability.ts`, `useCoordination.ts`
  e `intents/coordinationIntent.ts`. Aviso/resultado y acceso «Ver» aprovechan
  `shared/feedback/statusChangePresentation.ts` y `StatusChangeFlow.tsx`.
- Vista canónica nueva: `cards/shared/local-pickup-information/` (TSX y CSS).
  Las entradas `ProcessOrderCard.tsx` y `ProcessHistoryCard.tsx` seleccionan esa
  misma composición. Miniatura, visor de referencia y DetailReveal reales.
  `AvailabilityPostActions.render` conserva consentimientos/recuperación existentes.
- Pantalla: `screen/application/useRequestsScreenController.tsx`, rol explícito
  para badges/historial. Monitor: `notifications/BusinessNotificationMonitor.tsx`
  negocia lectura, cuenta por participante y suprime anuncios de trabajo en E200.
- Pruebas: fixture de dominio y `localPickupInformation.test.ts`; adaptación de
  arneses en useCoordination/useRequestsContract; caso de monitor sin tarea de
  negocio. `scripts/check-local-pickup-information.mjs` y extensión optativa
  `information` del fixture acceptance existente. Sin framework nuevo.

Los archivos nuevos tienen menos de 100 líneas; no se conserva diseño duplicado.
No se tocaron los diseños aprobados de las otras modalidades ni las ventanas.

## Evidencia y selección de pruebas

19 suites focalizadas aprobadas (445 casos distintos): normalización, agrupación,
API, intenciones, hooks, recepción física, disponibilidad, presentación, avisos,
selección/navegación de pantalla y arquitectura. Reejecuciones acotadas:
los arneses de listas debían simular el helper de negociación nuevo; tres pruebas
de doble toque debían esperar la entrada real al transporte asíncrono. Se
conservaron sus aserciones de bloqueo, recibos y ausencia de POST duplicado.

Cuatro escenarios nuevos con HTTP sintético y componentes reales a 320/390/430:
confirmación negocio → Historial antes de cliente → cliente continúa → acuse →
Historial; acuse directo; fallo antes de guardar con reintento del mismo UUID;
respuesta perdida después de guardar, resuelta por GET sin repetir. Validan
instrucciones conservadas, ausencia de slider/recepción física, conteos y «Ver».

Fixture ajustado por evidencia: escribir horario antes de comprobarlo; snapshot
informativo visible solo al recibir GET, para no simular una confirmación a partir
de un POST cuya respuesta se perdió. Se repitieron los cuatro casos dependientes;
la restauración final de fecha/foto en el detalle justificó repetir solo el caso
activo. Dos regresiones reutilizadas: retiro NONE anterior y aceptación WhatsApp.
No se enviaron pushes ni se modificaron pedidos QA en estas pruebas.

Build QA/PWA aprobado (2407 módulos, 13 entradas de precache). Se repitió una
vez por restaurar fecha/foto en la revisión final. Advertencia conocida de tamaño
de chunks; no configuración nueva. Repo sin tsc/config TypeScript: transpilación
y build aprobados, no se afirma un typecheck completo.

Comprobación remota de solo lectura: capabilities QA sin sesión respondió 401.
No se comprobó creationEnabled autenticadamente ni se activó la variable.
Pendiente comprobar el flujo real con ambos teléfonos después de coordinar admisión.
Chrome/HTTP sintético no acredita Safari físico, entrega de push ni backend real.

## Tiempos y publicación

Reloj de pared desde 03:53:50 UTC; lectura inicial anterior no cronometrada.
Análisis 185 s; implementación 406 s; preparación 225 s; ejecución/reparación de
pruebas y revisión 526 s. La preparación incluye una primera ejecución de contrato
(15 casos, runner 0,65 s). Ejecución incluye 67 s del primer lote con arneses aún
sin adaptar y reparaciones de fixtures, no solo tiempo del runner.

Primer build efectivo QA/PWA 11,8 s dentro de ventana 53 s. Segundo build efectivo
9,7 s por restauración de detalle. La fase de revisión final incluye ese segundo
build y el escenario repetido, sin sumarlos dos veces. Esperas/lecturas/documentación
se completan al verificar publicación. No atribuye duración a rendimiento gráfico.

Rama `qa`, publicación pendiente de verificar al redactar. Main conservó
`8295ab8c6024ab20851ebd371308d2f299b4668f`, producción intacta. Railway ya preparado;
desde este bloque no se modificó, activó ni desplegó backend. Cierre documental
posterior al éxito se conserva local para evitar otro despliegue solo por memoria.
