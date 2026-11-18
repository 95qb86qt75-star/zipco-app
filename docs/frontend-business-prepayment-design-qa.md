# Negocio: pago y apartado pendientes — diseño Claude

## Ajuste contra referencias visuales del usuario — 2026-11-18

Clasificación solo frontend: ajuste del acabado entregado a las imágenes de
Más opciones, Cancelar retiro y Seguimiento. Se mantienen acciones y contratos.

Fuentes modificadas:
- PickupPrepaymentCard.tsx: el panel de opciones permite una altura menor que
  la tarjeta cerrada; el margen opuesto conserva el pie y las filas siguientes.
  Identificador CSS propio zipco-bpp-options-panel, sin depender del texto ARIA.
- pickup-prepayment.css: filas e iconos compactos, sin espacio blanco del cuerpo
  cerrado; pie sin margen superior redundante. overflow:clip evita scroll oculto
  del contenedor al enfocar, manteniendo scroll interno de los paneles.
- ReservationPanel.tsx: retirado el círculo grande bajo la etiqueta del diálogo.
- AvailabilityPostActionsView.tsx: lo mismo en cancelar/revocar; cancelar del
  negocio añade el icono pequeño CircleX en la fila. Otros consumidores intactos.

No se agregan motivos de seguimiento ejecutables: el contrato solo recibe
confirmationAccepted:true. La imagen con motivos y aviso de no persistencia era
una maqueta; no se obliga una selección para descartarla silenciosamente.
Cancelar retiro sí guarda reasonDetail; no muestra un aviso falso de motivos
pendientes. Campos/endpoints existentes, sin cambios de backend.

Pruebas por layout y presentación afectados: 10 pruebas de la vista compartida
aprobadas(2,29s), nueve paridades SSR idénticas. Chromium con API simulada y
toques físicos: ventanas sin círculo grande a320/390/430, motivos/teclado/foco,
Volver/X/Escape, busy/error503/recuperación, modo oscuro, reducir movimiento y
ventana de pago real conservados. Se revisaron capturas de las ventanas y del
panel compacto; una captura detectó desplazamiento interno del contenedor y se
repitió el escenario tras aplicar overflow:clip. Sin nuevas dependencias.

Mediciones del panel de tres opciones: alto cerrado374,19px → compacto243px
a320;326,28→243 a360;326,28→230 a390/430. Desplazamiento del pie inferior
menor a0,3px. Cerrar restaura la altura original sin mover la base ni las filas
siguientes. La compacidad depende del número real de acciones y errores.
Scripts compact-options-check-browser/aurora-actions-browser en caché ignorada.
No se prueban operaciones reales de backend ni teléfonos físicos.

Build final, SHA y estado de Vercel se completan al cerrar. No hay tsc/lint
independiente configurado; no se los declara ejecutados. Railway, main y
producción no modificados. Motivos de seguimiento requieren contrato separado.

Build QA/PWA final aprobado: Vite12,50s, advertencia de chunks grandes ya
existente. Ventanas medidas hasta cierre funcional:387s desde inicio de edición,
341s desde preparación/ejecución y42s desde documentación. Son intervalos
solapados, no sumables; análisis inicial sin cronómetro exclusivo.

Ajuste publicado en origin/qa: `b3090f80de3a5d693875b77907d539053634fcf6`.
Vercel success verificado para ese SHA:
https://vercel.com/zipco-s-projects/zipco-app/3MSkbe9hAdyQVgnoPvLi65KoRRiS
Publicación/verificación 71s incluida espera externa. En el teléfono
comprobar QAb3090f8; no se verificó la sesión móvil física. Main conserva
8295ab8c6024ab20851ebd371308d2f299b4668f. Cierre documental local sin otro push.

## Publicación recuperada tras captura Android antigua — 2026-11-18

Clasificación solo frontend, diagnóstico/publicación. La captura del usuario
mostraba QA1f8fa0c y el panel Vercel la misma publicación Ready. No acreditaba
que Aurora estuviera servido ni un problema específico de Android/CSS.
origin/qa sí tenía d7e2963, pero no tenía status Vercel. La consulta directa de
metadatos devolvió403 forbidden; no se conoce la causa del disparo ausente.

Se hizo un solo reintento: enviar el cierre pendiente a078d7c desde qa, con el
mismo código de aplicación (git diff d7e2963 a078d7c -- src vacío). Sin cambios
de herramientas, API, credenciales, protección, main ni backend.

Vercel success verificado para `a078d7c0bdfa821426f4ae38e3d43ed730a098a8`:
https://vercel.com/zipco-s-projects/zipco-app/7UTEPFAjH57uFEKHoNfbakVgWN9w

Lectura pública del alias QA devuelve200 pero sin índices de assets del bundle
de la app reconocibles por el verificador; por ello no se afirma SHA servido
verificado en alias ni teléfono. Se confirma despliegue por status exacto de
Vercel. En teléfono comprobar la etiqueta QAa078d7c al actualizar, sin limpiar
almacenamiento ni perder intenciones pendientes. Aurora debe mostrar etiqueta
superior, X e icono; motivo de seguimiento continúa pendiente de backend.

No se repitieron pruebas de aplicación porque src no cambió; se reutilizan las
10 pruebas, nueve paridades, build y navegador de esta entrega. Reintento y
verificación medidos 117s, incluyendo esperas externas; diagnóstico sin
cronómetro exclusivo. Cierre documental local sin nuevo push/despliegue.

## Segunda entrega Aurora integrada — 2026-11-18

Clasificación solo frontend. Recibidas ahora las cuatro fuentes actualizadas:
ReservationPanel.tsx, AvailabilityPostActionsView.tsx, ReservationReasonChoices.tsx
y pickup-prepayment.css. Sustituyen el acabado blanco provisional por el Aurora
aprobado CliV13: degradado verde/lila, etiqueta, cerrar44px, icono circular,
contenido centrado y pie primario/Volver48px con scroll interno y fade0,22s.
PickupPrepaymentCard.tsx no cambia; tampoco PaymentConfirmationSheet.

Alcance estricto: business + render + pickupPrepaymentFor válido +
AWAITING_PAYMENT_AND_HOLD. No habilita WhatsApp como modalidad ni cambia
estados, categorías, permisos o contratos. Motivos de cancelación/declinación
siguen por reasonDetail existente; seguimiento solo confirmationAccepted:true.
No hay flag ni motivos de seguimiento ejecutables. Tone ok queda como capacidad
de presentación opcional, sin activar flujo de backend.

Integración adicional necesaria: mover openerRef antes de las salidas
condicionales para conservar el orden de hooks. La prueba existente llamaba a
AvailabilityPostActionsView como función: se corrigió para montarla mediante
React SSR, porque ahora posee useRef real. No es un mock del hook.

Validación por vistas compartidas y navegación cambiadas:
- 10 pruebas AvailabilityPostActionsView aprobadas,1,30s.
- Nueve casos de HTML clásico idénticos al original mediante SSR.
- Build QA/PWA aprobado, Vite16,14s; advertencia de chunks>500k preexistente.
  No hay tsc/lint independiente configurado/disponible; no se afirma ejecutado.
- RequestsScreen/controladores/ventanas reales en Chromium, API simulada y
  toques por coordenadas: seguimiento y cancelar retiro a320/390/430; cancelar
  solo reserva, declinar y permitir contacto también a390 cuando permitidos por
  la respuesta simulada. No se amplían permisos reales.
- Sin desborde ni recortes: radios nativos, selección única, teclado, bloqueo
  hasta elegir, cierre44px y CTA48px; centro real mediante Tailwind, Outfit real.
- Volver/X/Escape no hacen POST, mantienen opciones abiertas y devuelven foco a
  la fila disparadora. Fallo503 visible, todos los botones/X bloqueados mientras
  busy y Escape no cierra durante envío. Error también visible fuera del panel.
- Modo oscuro390 mantiene Aurora; reducir movimiento desactiva fade. Ventana de
  confirmación de pago conserva su composición original.
- Ventanas abiertas de seguimiento del cliente pendiente y negocio en
  NEEDS_CLARIFICATION verificadas como zipco-action-dialog, sin Aurora.
  Selección visual única comprobada tras la transición de180ms.

Scripts aurora-actions-browser.mjs y aurora-legacy-browser.mjs y capturas
aurora-* ignorados en node_modules/.cache/business-closure/. Un error inicial al
recortar el módulo del arnés se corrigió en el fixture antes de ejecutar; no fue
un fallo del producto. La transición de selección se captura tras finalizarla.
No se enviaron pagos/pedidos/mensajes reales. Quedan pendientes teléfonos,
backend autenticado y evaluación táctil física. No fue necesario cambiar Railway.
Los endpoints/campos existentes se enumeran en Datos y acciones conservados.

Análisis, edición, reparación/preparación y ejecución solapados sin cronómetro
exclusivo. Se mide aparte build y test arriba; ventanas y publicación al cierre.
Main y producción no modificados.

Ventanas anidadas medidas hasta cierre funcional de esta segunda entrega:
315s desde análisis,300s desde implementación,214s desde preparación/ejecución,
15s desde documentación. No sumar esos intervalos; incluyen esperas y trabajo
solapado. Publicación y verificación se registran tras el despliegue.

Segunda entrega guardada y enviada a origin/qa en
`d7e2963e05bd6fd1d996204701cb215bf708bc4f` (ls-remote confirma el SHA).
Vercel todavía sin estado registrado para ese commit al cerrar la revisión.
Consulta de metadatos del proyecto con credencial existente: HTTP403; no se
imprimieron secretos ni se cambiaron credenciales/protecciones/configuración.
No se afirma despliegue fallido ni exitoso, ni disponibilidad del código en el
alias QA. Último despliegue confirmado anterior:1f8fa0c. Ventana de publicación
y consulta 211s incluida espera externa; no sumar con las otras fases.
Verificar Vercel antes de dar esta segunda entrega por publicada en teléfonos.
Cierre documental local sin otro push. Railway/main/producción intactos.

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
