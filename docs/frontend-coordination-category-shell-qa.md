# UI-COORDINATION-CATEGORY-SHELL-01 — Coordinación sin cambio de diseño al cargar

2026-10-23. Solo frontend QA. Corrección de la transición En curso → Por
coordinar observada por el usuario en 901f9d1.

## Antes / Después

Antes: ProcessOrderCard mostraba su tarjeta Aurora genérica mientras useAgreement
leía las condiciones aceptadas. Al terminar, la reemplazaba por el diseño de
coordinación. El cambio de categoría reiniciaba esa lectura para cada tarjeta.
Era una vista intermedia del acuerdo, no un estado nuevo del pedido.

Después: COORDINATION_PENDING/COORDINATING usan desde el primer render el mismo
diseño compacto de coordinación. La carga y la vista verificada comparten
CoordinationCardHeader, ancho reservado para total, avatar, estado y fila de paso.
La fila indica Autorizar contacto o Iniciar coordinación por WhatsApp según la
autorización ya recibida en el proceso; permanece deshabilitada mientras verifica.
El importe se reserva visualmente y solo aparece tras leer el acuerdo válido.
No se presenta el total/producto/nota/foto de la solicitud original como acuerdo.

Si la lectura falla, permanece el mismo diseño con error y Reintentar carga de
condiciones. Reintentar solo repite GET; no acepta, autoriza ni envía propuestas.
No se añaden caches ni se omiten verificaciones del acuerdo. Las tarjetas siguen
cerradas al navegar y se conserva la apertura dirigida desde notificación,
incluida la llegada antes de terminar el acuerdo.

## Archivos y contrato

- Nuevo `src/app/screens/requests/CoordinationCardShell.tsx`: diseño de espera/error
  y encabezado compartido con la tarjeta verificada.
- `BusinessCoordinationCard.tsx`: reutiliza ese encabezado.
- `ProcessOrderCard.tsx`: selecciona el diseño correcto antes de terminar GET.
- `processCardVisualFlow.test.ts` y `processPresentation.test.ts`: preservan la
  prohibición de usar condiciones antiguas y la recuperación de errores.
- `scripts/check-business-own-feedback.mjs`: transición real con lista/hook/tab,
  lectura pausada, observación DOM, medidas y error/reintento.
- Este registro y el catálogo de diseño.

Sin campos, endpoints, estados, permisos o persistencia nuevos. Conserva las
listas con processContract=alternatives-v1 y GET
`/request-processes/:id/agreement`, validando requestProcessId/agreementPublicId.
Nombre/imagen/estado y consentimiento proceden de la lista existente; precio y
condiciones solo del AgreementReadDto validado. Sin cambios de acciones POST.

## Validación y pendientes

Suite **1.219 pruebas / 104 archivos aprobados** y build QA/PWA aprobado; aviso
previo de bundle mayor de 500 kB. No hay tsc independiente configurado.
Se actualizaron expectativas del diseño de carga anterior, conservando las
comprobaciones de ausencia de datos originales y de reintento.

Pruebas de navegador incluyen entrada desde En curso con lectura de acuerdo
pausada: cero apariciones de .zipco-aurora-card, ningún botón de acción habilitado,
altura compacta estable (diferencia inferior a 2 px) y cero POST. Ambos actores,
360/393 px, con pasos Autorizar contacto e Iniciar coordinación por WhatsApp.
También error y recuperación GET, notificación durante carga y apertura manual.
Resultados finales: **13 recorridos de navegador aprobados**, más **234 casos
visuales aprobados** en 12 estados, ambos actores, temas claro/oscuro y anchos
320/393/400 px. Publicación exacta se registra al cerrar.
Capturas en `node_modules/.cache/business-own-feedback/transition-{loading,loaded}-{business,customer}-{360,393}.png`.
Se revisaron las dos capturas del negocio en 393 px. Sin acciones reales.

Pendiente Android/iPhone: pasar de En curso a Por coordinar con red normal/lenta,
confirmar que conserva la tarjeta compacta y probar apertura manual. Luego probar
la navegación desde notificación. Un paso por vez; no se declara aprobación física.
Los reintentos fiables de notificaciones siguen pendientes del cierre general.

Código respaldado en GitHub, rama qa: `633ebc288995c1ecc1950a4484db0251d1347bce`.
Vercel QA READY `dpl_vZHD9jkg88iU7ZX4hUw2xhSiWjzG`, SHA exacto y alias
`https://zipco-app-git-qa-zipco-s-projects.vercel.app` comprobados.
Este cierre documental también se respalda y publica en QA con código idéntico.
Railway/backend no requeridos.
Main y producción sin modificaciones.
