# Revisar propuesta del negocio — CliU39

2026-11-13. Solo frontend: presentación y navegación local del rechazo.
Se integran completos ProposalChat (5).tsx, proposal-chat (5).css y
ProposalNegotiation (6).tsx en sus propietarios actuales. La conversación del
negocio tiene historial compacto, detalles en la cabecera, cambios solicitados
con comparisonRows y apertura al final. Rechazar abre un diálogo local sobre
la conversación. Solo su confirmación conserva el envío existente.

## Alcance y compatibilidad

Archivos productivos: cards/shared/proposal/ProposalChat.tsx, proposal-chat.css,
forms/proposal/ProposalNegotiation.tsx, todos bajo src/app/features/requests.
El bloque CSS inicial 1–463 no cambia. Se conservan las pantallas del cliente,
la tarjeta exterior, aceptación, renovación y el formulario final. No cambia
execute, payloads, permisos, validaciones ni idempotencia. Rechazo usa el mismo
REJECT_COUNTER_PROPOSAL; aceptación usa ACCEPT_COUNTER_PROPOSAL; renovación usa
PROPOSE_FINAL, con aceptación posterior del cliente. Sin campos/endpoints nuevos.
Railway innecesario. No se alteran contratos ni notificaciones.

Ajuste adicional de integración: refs de foco en Volver/Rechazar y eventos
onOpenAutoFocus/onCloseAutoFocus, porque el pop-up puede contener controles de
producto antes de Volver. No depende del orden accidental de tabulación.
Se conserva la rama antigua de confirmación compartida sin refactor fuera de alcance.

## Validación proporcional al riesgo

- 43 pruebas aprobadas: ProposalChat.test.ts, proposalContract.test.ts,
  proposalApi.test.ts. Se repiten porque cambian la composición compartida y
  el acceso a las acciones; sin suite general por rutina.
- Chromium con ProcessOrderCard/ProposalNegotiation y componentes reales,
  HTTP sintético: revisar/rechazar a 320/390/430, tres bloques, sin desborde,
  apertura al final, foco en Volver, Esc/Volver sin POST y conversación conservada.
- Rechazo a 390: respuesta 400 simulada y diferida, todos los controles bloqueados
  durante envío, Esc no cierra, error dentro del pop-up y acceso Actualizar
  propuestas presente. Reintento confirmado termina CLOSED, un POST registrado
  por el servidor simulado tras el rechazo inicial interceptado.
- Renovación a 320/390/430: Aceptar y confirmar abre revisión sin POST y Volver
  devuelve al chat. No confundir la etiqueta nueva con aceptación directa.
- Cliente 390: conversación sin clases del negocio ni pop-up, aceptación abre
  su confirmación y no envía automáticamente. Sin excepciones JS.
- Captura negocio 390 inspeccionada. ProductPreviewControl real montado con
  datos sintéticos; fixture sin fotografía remota. No acredita foto física.
- Build QA/PWA aprobado: Vite 11,40 s, 2412 módulos y diez precaches. No tsc
  configurado; transpilación no equivale a verificación de tipos completa.

Arneses ignorados prepare-bz-check.mjs/bz-browser.mjs, prepare-bz-client.mjs y
bz-client.mjs; capturas customer-proposal-redesign/business-review-*, business-reject-*.
La primera preparación tuvo un paréntesis extra: corregido solo en el arnés.
El arnés anterior esperaba la pantalla antigua del rechazo y falló por ese
selector obsoleto; se adaptó a pop-up. Un arranque duplicado sin elevación
falló al obtener DevToolsActivePort; no se modificó la app para resolverlo.
Pendientes: teléfonos, reduced-motion del flujo completo y error real de servidor.
Sin pedidos/push reales, main y producción intactos; handoff ajeno preservado.

## Tiempos y limitaciones de medición

Análisis 45 s. Integración y preparación inicial 62 s conjuntos, sin separación
fiable. Intervalo verificación/diagnóstico/esperas 1400 s: incluye comandos que
no devolvían salida, intentos de recuperar la ejecución y ajuste de foco/arnés.
No equivale a 1400 s de pruebas ni al rendimiento de la app; no hay atribución
medida a animaciones. Causa de esas esperas del entorno no confirmada.
Se lanzaron diagnósticos duplicados durante la espera: no repetir ese patrón
en próximos bloques; conservar un proceso y su salida antes de lanzar otro.
Unitarias: 2,37 s. Build/inspección 21 s, incluye Vite 11,40 s, no sumar de nuevo.
Comprobación adicional cliente/cierre inicial 39 s. Documentación y publicación
se registran al verificar SHA. Evitar interpretar estos intervalos como CPU.

Publicado en rama qa, SHA 5fe451a1b07cee8f30891f235ee1429eeecfe76c.
Vercel success verificado:
https://vercel.com/zipco-s-projects/zipco-app/CyMCMu7DjgdrhGq6Mm81d8LZ95hV
Documentación/preparación de publicación 68 s; publicación/verificación 52 s,
incluye espera externa. Cierre documental local sin otro push/despliegue.
No se inspeccionó por separado el bundle protegido ni un teléfono físico.
