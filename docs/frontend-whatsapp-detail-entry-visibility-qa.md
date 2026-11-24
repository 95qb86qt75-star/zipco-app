# Detalle WhatsApp · contenido invisible al pausar la entrada

2026-11-03. Clasificación: solo frontend, CSS de presentación. Usuario observa
detalle vacío en Esperando al negocio después de aplicar la visual a Preparando.

## Evidencia y corrección

Antes de corregir, reproducción con varias tarjetas: nodos reales de condiciones,
contacto y permisos presentes, visibility:visible, opacity:0 y animationPlayState:
paused. El espacio seguía reservado y el aviso legal permanecía visible, como
en la captura. La existencia del DOM y el tamaño correcto no bastaban para
detectar este fallo; las pruebas anteriores no comprobaban opacidad con pausa.

customer-receipt-details.css: zipco-wa-w-rise arrancaba con opacity:0 y fill:both.
Las reglas de reposo/scroll/visibilidad podían pausar esa entrada antes de hacerse
visible. Se elimina únicamente la transparencia de ese keyframe. Conserva el
desplazamiento de 6 px y su duración; la visibilidad del contenido real deja de
depender del avance de una animación. No se modifica el planificador compartido.
Se mantienen pausas de adornos y movimiento reducido.

No se atribuye la captura exclusivamente al iPhone ni se declara medida de
rendimiento. La reproducción local demuestra una condición CSS capaz de producir
el síntoma, con valores calculados observados antes y después.

## Validación y alcance

Nuevo escenario scripts/check-whatsapp-detail-entry.mjs con el runner existente:
Preparando y Esperando simultáneos, cada uno con data-request-motion=idle,
data-request-list-scrolling=true y data-coordination-motion=idle. Seis casos
aprobados: opacidad 1 con entrada realmente pausada, ventana de condiciones
real, toques por coordenadas, cerrar detalle y devolver foco. Cero POST.
Primer intento previo a la corrección falló por opacidad cero; conservado como
control negativo, no contado como prueba aprobada.

Build QA/PWA aprobado, 9,94 s internos, advertencia de chunks grandes preexistente.
No se repiten unitarias de acciones/API: solo cambia un keyframe y la regresión
relevante es visual/táctil con estilos calculados. Las reglas de movimiento
reducido no cambian. Sin nuevos campos/endpoints/headers; lecturas y acciones
existentes intactas. No se modifican TSX, controladores, estados ni permisos.

Solo QA. Railway no necesario. Main y producción intactos. Pendiente comprobar
físicamente el detalle en iPhone/Android; Chrome sintético no acredita Safari.
Directorio ajeno sin seguimiento conservado. Cierre documental sin push extra.

## Publicación y medición

Publicado Vercel QA `8ec1fa921505fe96aa98ef8939ceed3931b10512`, rama qa,
[check Vercel success](https://vercel.com/zipco-s-projects/zipco-app/ETo9bJuxaR5kDfbueDPCpKjgHns5).
Fases en wa-detail-entry-timing.json dentro de
node_modules/.cache. Lectura inicial sin temporizador. La primera fase agrupa
preparación de reproducción y diagnóstico; implementación, verificación, build,
documentación y publicación se miden aparte. No son tiempos de rendimiento.

| Fase medida | Tiempo de pared |
| --- | ---: |
| reproduction | 60.3 s |
| implementation | 4.6 s |
| test-execution | 44.8 s |
| build | 51.6 s |
| documentation | 10.0 s |
| publication | 82.5 s |

Intervalo exterior build incluye lectura/espera y preparación del cierre;
ejecución interna QA/PWA: 9,94 s. No se dispone de separación de los otros
subpasos. Los tiempos excluyen la lectura inicial y este commit documental final.
