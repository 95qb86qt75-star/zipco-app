# Piloto de herramientas QA — 2026-10-30

Clasificación: solo frontend, herramientas de desarrollo y documentación.
Autorización: «probemos si funciona eso y si no pasa nada malo, lo dejamos como
regla». Alcance: [propuesta acotada](frontend-qa-tools-stabilization-proposal.md).
No cambia presentación ni comportamiento de ZIPCO.

## Resultado y uso acordado

Los dos escenarios usan fixtures explícitos y un navegador/helper común;
selección por caso, rol y ancho; verificador parametrizado de publicación
existente. Reutilizar esas piezas según dependencias, sin repetir casos
aprobados sin motivo. No ampliar esta decisión a otras baterías o despliegues.
Los próximos ajustes permitirán medir el ahorro real; este bloque no demuestra
todavía una reducción porcentual frente a los anteriores.

Archivos: entradas scripts/check-coordination-detail-taps.mjs y
scripts/check-acceptance-presentation.mjs; scripts/qa/ (fixtures, helper de
navegador, catálogos, selección, medición y comprobaciones); nueva entrada
scripts/verify-qa-publication.mjs. [Uso exacto](../scripts/qa/README.md).
La memoria se actualiza en AGENTS.md, estado actual, política y propuesta.

## Evidencia y validación proporcional

- 11 casos de coordinación aprobados: cliente a 393/320, consulta/negativa,
  disabled, revelado normal/reducido, contenido que ya cabe y tres del negocio.
  Se ejecutó uno inicial y después los otros diez excluyendo el aprobado.
- 3 secuencias de aceptación aprobadas: 393/320 y pantalla corta de 393×540.
  Conservan altura durante guardado, contenido bloqueado, resultado compacto,
  holograma, texto positivo, categoría hasta Ver, 3 acciones simuladas y
  destino alineado/marcado sin desplazar window.
- 23 comprobaciones nativas de selección y verificador aprobadas. Se añaden
  2 comprobaciones focalizadas de medición/archivo por ejecución, aprobadas.
  Estas detectaron una declaración duplicada al añadir el archivo de tiempos;
  se corrigió y se repitieron solo esas dos comprobaciones y el listado del CLI.
- 4 controles negativos rechazados por su aserción prevista: botones bloqueados,
  doble envío, texto del aviso incorrecto y scroll sin efecto. Sus fallos son
  intencionales en el fixture, no regresiones detectadas en la app.
- El primer intento de aceptación expuso una espera antigua que pulsaba Ver
  por su cuenta. Se sustituyó por un paso explícito y se ejecutaron los tres
  casos aún no aprobados. No se cambió la aplicación para satisfacer el test.
- Los resultados previos se conservaron como referencia de geometría/acciones;
  no se volvieron a ejecutar las baterías antiguas completas. Los runners
  fuera del alcance conservan su implementación anterior.

Chrome local con transporte sintético no demuestra Safari físico, entrega push,
mensajes WhatsApp ni servidor real. El diagnóstico del clic externo sigue
pausado. No se crearon solicitudes ni notificaciones reales.

## Publicación, API y protección del alcance

Verificador ejecutado sobre la publicación existente, 5 GET y ningún cambio:

- SHA b9512e6372cd5a83c662f00eca783404ab1977ad, rama qa.
- Vercel dpl_3An1hnuYNUjPoSDxRk5X8DXq1q67, READY, proyecto QA correcto.
- Alias https://zipco-app-git-qa-zipco-s-projects.vercel.app.
- JS /assets/index-B3uIRY_w.js; CSS /assets/index-C0YMgPD1.css.
- Identidad de build, backend QA y marcadores JS/CSS comprobados.

Ningún campo/endpoint de ZIPCO agregado o modificado. Los fixtures reutilizan
acciones/recibos/versiones existentes con datos sintéticos. La lectura remota
solo usa endpoints GET existentes de Vercel y artefactos del alias QA.
No se cambian src/, public/, dependencias, configuración, contratos ni secretos.
No se ejecuta build de publicación porque no hay cambios de aplicación ni una
publicación autorizada en este bloque. Railway QA no fue necesario.
Sin push ni nuevo despliegue. Main y producción no modificados.
El commit es respaldo local en qa; no confundirlo con respaldo remoto.

## Medición y límites

Horas UTC (fecha local: 30 de octubre, America/Santiago):

| Fase | Medición y alcance |
| --- | --- |
| Análisis | 00:56:02–00:59:34: 3 min 32 s. |
| Implementación y preparación de herramientas | Ventana 00:59:34–01:12:29: 12 min 55 s; intercalada con pruebas medidas debajo. En este piloto preparar los runners es la implementación; no hay cronómetro exclusivo separado para ambas. |
| Preparación automática | Coordinación: servidor 0,386 s y Chrome 1,382 s. Aceptación: servidor 0,319 s y Chrome 0,745 s. |
| Ejecución aprobada de coordinación | 10 casos restantes: 56,419 s incluyendo preparación; el primer caso aprobado se midió en un informe que se sobrescribió antes de añadir archivo por ejecución. No inventar su duración. |
| Ejecución aprobada de aceptación | 3 casos: 44,295 s incluyendo preparación. |
| Verificación remota existente | 2,299 s, 5 GET, sin despliegue. |
| Documentación y cierre | Empieza 01:12:29; duración final registrada en la entrega. |
| Build / despliegue | No ejecutados, fuera del alcance. |

Se conservan fallos y controles negativos en informes separados de la caché
local. Los tiempos de ejecución no incluyen análisis ni escritura. Hubo
preparación/ejecuciones paralelas: no sumar ventanas y subfases como tiempo
total. No hay mediciones FPS/CPU/GPU para atribuir demoras a animaciones.

Pendiente: medir los próximos bloques para confirmar menor preparación y menor
tiempo total; comprobación física de cambios de UI solo en sus bloques propios.
