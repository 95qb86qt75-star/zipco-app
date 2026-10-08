# Coordinación frontend QA ↔ backend

Estas instrucciones aplican al workspace frontend QA `C:\dev\zipco-app-qa`.

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
