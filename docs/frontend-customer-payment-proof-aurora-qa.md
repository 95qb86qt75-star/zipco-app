# Cliente Aurora Pro y declaración de comprobante — E214

Fecha: 2026-11-18, America/Santiago. Clasificación: frontend + backend.

## Contrato recibido y límites

El usuario entregó la publicación backend Railway QA `2a2e5f2` y su respaldo
`3e78fd0`. Se leyó el contrato definitivo
`C:/dev/zipco-backend-qa/docs/testing/customer-payment-proof-declaration-contract-qa.md`,
incluida sección 9 y el código de su proyección. El título documental backend
identifica el cierre E216; la funcionalidad implementada/autorizada es E214,
contrato `customer-payment-proof-v1`.

Backend reportó 1110 pruebas aprobadas y 5 omitidas. Su informe acredita capacidad
autenticada en arranque local y despliegue exacto/rutas protegidas/CORS en Railway;
no acredita una lectura autenticada de pedidos reales en Railway. No se hicieron
mutaciones reales ni se reutilizaron credenciales en las pruebas frontend.

E215 (motivos del seguimiento del negocio) sigue **propuesto, sin integrar**.
Finalizar seguimiento conserva `confirmationAccepted:true`, sin motivos.

## Cambios y fuentes

- `domain/customerPaymentProof.ts`: normalización aditiva, capacidad por token,
  vínculo reserva/acuerdo y categorías; `requestProcess.ts` conserva la proyección.
- `api/participantContractHeaders.ts`: adopción en listas, detalle y comandos
  existentes después de capacidad auténtica. No bandera local de habilitación.
- `domain/requestStatusGrouping.ts`: agrupador común de filtros, etiquetas y
  contadores; cierre/recepción/estados terminales conservan prioridad.
- `api/customerPaymentProofApi.ts`, `application/intents/paymentProofIntent.ts`,
  `application/useCustomerPaymentProof.ts`: DTO exacto, UUID durable por usuario y
  proceso, bloqueo de doble envío, comprobación y estado actual tras recuperación.
- `availabilityApi.ts`, `proposalApi.ts`, `reservationApi.ts`: admiten la acción
  aditiva validada en recibos de otros comandos; no relajan las demás acciones,
  versiones, identidades, planes o vínculos del recibo.
- `cards/shared/reservations/CustomerPrepaymentView.tsx`: composición cliente
  Aurora Pro canónica separada de la composición negocio; importada por
  `PickupPrepaymentCard.tsx` solo en la fase autorizada.
- `customer-pickup-prepayment.css`, importado en el manifiesto de tarjetas:
  estilos propios, ventanas, responsive y movimiento reducido. Pausa de scroll
  comprueba `data-request-list-scrolling="true"`, no mera presencia del atributo.
- `ReservationPanel.tsx`, `AvailabilityPostActionsView.tsx`: piezas y ventanas
  del cliente. Seguimiento, cancelar y retirar permiso conservan sus acciones;
  se mantienen accesibles aclaración formal y revocación de reserva omitidas en
  la maqueta, para no quitar controles de recuperación existentes.
- `reservationWhatsappNavigation.ts`: evento UI de regreso después de enlace
  nativo, salida real y GET verificado. La tarjeta no duplica listeners de
  foco/visibilidad ni deduce una declaración de ese regreso.

## Endpoints y datos

- GET `/request-process-capabilities` → `customerPaymentProof` habilitado para
  esta sesión y contrato; se preservan los demás contratos.
- POST `/request-processes/:id/actions/declare-payment-proof-sent`:
  `{expectedVersion,reservationId,proofSentDeclared:true}`.
- GET `/request-processes/:id/payment-proof-result`, con UUID original en
  `Idempotency-Key`; se presenta `currentRequestProcess`, no el recibo antiguo.
- `X-Customer-Payment-Proof-Contract: customer-payment-proof-v1` junto a contratos
  de proceso/horario y participantes existentes. JWT solo en memoria/cabeceras;
  intención durable contiene IDs, vínculo de acuerdo, versión, true y UUID.
- Declaración y `categories` de servidor: cliente Por responder → En espera;
  negocio permanece Esperando respuesta. Pago recibido y apartado del negocio
  llevan a En curso para ambos. Declarar no confirma pago, entrega ni apartado.
- El regreso WhatsApp mantiene GET y nunca ejecuta automáticamente el POST.
  «No, aún no», cerrar y volver no declaran. También existe «Ya envié el
  comprobante» para declaración explícita sin exigir apertura previa en ZIPCO.
- `recorded:false` conserva el UUID/payload; permite comprobar o reintentar
  explícitamente el mismo envío. No se genera otra intención tras una respuesta
  perdida. Si la versión cambió, se exige comprobar el estado.

## Validación

- Vitest focalizado por contrato, transporte y dependencias compartidas: 94
  pruebas únicas aprobadas en siete archivos. Nueva suite 8; proyección anterior,
  navegación WhatsApp, acciones compartidas, contratos informativos, propuestas y
  horario se seleccionaron por dependencias afectadas. Una repetición de las 8
  nuevas tras endurecer la normalización no se cuenta de nuevo.
- Nueve comparaciones HTML byte a byte: negocio y otras fases conservados.
  SSR advierte de `useLayoutEffect` en la tarjeta cliente del navegador; esta
  comparación no pretende validar hidratación ni una ruta SSR de producción.
- Chrome/CDP con componentes del proyecto, eventos táctiles por coordenadas y
  HTTP simulado: 320/390/430, detalle, declaración exacta, guardado bloqueado,
  categoría actual y recuperación por UUID sin segundo POST. Regreso desde
  enlace nativo a destino simulado, pregunta sin envío, «No» abre opciones,
  ventanas de seguimiento y cancelación cliente; movimiento reducido y texto
  legible en modo oscuro de la aplicación. Evidencia local ignorada en
  `node_modules/.cache/e214-browser/`.
- Build QA/Vite y PWA aprobados; advertencia existente de chunk >500 kB.
  No se ejecutaron `tsc` o lint independientes: este workspace no dispone de
  esos controles configurados; el build transforma TS, no sustituye un typecheck.

Preparación: un intento usó Python ausente, sin instalarlo; se reutilizó Node.
Se corrigió la extracción de la composición antes de compilar. Un build aislado
compiló pero PWA no pudo acceder a AppData por sandbox; el build completo posterior
con permisos aprobados pasó. El escenario de movimiento reducido inicialmente
buscaba «Ya envié» después del regreso (cuando corresponde «Sí, confirmar envío»);
se corrigió el fixture, sin cambiar el flujo para satisfacer la prueba.

## Publicación y pendientes

Frontend publicado en origin/qa:
`ca153f469c703e322ff3fb012836c6296d4f68ca`. GitHub combined status del SHA exacto
devolvió Vercel **success**:
https://vercel.com/zipco-s-projects/zipco-app/H1s166CzmoUXG8WR7jaYy3e5SGnK.
Alias QA: https://zipco-app-git-qa-zipco-s-projects.vercel.app.
No se acredita inspección autenticada del bundle desde el teléfono con ese status.
Main `8295ab8c6024ab20851ebd371308d2f299b4668f` y producción intactos; Railway no se
modifica desde frontend. Los directorios ajenos no versionados quedaron intactos.

Pendiente de validación física/autenticada: capacidad en Railway, iPhone y Android,
WhatsApp real, envío manual del comprobante, declaración cliente y confirmación
independiente del negocio. No declarar cerrado el flujo completo con las pruebas
sintéticas. No activar E215 ni añadir motivos al seguimiento.

## Tiempos observados

Primera medición conservada: 23:35:08 UTC. Implementación, preparación/reparación de
fixtures y ejecuciones se intercalaron; no hay cronómetro exclusivo por actividad
para repartir esos minutos sin inventarlos. Análisis anterior sin medición propia.
Vitest registró 0,812 s, 0,924 s y 1,01 s en sus tres ejecuciones. Vite final
registró 8,18 s; PWA posterior sin timer separado. No sumar fases solapadas como
si fueran exclusivas. Push observado a las23:55:48 UTC; Vercel pasó de pending a
success en la consulta posterior, antes del cierre. No hay timer de duración
exclusiva del despliegue; no se inventa uno. El cierre documental local no hace
push ni provoca otro despliegue.
