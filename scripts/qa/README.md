# Herramientas del piloto QA

Alcance: coordinación táctil y aceptación → aviso → Ver. No son pruebas físicas
de Safari ni del backend real. Usan componentes reales, fixtures explícitos,
fetch sintético y Chrome local instalado; no requieren dependencias nuevas.

## Seleccionar antes de ejecutar

```sh
node scripts/check-coordination-detail-taps.mjs --list
node scripts/check-coordination-detail-taps.mjs --case reveal --role customer --width 320
node scripts/check-coordination-detail-taps.mjs --case controls --role business
node scripts/check-acceptance-presentation.mjs --case short-viewport
node --test scripts/qa/selection.checks.mjs scripts/qa/publication.checks.mjs scripts/qa/timing.checks.mjs
```

Sin filtros se ejecutan 15 y 3 casos respectivamente. `--exclude` permite omitir
un caso ya aprobado: `--exclude controls:customer:393:852`. No seleccionar todo
por rutina; elegir consumidores y estados afectados. Los anchos son los del
catálogo, no tamaños arbitrarios. `--list` no abre navegador.

Fixtures: `fixtures/coordination.tsx`, `fixtures/acceptance.tsx`. No leen ni
recortan código de otro test. La frontera de navegación externa de coordinación
se adapta solo en memoria del servidor de prueba, exige una coincidencia exacta
en useCoordination.ts y falla si cambia; nunca escribe ese archivo. Las llamadas
de negocio son simuladas. CDP bloquea solicitudes externas al origen local y
rechaza intentos inesperados. No crear pedidos, confirmar acciones o enviar push
reales para preparar estos escenarios.

Se conservan toques por coordenadas, elementFromPoint, inert/disabled, permisos,
recibos/versiones simulados y cantidades de envíos. La secuencia de aceptación
pulsa Ver explícitamente; las esperas no realizan acciones ocultas.

## Controles negativos, solo cuando se cambie el detector

```sh
node scripts/check-coordination-detail-taps.mjs --case controls --role customer --width 393 --negative-control pointer-events
node scripts/check-coordination-detail-taps.mjs --case controls --role customer --width 393 --negative-control duplicate-open
node scripts/check-acceptance-presentation.mjs --case short-viewport --negative-control toast
node scripts/check-acceptance-presentation.mjs --case short-viewport --negative-control scroll
```

Requieren un solo caso. Deben terminar con código 1 por la aserción específica:
toque bloqueado, 2 envíos en vez de 1, texto incorrecto o destino fuera del área
esperada. Un timeout/Chrome ausente no acredita ese control. Las alteraciones
viven solo en el fixture/DOM y no modifican la app. No ejecutar estos controles
en cada ajuste visual si la herramienta no cambió.

## Verificación de una publicación existente

```sh
node scripts/verify-qa-publication.mjs --sha SHA_COMPLETO --deployment dpl_ID --contains-js MARCADOR_JS --contains-css MARCADOR_CSS
```

Usa el acceso Vercel ya existente; `--auth-file RUTA` permite indicar su archivo
local. No copiarlo al repo ni imprimirlo. Solo admite el proyecto, alias y rama
QA conocidos. Exige READY, SHA exacto, alias correcto, artefactos JS/CSS del HTML
servido y backend QA; rechaza producción/login/errores. Solo GET, sin seguir
redirecciones ni crear credenciales, cambiar protección o desplegar. Si falta
el acceso existente, informar la limitación; no alterar Vercel para sortearla.

Resultados, capturas de fallo, perfiles locales y tiempos quedan ignorados en
`node_modules/.cache/qa-pilot/`. Hay informe más reciente y copias por ejecución;
los controles negativos tienen directorios separados. Preparación de servidor,
arranque de navegador y cada caso se miden por separado. La compilación inicial
de recursos Vite queda dentro del primer caso, no acredita tiempo puro de UI.
Las fases anidadas o ejecuciones paralelas no deben sumarse al total del bloque.

No se reescribieron check-coordination-inline, check-availability-flow ni
check-availability-status-flow. Tampoco se cambiaron scripts de package.json,
frameworks, configuración, build o despliegues.

La variante inicial del cliente tiene escenarios adicionales reutilizando este
runner: `node scripts/check-customer-initial-coordination.mjs --list`. Seleccionar
por caso/ancho. Incluyen controles, consentimiento, bloqueo, revocación y
recuperación; la firma original de Condiciones se compara en controls a 393 px.
