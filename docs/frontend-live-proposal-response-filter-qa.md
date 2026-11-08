# Propuesta entrante oculta por el filtro de respuestas

Fecha: 2026-11-07. Clasificación: solo frontend, selección/presentación local.

## Causa y corrección

El contador de Por responder usaba requestStatusGrouping e incluía
AWAITING_CUSTOMER_DECISION. Al seleccionar la franja naranja, la lista usaba
getCustomerAttentionItems.responses, que omitía tanto ese estado como
AWAITING_CUSTOMER_FINAL_DECISION para pedidos con proceso. Una disponibilidad
existente permanecía visible y el contador subía, pero la nueva propuesta
quedaba fuera del filtro. Cambiar de navegación podía restablecer browse.

Único archivo de código productivo modificado:
src/app/features/requests/domain/requestAttentionSummary.ts. Se incluyen los dos
estados de propuesta que requieren decisión del cliente. No se incluye la
contrapropuesta que espera al negocio. Se conservan consulta atrasada,
disponibilidad, coordinación no leída, cotizaciones y listos.

No se cambian APIs, estados del servidor, permisos, notificaciones, recargas ni
navegación. Se aprovechan los GET/actualizaciones existentes de pedidos; sin
campos/endpoints nuevos. Railway innecesario. No hay otro diseño ni copia de
tarjeta. Main/producción intactos.

## Evidencia y pruebas

- Caracterización antes del arreglo: dos pruebas de dominio y dos de pantalla
  reproducían la ausencia: esperaban IDs [20,21], pero recibían [20]. El test de
  pantalla mantiene seleccionado el resumen mientras llegan nuevos datos.
- 58 pruebas aprobadas tras el arreglo: requestAttentionSummary,
  RequestsScreen.notificationNavigation y requestStatusGrouping. Cinco nuevos
  casos persistentes cubren propuesta inicial/final, actualización sin remontar
  y exclusión de contrapropuesta a la espera del negocio.
- Chromium con RequestsScreen real y transporte/cuentas sintéticos: primero se
  selecciona una disponibilidad; luego llega una propuesta por el evento de
  actualización existente. Aparecen ambas tarjetas, aviso 2 y pestaña 2, con la
  misma URL y sin remontar pantalla. También comprobada la propuesta final.
  Cero POST, pedidos o notificaciones reales.
- Escenario temporal reutiliza el arnés previo, sin modificar herramientas del
  repo. Capturas ignoradas en node_modules/.cache/late-click-audit/live-alternative.png
  y live-final-proposal.png. El caso final necesitó corregir permisos y versión
  del fixture: conservaba acciones de solicitud atrasada tras quitar su campo.
  Se repitió solo ese caso; el inicial ya había pasado.
- Build QA/PWA aprobado, 2407 módulos, 10 entradas; bundling 12,17 s. Aviso
  conocido de chunks grandes. Sin configuración/compiler tsc: no se afirma
  comprobación completa de tipos. git diff --check aprobado.
- Pendiente comprobación física en iPhone y actualización entre teléfonos con
  backend real; la prueba local no acredita entrega push ni conectividad real.

## Tiempos y publicación

Ventanas de pared medidas: análisis/caracterización 216 s; implementación y
regresión focalizada 288 s; preparación de navegador 20 s; ejecución/revisión
431 s, incluidos ajustes del fixture. Preparación adicional de escenarios se
solapó con la ventana de implementación; no representa tiempo puro de edición.
Build se ejecutó en paralelo con navegador, sin sumar sus 12,17 s otra vez.
Lectura inicial anterior al cronómetro no estimada. Cierre/publicación al
verificar. Estas mediciones no describen rendimiento de la app.

Rama qa; publicación en preparación. La comprobación de artefactos con acceso
local previamente rechazado (403) no se repite sin un cambio de acceso; se
verificará el estado Vercel del SHA exacto.
