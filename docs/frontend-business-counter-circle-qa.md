# Contrapropuesta exterior: círculo y botón — QA

2026-11-13. Clasificación: solo frontend, presentación. Alcance exclusivo:
business && AWAITING_BUSINESS_COUNTER_RESPONSE. Sin conversación, confirmaciones
ni propuesta final. Sin cambios de campos, endpoints, callbacks, permisos,
estados, hooks o backend. Railway no necesario.

Archivos productivos: cards/shared/layout/aurora.css y OrderCardAurora.tsx
(bajo src/app/features/requests). Se integra aurora (3).css completo: las primeras
107 líneas permanecen idénticas. Círculo de 38 px, selector p > span para evitar
sobrescribir display:grid del icono, sin anillo; botón >=50 px con flecha real
en círculo translúcido, dos movimientos de 4 px y parada al bloquear o reducir
movimiento. Se elimina opacity .75 de pseudoelementos para no atenuar la etiqueta
de origen notificación; controles de rendimiento existentes intactos.

La última copia local OrderCardAurora (1).tsx seguía usando MessageCircle:
se aplicó ArrowLeftRight según el diseño expresamente indicado por el usuario.
Se elimina counterKind no conectado; aviso genérico. Rama default idéntica.
ProcessOrderCard y ProposalNegotiation no modificados.

## Verificación

Reutilizado arnés real de ProcessOrderCard/ProposalNegotiation con HTTP simulado,
scripts ignorados prepare-counter-circle-test.mjs y counter-circle-browser.mjs.
320/390/430 px: icono grid 38x38 y centrado, ArrowLeftRight, radio50%, sin anillo,
punto dos ciclos, flecha dos ciclos, quieta disabled/reduced-motion. Sin filtros,
blobs ni pseudoelementos del botón, sin resplandor del precio ni animación infinita.
Altura botón 69/50/50 px (texto se adapta a 320), sin desborde de página.
Toque por coordenadas abre chat, cero POST, cero excepciones JS. Captura 390
inspeccionada. El scrollWidth interno incluye luces recortadas; no es desborde
de la página. No hubo fallos del escenario. Capturas counter-circle-* en caché.

Build QA/PWA y publicación se registran al cierre. No se repite suite funcional
general para CSS/ícono acotados: interacción afectada verificada con arnés existente.
Sin prueba física iPhone/Android ni peticiones QA reales. Main y producción
intactos; handoff ajeno conservado.
