# Cliente: Contraponer · 1 vez con Glow compartido

Fecha: 2026-11-07. Clasificación: solo frontend, presentación y estado local.

Se reutiliza el diseño aprobado del editor de alternativas, sin copiar tarjetas
ni cambiar CSS. Tres archivos de código modificados en forms/proposal:

- ProposalNegotiation.tsx: una sola prop de presentación, counterProposal,
  exclusivamente para cliente con draftAction COUNTER_PROPOSAL.
- PendingAlternativeActions.tsx: esa prop activa la composición Glow existente;
  el encabezado sigue Contraponer · 1 vez y el origen Propuesta vigente. No se
  muestra la pista de nueva fecha del negocio atrasado en una contrapropuesta.
- AlternativeChangeEditor.tsx: frases sugeridas propias del cliente, solo con
  mensaje vacío. El editor, campos, validación, foto y animaciones son compartidos.

Se conserva la explicación de 3–1000 caracteres y al menos un cambio real. La
fecha es opcional si la vigente es válida o Ahora; fechas vencidas conservan su
validación existente. No cambian permisos, máximo de una contrapropuesta,
recuperación, idempotencia, revisión, confirmación ni hologramas. La prop nueva
es exclusivamente React; no es un campo de API. Propuesta final no rediseñada.

API sin cambios: GET /request-processes/:id/proposals y lecturas de pedidos;
POST /request-processes/:id/actions/counter-proposal. Se conservan expectedVersion,
proposalId, confirmationAccepted, totalPriceClp, message, lineChanges, schedule
opcional y cabeceras/UUID existentes. Railway no necesario, main/producción intactos.

## Pruebas proporcionales

- 55 unitarias aprobadas: alternativeDraft, proposalContract, proposalApi.
- Dos recorridos Chromium a 320/390 con formulario, controlador, revisión y
  hologramas reales; transporte/cuentas sintéticos. Tocar Contraponer abre Glow;
  cambio de precio sin mensaje no permite revisar. Con mensaje se confirma una
  sola vez, sin schedule nuevo y con confirmationAccepted. El proceso queda
  AWAITING_BUSINESS_COUNTER_RESPONSE y ya no ofrece Contraponer otra vez.
- Regresión de alternativa normal del negocio aprobada: precio/mensaje, fecha
  original conservada y holograma de envío. Justificada por formulario compartido.
- Reutilización temporal ignorada de los arneses de negociación y Glow. El mock
  antiguo se adaptó para aceptar query strings en GET propuestas y rutas de
  pedidos actuales; no se cambian herramientas del repo. Cero operaciones QA reales.
- Build QA/PWA aprobado, 2407 módulos, 10 entradas precache, bundling 11,07 s.
  Aviso conocido de chunks grandes. Repo sin configuración/compiler tsc; build
  no equivale a comprobación completa de tipos. git diff --check aprobado.
- Pendiente iPhone/Android físicos y backend real. No se repiten escenarios de
  CSS/recovery ajenos ni se afirma verificación de la entrega push.

## Tiempos y publicación

Lectura inicial anterior al cronómetro no estimada. Análisis 90 s; implementación
55 s; preparación 24 s; ejecución/revisión 127 s, incluida adaptación del fixture.
Build y unitarias (892 ms runner) se solapan con esa ventana, sin sumarlos otra
vez. Documentación/preparación del commit 47 s; publicación/verificación 66 s,
incluidos push 3,60 s y espera. Cierre documental posterior no incluido.
No son métricas de la app.

Publicado en qa: abf6e40f66c4427d39429b9f783737b344e4c5c1. Vercel success para
ese SHA: https://vercel.com/zipco-s-projects/zipco-app/7PA5GuFSv1wwQymy69dXvCtKTK2s.
Cierre documental local, sin segundo push/despliegue.
Verificación independiente de artefactos limitada por el acceso local 403 ya
documentado; no se repite sin un cambio de acceso.
