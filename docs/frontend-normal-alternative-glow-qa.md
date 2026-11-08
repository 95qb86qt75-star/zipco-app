# Glow para la alternativa inicial normal del negocio

Fecha: 2026-11-07. Clasificación: solo frontend, composición visual e interacción
local existente. Usuario aprobó físicamente Glow atrasado y pidió compartirlo
con la alternativa normal sin exigir otra fecha.

Único código modificado: forms/proposal/PendingAlternativeActions.tsx dentro de
requests. Se selecciona Glow para una alternativa inicial accionable del negocio
con sourceOverride/onConfirm, usando canPrepareAlternative existente. No depende
de onCheck (que solo recibe la atrasada). La pista de nueva fecha se conserva
solo con STILL_NEEDED/requiresNewSchedule. Mismo editor, foto, CSS y animaciones,
sin duplicar diseños. Contrapropuestas y propuesta final conservan su composición.

Al menos un cambio real y mensaje de 3–1000 caracteres siguen siendo necesarios.
Guardar un editor sin modificar su valor no cuenta como cambio. La disponibilidad
normal es opcional: se conserva la fecha futura original o el pedido para Ahora.
No se debilita reviewAlternative ni la protección específica de ProposalNegotiation
para atrasadas. Una fecha programada vencida sigue sujeta a las reglas existentes.

Mismos campos, headers y endpoints: GET de propuestas/pedidos y POST
/request-processes/:id/actions/propose-alternative, con versión, propuesta,
confirmationAccepted, lineChanges, totalPriceClp, message, schedule opcional y
fulfillment. No se cambia API, permisos, idempotencia, estados ni recuperación.
Railway no es necesario; main y producción intactos.

## Pruebas seleccionadas

- 22 pruebas de alternativeDraft aprobadas (687 ms runner). No se repitieron
  contratos, intents ni todas las variantes responsive ya aprobadas: no cambiaron
  esas dependencias, CSS ni editores.
- Tres escenarios de Chromium, RequestsScreen real, HTTP/cuentas sintéticos y
  toques por coordenadas: alternativa de precio con fecha futura conservada;
  alternativa de precio para Ahora; regresión STILL_NEEDED con nueva hora.
  Cada caso envía una sola vez y muestra el holograma real. Los dos normales
  envían sin schedule; importe nuevo y mensaje comprobados. Sin cambios o sin
  mensaje no permite revisión. La atrasada conserva aviso y bloqueo con fecha
  original pasada. Sin mutaciones, pedidos o notificaciones QA reales.
- Reutilización del arnés anterior, cambios temporales ignorados en
  node_modules/.cache/late-click-audit/normal-run.mjs y normal-results.json.
- Build QA/PWA aprobado: 2407 módulos, 10 entradas precache, bundling 8,29 s;
  aviso conocido de chunks grandes. Repo sin compilador/configuración tsc;
  no se afirma comprobación completa de tipos. git diff --check aprobado.
- Pendiente comprobar físicamente en iPhone/Android y con backend real.

## Tiempos y publicación

Lectura inicial anterior al cronómetro no estimada. Análisis 66 s; implementación
34 s; preparación de escenarios 130 s; ejecución/revisión 104 s. Build y unitarias
solapados con esa ventana, sin sumar de nuevo. Cierre y publicación al verificar.
Estos tiempos no son mediciones de rendimiento de la app.

Publicación QA pendiente al preparar el informe. No se repite la verificación
adicional de artefactos con credencial local que ya devolvió 403 sin cambios en
su acceso. Se verificará el estado Vercel del SHA exacto y se indicará ese límite.
