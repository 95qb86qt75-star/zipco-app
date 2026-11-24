# Cliente: Disponible por WhatsApp — CliU18

Fecha: 2026-11-01, America/Santiago. Clasificación: **solo frontend**,
presentación, accesibilidad y coordinación de animaciones locales.

## Diseño integrado completo

Los dos archivos entregados por Claude se compararon con el repo vigente y se
integraron en `src/app/features/requests/shared/availability-design/`:

- `AvailabilityDesign.tsx`: una única variante `AvailableWhatsappDesign` para
  disponibilidad WhatsApp; cabecera y miniatura reales, estado/carril plegables,
  detalle, permiso de contacto, decisiones y confirmación visual de cierre.
- `availability-design.css`: bloque CliU18, responsive, efectos, pausa, foco y
  movimiento reducido. La rama de retiro conserva su composición; se eliminó el
  JSX WhatsApp anterior que quedaba inalcanzable después de delegar en la nueva.

Adaptaciones necesarias para integrar la entrega:

- `cards/shared/availability/AvailabilityFlowCard.tsx`: pasa `leaving` desde la
  fase visual existente, introduce el botón real de recuperación dentro de la
  tarjeta y aplica la variante/textos de cierre solo al cliente WhatsApp.
- `shared/feedback/StatusChangeFlow.tsx`: durante la salida de esta variante deja
  que se vea la tarjeta original animada, conservando el bloqueo durante guardado
  y la presentación anterior en todos los otros casos.
- `shared/feedback/statusChangePresentation.ts`: reserva 900 ms de salida solo
  para esta variante, después del holograma; las demás conservan 500 ms y el
  movimiento reducido omite la espera. No cambia destinos ni estados del pedido.

El detalle inactivo usa `inert` y `aria-hidden` desde el inicio del pliegue, además
de la visibilidad CSS animada. Los errores y Actualizar estado quedan fuera del
panel plegable. La confirmación de cierre es explícita: no se decide el estilo
comparando títulos, para no rediseñar accidentalmente retiro u otros diálogos.
Se reforzó la especificidad del contenedor de salida para que la transición
compartida no anule la animación del diseño.

## Contratos y controles conservados

Sin cambios en `useAvailability`, API, permisos, intents, idempotencia, recibos o
recuperación. Se conservan `CONTINUE_REQUEST`, `DECLINE_REQUEST`, sus confirmaciones
y lecturas de pedidos. No hay endpoints/campos nuevos. Se usan productos, total,
nota, horario, foto, `availability`, preferencia de contacto y `allowedActions`
existentes. Cambiar el interruptor no guarda; Volver no cierra la solicitud.

ProductPreviewControl, AcceptGlassButton, OrderReferencePhoto y sus ventanas son
los componentes reales. No se cambió Condiciones aceptadas, retiro, reservas,
worker, backend ni el diagnóstico pausado de clic externo.

## Validación dirigida

- **109 unitarias distintas aprobadas**: presentación compartida, recuperación,
  contrato de disponibilidad y transición de estado visual. Nuevo caso de 900 ms
  acredita espera del holograma, aviso posterior y exclusión de negocio/retiro.
- **12 escenarios distintos de navegador aprobados**: ocho de diseño/controles,
  tres de aceptación y uno de negocio. Incluyen 320/393/430 px, ventana corta,
  miniatura y ventana reales, interruptor sin POST, cerrar/Volver, recuperación
  plegada, pausas, movimiento reducido, retiro y foto de referencia real con una
  imagen local. Los recorridos de aceptación usan holograma real, bloqueo del
  origen, altura estable, salida de tarjeta y Ver con foco en coordinación.
- HTTP exclusivamente sintético; no pedidos reales, confirmaciones repetidas ni
  notificaciones artificiales. Los reemplazos de la maqueta de Claude no se usan.
- Captura expandida revisada en el arnés. Build final QA/PWA aprobado: **10,41 s**.
  Advertencia existente de tamaño de chunks, sin cambios de herramientas/bundles.
  Imports verificados. No hay `tsc`/script de typecheck independiente en el repo;
  el build no se presenta como comprobación completa de tipos.

Se reutilizaron navegador, fixtures y selector de casos del piloto. El primer caso
de cierre eligió por error el selector del botón de confirmar en lugar de Volver;
se corrigió la prueba y se repitieron solo los pendientes. Tras reforzar CSS de
salida se repitió solo aceptación a 393 px. Al retirar el JSX inalcanzable se
repitió la prueba de composición y el build final; no se suman como casos nuevos.
Evidencia local ignorada: `node_modules/.cache/qa-pilot/available-whatsapp-design`,
`acceptance-presentation`, `coordination-detail` y `available-wa-unit*.json`.

## Publicación y pendientes

Publicado **dcd1deb0a25b91d532221881b9d6a0af3fff3faa**, rama qa;
[Vercel success](https://vercel.com/zipco-s-projects/zipco-app/A6t58hs9pqY54TT6PuwrtsxRoY1e).
Railway no fue necesario. Main y producción
intactos. El HTML generado de dist no se versiona. La carpeta previa del usuario
en `docs/design-handoffs/` se conserva fuera del commit.

Pendiente revisión visual/táctil física en iPhone y Android. Chrome sintético no
acredita Safari real ni WhatsApp externo. El estado de Vercel no sustituye lectura
autenticada de los assets; no se reintentan credenciales previamente rechazadas.

## Medición del bloque

Desde la primera observación de reloj, 05:27:20 UTC; lecturas iniciales anteriores
sin medición. Fuente local: `node_modules/.cache/available-wa-timing.json`.
Análisis 1 min 46 s; implementación inicial 1 min 1 s; preparación 1 min 47 s;
pruebas y reparación del arnés 3 min 51 s. Build/revisión final: 1 min 58 s,
incluye revisión, limpieza de JSX y comprobación dirigida; comandos de build
14,07 s y 10,41 s, no dos minutos de compilación. Documentación inicial: 1 min 6 s.
Publicación hasta confirmar Vercel: 1 min 58 s (incluye espera externa).
Total desde la primera observación de reloj hasta Vercel success: **13 min 27 s**;
no incluye las lecturas previas sin timer ni este cierre documental posterior.
Navegadores parcialmente en paralelo: no duplicar sus esperas al sumar fases.
Son tiempos de desarrollo, no rendimiento de la app.
