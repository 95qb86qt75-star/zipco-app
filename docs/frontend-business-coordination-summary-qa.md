# UI-BUSINESS-COORDINATION-SUMMARY-01 — Campanita Por coordinar

Fecha: 2026-10-17. Clasificación: solo frontend. Rama qa.

## Nombre y commit

- Nombre estable: **Solicitudes negocio — resumen persistente Por coordinar**.
- Componente compartido: `CoordinationOrdersSummary`, variante negocio.
- Commit visual: `2dac8908b266de868f16a5cae5e9004aa882a563`,
  `fix: show business coordination summary card`.
- Base: `7b7f94dce1032ff30a9117803bba8619e80e232e`.
- Referencia: tarjeta con campanita de Coordinación del cliente implementada en
  `87ae42980304fe07f1172d10d6c269f9ffa6cc33`. Bastián informó que faltaba su
  equivalente en Por coordinar del negocio.
- Estado: implementado y probado, publicación QA para revisión bajo la
  autorización vigente de iteración visual. Aprobación final y comprobación
  móvil pendientes.

## Causa y modificaciones

1. La lista de resúmenes del negocio omitía coordination, aunque su pestaña
   Por coordinar y contador ya existían. Se añade la categoría a los resúmenes
   de pedidos del negocio, después de Pendientes, usando su contador existente.
   No se crea una categoría ni estado en cotizaciones.
2. Se reutiliza la campanita verde del cliente con texto **1 pedido por coordinar**
   o su plural. No pide al dueño autorizar el contacto del cliente ni supone
   consentimiento concedido: invita a revisar esa categoría y sus próximos pasos.
3. La tarjeta permanece mientras el contador sea mayor que 0; leer el pedido o
   autorizar contacto no la elimina si sigue perteneciendo a Coordinación.
   Al pulsarla selecciona Pedidos / Por coordinar, muestra solo esos pedidos y
   resalta en verde. Se oculta al quedar sin pedidos en la categoría.
4. En carga/error no muestra datos previos como respaldo del resumen. Las otras
   tarjetas del negocio y la variante del cliente conservan su comportamiento.

Paleta compartida: seleccionado `from-emerald-600 to-green-500`, texto blanco;
sin seleccionar `from-emerald-50 to-teal-50`, variantes nocturnas de la misma
familia. Respeta el movimiento reducido y `aria-pressed`.

La selección es navegación local: no envía acciones de pedidos, no abre
WhatsApp, no autoriza contacto ni ejecuta START_WORK. Usa los campos ya leídos
`requestProcess.state`, `status` y disponibilidad normalizada, mediante el conteo
de categoría existente. Sin campos/endpoints nuevos, cambios de API, permisos,
estados, credenciales, peticiones de carga o notificaciones.

## Archivos y comprobaciones

- `src/app/screens/RequestsScreen.tsx`
- `src/app/screens/RequestsScreen.readySelection.test.ts`
- `src/app/screens/requests/CoordinationOrdersSummary.tsx`
- `src/app/screens/requests/CoordinationOrdersSummary.test.ts`
- `docs/frontend-business-coordination-summary-qa.md` (esta ficha)

857 pruebas en 79 archivos correctas. Cobertura de tarjeta visible del negocio,
selección Por coordinar, filtrado de sus pedidos, no ejecución de acciones,
contador persistente tras lectura/consentimiento, reducción a cero, carga/error
y copy según participante. La variante cliente y sus pruebas se conservan.

Build QA con diagnóstico temporal activo correcto, salida ignorada en
`node_modules/.cache/business-coordination-summary-qa-build`. Advertencia habitual
de bundle superior a 500 kB. Sin cambios en dist/index.html, dependencias ni
configuración global. No se ejecutan acciones reales de pedidos como prueba.

## Publicación prevista y revisión pendiente

Destino exclusivo Vercel Preview del proyecto zipco-app, equipo zipco-s-projects,
rama qa. Configuración pública Preview comprobada con Backend QA, sin cambiarla.
Acceso habitual: `https://zipco-app-git-qa-zipco-s-projects.vercel.app`.
Se conserva el override exclusivo del despliegue
`ZIPCO_QA_LOAD_DIAGNOSTICS=1 npm run build -- --mode qa`.

Nueve documentos locales anteriores se preservan fuera de los commits. Ficha
con nombre y commit visual guardada por separado. Sin cambios en backend,
Railway QA, main o producción. Pendiente revisión por Bastián en Android/iPhone,
contador, navegación, selección y colores claro/oscuro; no es cierre de diseño.

## Resultado de publicación QA

Commit visual `2dac8908b266de868f16a5cae5e9004aa882a563` y ficha con nombre y
hash respaldados en el commit documental
`8835e7b5786abfe8f3780aea2d66d76014f8a0dd`. Publicados únicamente en origin/qa;
cinco rutas verificadas, nueve documentos locales anteriores preservados por
hash fuera del bloque. Staging vacío; sin cambios de código pendientes.

Preview READY `dpl_2cacBELQ4eQEJXwrnsWAXXSS3kf7`, fuente GitHub real, rama qa,
SHA efectivo `8835e7b5786abfe8f3780aea2d66d76014f8a0dd`, entorno Preview.
URL propia: `https://zipco-f7ihv8k4i-zipco-s-projects.vercel.app`.
El alias QA habitual apunta a este despliegue y es su único alias asignado.
Build remoto QA correcto, diagnóstico temporal conservado mediante override
por despliegue. Build global y rama de producción sin cambios.

Sin acciones reales de pedidos ni cambios en backend, Railway QA, main o
producción. Revisión móvil pendiente de Bastián. Este resultado se añade
localmente después de publicar; la ficha de nombre + commit visual sí quedó
respaldada en Git mediante el commit documental indicado.
