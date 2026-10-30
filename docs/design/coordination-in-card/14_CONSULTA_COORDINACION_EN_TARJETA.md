# 14 · Consulta de coordinación dentro de la tarjeta — integración QA

Fecha: 2026-10-30. Backend definitivo publicado: Railway QA c3da34e. Contrato: `C:/dev/zipco-backend-qa/docs/testing/whatsapp-coordination-initial-decline-contract-qa.md`. La auditoría 01 describe el contrato anterior; su dependencia inicial quedó resuelta.

## Reemplazo visual

El flujo bilateral usa una variante de la propia tarjeta, en lugar del aside verde y StartWorkSheet confirm/respond. Cada consulta identifica su pedido, producto, contraparte y precio. AvailabilityWaitingCard/DetailReveal se reutilizan; no se transforma una disponibilidad pendiente de continuación en una consulta de coordinación.

El detalle conserva los componentes originales BusinessCoordinationCard, BusinessProgressCard o CustomerProgressCard, sus condiciones y controles. La miniatura abre el producto de manera independiente. useStartWorkPrompt solo puede señalar la consulta al regresar: no abre un holograma ni confirma nada automáticamente. Otras hojas de acciones distintas o recorridos legados se conservan.

## Contextos y acciones

| Contexto | Permiso y capacidad | Sí | Falta |
| --- | --- | --- | --- |
| confirm | COORDINATING, CONFIRM_WHATSAPP_COORDINATION y capacidad bilateral | confirm-whatsapp-coordination: expectedVersion + confirmationAccepted:true; pasa En curso | Solo con capacidad initialDecline y DECLINE_WHATSAPP_COORDINATION: confirmar dentro de tarjeta; Devolver envía expectedVersion + coordinationAccepted:false; sigue Por coordinar |
| respond | IN_PROGRESS, ronda PENDING ajena, RESPOND_WHATSAPP_COORDINATION | expectedVersion + confirmationId + coordinationAccepted:true; sigue En curso | Devolver usa el mismo endpoint respond con coordinationAccepted:false; vuelve Por coordinar |
| ownPending | IN_PROGRESS y ronda PENDING propia | Sin botones de autorrespuesta | Sin botones |
| declined | whatsappCoordinationInitialDecline.active:true | Consulta cerrada, conservada tras recargar; coordinación posterior mediante acciones autorizadas | Sin repetir la negativa |
| no elegible | Capacidad apagada, ámbito excluido, sin permiso o ronda caducada | No se habilita consulta | No se habilita consulta |

La negativa inicial no crea confirmationId ni sustituye ANNUL_COORDINATION. No anula ni lleva a Historial. Se limita a productos con acuerdo aceptado y coordinación WhatsApp general o legado sin plan; no servicios, retiro local ni reservas excluidas. Mantener MARK_READY cuando backend lo permite, sin añadir un segundo paso obligatorio.

## Contrato exacto

- Acción nueva: POST `/request-processes/:id/actions/decline-whatsapp-coordination`.
- Body: `{expectedVersion, coordinationAccepted:false}`. No enviar confirmationId, confirmationAccepted, rol ni teléfono.
- Header de mutación: `X-Whatsapp-Coordination-Contract: whatsapp-coordination-initial-decline-v1`. CONFIRM y RESPOND conservan `whatsapp-coordination-v1`.
- Lecturas y recibos opt-in: `X-Whatsapp-Coordination-Initial-Decline-Contract: whatsapp-coordination-initial-decline-v1`.
- Capacidad: `whatsappCoordination.initialDecline.contract/enabled`, dentro de la capacidad bilateral existente.
- Resumen opcional: `whatsappCoordinationInitialDecline` con contract, id, declinedBy, declinedAt, recordedVersion y active. Ese id es el evento negativo, no una confirmación positiva.
- GET no reabre la consulta cerrada. Un nuevo OPEN autorizado o una confirmación positiva posterior usan otra intención y las reglas de backend. Coordinar después primero abre el detalle; no hace una mutación por sí mismo.
- Respetar sesión, Bearer, Idempotency-Key, expectedVersion, allowedActions y concurrencia. COORDINATION_ALREADY_DECLINED exige recuperar el estado; nunca convertir automáticamente la operación en otra acción.

## Diseño y comportamiento

Variante Aurora compacta con anillo, cantidad, badge WhatsApp, COORDINACIÓN, Detalle y pregunta con nombre/precio. Sí y Falta tienen al menos 44 px. Falta muestra Devolver ámbar y Cancelar en la misma tarjeta. Cancelar no escribe ni avisa y se bloquea mientras hay una operación que debe recuperarse.

El detalle mantiene contexto y texto legal: ZIPCO no recibe ni verifica pagos. El precio unitario no se confunde con el total. La espera propia informa que ya se indicó coordinación y falta la respuesta de la contraparte. La negativa inicial activa permanece cerrada tras recarga, con acceso para coordinar después.

Seguir la secuencia 13: guardando, resultado comprobado, salida solo al cambiar de categoría, aviso con Ver y contadores reales. Con error incierto o lectura pendiente conservar controles de recuperación y datos; no deducir éxito a partir de un booleano local.

## Pruebas

Ambos iniciadores, Sí/Falta de contraparte, Cancelar sin POST, doble toque, persistencia/recarga, coordinación posterior, capacidades apagadas, propia pendiente, permisos, recuperación exacta, recibo antiguo frente a lectura más reciente, Listo invalidando una consulta anterior, varias tarjetas, 320 px, movimiento reducido y miniatura independiente. Resultados y límites en `docs/frontend-coordination-in-card-qa.md`.
