# Propuesta acotada: estabilizar escenarios y verificación QA

Fecha: 2026-10-30. **Estado: piloto acotado aprobado y ejecutado.**
Autorización posterior: «probemos si funciona eso y si no pasa nada malo,
lo dejamos como regla». [Resultados y límites](frontend-qa-tools-pilot-2026-10-30.md).
Se conserva debajo el alcance presentado; no autoriza ampliaciones.

## Objetivo

Reducir preparación repetida y fallos del fixture conservando las comprobaciones
necesarias. No cambiar el comportamiento de ZIPCO ni sus tiempos visuales para
acelerar los tests.

## Alcance propuesto

| Área | Trabajo propuesto |
| --- | --- |
| Escenarios prioritarios | Botones del detalle de coordinación y aceptación → aviso → Ver. |
| Preparación | Extraer fixtures/helpers reutilizables y eliminar recortes/reemplazos de texto entre scripts para esos escenarios. |
| Selección | Elegir caso, rol y viewport sin repetir grupos aprobados ajenos al cambio. |
| Verificador QA | Parametrizar commit/despliegue; comprobar proyecto/rama, Ready y artefactos servidos mediante lectura autenticada existente. |
| Medición | Separar preparación, ejecución, esperas, documentación, build y publicación/verificación; señalar paralelismo. |

## Base existente para reutilizar

- scripts/check-coordination-detail-taps.mjs: cinco casos táctiles del cliente.
- scripts/check-acceptance-presentation.mjs: tres secuencias con geometría y Ver.
- scripts/check-coordination-inline.mjs: fixture de coordinación y selección
  shared-only existente.
- scripts/check-availability-status-flow.mjs y check-availability-flow.mjs:
  base de checkout/disponibilidad y diez regresiones.
- Unitarias de statusChangePresentation, requestSummaryScroll,
  availabilityRecovery y statusToast.
- Comprobación autenticada de Vercel ya utilizada en este workspace; actualmente
  hay helpers particulares en node_modules/.cache. No copiar tokens al repo.
- Verificación adicional de negocio: tres estados aprobados en el helper local
  de coordinación táctil. No existe todavía esa cobertura en un runner común.

La lista identifica fuentes de reutilización, no autoriza reescribir todas las
baterías, instalar dependencias o añadir un framework nuevo.

## Controles conservados y aceptación del bloque

- Mantener los casos y resultados funcionales existentes del alcance.
- Toques por coordenadas, foco, hit testing, inert y disabled.
- Permisos simulados explícitos, recuperación y ausencia de acciones reales.
- Comparar equivalencia antes/después usando resultados registrados y los
  escenarios afectados; no repetir baterías no relacionadas.
- Entregar diff local de herramientas, resultados, límites y medición separada.

## Fuera de alcance

Código productivo, contratos, estados, reglas comerciales, backend, variables,
configuración de Vercel, secretos/protección, producción y despliegues.
No hacer push a qa: activa una publicación automática. Se conserva un commit
local del piloto; cualquier publicación requiere su alcance aprobado.

El piloto permite reutilizar los dos escenarios y el verificador de lectura.
No autoriza refactorizar otras baterías, modificar la app o publicar.
