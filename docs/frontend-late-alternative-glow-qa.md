# Proponer alternativa atrasada — D · Glow

Fecha: 2026-11-07. Clasificación: solo frontend (presentación e interacción local).

## Alcance

Entrega completa de Claude integrada en PendingAlternativeActions.tsx,
AlternativeChangeEditor.tsx y alternative-proposal.css, bajo
src/app/features/requests/forms/proposal/. Variante únicamente para negocio,
STILL_NEEDED, sourceOverride y onCheck presentes. Edición inicial renovada;
revisión final, envío, recuperación, contratos y holograma existentes conservados.
No se modificaron archivos de referencia/protegidos ni herramientas del repo.

Disponibilidad primero, cuatro filas con editor inline, horarios rápidos de
Santiago filtrados mediante santiagoDraftTime, frases solo con mensaje vacío,
mensaje/foto ocultos sin desmontarse hasta elegir un cambio, contador y Glow.
La obligatoriedad de una nueva hora programada sigue en ProposalNegotiation;
la pista visual no sustituye esa regla ni la validación del servidor.

Única adaptación sobre la entrega: efecto de scroll dependiente de un booleano
estable y del editor abierto. El objeto late se recrea en cada render; depender
de su identidad provocaba desplazamientos adicionales al escribir mensajes.
El CSS base recibido se conserva; nuevos estilos específicos zipco-la/late.
AlternativeChangeEditor tiene 520 líneas: se revisó el tamaño orientativo y se
conserva esta unidad coherente de editores compartidos/variante entregada. No se
comprime ni fragmenta durante este ajuste de tres archivos.

## Datos y acciones conservados

lateInitialResponse.status/requiresNewSchedule, productos, total, fecha/hora y
borrador existente. GET /request-processes/:id/proposals y lecturas de pedidos;
POST /request-processes/:id/actions/propose-alternative. Mismos expectedVersion,
proposalId, confirmationAccepted, schedule, lineChanges, totalPriceClp, message,
photo y fulfillment, cabeceras negociadas e Idempotency-Key. No hay nuevos campos,
endpoints, horarios de servidor ni persistencia. Foto local no sube al prepararla.

## Verificación

- 84 pruebas existentes aprobadas: alternativeDraft, proposalContract,
  proposalApi, proposalIntent y proposalSentFeedback. Seleccionadas por las
  dependencias del formulario; no se repitieron suites ajenas.
- Chromium local con RequestsScreen, tarjetas, editor, revisión, diálogo de
  modalidad y holograma reales. Transporte/cuentas sintéticos; cero mutaciones
  QA, cero pushes/notificaciones. Reutiliza el arnés de late-initial y la prueba
  previa del holograma; adaptación temporal ignorada en node_modules/.cache/late-click-audit/.
- Ocho grupos comprobados: responsive/toques por coordenadas a 320/390/430;
  mensaje y foto conservados al quitar/reponer cambios, sin upload; envío único
  con alternative_proposed/AWAITING_CUSTOMER_DECISION y holograma; fallo incierto
  con recuperación GET sin reenvío y mensaje conservado; movimiento reducido sin
  animaciones; formulario no atrasado original.
- Se corrigieron selectores/expectativas del arnés: el fondo decorativo recortado
  no equivale a desborde del contenido; selector con comillas; abrir Ver detalle
  antes de tocar Proponer alternativa en la variante normal. El último caso se
  repitió aisladamente, sin volver a ejecutar los siete grupos ya aprobados.
- Build QA/PWA aprobado, 2407 módulos, 10 entradas precache. Aviso conocido de
  chunks grandes. Repo sin configuración/compilador tsc: build/transpilación,
  no comprobación completa de tipos. git diff --check aprobado.
- Pendientes iPhone/Android físicos, animaciones percibidas y backend real.

## Tiempos

Lectura inicial previa al cronómetro no estimada. Análisis 40 s; integración y
revisión 48 s; preparación de pruebas 84 s; ejecución/revisión 249 s, incluidos
ajustes del arnés. Unitarias: 1,03 s de ejecución del runner, solapadas con la
preparación. Build: 7,05 s de bundling más generación PWA, dentro de la ventana
de ejecución/revisión, sin sumarlo de nuevo. Documentación/preparación del commit
74 s; publicación/verificación 81 s (incluye push de 3,3 s, espera Vercel y
comprobación GET fallida por HTTP 403). Cierre documental posterior no incluido.
Estos tiempos no miden rendimiento de la app.

Publicado en qa: 578fe17ad3fd41903b992e70e4b6e6499acffe2e.
Vercel confirmó success para ese SHA exacto:
https://vercel.com/zipco-s-projects/zipco-app/DUSiFRdhqxPZZZHiSffbiQh4Q8dx.
La comprobación adicional GET de artefactos/proyecto/alias con la herramienta
existente no pudo completarse: HTTP 403 al consultar metadatos de Vercel con
el acceso local. No se cambiaron credenciales, protección ni herramientas.
Success de Vercel no se presenta como comprobación independiente del bundle.
El cierre documental posterior queda local, sin push ni segundo despliegue.
Railway innecesario. Main conserva 8295ab8c6024ab20851ebd371308d2f299b4668f;
producción intacta. Carpeta previa ajena de docs/design-handoffs conservada.
