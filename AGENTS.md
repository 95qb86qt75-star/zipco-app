# Coordinación frontend QA ↔ backend

Estas instrucciones aplican al workspace frontend QA `C:\dev\zipco-app-qa`.

## Memoria documental y forma de trabajo vigente

Al retomar trabajo, leer [estado actual](docs/frontend-qa-current-state.md) y
[política de trabajo](docs/frontend-qa-working-policy.md). Los informes fechados
describen su versión; no sustituyen el contrato o el estado actual.

- Seleccionar pruebas por dependencias y riesgo. Distinguir presentación,
  interacción/navegación local y cambios de comportamiento o contrato.
- Reutilizar escenarios aprobados. Repetirlos solo si nuevos cambios, fallos o
  dependencias afectadas lo justifican; registrar el motivo.
- Medir por separado análisis, implementación, preparación de pruebas, ejecución,
  documentación, build y publicación/verificación. Registrar esperas y
  paralelismo sin sumar dos veces el tiempo. No inventar mediciones ausentes.
- Conservar todos los controles de este archivo. Las pruebas visuales/táctiles,
  de permisos/recuperación y las regresiones se adaptan al riesgo real.
- No confundir demora de desarrollo con rendimiento de la app; no atribuir
  tiempos a gráficos o animaciones sin mediciones.
- Cambiar herramientas requiere un bloque definido y aprobado. La
  [propuesta de estabilización](docs/frontend-qa-tools-stabilization-proposal.md)
  fue aprobada como piloto acotado y sus [resultados](docs/frontend-qa-tools-pilot-2026-10-30.md)
  están registrados. Reutilizar esas herramientas según dependencias; ampliar
  el alcance exige definir el nuevo bloque. No equivale a autorización global.
- Guardar memoria no autoriza despliegues. Un push a qa puede activar Vercel:
  los cierres exclusivamente documentales y el bloque propuesto no hacen push
  ni despliegue sin alcance aprobado.

## Clasificación obligatoria

Antes de implementar una modificación, clasificarla como:

1. Solo frontend.
2. Frontend + backend.
3. Requiere diagnóstico antes de decidir.

## Cuándo detenerse y coordinar con backend

Detener la implementación e informar al chat principal/backend cuando el
cambio implique:

- agregar, eliminar o renombrar campos de la API;
- crear o modificar endpoints;
- guardar datos nuevos;
- modificar entidades o base de datos;
- crear migraciones;
- cambiar estados o transiciones;
- autenticación, permisos o roles;
- notificaciones push;
- horarios o timestamps generados por servidor;
- búsquedas, filtros o matching ejecutados en backend;
- carga o persistencia de imágenes;
- reglas comerciales que deban ser confiables;
- métricas o eventos que deban registrarse en servidor.

En esos casos:

- no inventar campos;
- no simular datos como si fueran reales;
- no utilizar `createdAt` o `updatedAt` con otro significado;
- no implementar solamente la mitad visual sin advertirlo;
- entregar primero un diagnóstico con:
  - contrato actual;
  - archivos involucrados;
  - payload enviado;
  - respuesta recibida;
  - campo o endpoint necesario;
  - compatibilidad requerida.

## Cuándo puede avanzar frontend QA

Puede proceder directamente cuando el cambio sea solamente de:

- colores;
- tipografías;
- espaciados;
- layout;
- animaciones;
- iconos;
- textos;
- responsive;
- modo oscuro;
- navegación local;
- presentación o formateo de datos que ya entrega la API.

## Cambios coordinados con backend

Seguir este orden:

1. Definir el contrato.
2. Implementar y probar backend.
3. Publicar backend en Railway QA.
4. Aplicar migraciones QA si corresponde.
5. Confirmar que la API QA responde correctamente.
6. Implementar frontend con compatibilidad segura.
7. Publicar frontend en Vercel QA.
8. Probar el flujo completo en celular y navegador.
9. No integrar producción sin aprobación explícita.

## Informe obligatorio después de cada trabajo

Indicar siempre:

- clasificación: frontend o frontend + backend;
- archivos modificados;
- campos y endpoints utilizados;
- pruebas y build;
- commit y rama;
- estado de Vercel QA;
- si Railway QA fue necesario;
- cambios pendientes;
- confirmar que `main` y producción no fueron modificados.

Si durante una tarea inicialmente visual aparece una dependencia de backend,
detenerse y comunicarla antes de continuar.

No modificar `C:\dev\zipco-app` (`main`) ni producción sin autorización
explícita.

Regla práctica:

- Si cambia cómo se ve: frontend QA.
- Si cambia qué datos existen o cómo se comportan: coordinar backend.
- Si involucra ambos: acordar primero el contrato, después coordinar ambos
  despliegues QA.
