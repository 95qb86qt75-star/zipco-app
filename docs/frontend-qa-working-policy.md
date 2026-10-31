# Política vigente de trabajo — frontend QA

Fecha: 2026-10-30. Decisiones expresas del usuario. Complementa AGENTS.md; no
reduce sus controles de coordinación, alcance, permisos o publicación.

## Acordado y aplicable desde ahora

1. Limitar cada cambio al alcance solicitado. Clasificar antes de implementar.
2. Distinguir ajuste visual, interacción/navegación local y comportamiento de
   negocio. Si aparecen dependencias de servidor, coordinar contrato antes de
   implementar, según AGENTS.md.
3. Elegir pruebas por archivos/dependencias afectados y riesgo. Reutilizar las
   pruebas/fixtures ya existentes. No ejecutar una batería amplia por rutina.
4. Repetir comprobaciones aprobadas solo por nuevos cambios, un fallo relevante
   o dependencias afectadas. Registrar cuál fue la razón. Un fallo del fixture
   exige primero repetir el caso corregido, no automáticamente todos los casos.
5. Comprobar interacción física mediante coordenadas/elementFromPoint cuando
   se evalúan controles táctiles. Un click por código no prueba hit testing CSS.
6. Registrar resultados y límites. Chrome con HTTP simulado no acredita Safari
   físico, backend real, mensajes WhatsApp ni entrega de notificaciones reales.
7. Mantener idempotencia, permisos/allowedActions, recuperación, compatibilidad,
   ausencia de mutaciones reales en pruebas y protección de main/producción.
8. Al entregar material a Claude para rediseño, señalar los archivos de código
   vigentes del repo y sus líneas actuales. Un documento de diseño no sustituye
   el TSX/CSS real; no sobrescribir código vigente con copias antiguas.
   Formato acordado: un único prompt con rutas, líneas, lógica, botones y
   animaciones; adjuntar solo las fuentes necesarias. Separar qué se modifica y
   qué CSS es solo referencia. No preparar ZIP con decenas de archivos o JSON
   de configuración para un ajuste local, salvo petición expresa.

## Medición separada por bloque

Registrar tiempo transcurrido y finalidad de cada intervalo:

- Análisis y diagnóstico.
- Implementación del cambio solicitado.
- Preparación y reparación de fixtures/herramientas de prueba.
- Ejecución de pruebas y esperas.
- Documentación.
- Build, incluido PWA.
- Publicación y verificación del artefacto QA.

Separar espera externa de ejecución activa cuando pueda medirse. Registrar
qué tareas corrieron en paralelo; la suma de fases superpuestas no es el total.
Conservar fallos y reintentos relevantes, sin sumarlos como casos distintos
aprobados. No completar con cifras inventadas cuando un timer falta.

Formato de cierre: alcance/clasificación, cambios, pruebas justificadas,
build, commit/rama, publicación, pendientes y tiempos. La duración de un bloque
incluye lectura, preparación y herramientas; no representa solo tiempo de
escritura de código.

## Matriz orientativa, no sustituto de evaluar dependencias

| Cambio | Validación proporcional |
| --- | --- |
| Color, tipografía o espaciado local | Vista afectada, responsive pertinente y build cuando corresponda publicar. |
| CSS que afecta controles/capas | Toques por coordenadas, foco, inert/disabled y estados relevantes; ambos roles si comparten el componente. |
| Presentación compartida, avisos o navegación local | Unitarias focalizadas, recorrido reproducido y regresiones de los consumidores afectados. |
| Permisos, estados, API, persistencia o regla de negocio | Coordinar primero; pruebas de contrato, recuperación, concurrencia y compatibilidad según el alcance. |
| Solo documentación | Diff, referencias, alcance y ausencia de secretos. No ejecutar build/suite de la app por guardar Markdown. |

## Diagnóstico aceptado como orientación

El usuario aceptó el [diagnóstico de tiempos](frontend-qa-development-time-diagnosis-2026-10-30.md)
como orientación. Las mediciones apuntan a análisis/reproducción y preparación/
reparación de escenarios; no acreditan que el build o las animaciones causen
demoras de 30–40 minutos. No hay perfilado FPS/CPU/GPU/Safari para afirmar
un problema de rendimiento del producto.

## Piloto de herramientas aprobado y validado

La [propuesta de estabilización](frontend-qa-tools-stabilization-proposal.md)
fue aprobada después de guardar la memoria y ejecutada con alcance acotado.
Ver [resultados](frontend-qa-tools-pilot-2026-10-30.md). Reutilizar los fixtures,
selección por caso/rol/ancho y verificación de publicación existente de ese
bloque; no convertir el piloto en autorización para reescribir otras baterías.
Medir los próximos ajustes para comprobar el ahorro real: el piloto valida las
herramientas, no demuestra todavía una reducción del tiempo total por cambio.

No ampliar ese bloque a código productivo, contratos, backend, variables,
configuración o despliegues sin definir y aprobar su alcance.
No hacer push a qa en ese bloque: dispara Vercel. La verificación propuesta es
de solo lectura sobre una publicación ya existente, con acceso autorizado
existente, sin imprimir credenciales ni cambiar la protección.

## Memoria y cierre

Mantener [estado actual](frontend-qa-current-state.md) e informes enlazados.
Conservar notas antiguas como antecedentes con su fecha/versión; no convertir
una propuesta histórica en API disponible o autorización actual. Registrar
conformidades del usuario con su alcance, sin exigir frase literal y sin
convertir una aprobación parcial en aprobación global.

Los documentos y commits locales no equivalen a respaldo remoto. Si el push
activa publicación y no está autorizado para el bloque, conservar el commit
local y comunicar esa limitación.
