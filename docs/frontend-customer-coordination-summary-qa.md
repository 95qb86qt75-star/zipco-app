# UI-CUSTOMER-COORDINATION-SUMMARY-01 — Campanita de Coordinación

Fecha: 2026-10-17. Clasificación: solo frontend. Rama qa.

## Nombre y commit

- Nombre estable: **Solicitudes cliente — resumen persistente de Coordinación**.
- Componente: `CoordinationOrdersSummary`.
- Commit del cambio:
  `87ae42980304fe07f1172d10d6c269f9ffa6cc33`,
  `feat: add persistent customer coordination summary`.
- Base de la pantalla: `314d4a21976b1ce853ba2fd1117aa87c5ca43739`.
- Referencia visual: captura cliente con un pedido en Coordinación y referencia
  de tarjeta horizontal con campanita aportadas por Bastián. Aclaró que quiere
  una tarjeta adicional para Coordinación, que desaparezca al quedar en 0.
- Estado: implementado y probado; publicación QA para revisión autorizada por la
  instrucción vigente de continuar las mejoras visuales. Revisión móvil nueva
  pendiente; no es aprobación final del diseño.

## Modificaciones realizadas

1. Se añade una tarjeta con campanita en la pantalla del cliente, encima de las
   categorías. Texto: **1 pedido en Coordinación** o su plural, con contador real
   de pedidos disponibles en COORDINATION_PENDING o COORDINATING y pertenecientes
   a esa categoría. No se cuentan procesos desconocidos/inválidos, registros no
   disponibles ni pedidos antiguos que no tienen RequestProcess.
2. Se mantiene mientras ese contador sea mayor que 0. Leer o abrir el pedido no
   la elimina. Autorizar el contacto tampoco la elimina si el pedido continúa
   en Coordinación. Al pasar los pedidos a otras categorías, el contador baja;
   cuando no queda ninguno, desaparece.
3. Pulsarla selecciona Pedidos / Coordinación mediante navegación local existente.
   No autoriza contacto, no abre WhatsApp ni ejecuta START_WORK u otra acción.
   Permite acceder a la tarjeta del pedido y sus controles habituales.
4. Usa la familia verde de la categoría Coordinación: seleccionado
   `from-emerald-600 to-green-500`, texto blanco e icono sobre círculo translúcido;
   sin seleccionar `from-emerald-50 to-teal-50`, con variantes nocturnas. Listos
   conserva la campanita naranja/ámbar; no se sustituye ni mezcla su contador.
5. Se separa del aviso de nuevas respuestas basado en no leído. No altera sus
   alertas, badges, contadores existentes, Listos, permisos ni agrupación de la
   API. En carga/error no muestra la lista anterior como respaldo de la tarjeta.

Datos utilizados: `requestProcess.state`, `status` y disponibilidad normalizada
de las listas que ya consume Solicitudes. No hay campos nuevos, endpoints,
peticiones adicionales, persistencia, cambios de servidor ni temporizadores.

## Archivos del bloque

- `src/app/screens/RequestsScreen.tsx`
- `src/app/screens/RequestsScreen.readySelection.test.ts`
- `src/app/screens/requests/requestAttentionSummary.ts`
- `src/app/screens/requests/requestAttentionSummary.test.ts`
- `src/app/screens/requests/CoordinationOrdersSummary.tsx` (nuevo)
- `src/app/screens/requests/CoordinationOrdersSummary.test.ts` (nuevo)
- `docs/frontend-customer-coordination-summary-qa.md` (esta ficha)

## Pruebas y entrega

852 pruebas en 79 archivos correctas. Incluyen tarjeta visible en RequestsScreen,
convivencia con Listos, navegación solo a Coordinación, lectura/consentimiento
sin ocultar la tarjeta, descenso del contador y desaparición al llegar a cero,
ausencia en negocio y en carga/error, exclusión de estados ajenos, selección
accesible y movimiento reducido. Son pruebas con mocks/datos sintéticos; no
equivalen a validación visual en celulares.

Build QA con diagnóstico temporal activo correcto, salida ignorada en
`node_modules/.cache/customer-coordination-summary-qa-build`. Advertencia habitual
de bundle superior a 500 kB. No cambia `dist/index.html` ni configuración global.

Destino exclusivo Vercel Preview, equipo zipco-s-projects, proyecto zipco-app,
rama qa, Backend QA y acceso habitual:
`https://zipco-app-git-qa-zipco-s-projects.vercel.app`.
Se conserva el override por despliegue
`ZIPCO_QA_LOAD_DIAGNOSTICS=1 npm run build -- --mode qa`.

Ocho documentos locales anteriores se preservan fuera de los commits del bloque.
No se ejecutan acciones reales de pedidos para verificarlo. Sin cambios en
backend, Railway QA, main ni producción. Pendiente revisión por Bastián en
Android/iPhone, selección, colores claro/oscuro y actualización del contador.

## Resultado de publicación QA

Commit visual `87ae42980304fe07f1172d10d6c269f9ffa6cc33` y ficha con ese nombre
y hash respaldados en Git mediante el commit documental
`7b7f94dce1032ff30a9117803bba8619e80e232e`. Ambos publicados únicamente en
origin/qa. Siete rutas verificadas; ocho documentos anteriores preservados por
hash fuera del bloque. Staging vacío y sin cambios de código pendientes.

Preview READY: `dpl_AH9BthqGPz4afmY1621LEqtMbq3b`, fuente GitHub real, rama qa,
SHA efectivo `7b7f94dce1032ff30a9117803bba8619e80e232e`, entorno Preview.
URL propia: `https://zipco-oi1msadkx-zipco-s-projects.vercel.app`.
El alias QA habitual apunta a este despliegue y es su único alias asignado.
Build QA remoto correcto y diagnóstico temporal conservado mediante override
de despliegue. Build global y rama de producción sin cambios.

No se ejecutaron acciones de pedidos ni se modificó backend, Railway QA, main
o producción. Revisión en celulares pendiente de Bastián. Esta anotación del
resultado se añade localmente después del despliegue; la ficha del nombre y
commit visual ya está respaldada en Git con el commit documental indicado.
