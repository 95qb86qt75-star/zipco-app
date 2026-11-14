# Puntos de espera continuos mientras la tarjeta es visible — QA

2026-11-14. Solo frontend, CSS. El usuario aprobó que los tres puntos de espera
continúen mientras ve la tarjeta. Se conserva la pausa durante scroll/fuera de
vista y no se reinician entradas, textos ni pasos. No es una autorización para
activar todos los efectos de toda la app ni bucles de filtros/fondos/sombras.

Único archivo productivo: src/app/features/requests/cards/shared/layout/aurora.css.
zipco-aurora-wt-dots u pasa de cuatro iteraciones a infinite. Solo transforma
posición/opacidad de tres puntos de 3 px. Los selectores existentes pausan por
data-request-motion=idle y data-request-list-scrolling; animation-play-state
conserva el tiempo, no elimina/recrea la animación. Reduced motion conserva
animation:none. Las entradas y los demás efectos siguen finitos.

Sin cambios de TSX, hooks, permisos, contratos, campos, endpoints, estados ni
datos. Ninguna llamada nueva; Railway innecesario. Main y producción intactos.

## Verificación

Arnés reutilizado con pantalla real y datos sintéticos: tras seis segundos
el efecto sigue running con iterations=Infinity; al pausar currentTime permanece
estable. Al reanudar se conserva exactamente el mismo objeto Animation y avanza
desde ese tiempo. Scroll y fuera de vista pausan; reduced motion elimina las
animaciones de los tres puntos. Cero POST y excepciones JS.

Primer arranque del arnés completo venció esperando el montaje; se amplió el
plazo del arranque y el mismo caso pasó. Además se ejecutó el componente real
AuroraProposalHeader con CSS global en un escenario focalizado: mismo resultado.
Ambos publicaron passed. No se repite suite de API por cambiar solo iteraciones.
Scripts ignorados prepare-wt-continuous.mjs/wt-continuous-browser.mjs y
prepare-wt-continuous-focused.mjs/wt-continuous-focused.mjs.

Build QA/PWA aprobado: 2412 módulos, Vite 3 min 32 s, diez precaches. Primer
intento no se ejecutó por timeout de revisión automática de permisos; reintento
único permitido completado. El entorno tardó más que en bloques anteriores;
no hay mediciones que atribuyan esa demora a los puntos ni al rendimiento móvil.
No tsc configurado. Pendiente comprobar sensación en teléfono físico.

## Tiempos

Análisis 64 s; implementación 4 s; preparación inicial 3 s. Verificación y esperas
746 s conjuntos hasta obtener salida del build (incluye timeout de aprobación,
arranque del arnés y preparación del caso focalizado). Build Vite 212 s, incluido,
no sumar dos veces. No hay desglose fiable de CPU vs esperas de esos intervalos.
Documentación/publicación se registra al cierre. Handoff ajeno conservado.
