# Diagnóstico de tiempos de desarrollo — orientación aceptada

Fecha: 2026-10-30. Revisión de solo lectura aceptada por el usuario como
orientación. No fue una autorización para modificar herramientas.

## Muestra y límites

Tres últimos bloques publicados: 4542d7f, 12c3b97 y e367ab6. La comprobación de
negocio posterior a 12c3b97 se registra separada, sin commit/build/despliegue.
No se infiere duración de trabajo a partir del intervalo entre commits.

| Fase | 12c3b97, botones | e367ab6, aceptación/Ver |
| --- | --- | --- |
| Análisis | 1:09 | 5:10 |
| Implementación/preparación/documentación, categorías mezcladas | 2:59 | 6:08 |
| Pruebas y ajustes del escenario | 1:27 | 4:17 |
| Build | 0:23 | Vite 8,92 s + PWA, paralelo; sin timer completo de PWA |
| Publicación/cierre | 1:31 | 1:53 |
| Total | 7:29 | 17:28 |

En estos dos bloques, 21:10 de 24:57 (aproximadamente 85 %) quedó en análisis,
implementación/preparación/documentación y pruebas. Publicación/cierre suma
3:24; no equivale exclusivamente a espera de Vercel. El build paralelo no se
suma dos veces.

4542d7f no tiene desglose temporal completo. Cambió comportamiento de acceso
compartido y continuidad de redirección: cinco archivos productivos, 1.715
unitarias y 38 escenarios de navegador aprobados al cierre. No era solo CSS.

Comprobación adicional de negocio: 21:42:20–21:45:01 UTC, 2:41. Tres estados
verificados por toque; sin cambios de fuente, build ni despliegue. Tras corregir
un permiso ausente del fixture Pending, se repitió solo ese caso Ready.

## Evidencia y explicación

- 12c3b97: una regla CSS, acompañada de 43 líneas de prueba y 46 de informe.
  La preparación fue parte sustancial del trabajo, pero no tuvo timer propio.
- Los escenarios recortan/reemplazan texto de otros scripts. Hubo fallos de
  anclas de texto, esperas y permisos simulados; reparar el fixture no era
  corregir la app.
- Click por código no detectó pointer-events:none. La falta de hit testing
  permitió escapar un bloqueo táctil y originó trabajo posterior.
- e367ab6 abarcaba tres problemas y componentes compartidos: presentación,
  texto y navegación local. Las regresiones de consumidores estaban justificadas.
- Checkout/confirmación se recrean por variante. Es una oportunidad de
  reutilización; no está cuantificado cuánto se ahorraría.
- No hay evidencia de que localizar estilos sea el costo principal: el
  diagnóstico táctil inicial tomó 1:09.

## Repeticiones

Hubo repetición evitable de grupos de navegador al reparar fixtures de 4542d7f.
Primero debía repetirse el caso fallido si no cambió su código productivo.
Revalidar después de cambiar el montaje del controlador sí estaba justificado.
12c3b97 no repitió suite completa ni los 38 recorridos previos; e367ab6 usó
35 unitarias focalizadas y diez regresiones pertinentes, además de tres
secuencias nuevas. No generalizar que se ejecuta la suite completa por cada CSS.

## Herramientas existentes

Reutilizar check-coordination-detail-taps, check-acceptance-presentation,
check-availability-status-flow, check-coordination-inline --shared-only y las
unitarias de presentación/scroll/recuperación/avisos. Reutilizar el acceso de
verificación Vercel ya resuelto, sin recrear un helper fijado a cada SHA.

## Desarrollo versus rendimiento de ZIPCO

No hay medidas de FPS, CPU/GPU o latencia real de Safari en esta revisión.
La advertencia de bundle grande no explica por sí sola estas demoras.
Las esperas funcionales de hologramas aumentan ciertas pruebas; no demuestran
lentitud del dispositivo. La medición de altura es geometría, no un benchmark.

## Mejoras propuestas, no implementadas por este diagnóstico

| Cuello de botella | Evidencia | Mejora propuesta | Riesgo |
| --- | --- | --- | --- |
| Preparación frágil | Generación por slice/indexOf/reemplazos | Base reutilizable en bloque específico | Medio: equivalencia con contratos |
| Cobertura táctil incompleta | Click por código pasó con CSS bloqueante | Toques reales sobre controles representativos de ambos roles | Bajo: conservar inert/disabled |
| Flujo completo por variante | Crear/confirmar antes de cada caso | Un smoke integral y casos desde estados verificados | Medio: fixtures desactualizados |
| Repetición al depurar | Grupos aprobados reejecutados por fallos del fixture | Selección por caso y dependencias | Medio si se clasifica mal el alcance |
| Verificador particular por entrega | SHA/despliegue fijados en cada helper | Comprobador QA parametrizado, de solo lectura | Bajo con controles de rama/proyecto/credenciales |
| Medición mezclada | Fases combinan preparación/documentación/cierre | Cronómetros separados, esperas y paralelismo explícitos | Bajo |
| Alcance compartido | Presentación y navegación usadas en varios recorridos | Matriz mínima antes de implementar | Bajo, conservando coordinación backend |

Aplicar ya la [política de trabajo](frontend-qa-working-policy.md). La
[estabilización de herramientas](frontend-qa-tools-stabilization-proposal.md)
requiere aprobación de su alcance antes de modificar scripts.
