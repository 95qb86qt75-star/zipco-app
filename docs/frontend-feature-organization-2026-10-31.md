# Reorganización por capacidades y tarjetas — frontend QA

Fecha local: 2026-10-31. Clasificación: **solo frontend**. Bloque amplio autorizado
por el usuario para aplicar la organización a todo el frontend, preservando un
solo diseño canónico. No es un rediseño ni un cambio de contrato.

## Resultado

- Doce capacidades bajo `src/app/features`: negocios, catálogo, compra, favoritos,
  inicio, onboarding, perfil, cotizaciones, registro, solicitudes, búsqueda y servicios.
- `src/app/shell` compone la aplicación; `src/app/shared` conserva las piezas globales.
- Pantallas principales con entrada de composición, controlador y vista. App,
  Solicitudes, perfil de negocio y búsqueda tienen entradas de ocho líneas.
  La vista de Solicitudes se redujo a 320 líneas de composición, con cabecera,
  pestañas, resúmenes, resultados y filtros en archivos identificables.
- Diseños independientes para coordinación inicial del cliente, consulta de
  coordinación, progreso WhatsApp, retiro local y progreso de servicios. Las
  variantes del negocio también tienen propietarios propios.
- Tarjetas de catálogo, resultados de búsqueda, favoritos y productos seleccionados
  extraídas de sus pantallas. Cotizaciones de cliente, negocio y tarjeta separadas;
  normalización y listas de Historial también separadas.
- CSS de tarjetas trasladado al propietario. `src/styles/index.css` tiene 25 líneas
  de imports. Se comparó la secuencia de reglas/valores con PostCSS al extraer
  22, 2 y 13 bloques de los tres estilos principales: mismo orden de cascada.
- Retirados la pantalla ficticia de servicios y dos componentes sin recorrido
  activo (`BusinessRequestCard`, `OrderCardHeaders`), más las fachadas duplicadas
  sustituidas por imports directos. La pantalla real de servicios conserva su API.
  Los archivos originales trasladados no quedan como otra versión ejecutable.
- No se añadieron dependencias ni se modificó `package.json`, configuración de
  Vite, workers públicos, contratos, variables ni transportes HTTP.

La división no se hizo por un límite arbitrario de líneas. Una tarjeta mantiene
sus estados locales relacionados y compone piezas compartidas cuando tienen el
mismo significado. API, idempotencia, permisos y recuperación conservan su fuente.

## Fuentes y regla para próximos diseños

El [mapa del frontend](../src/app/features/README.md) y el
[mapa de tarjetas](../src/app/features/requests/cards/README.md) señalan los
propietarios canónicos. Son la referencia actual, en lugar de las rutas de los
informes fechados anteriores.

Para Claude se entregan los TSX/CSS reales de la tarjeta y sus dependencias
visuales necesarias, incluyendo el cuerpo expandido. Controlador, API y ventanas
compartidas se marcan como solo lectura cuando no están en el alcance. Se pide
explicar todos los estados, clics, errores, animaciones y tamaños, y devolver los
archivos completos modificados. No se conserva una variante antigua como fallback
visual ni se pega solamente una cabecera sobre otro cuerpo.

El retiro conserva su presentación vigente y los ajustes previos locales de
contraste/toques. No se inventó el detalle integral que faltaba en el paquete de
Claude; ese rediseño sigue siendo otro bloque.

## Contratos y comportamiento

Se mantienen los campos, headers, endpoints y `allowedActions` existentes,
incluido `customer-receipt-finalization-v2`, recepción/finalización, coordinación,
reservas, horarios informativos y compatibilidad histórica. Se cambian imports y
propiedad de archivos, sin sustituirlos por datos simulados en la app.

Una comparación AST final de módulos trasladados conserva 209 cuerpos de ejecución
idénticos. Los módulos que
separan vistas/controladores se verificaron además con pruebas de interacción.
Los escenarios de prueba siguen usando datos sintéticos explícitos.

Railway QA no fue necesario. El diagnóstico del clic externo sigue pausado; no se
enviaron pushes, no se repitieron confirmaciones ni se crearon pedidos reales.
`main` conserva `8295ab8c6024ab20851ebd371308d2f299b4668f`; producción no se modificó.

## Validación

La amplitud del cambio de imports, CSS y composición justifica una ejecución
completa de unitarias y regresiones de los consumidores afectados.

- **1.743/1.743 unitarias** aprobadas, incluidas cuatro comprobaciones de estructura:
  ausencia de recorridos en la carpeta retirada, imports estáticos/lazy válidos,
  fuente única por composición y dependencias CSS válidas.
- **35 recorridos de navegador distintos** aprobados: recepción/finalización 13;
  retiro preparando/listo/recibido 3; paridad app/vista local 4; coordinación inicial
  del cliente 7; controles del negocio 1; navegación inferior real 3; checkout con
  incertidumbre en tres anchos y preferencia de contacto activa 4.
- Anchos comprobados según escenario: 320, 390/393 y 430 px. Se conservaron
  Condiciones aceptadas, controles táctiles, foco, recuperación, misma clave/cuerpo
  al reintentar, permisos denegados y movimiento reducido.
- **Build QA/PWA aprobado**, 2.402 módulos transformados. Se mantiene el aviso
  existente sobre chunks grandes; no acredita un problema de rendimiento.
- `git diff --check` aprobado. Artefactos `dist` descartados del commit de fuentes.

Antes de mover archivos, la suite tenía 28 fallos de 1.740 casos: expectativas
anteriores a la tarjeta real de recepción y arneses que no preparaban la negociación
de capacidades. Se alinearon esos escenarios y su sincronización; se retiró una
aserción de un encabezado sin consumidores. Las nuevas fronteras de presentación
requirieron adaptar la inspección superficial para recorrer las vistas reales,
conservando las aserciones de permisos y recuperación.

Dos incidencias de preparación quedaron conservadas:

- La primera ejecución del escenario de barra inferior leyó un elemento DOM nulo.
  La repetición sin cambios de app pasó los tres anchos. No se atribuye una causa
  al rendimiento, al worker ni a iOS.
- El escenario antiguo de checkout omitía el GET de horario vigente y quedó en
  «Horario no disponible», con cero POST. Se agregó esa respuesta sintética al
  arnés, conservando el control real de horario; la repetición pasó. No se cambió
  la implementación del checkout para hacer pasar la prueba.

Los fallos/repeticiones no se cuentan como escenarios aprobados adicionales.
Capturas y reportes locales están en `node_modules/.cache/qa-pilot`,
`frontend-organization-app-smoke` y los JSON de este bloque. Chromium con HTTP
interceptado no acredita Safari físico ni el backend real.

## Tiempos medidos y límites

Inicio del registro: 23:00:43 UTC. La preparación inicial anterior a ese punto no
tiene medición desglosada. No se completan intervalos ausentes por estimación.

| Actividad | Medición disponible |
| --- | --- |
| Análisis inicial | 5 min 51 s, intervalo de fase. |
| Implementación estructural | 28 min 59 s, incluye verificaciones unitarias intermedias mientras avanzaba la extracción. |
| Preparación/adaptación de arneses | 7 min 13 s, con primeros navegadores ejecutándose en paralelo. |
| Suite unitaria final | 11,89 s de reloj según el reporte. |
| Navegador: recepción / retiro / paridad / inicial / negocio | 28,68 / 12,95 / 13,85 / 50,46 / 9,90 s por suite, incluidas preparación y apertura de Chrome. Se superponen. |
| Build QA y PWA | 9,54 s según el cronómetro del procedimiento de build. |
| Documentación y preparación adicional | Intervalos de sesión conservados; parte del tramo 23:48–23:52 contiene diagnóstico del arnés de checkout. No existe desglose fiable para atribuir todo ese tramo a documentación. |
| Publicación y observación | 72,63 s de intervalo de sesión, desde el comienzo del push hasta cerrar la observación y revisar capturas. Vercel comunicó success dentro de ese intervalo; no es una medición de su tiempo interno de build. |

Los intervalos de fase no equivalen a CPU ni a escritura de código. Las duraciones
anidadas o paralelas no se suman para calcular el total del bloque. No hubo cambios
de herramientas compartidas: se reutilizó el piloto existente y se actualizaron
rutas, datos faltantes de escenarios y un adaptador de inspección de vistas para
las unitarias. No se midió rendimiento de la app ni se atribuyó la duración a sus
gráficos o animaciones.

Registro de sesión hasta las **23:59:36 UTC**: **58 min 53 s** desde que comenzó
el cronómetro. Se conserva también su agrupación original para no presentar una
precisión de atribución que no existe:

| Etiqueta del registro | Tiempo de reloj | Límite de interpretación |
| --- | --- | --- |
| Análisis | 5 min 51 s | Incluye lecturas e inventario inicial. |
| Implementación | 28 min 59 s | Incluye comprobaciones intermedias; no es tiempo puro escribiendo. |
| Preparación de pruebas | 7 min 13 s | Hubo navegador y escritura de mapa en paralelo. |
| Ejecución, dos intervalos | 3 min 22 s | No contiene todas las suites: varias corrieron durante otras fases. |
| Build, intervalo de sesión | 58 s | Compilación/PWA real: 9,54 s; el resto incluye observación y lanzamiento de comprobaciones. |
| Documentación/preparación adicional | 11 min 17 s | Incluye diagnóstico de dos escenarios y esperas; no se atribuye íntegramente a escribir documentación. |
| Publicación/observación | 1 min 13 s | Push y comprobación de estado CI; sin verificación autenticada del alias. |

Las cifras de ejecución de cada suite de la tabla anterior son las medidas
específicas más útiles. No añadirlas a estos 58 min 53 s: ya ocurrieron dentro
de esos intervalos. El cierre Git documental posterior queda fuera de ese corte.

## Publicación y pendientes

Rama: `qa`. Commit de código: **`6f239cad792e593a46576a5b07827e017d7909fc`**.
Push correcto desde `b5f37dd`; una sola publicación QA del bloque, sin despliegues
parciales. GitHub comunica **[Vercel success](https://vercel.com/zipco-s-projects/zipco-app/4wyL3yhQ73mfEpRMtV8RaLnncfjf)** para ese SHA.
Alias aprobado: https://zipco-app-git-qa-zipco-s-projects.vercel.app.

No se repitió la comprobación de assets con credenciales que ya devolvieron 403,
ni se modificó la protección SSO. El éxito de CI no se presenta como verificación
autenticada del JS/CSS servido por el alias. El cierre documental posterior se
guarda localmente y no provoca otro despliegue.

Pendiente después de publicar: revisar en ambos celulares las tarjetas y ventanas
habituales. Quedan separados el rediseño integral de retiro aún no entregado y el
incidente del clic externo pausado.
