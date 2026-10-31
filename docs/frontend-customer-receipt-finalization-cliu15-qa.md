# CliU15: recepción y finalización del cliente — QA, 2026-10-31

Clasificación: frontend + backend coordinados. Backend publicado por su chat en
Railway QA 5d09106. Contrato leído:
C:/dev/zipco-backend-qa/docs/testing/customer-receipt-finalization-contract-qa.md.
Este bloque no modifica backend, contratos, datos reales, Railway, main o producción.

## Resultado

- Diseño CliU15: carril de tres pasos y panel expandible, sin vidrio que tape
  identidad/producto/precio. CustomerCoordinationCard cambia ownPending; los otros
  modos conservan su comportamiento. Miniatura eager conservada.
- CustomerReceiptFlowCard integra productos por WhatsApp y retiro local. La tarjeta
  de retiro clara conserva detalle, condiciones aceptadas, reserva y acciones
  existentes según permisos; Escribir al negocio usa WhatsAppMark.
- ReadyPanel y StatusRail sustituyen a los componentes anteriores de la demo.
  ConditionsSheet y su diseño no se editan. Servicios y recepción legacy se conservan.
- Confirmar recepción llama DECLARE_PRODUCT_RECEIVED; READY se conserva y el resumen
  RECEIVED_PENDING_FINALIZATION agrupa en En curso para ambos roles. Finalizar llama
  FINALIZE_REQUEST y el servidor completa para ambos. No se renombra un endpoint legacy.
- Capacidad customerReceiptFinalization negociada por sesión, cabecera
  X-Customer-Receipt-Contract: customer-receipt-finalization-v2, sin sustituir otras.
  Ausente/false mantiene compatibilidad y no ofrece los botones nuevos.
- Cada intención conserva UUID/cuerpo originales. Doble toque bloqueado; errores
  inciertos no reintentan automáticamente. POST correcto + GET fallido conserva la
  tarjeta y Actualizar estado. Conflictos requieren actualización explícita.
- La salida visual ocurre después de POST y lectura verificadas; conteos del GET.
  No fuerza otra pestaña: el aviso inferior Ver abre active/history y enfoca el pedido.
- Ambos avisos contratados conservan tipo y tag versionado en worker y aviso interno.
  No se retoma el diagnóstico pausado de clic iPhone ni se envían pushes reales.

## Archivos funcionales

CustomerCoordinationCard, CustomerReceiptFlowCard, ReadyPanel, StatusRail,
coordination-v2.css, ProcessOrderCard y BusinessProgressCard (presentación).
customerReceiptContract, requestProcess, coordinationApi, coordinationIntent,
useCoordination, useRequests, requestStatusGrouping, requestAttentionSummary,
requestProcessApi, availabilityApi, reservationApi, proposalApi y
requestProcessErrors (contrato/lectura/recuperación). CustomerReceiptDialog amplía
su tipo interno para el callback compartido, sin cambiar el diálogo legacy.
BusinessNotificationMonitor, notificationDelivery y public/push-sw.js (avisos).

La vista local de scripts/qa/previews/customer-course usa ahora las fuentes reales
CliU15, exclusivamente con estado ficticio. Se retiran sus copias antiguas de
StatusSeals/ReadyBellOverlay y el comprobador obsoleto. La carpeta de handoff
preexistente del usuario se conserva sin incorporar ni modificar.

## API y validación

GET /request-process-capabilities; listas /orders/my-orders y /orders/business/:id;
lecturas privadas del acuerdo y representaciones compatibles. Nuevos POST:
/request-processes/:id/actions/declare-product-received y /finalize-request,
con Bearer, Idempotency-Key, contratos de proceso y cuerpo estricto
{expectedVersion,confirmationAccepted:true}. Normaliza customerReceipt y valida
fase, fechas del servidor e identidad del recibo. No inventa timestamps ni ACK.

20 pruebas unitarias nuevas aprobadas: normalización, permisos, capacidad,
recepción/finalización, agrupación, reserva FREE/PREPAYMENT, UUID/restauración y
tags. Regresiones seleccionadas de coordinación, intenciones, normalizadores,
agrupación, atención, acuerdos, propuestas y notificaciones aprobadas. Informes
intermedios: 140 aprobadas en seis archivos; 76 aprobadas y cuatro fallos de
sincronización en AgreementRoute tras introducir await en lectura; se conservó
lectura síncrona de cabeceras conocidas y las 14 de AgreementRoute pasaron.
No sumar estas cifras como pruebas únicas: hay solapamiento entre selecciones.

13 escenarios únicos de navegador aprobados con API simulada: WhatsApp y retiro
a 320/393/430, negocio pendiente de cierre, envío incierto/misma clave, conflicto,
POST OK/GET fallido, recarga, falta de permisos y movimiento reducido. Una regresión
de controles de coordinación del cliente aprobada. Revisión de capturas detectó
recorte del carril a 320; se ajustó y repitió solo el caso afectado.

Fallos de preparación/correcciones conservados: fixture retiro sin disponibilidad
en el acuerdo; espera de botón Finalizar sin pulsar Ver en recuperación; espera
faltante de toast en movimiento reducido. Fallos funcionales corregidos: conflicto
sin recuperación explícita y publicación prematura del recibo mínimo tras GET
fallido. Cada reejecución excluye los casos ya aprobados salvo dependencia cambiada.
Los dos tipos nuevos del worker necesitaron agregarse a su lista permitida;
su prueba de identidad no había pasado antes de esa corrección.

Chrome físico por coordenadas y hit testing, sin servicios externos ni mutaciones
reales; no acredita iPhone/Android físicos. Artefactos y resultados sucesivos:
node_modules/.cache/qa-pilot/receipt-finalization/. Validación móvil queda pendiente.

## Tiempos y publicación

Inicio observado UTC 16:30:30. Análisis inicial y lectura del contrato, seguidos
de implementación hasta 16:38:51: intervalo combinado 8 min 21 s. La instrumentación
no separó todas esas subfases; no atribuir tiempos exactos inventados a cada una.
Preparación/reparación de escenarios e implementación de recuperación alternan
con ejecuciones desde 16:38:51; cada caso guarda tiempo propio en timing.json y
results-*.json. No sumar ejecuciones en paralelo a tiempo total.

Build inicial: 13.644 s, falló al leer AppData en sandbox. Reejecución aprobada:
13.444 s. Se repitió después por corrección CSS estrecha y ampliación de los dos
tipos del worker; esos cambios justifican nuevos artefactos. El último build
aprobado y publicación se registran en el cierre; no confundir builds previos
con los assets publicados. Documentación desde 16:55, en paralelo al cierre de
pruebas/build. Publicación aún no afirmada en esta entrada inicial.

No cambia herramientas compartidas ni configuración Vercel. Publicar solo qa.
La API Vercel había dado 403 en el bloque anterior: no repetir esa consulta sin
cambio de acceso. Comprobar estado con GitHub; distinguirlo de assets servidos.
