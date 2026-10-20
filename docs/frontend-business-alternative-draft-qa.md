# UI-BUSINESS-ALTERNATIVE-DRAFT-01 — Proponer alternativa: preparación

Fecha: 2026-10-20. Clasificación frontend + backend, contrato definido por backend;
este bloque cambia solo frontend QA. Backend comunicado como enviado a GitHub en
`c1f3b57112f37236af5c08b923d2c12c7be43de5`; **activación Railway QA pendiente**,
no comprobada ni promovida por este trabajo. Contrato leído:
`C:/dev/zipco-backend-qa/docs/testing/business-alternative-proposal-qa.md`,
REQ-BUSINESS-ALTERNATIVE-01. No se modifica backend, main o producción.

## Diseño recuperado y conservado

Fuente histórica inspeccionada en Git:
`e386b2c450bdbfa883331f382ce61c39b81f0e70`, «feat: elevate request and proposal workflows».
Se contrastó con el árbol previo a este bloque, frontend
`19a3618f7b8974c974d488adc45862555c57aec0`.

- Botón violeta «Proponer alternativa» de BusinessOrderCard.tsx.
- Modal de BusinessOrdersTab.tsx: ancho max-w-sm, esquinas redondeadas, panel
  desplazable de hasta 88vh, fondo oscuro, Volver y acción violeta/índigo.
- Componente **reutilizado realmente** AlternativeProposalFields.tsx: tarjeta
  Solicitud original; cuatro opciones con iconos en dos columnas (Producto o
  servicio, Precio, Cantidad, Fecha y hora); campos desplegables; cantidad +/−;
  explicación y adjunto de foto con borde violeta discontinuo.

Se añadieron extensiones opcionales al componente compartido; su consumidor
legacy conserva valores y transporte anteriores. El formulario de procesos usa
slots/control explícito y **no conecta el uploader o handler legacy**. El modal
nuevo usa Radix Dialog para foco, teclado/cierre y bloqueo modal. No rediseña
tarjetas, aceptación, rechazo, Historial o desplazamiento previamente aprobados.

## Alcance visible: solo preparación, sin guardar ni enviar

Negocio, solicitud inicial válida y accionable: botón «Proponer alternativa».
Mientras no se negocia el contrato nuevo, los permisos actuales de aceptar o
rechazar permiten únicamente abrir este editor local. También reconoce el permiso
explícito PROPOSE_ALTERNATIVE si se recibe, sin habilitar su ejecución. Nunca se
concede permiso de servidor por inferencia de Order.status. No aparece para cliente,
proceso inválido, coordinación o solicitud sin acciones de negocio.

El aviso indica «Solo preparación. Aún no se puede enviar al cliente. Al cerrar se
descartan estos cambios». Revisar alternativa muestra comparación; **Confirmar y
enviar está deshabilitado y no tiene handler de envío**. No hay POST nuevo,
Idempotency-Key, recibo simulado, éxito, actualización optimista, cambio de estado,
notificación o persistencia del borrador. Cerrar descarta y reabrir comienza limpio.
Las lecturas existentes y sus parámetros se conservan.

## Campos y validación del formulario

- Producto/servicio: conserva artículo original o prepara opción CUSTOM escrita,
  nombre trim1–120, descripción opcional hasta500; conserva tipo de la solicitud.
  No crea catálogo ni inventa IDs. Selector de otro ID publicado y lectura de su
  snapshot canónico no se conectan todavía; no se sustituye catálogo con datos falsos.
- Líneas originales conservadas en memoria separada; en solicitudes de varias
  líneas se elige cuál ajustar. No agrega/elimina ni reordena. Índices de revisión
  local, pendientes de validar contra snapshot autorizado antes de cualquier envío.
- Cantidad entera1–99; servicio una línea/cantidad1. Se conserva orderType que ya
  entrega la API; si no está disponible no se inventa ni se valida como producto.
- Precio del artículo conservado: por unidad entero1–50.000.000. CUSTOM: total
  de la línea explícito y entero; no divide por cantidad ni inventa precio unitario.
  Total propuesto suma líneas con máximo50.000.000, sin redondear ni sanitizar
  silenciosamente decimales, negativos o notación exponencial.
- Explicación obligatoria trim3–1000 en toda propuesta; texto pide explicar el
  motivo de cualquier cambio de precio. No se afirma validar semánticamente la
  veracidad del motivo, igual que el contrato backend.
- Fecha/hora: conserva horario original o prepara IMMEDIATE/SCHEDULED. Comprobación
  local America/Santiago, fecha futura, round-trip UTC−3/−4 para rechazar horas
  inexistentes o ambiguas; no inventa anticipación mínima. Fecha original vencida
  obliga a proponer una futura o inmediata. Backend deberá validar nuevamente al enviar.
- Requiere cambio material, no solo explicación/foto. La comparación conserva
  expectedVersion y currentProposalId como proposalId, pero **no es payload confirmado**:
  no añade confirmationAccepted ni afirma disponer del snapshot canónico.
- Si cambia proceso, versión, propuesta o permiso mientras está abierto, deshabilita
  revisión e indica cerrar/actualizar. No repite ni reconcilia acciones ya confirmadas.
- Foto opcional **local**: JPG/PNG/WebP hasta8MB para vista previa, object URL revocado
  al reemplazar/quitar/cerrar. Sin upload, almacenamiento persistente o datos enviados.
  El límite8MB es del selector local, no una regla nueva atribuida al backend.
  No convierte blob en URL Cloudinary ni usa avatar/foto original como propuesta.

## Interbloqueo de activación y compatibilidad

Revisado processContract=alternatives-v1. Backend lo exige para descubrir acciones
en GET /orders/business/:id, /orders/my-orders y /request-processes/:id.
GET /request-processes/:id/proposals consulta el contrato nuevo explícitamente.
Sin parámetro conserva acciones anteriores mientras espera primera respuesta.

**No se activa ese parámetro en las lecturas actuales**, ni se consulta propuestas
o catálogo nuevo. Se reconoce solo PROPOSE_ALTERNATIVE para el caso inicial;
normalización de estados posteriores/schema2/acuerdos negociados/respuestas del
cliente sigue pendiente. No se afirma compatibilidad completa con alternativas-v1.

ALTERNATIVE_RELEASE y canSubmitAlternative mantienen bloqueo literal, sin interruptor
por entorno, URL o almacenamiento. Para un bloque posterior se requiere confirmar
Railway QA, integrar visualización/respuesta del cliente y compatibilidad de ambos
lectores/snapshots/acuerdos/cierres, negociar lecturas, validar fotos Cloudinary y
transporte estricto con versión/propuesta/confirmación e idempotencia. **No basta
publicar backend ni recibir PROPOSE_ALTERNATIVE para habilitarlo.**

Endpoint futuro, **no invocado ni implementado como transporte aquí**:
POST /request-processes/:id/actions/propose-alternative. No se usa PATCH legacy.
No se altera push, arquitectura pausada, Railway, permisos o configuración global.

## Archivos y comprobaciones

- src/app/screens/requests/AlternativeProposalFields.tsx: diseño compartido con
  slots opcionales, selección controlada, límites, explicación y foto local separada.
- PendingAlternativeActions.tsx: botón, modal, edición/comparación local, bloqueo y foto.
- alternativeDraft.ts: modelo separado, validación y bloqueo de envío.
- ProcessOrderCard.tsx: entrada únicamente negocio/espera inicial, conserva otras acciones.
- requestProcess.ts: reconocimiento explícito de acción inicial; desconocidas siguen seguras.
- types.ts y orderNormalization.ts: conservar orderType recibido, sin inventarlo.
- alternativeDraft.test.ts, PendingAlternativeActions.test.ts: validación/formulario.
- processPresentation.test.ts, processCardVisualFlow.test.ts,
  orderCardCharacterization.test.ts: expectativas actualizadas de preparación local.
- useRequestsContract.test.ts: el transporte legacy no puede enviar una propuesta de proceso.
- scripts/check-business-alternative-draft.mjs: Chrome DOM/React/CSS real sin red backend.
- Esta ficha y referencias documentales de cierre.

**1050 pruebas en 91 archivos aprobadas y build QA aprobado**. Comprobación táctil del formulario:
**6 escenarios Chrome** (320×700,393×852,400×870, producto/servicio): abrir, editar,
revisar, envío bloqueado, cerrar/reabrir sin borrador, límites horizontales y cantidad
de servicio. No acceso backend, upload, persistencia o acciones de pedidos.
Regresión campanitas: una ejecución no capturó posición intermedia de scroll suave;
repetición aislada aprobó **24/24 casos**. No se cambió el helper ni se ocultó la
aserción; el primer resultado no prueba por sí solo un fallo funcional o su causa.
Advertencia habitual de bundle Vite >500kB.

## Publicación y pruebas pendientes

Solo qa/Vercel Preview, proyecto zipco-app/equipo zipco-s-projects, fuente Git real,
SHA exacto y Backend QA. Override por despliegue, sin tocar configuración global:
`ZIPCO_QA_LOAD_DIAGNOSTICS=1 ZIPCO_QA_NOTIFICATION_TRACE=0 npm run build -- --mode qa`.

Celulares pendientes: abrir acceso habitual, Mi Negocio → Pendientes → Proponer
alternativa. Probar seleccionar campos, opción escrita y total, cantidad, fecha/hora,
explicación y foto local; Revisar; comprobar que Confirmar y enviar está bloqueado.
Volver/cerrar descarta. Aceptar y rechazar existentes conservan sus recorridos.

No se acredita envío, almacenamiento backend, recepción/respuesta del cliente,
acuerdo nuevo, notificación ni prueba física Android/iPhone. Tampoco se declara
activado c1f3b57 en Railway. Proponer/aceptar/rechazar reales quedan fuera de estas
comprobaciones. La deuda de notificaciones fiables y privacidad sigue pendiente.

## Resultado de publicación — 2026-10-20

Código, pruebas, script y ficha (15 rutas) enviados a origin/qa en
`f2a4ccf453d6afbcf0f27fcb581ea548d5b1cc81`.
Preview funcional **READY**: `dpl_mXn3poScvkfygVN524HT6DYRhRn8`;
URL propia https://zipco-4sncdy79z-zipco-s-projects.vercel.app.
Fuente GitHub real, SHA exacto, rama qa, entorno Preview y build qa completado
verificados. Alias habitual https://zipco-app-git-qa-zipco-s-projects.vercel.app
apunta a ese despliegue al comprobarlo.

Backend Preview verificado como https://zipco-backend-qa.up.railway.app, sin
atribuirle activación del SHA c1f3b57. Diagnóstico de lecturas conservado y traza
de clic deshabilitada (asset ausente). Build global null y producción main
conservados. **Envío de alternativas bloqueado en el código publicado**.

Este cierre y sus referencias se guardan en un commit documental posterior;
su publicación mantiene el mismo código funcional y override exclusivo QA.
El SHA visible final cambia al del cierre. No hay conformidad física del nuevo
formulario ni flujo integrado de alternativas; no se ejecutaron acciones reales,
uploads o cambios de pedidos en la implementación, validación o publicación.
