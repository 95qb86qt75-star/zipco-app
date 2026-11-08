# Presupuesto decorativo de tarjetas de retiro

2026-11-08. Solo frontend: CSS, sin modificación de comportamiento o contrato.
Usuario informa lentitud intermitente usando la app y sobre todo al sacar capturas.

## Medición previa

RequestsScreen real con doce pedidos sintéticos de retiro/pago pendiente, una
tarjeta abierta; Chromium, componentes reales, HTTP simulado y red externa bloqueada.
21 animaciones decorativas infinitas corriendo, tres sobre elementos fuera del
viewport dentro de la tarjeta parcialmente visible. No eran doce tarjetas visibles:
el control de visibilidad por tarjeta ya pausaba las otras; faltaba acotar los
efectos dentro de la tarjeta visible. Había box-shadow y background-position
animados, reflejos, halos, iconos y mano simultáneos.

## Cambio focalizado

Solo customer-pickup.css, bloque PERF-PICKUP-DECORATION-01:

- Conserva colores, gradientes, vidrio, estructura y ventanas.
- Sombras y fondos decorativos quedan estáticos; elimina los reflejos continuos.
- Mano, ondas e iconos ejecutan como máximo dos ciclos. Sello de confirmación
  conserva una entrada finita, sin aro infinito.
- Retira blur/backdrop-filter de los tres controles decorativos indicados.
- No selecciona spinners de operación, no cambia feedback de envío, errores,
  transiciones del detalle ni los estados/permisos/callbacks.
- Regla añadida al handoff visual: presupuestar decoración, medir varias tarjetas
  y reposo, no confundir maqueta o captura de Chromium con fluidez física.

No se audita aquí todo el frontend ni se garantiza eliminar el coste del sistema
operativo al tomar una captura. La lentitud real del iPhone requiere comprobarse.

## Comparación controlada local

Misma espera de nueve segundos, doce tarjetas, tarjeta abierta, dos segundos en
reposo y tres Page.captureScreenshot. Base sin las reglas nuevas retiradas solo
en CSSOM del navegador de pruebas; no se alteró el código base del repositorio.

| Medida | Base | Ajuste |
|---|---:|---:|
| Animaciones infinitas activas | 21 | 0 |
| De ellas fuera del viewport | 3 | 0 |
| RecalcStyleCount del intervalo | 142 | 1 |
| RecalcStyleDuration | 0,116303 s | 0,000071 s |
| TaskDuration | 0,738488 s | 0,003550 s |
| LayoutCount | 0 | 0 |

Son métricas locales de CDP, un intervalo por condición, servidor de desarrollo,
sin equiparar TaskDuration a FPS, rapidez porcentual o rendimiento del iPhone.
La primera comparación intentó retirar CSS mediante transform del arnés, pero no
eliminaba el bloque importado: se descartó. La comparación final verifica 21/0.
Hubo un bloqueo EBUSY transitorio al iniciar Chromium y se repitió ese escenario.

## Verificación

- 19 unitarias de composición/permisos/recuperación aprobadas, seleccionadas por
  dependencias; no suite general por rutina.
- Prueba real de reserva: estabilidad de cinco tarjetas en 80 muestras tras abrir
  y otras 80 tras cerrar; pliegue interno y error que abre la pestaña oculta.
- Build QA/PWA aprobado: Vite 8,35 s, 2408 módulos y diez entradas precache.
  No hay tsc configurado; no se afirma tipado completo.
- Ningún pedido creado, push o mutación real. Celulares físicos pendientes.
- Evidencia local ignorada .cache/pickup-performance/{before,baseline,after}.json
  y .cache/pickup-jitter/paid-controls.mjs. No herramientas nuevas versionadas.

## Tiempos y publicación

Análisis y primera medición: 156 s; implementación/preparación y primeras
comparaciones: 98 s; verificación/comparación adicional: 124 s.
La implementación incluye la
preparación de comparación y ejecución inicial; no se inventa separación ausente.
Build y pruebas se solapan, no se suman dos veces.
Documentación inicial y commit/push: 62 s; verificación de publicación: 39 s.
Cierre documental posterior separado.

Rama qa; publicado `8b27afc2a80487a9fe87d043d9f3934e758c53f4`, Vercel success:
https://vercel.com/zipco-s-projects/zipco-app/8vUorZZwJwCBuvH2YTRB669kYBrf
No repetida consulta independiente de bundles con acceso local antes limitado por
403 y sin cambios de credenciales/protección.
Campos/endpoints sin cambios. Railway no necesario;
main y producción intactos. La mejora física queda pendiente de confirmación.
