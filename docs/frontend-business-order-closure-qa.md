# Cerrar solicitud desde Mi Negocio → En curso

2026-11-14, America/Santiago. Clasificación: frontend + backend coordinado.
Backend aportado por su chat: Railway QA cc17287, contrato E207 publicado.
Fuente: C:/dev/zipco-backend-qa/docs/testing/business-in-progress-closure-contract-qa.md.
Este bloque modifica solo frontend QA. No modifica backend, main ni producción.

## Composición y alcance

Integra la entrega Claude CliV12 (BusinessAgendaRow (3), business-agenda (3),
BusinessProgressCardView (1), business-progress (1)) sobre la base QA 00e6a8e.
Swipe sobre la tarjeta plegada revela Cerrar solicitud; nunca envía al soltar.
Botón equivalente dentro del detalle; hoja real Radix, motivos y confirmaciones.
Una sola fila revelada, scroll vertical, miniatura y slider conservados.

Controles nuevos solo en productos IN_PROGRESS de negocio, no embebidos,
sin recepción previa ni localPickupInformation y con capacidad/acciones del servidor.
Backend también soporta READY, pero este bloque no amplía los accesos a Listos.
Sin capacidad negociada no aparecen swipe, hoja, botón ni aviso de ayuda.

## Propietarios y cambios necesarios al diseño aislado

- Agenda: BusinessAgendaRow.tsx, business-agenda.css, BusinessOrdersTab.tsx.
  Conserva fecha acordada, layout compacto, pausas y transición de apertura.
- Tarjeta: BusinessProgressCardView.tsx y business-progress.css.
- Hoja canónica extraída a cards/business/progress/CloseRequest.tsx, sin mocks.
- Dominio/transporte/controlador separados en domain/businessClosure.ts,
  api/businessClosureApi.ts, api/businessClosureCapabilities.ts,
  application/useBusinessClosure.ts e intents/businessClosureIntent.ts.
- participantContractHeaders.ts negocia la capacidad y añade cabecera a lecturas.
- requestProcess.ts normaliza opciones, declaración, motivos y cierre estructurado.
- requestStatusGrouping.ts prioriza categorías por participante antes de READY.
- ProcessHistoryCard.tsx conserva acuerdo, motivo y ReservationPanel real.
- ReservationPanel.tsx solo incorpora marcador/foco para navegar al panel existente.
- RequestStatusTab.tsx incorpora destino visual de salida hacia Historial.
- Cliente: CustomerReceiptFlowCardView, su controlador, CustomerPickupCard,
  CustomerWhatsappProgressCard y ReadyPanel distinguen entrega declarada de Listo.
  No crean recepción ni finalización: mantienen sus acciones reales independientes.
- orderNotice.ts y BusinessNotificationMonitor.tsx: texto, deduplicación y contador
  por participante; no tratar declaración como aviso MARK_READY ni como pago.

No se reemplazan controladores de reserva ni hojas de condiciones por imitaciones.
No se implementa borrado/archivo personal. Una declaración del negocio no acredita
pago, devolución ni recepción confirmada por el cliente.

## Contrato utilizado

- GET /request-process-capabilities → businessOrderClosure, enabled y contract.
- X-Business-Order-Closure-Contract: business-order-closure-v1 junto a contratos
  existentes de proceso, recepción y horario; sin flags ni campos inventados.
- POST /request-processes/:id/actions/declare-delivery:
  expectedVersion, deliveryDeclared:true e Idempotency-Key UUID por intención.
- POST /request-processes/:id/actions/close-without-delivery:
  expectedVersion, closureConfirmed:true, reasonCode; reasonDetail solo OTHER.
- GET /request-processes/:id/business-closure-result con clave ORIGINAL en cabecera.
- Listas privadas existentes para releer estado actual antes de publicar el resultado.
- businessClosure.businessCategory/customerCategory gobiernan agrupación y contadores.
- businessClosureOptions.deliveryBlock/reasonCodes gobiernan explicación y motivos.

Motivos exactos: CUSTOMER_DID_NOT_COLLECT, BUSINESS_COULD_NOT_FULFILL,
AGREED_NOT_TO_PROCEED, OTHER. OTHER exige texto recortado 3–1000 caracteres,
con los controles permitidos por reservationText del backend (tab/CR/LF válidos).

La declaración lleva negocio a Historial; cliente permanece En curso para recibir
y finalizar. No se concretó lleva ambos a Historial y conserva aclaraciones.
Un bloqueo enlaza al panel real de la reserva del pedido; si falta/cambió su ID,
actualiza el pedido sin inventar una confirmación de apartado o pago.

## Incertidumbre, seguridad de interacción y presentación

Intención durable en sessionStorage, separada por usuario/negocio/proceso;
almacena UUID, acción y cuerpo exactos, nunca credenciales. Bloqueo compartido por
slot y protección antes del POST. Error incierto conserva la intención; reapertura
y remontaje muestran Comprobar estado sin nuevo POST. recorded:false NO demuestra
fracaso ni autoriza otra clave. Un recibo válido permite reconciliar por GET.
Confirmación durable antes de limpiar, con tombstone si falla la eliminación.
Sesión cambiada/desmontada no publica resultados en otra cuenta.

Se sustituye el operation.update genérico del prototipo para la recuperación del
cierre por su endpoint dedicado. No se afirma que permanecer en la lista pruebe fallo.
La lectura actual se realiza antes de la salida visual. La fila notifica fin de su
animación y publica el recibo/recuento, con respaldo acotado de 650 ms y salida sin
animación con movimiento reducido; no se retrasa la petición de datos 950 ms.
No cambia automáticamente la pestaña que está mirando el usuario.

## Validación y evidencia

Vitest por dependencias: contrato/normalizador, transporte/recuperación/intenciones,
reservas, recepción, agrupación, atención, navegación, monitor y avisos. Ejecuciones:
137 pruebas (5 archivos), 140 (10 archivos), y cierre final 29 (3 archivos), aprobadas.
Son conjuntos parcialmente solapados; NO sumar como casos únicos. La primera corrida
de 96 casos tenía colección duplicada por importar una fixture desde un test; se
extrajo la fixture y se corrigió antes de los resultados anteriores.

Navegador Chromium con RequestsScreen y componentes reales, HTTP sintético:
- 320/360/390/430: gesto corto/largo, scroll vertical, una fila, sin envío al soltar,
  botón, foco inicial, Escape, motivo OTHER requerido, sin desborde y entrega única.
- Error de versión, bloqueo de reserva y navegación a controles reales.
- Respuesta perdida sin recibo: GET negativo no reenvía; conserva UUID al remontar.
- Respuesta perdida con recibo: recuperación positiva sin segundo POST.
- Negocio Historial y cliente En curso; recepción y finalización posteriores con
  los endpoints existentes, tres comandos distintos en el recorrido completo.
- Miniatura real no pliega; capacidad apagada oculta accesos; reduced motion sin
  animación en hoja. Sin excepciones JS en las corridas aprobadas.
- Historial conserva lectura y seguimiento de reserva; fixture PREPAYMENT con
  NEEDS_CLARIFICATION mantiene acciones en prueba de normalización.

Evidencias locales ignoradas en node_modules/.cache/business-closure/ y scripts
business-closure-browser.mjs, business-closure-additional.mjs,
business-closure-customer.mjs; reutilizan el escenario real de agenda aprobado.
No se publican esos fixtures ni mocks. Ningún pedido, pago, push o SMS real creado.

Fallos de preparación: Chrome no inició una vez (DevToolsActivePort); se ejecutó con
el permiso de entorno local requerido. Un gesto de prueba caía sobre Ver detalle y
se corrigió su coordenada. El recorrido cliente necesitó permisos diferenciados por
rol en el mock; no se alteraron permisos productivos para hacerlo pasar. Una corrida
sin salida quedó esperando cierre del arnés y se interrumpió; la corrida corregida
finalizó y aprobó. No atribuir estos tiempos al rendimiento de la aplicación.

Build Vite QA y PWA aprobados. Proyecto sin tsconfig/tsc instalado ni comando de
tipado independiente; no afirmar tsc aprobado. Advertencia habitual de bundle >500k
conservada; no se amplía este bloque a reorganizar paquetes.

Pendiente: autenticación/operaciones reales en QA y prueba física iPhone/Android,
incluidos gesto, sensibilidad, retorno de foco y reserva con pago previo real.
El navegador con mocks no acredita esos recorridos físicos ni el envío de push.

## Tiempos y publicación

Antes de documentación se midieron 23 min 07 s desde inicio de implementación;
la ventana superpuesta de preparación/pruebas fue 17 min 04 s. Son intervalos que
se solapan: no sumarlos ni presentarlos como tiempo exclusivo de cada fase.
Análisis previo no tuvo timer aislado. La implementación y la reparación de arneses
se intercalaron; no hay medición honesta que las separe en minutos exclusivos.
Ejecución Vitest reportada: 2,07 s; 4,65 s; 0,66 s en las corridas citadas.
Build Vite: 7,29 s y 6,64 s; se repitió por cambios posteriores justificados de
semántica/avisos/validación. La generación PWA también aprobó, sin timer aislado.
Documentación y publicación/verificación se registran al cierre, por separado.

Rama qa. Publicación frontend y SHA exacto: pendientes de completar tras push y
verificación Vercel. Backend no requiere otro despliegue en este bloque.
Main de frontend permanece 8295ab8c6024ab20851ebd371308d2f299b4668f.
