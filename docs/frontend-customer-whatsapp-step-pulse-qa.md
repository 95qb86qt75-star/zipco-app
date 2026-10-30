# Paso actual WhatsApp y Condiciones aceptadas — QA

Fecha: 2026-10-30. Rama qa, base 7f7af0c. **Clasificación: solo frontend.**

La aclaración del usuario se refiere al tercer paso Aceptado → Autorizada → WhatsApp, no al texto superior ni al badge alrededor de la foto. El CSS anterior de ese paso solo definía fondo/borde y no una animación.

## Cambios

- CustomerCoordinationDetail.tsx: marca de presentación data-live cuando el contacto está habilitado y la UI está lista, sin busy/recuperación; icono CircleCheck en Condiciones aceptadas y clase propia del botón.
- coordination-v2.css: reutiliza los keyframes existentes zipco-co-visible-pulse y zipco-co-visible-ring para el círculo actual; acabado de cristal y acento menta en Condiciones.
- La animación se pausa con detalle cubierto/oculto, scroll, fuera de vista y visibilidad; movimiento reducido deja el círculo estático.

data-live es solo presentación derivada de canOpen, phase, busy y recovery; no es un campo de servidor. No se modifican acciones, estado, permisos, timestamps, recibos, contadores, avisos ni navegación a WhatsApp.

## API y alcance

Sin endpoints, campos ni payloads nuevos o modificados. El botón Condiciones conserva onConditions y el diálogo existente; se presentan las condiciones aceptadas que ya entrega el contrato. No se cambia el consentimiento ni se llama a OPEN_WHATSAPP para animar el indicador.

Archivos del bloque: los dos componentes/estilos indicados y este informe. Los documentos ajenos no rastreados se conservan fuera del bloque.

## Verificación

- Build QA/PWA aprobado: 2313 módulos y precaché generado. Advertencia conocida de bundle principal mayor de 500 kB.
- Navegador Chrome local con React/hooks reales y HTTP sintético, sin POST ni notificaciones reales.
- Viewports 393, 437 y 320 CSS px; tarjetas de 361, 405 y 288 px, sin desbordamiento.
- La animación del tercer paso tiene el nombre esperado y su currentTime avanza durante la observación.
- Condiciones usa CircleCheck y fondo de cristal; abre el diálogo real, pausa el pulso mientras está abierto y lo reanuda al cerrar.
- Movimiento reducido desactiva el pulso y su aro.
- Se conservan las comprobaciones de SVG de la mano, píldora 28 px / toque 44 px, especificidad del anillo y badge.
- Captura local revisada: node_modules/.cache/step-pulse-visual/cliente-405px-abierta.png. Datos sintéticos; no es prueba física en iPhone.

## Publicación y pendientes

El cierre entrega el SHA exacto del commit en qa y verifica estado Ready/artefactos en Vercel.
Alias: https://zipco-app-git-qa-zipco-s-projects.vercel.app

Pendiente: revisión física del cliente en iPhone/Android y comparación del acabado con la referencia. Movimiento reducido se respeta.

No se modificaron Railway, main, producción, flags ni migraciones. C:/dev/zipco-app permanece intacto. El diagnóstico del clic externo iPhone sigue pausado.
