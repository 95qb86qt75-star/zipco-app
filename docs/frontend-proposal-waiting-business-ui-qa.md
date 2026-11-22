# Esperando al cliente: tarjeta del negocio y conversación

## Actualización 2026-11-22 · NegW17

Versión vigente para negocio `AWAITING_CUSTOMER_DECISION`. El informe anterior,
debajo, es histórico. Clasificación: **solo frontend**, presentación e interacción local.

Se reemplazaron completos los cinco adjuntos autorizados:

- `src/app/features/requests/cards/shared/proposal/ProposalWaitingCard.tsx`.
- Misma carpeta: `proposal-waiting.css`, `ProposalChat.tsx`, `proposal-chat.css`.
- `src/app/features/requests/forms/proposal/ProposalNegotiation.tsx`.

Tarjeta clara, banner turquesa, propuesta horaria, detalle de solicitud original y
monto comparado solo cuando cambia. Conversación explícita con datos de cada
snapshot, todos los tipos de cambio y turno de espera. No infiere pago, reserva,
entrega ni productos propuestos desde el pedido original. Sin resumen/fecha no
inventa monto/hora; conserva «No incluye una hora fija». No usa `needNow` del
pedido original para atribuírselo a otra propuesta.

Única adaptación sobre los adjuntos: referencia al botón de entrada y
`onCloseAutoFocus` limitado a esta variante. La prueba real detectó que Radix no
devolvía el foco al botón tras la carga asíncrona. Ahora lo devuelve si continúa
montado. Sin cambio de carga, envío, validación o recuperación.

### Contrato y alcance conservados

Lectura existente `GET /request-processes/:id/proposals`, con sus cabeceras y
parámetros actuales, mediante `readProposals`. Sin nuevos endpoints/payloads.
Datos: `proposalSummary.totalPriceClp/scheduledFor`, productos/nota/foto del
pedido original y `subjectSnapshot` de cada propuesta. Fechas America/Santiago.
Abrir, actualizar y consultar hojas no hace POST. Railway QA no fue necesario;
`main` y producción no se modifican.

Comparación directa contra respaldo: rama cliente y función
`BusinessFinalWaiting` idénticas; las dos hojas CSS conservan íntegro el prefijo
anterior y agregan bloques scoped. Fuente heredada, sin dependencias nuevas.
Los cinco archivos completos solicitados conservan su responsabilidad compartida;
no se fragmentaron ni comprimieron para satisfacer un límite de líneas.

### Validación real de frontend

- 64 pruebas aprobadas en cuatro archivos: ProposalChat, proposalContract,
  proposalApi y availabilityScheduleReview, 1,57 s. Selección por conversación
  compartida, normalización, lectura y convivencia E221.
- Chrome con RequestsScreen, componentes y diálogos reales, HTTP simulado:
  12 escenarios (320/360/390/430 × básica; tres productos/nombre y nota largos/
  foto/cambio de producto-cantidad-precio-fecha; sin hora/nota). Sin desbordes;
  detalle cerrado inerte; montos por snapshot; separadores de días; hoja real
  anidada; Escape, actualización y foco; sin POST ni excepciones.
- Adicionales aprobados: ausencia de resumen; carga con botón bloqueado; fallo
  de lectura en tarjeta y al actualizar conversación, recuperación por lectura;
  movimiento reducido; contrapropuesta del negocio sin modificador NegW17.
- Fallos de arnés corregidos: selector CSS de atributo numérico sin comillas,
  mensaje largo con espacio final no permitido y fixture de contrapropuesta con
  total incompatible. No se cambió el contrato para aceptar datos inválidos.
  Se repitió el caso afectado y la matriz necesaria para verificar el foco.
- Build QA/PWA final aprobado (salida 0), Vite 8,55 s; aviso conocido de chunks
  grandes. Repetido tras corregir foco y confirmar salida: una invocación anterior
  con redirección stderr en PowerShell devolvió 1 pese a generar artefactos,
  por lo que no se contabiliza como exitosa.
- Este checkout no configura comandos typecheck/lint ni compilador TypeScript
  independiente; no se afirma haber ejecutado tsc/lint.

Evidencia local ignorada: `node_modules/.cache/negw17`, respaldos, fixtures, logs
y capturas closed-320/360/390/430, expanded-390 y conversation-390. No se recibió
tablero navegable; comparación con entrega y referencias del chat. El navegador
bloquea imágenes externas: no acredita backend real, descargas remotas ni
Safari/Android físicos. Revisión en ambos teléfonos pendiente. Publicación por
rama `qa`; verificar Vercel contra el SHA exacto en el cierre del chat.

### Medición

Medidos por herramientas: ejecución unitaria 1,57 s y Vite final 8,55 s.
Análisis, implementación, preparación del arnés, ejecución visual, documentación
y publicación no tuvieron cronómetro de fase: no se estiman. Build y navegador
corrieron concurrentemente; no se suman sus tiempos como duración total ni se
atribuyen esperas a animaciones.

---

Clasificación: solo frontend. Diseño recibido en Downloads: `11_TARJETA_ESPERANDO_RESPUESTA_NEGOCIO (1).md`, `ProcessOrderCard.tsx`, `ProposalWaitingCard.tsx` y `proposal-waiting.css`. Ajuste adicional pedido por Bastián: dentro de Ver detalle, botón «Ver conversación del pedido» para abrir la conversación existente con solicitud original y propuestas.

## Resultado

La nueva tarjeta se muestra solo al negocio en AWAITING_CUSTOMER_DECISION y AWAITING_CUSTOMER_FINAL_DECISION. Cabecera del cliente, total propuesto, calendario/hora de la propuesta, hora original y estado ESPERANDO AL CLIENTE. Si scheduledFor es null no se inventa una hora. Final tiene texto de propuesta final. Detalle plegado inicialmente, con productos/nota/foto originales y fechas; incluye el botón de conversación que reutiliza ProposalNegotiation/ProposalChat, sus lecturas, fotos y detalles existentes.

No ofrece aceptar/rechazar ni reenviar mientras el negocio espera. Cliente y AWAITING_BUSINESS_COUNTER_RESPONSE conservan su interfaz para responder. La conversación del negocio mantiene la corrección anterior: no duplica retiro/reserva fuera del detalle de la propuesta.

Se conserva el diseño adjunto con ajustes de envoltura en pantallas angostas, aislamiento de capas y reloj de arena decorativo sin captura de toques. Movimiento reducido sin animación. La barra inferior conserva su capa superior.

## Datos reales y límites

Total y fecha nuevos: requestProcess.proposalSummary.totalPriceClp y scheduledFor, en America/Santiago. Fecha original: lateInitialResponse.scheduledFor cuando esté presente; de lo contrario los campos deliveryDate/deliveryTime originales ya recibidos del pedido. Las propuestas originales se pueden consultar completas en la conversación.

El contrato actual omite lateInitialResponse al pasar a la nueva propuesta; no se conserva ni simula una franja que afirme «El cliente confirmó…» sin ese dato. No se agrega hora de envío porque proposalSummary no la entrega. No se usan createdAt/updatedAt con otro significado. No se agregan campos, endpoints, estados, permisos ni notificaciones.

Conversación: GET `/request-processes/:id/proposals?processContract=availability-v3&initialResponseContract=late-initial-v1`, JWT y headers de negociación existentes. Abrirla y consultar detalles no realiza POST.

## Archivos

- Nuevos: `src/app/screens/requests/ProposalWaitingCard.tsx`, `proposal-waiting.css`.
- Conexión: `ProcessOrderCard.tsx`.
- `ProposalNegotiation.tsx`: prop opcional de etiqueta para el botón y título de conversación; lecturas/acciones actuales intactas.
- Expectativa visual actualizada en `processPresentation.test.ts`; navegador en `scripts/check-proposal-waiting-ui.mjs`.

## Validación y publicación

1.484 pruebas / 119 archivos aprobados. 15 escenarios de navegador con componentes reales y HTTP sintético: inicial/final, programada/sin hora, 320/390/430 px, plegado/desplegado, conversación con todos los turnos, detalle de solicitud/propuesta, solo GET al abrir, movimiento reducido y compatibilidad de cliente/contrapropuesta. Capturas locales en `node_modules/.cache/proposal-waiting-ui`. No hay mutaciones reales de QA.

Build QA/PWA aprobado; aviso conocido de bundle mayor de 500 kB. No se presentan lint/TypeScript independientes como ejecutados. Publicación por rama qa → integración GitHub/Vercel QA. Pendiente revisión física del usuario en Android/iPhone tras recargar la versión publicada.

Railway QA no es necesario. Main y producción intactos; seis documentos locales previos ajenos conservados fuera del commit.
