# Negocio: pago y apartado pendientes — diseño Claude

## Corrección de ventanas — 2026-11-18

Solo frontend. Finalizar seguimiento y Cancelar retiro seguían abriendo Dialog
genéricos; la entrega de Claude también conservaba ese markup, sin diseño propio
para el contenedor portal. Las clases de la tarjeta no llegan a ese contenedor,
que se monta fuera de ella. Se aplicó el mismo ámbito visual en Dialog.Content
únicamente para la composición render del negocio y para su cancelación de retiro.
Las variantes tradicionales mantienen clases/markup. No cambió ningún payload,
endpoint, permiso, validación ni texto contractual; seguimiento no recibe motivo.

Fuentes corregidas: ReservationPanel.tsx, AvailabilityPostActionsView.tsx y
pickup-prepayment.css (rutas en el apartado de fuentes). Contenedor blanco,
botones de 46px, footer accesible y colores explícitos que no heredan el tema
oscuro genérico. El transform de centrado no se anima. La ventana de pago real
permanece intacta.

Validación adicional por modificación de estos contenedores compartidos:
10 pruebas de AvailabilityPostActionsView aprobadas (3,72s), nueve paridades HTML
idénticas y build QA/PWA aprobado (Vite19,81s). Chromium con HTTP simulado y
coordenadas físicas: ambas ventanas a320/390/430, sin desborde, dentro de viewport,
foco dentro de ventana, motivos habilitan confirmar, Volver no hace POST. Modo
oscuro390 mantiene texto/fondo correctos; confirmación de pago sin clase nueva.
Capturas ignoradas prepayment-followup-dialog-fixed.png y
prepayment-cancel-dialog-fixed.png en node_modules/.cache/business-closure/.
Pendiente teléfono físico. No requiere Railway ni cambios de contrato.

Se reutilizó el arnés anterior, repitiendo solo estas ventanas y compatibilidad
afectada. Análisis/edición/preparación/ejecución solapados sin cronómetro exclusivo;
duración de tests y build separadas arriba. Publicación se registra al cierre.

Corrección publicada en origin/qa: `1f8fa0c203360115734067aa77d09162da4106c0`,
Vercel success verificado para ese SHA:
https://vercel.com/zipco-s-projects/zipco-app/8FRpoUqdWwm6fDkz9k8YMFTLVUGg
Ventana total medida 228 s; publicación/verificación 62 s incluida en
ella. No sumar el total con subfases ni atribuirlo a rendimiento de la app.
Cierre documental local sin otro despliegue. Main y producción intactos.

Fecha: 2026-11-18. Clasificación: solo frontend QA, presentación e interacción
local sobre el contrato E209/E211 publicado. No cambia estados ni permisos.

## Alcance y fuentes

- `src/app/features/requests/cards/shared/reservations/PickupPrepaymentCard.tsx`:
  composición blanca únicamente negocio + `pickupPrepaymentFor` válido +
  `AWAITING_PAYMENT_AND_HOLD`. Reserva y total separados; detalle y opciones
  conservan sus nodos, permisos reales, errores y ventanas compartidas.
- `cards/shared/reservations/pickup-prepayment.css`, relativo a requests:
  estilos propios, expansión superior acotada al scroll real y viewport,
  animaciones decorativas finitas, pausa de lista y movimiento reducido.
- `cards/shared/layout/coordination-card-styles.css`: importa ese CSS.
- `shared/reservations/ReservationPanel.tsx`: render opcional de piezas reales;
  sin render se conserva la composición anterior. Confirmación de pago,
  controlador, reintentos y seguimiento propio conservan sus contratos.
- `shared/reservations/ReservationReasonChoices.tsx`: presentación compartida
  mediante radios nativos; selección textual enviada en reasonDetail existente.
- `cards/shared/availability/AvailabilityPostActionsView.tsx`: solo cancelación
  del retiro de esta variante de negocio usa las mismas razones seleccionables.
  Otras variantes conservan su textarea.

No hay otra tarjeta nueva paralela para esta fase. El cliente y las demás fases
usan sus composiciones vigentes. La selección continúa en ProcessOrderCard.
No se habilitó WhatsApp como modalidad de esta tarjeta: el selector exige
LOCAL_PICKUP. Su acceso para aclaraciones sigue por el host de navegación E211.

## Datos y acciones conservados

Fuente de importe de reserva: pickupPrepayment.requiredAmountClp; total y
productos: AgreementReadDto.totalPriceClp / subjectSnapshot; fecha acordada:
scheduledFor o needNow; nota de reserva: reservationChoice.note.

Lecturas existentes: capacidades, listas de pedidos, acuerdo y propuestas.
Comandos existentes bajo `/request-processes/:id/actions/`:
confirm-pickup-reservation, cancel-pickup-reservation,
decline-pickup-reservation, cancel-pickup, finish-own-reservation-follow-up,
open-reservation-whatsapp y authorize-reservation-contact cuando autorizados.
Se conservan expectedVersion, reservationId, Idempotency-Key y declaraciones
explícitas de pago recibido y pedido apartado. No se inventa pago verificado.

Seleccionar un motivo no envía nada. Confirmar envía reasonDetail existente.
Finalizar seguimiento mantiene únicamente confirmationAccepted: true; no se
añadió motivo ni se presenta como cierre del pedido.

Se omiten las filas normales Registrar una aclaración, Retirar permiso y
Actualizar reserva solo en el render nuevo, según la entrega aprobada.
Errores y recuperación siguen fuera de los paneles: el error de reserva incluye
Comprobar estado de la reserva (GET). Las alertas de disponibilidad/contacto se
conservan. No se repite confirmación al abrir/cerrar, refrescar o volver de WhatsApp.

## Ajustes encontrados en la integración

- Reservar altura antes de mover el pie a posición absoluta evita una reducción
  intermedia del scrollHeight que hacía saltar el scroll en pantallas de 360 px.
- Se observa el tamaño del pie y del contenido, sin remontar formularios, y se
  limita el crecimiento al área visible de `[data-requests-scroll]`.
- Paneles ocultos, indicaciones colapsadas y cuerpo cubierto quedan inert.
  Escape cierra y devuelve el foco; cerrar AgreementSheet devuelve el foco al
  disparador real. Recuperación que desaparece restaura el foco del panel.
- Se evita duplicar la insignia de cantidad del ProductPreviewControl real.
- La entrada pausada mantiene opacidad visible; reducir movimiento desactiva
  también el pequeño efecto de selección de motivos.

## Validación y límites

61 pruebas aprobadas en AvailabilityPostActionsView, pickupPrepayment,
reservationContract y simplifiedReservationContract. Selección por cambios
compartidos y contrato; no regresión general innecesaria.

Comparación SSR de nueve casos: HTML idéntico al original para ReservationPanel
sin render (seis variantes) y PickupPrepaymentCard fuera del negocio pendiente
(tres variantes). Copias de diagnóstico solo en node_modules/.cache, ignoradas.

Navegador Chromium con RequestsScreen y componentes/controladores reales,
HTTP sintético, sin pagos/pedidos/mensajes reales:

- 320/360/390/430 px: sin desborde, reserva $1.500 y total $12.000 separados,
  una insignia de cantidad, paneles inert, detalle/acuerdo real, Escape/foco,
  opciones autorizadas y Aún no sin POST.
- Pie antes/después de abrir: 628,19 → 628 px en 320; 628,28 → 628 px en los
  otros anchos. La tarjeta queda bajo el límite real del scroller fijo.
- Ventana real de confirmación, cancelar sin envío, HTTP503 visible, recuperación
  mediante GET, confirmación explícita posterior y relectura preparable: sale
  de la tarjeta pendiente y pasa al flujo En curso existente.
- Motivos nativos con las acciones permitidas simuladas: cancelar retiro,
  cancelar solo reserva y declinar envían el reasonDetail elegido al endpoint
  existente, únicamente tras confirmar; antes de seleccionar Confirmar está
  bloqueado. No se probaron mutaciones reales ni se ampliaron permisos del producto.
- Nombre largo y nota de 287 caracteres sin desborde a 320 px. Seguimiento propio
  envía confirmationAccepted sin reasonDetail. Movimiento reducido: cero
  animaciones ejecutándose; entrada pausada legible. Aclarar por WhatsApp muestra
  el enlace nativo separado target=_blank, conservando el documento ZIPCO.

Scripts y capturas ignorados en node_modules/.cache; no se entregan mocks como
código del producto. Los escenarios se repitieron tras fallos concretos de
geometría/foco; una nota sintética de más de 300 caracteres se corrigió para
respetar el contrato antes de repetir el caso de texto largo.

Build QA/PWA aprobado: Vite 14,15 s. Advertencia de chunks mayores a 500 kB
ya existente. No hay tsc/lint configurados e instalados en este workspace;
el build no se declara como sustituto de una comprobación independiente de tipos.
No se añadieron dependencias ni herramientas.

Pendiente: Safari/iPhone y Android físicos, ventanas y fotos con datos reales,
confirmación autenticada contra Railway y evaluación táctil de la expansión en
teléfono. Chromium con API simulada no acredita esos recorridos físicos.

## Dependencia separada de backend

Motivo para Finalizar mi seguimiento requiere acordar un campo y su semántica
con backend: hoy solo acepta confirmationAccepted. No se implementa parcialmente,
no se inventa reasonDetail para esa acción y no se cambia el contrato existente.
Los motivos seleccionables de cancelar retiro/reserva y declinar ya usan el
reasonDetail aceptado. Railway QA no requiere cambio para este rediseño.

## Tiempos y publicación

Análisis, implementación, preparación/reparación de arneses y ejecución se
solaparon; no hay cronómetros exclusivos por fase. Build final medido arriba.
No son mediciones de FPS ni se atribuye rendimiento de app al tiempo de desarrollo.
Estado de commit/publicación y pruebas adicionales se registra al cierre.
Main y producción no modificados.

Publicado en origin/qa: `6186fa5155b635a506cbbfccd9a5c97dfa1c7777`.
Vercel success verificado para ese SHA exacto:
https://vercel.com/zipco-s-projects/zipco-app/3TYXoMqR3mGo2nEHr5uuAip6iJkN
App QA: https://zipco-app-git-qa-zipco-s-projects.vercel.app
Main conserva `8295ab8c6024ab20851ebd371308d2f299b4668f`. Railway no modificado.
No tsc/lint independiente disponible, sin afirmarlo aprobado. Cierre documental
local sin otro push/despliegue. Datos reales y teléfonos pendientes.
Ventana de publicación/verificación: 82 s, incluye espera externa.

Ventana medida hasta cierre funcional: 2.045 s desde análisis, 1.746 s desde
implementación, 1.430 s desde preparación/ejecución y 123 s desde documentación.
Son intervalos anidados y solapados, no sumables; incluyen esperas de navegador
y reparación de fixtures. No existe medición exclusiva de cada subfase.
