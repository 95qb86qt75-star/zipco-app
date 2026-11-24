# Corrección del color del resumen Listos — QA

Fecha: 2026-10-17. Seguimiento: UI-READY-SELECTION-01. Clasificación: solo frontend.
Rama `qa`, base `566250d2752e4393411b88125ce0c8974cf0cbd6`.

## Causa y modificaciones

1. Bastián informó que «1 pedido listo para recibir» seguía del mismo color al
   pulsarlo. Causa confirmada en código: el ajuste anterior estaba en un bloque
   JSX desactivado con `false &&`. El mapa visible de `customerAttentionCards`
   conservaba un estilo fijo y no representaba la selección.
2. El mapa visible ahora utiliza `ReadyOrdersSummary`. El resumen activo se
   identifica por participante cliente, tipo de solicitud, filtro ready y categoría
   Listos. Seleccionado: verde teal oscuro y texto blanco. Sin selección: ámbar
   claro. Conserva el manejador de selección y no ejecuta acciones del pedido.
   El texto de ese componente indica que el negocio lo marcó como listo, sin
   asegurar finalización ni entrega del push.
3. Se añade una prueba de integración del componente real RequestsScreen:
   encuentra el resumen en la rama visible, lo pulsa, comprueba selección/color
   y categoría Listos; al cambiar de categoría pierde el resaltado y al volver
   a pulsarlo lo recupera. No realiza peticiones ni acciones del pedido.

Archivos del bloque:

- `src/app/screens/RequestsScreen.tsx`
- `src/app/screens/RequestsScreen.readySelection.test.ts` (nuevo)
- `docs/frontend-ready-summary-color-qa.md` (este informe)

Pruebas: `npm.cmd test`, **838 pruebas en 78 archivos, todas correctas**.
Build QA con diagnóstico temporal activo correcto, salida ignorada en
`node_modules/.cache/ready-summary-color-qa-build`. Advertencia habitual de bundle
superior a 500 kB. Sin cambios en `dist/index.html` ni configuración global.

Publicación autorizada por la instrucción vigente de continuar las correcciones
visuales en Frontend QA. Destino exclusivo Preview `zipco-app`, equipo
`zipco-s-projects`, rama `qa` y acceso habitual
`https://zipco-app-git-qa-zipco-s-projects.vercel.app`.
Se conserva el override por despliegue
`ZIPCO_QA_LOAD_DIAGNOSTICS=1 npm run build -- --mode qa` y Backend QA.
Los cinco documentos con cambios locales previos se preservan fuera del commit.

No se modifican campos/endpoints, contratos, permisos, estados, confirmaciones,
recargas ni datos de pedidos. Sin cambios en backend, Railway QA, `main` ni
producción. No se ejecutan acciones sobre pedidos para comprobar el color.
La comprobación visual Android/iPhone tras la publicación queda pendiente con
Bastián; este ajuste no constituye aprobación final del diseño.

## Resultado de publicación

Commit local y remoto `origin/qa`:
`683576b7f536ccba0f7171c30ed004837d037e65`,
`fix: highlight visible ready order summary selection`. Tres rutas verificadas;
`git diff --cached --check` correcto antes del commit.

Preview READY verificado: `dpl_5xsHdBvH9bzrMwbughaEd7JTEYRz`.
URL propia: `https://zipco-iex4528gf-zipco-s-projects.vercel.app`.
Fuente GitHub real, SHA exacto, rama qa, entorno Preview. Build remoto en modo qa
correcto, bundle `index-Bvr97EeO.js`. Override con diagnóstico temporal conservado.
El acceso habitual QA apunta a este despliegue y es su único alias asignado.
Build global sin cambios y rama de producción main sin cambios.

Cinco documentos anteriores verificados por hash y preservados fuera del commit.
Staging vacío; solo quedan notas documentales locales. Este resultado se añade
después de publicar y no forma parte del commit desplegado. Revisión visual real
en los celulares pendiente de Bastián. Sin acciones de pedidos ni cambios en
backend, Railway QA, main o producción.

## Paleta de referencia recuperada — UI-PALETTE-01

Registro solicitado por Bastián el 2026-10-17 después de observar que el color
publicado era distinto al diseño usado antes. Hasta esta revisión, la paleta
anterior se podía recuperar del código Git, pero no existía una tabla explícita
de referencia en estos documentos. Las entradas anteriores describen lo que se
implementó y publicó; no se borran ni se interpretan como aprobación del teal.

Fuente verificable: `src/app/screens/RequestsScreen.tsx` en
`dbf5bd96f3f4ccfa99cbf59d873c43b87e5556e0`, bloque de resúmenes de actividad del
negocio. La revisión y la respuesta de Bastián recuperan esta paleta como
referencia para conservar el diseño de selección, incluido el resumen Listos
del cliente. No constituye aprobación final de todas las pantallas.

| Resumen | Seleccionado: degradado | Texto seleccionado | Sin seleccionar: degradado claro |
| --- | --- | --- | --- |
| Pendientes | Ámbar/naranja: `from-amber-400 to-orange-500` | Blanco | `from-amber-50 to-orange-50` |
| Esperando respuesta | Violeta: `from-violet-600 to-purple-500` | Blanco | `from-violet-50 to-purple-50` |
| En curso | Verde/cian: `from-emerald-500 to-cyan-500` | Blanco | `from-emerald-50 to-cyan-50` |
| Listos | Naranja/ámbar: `from-orange-500 to-amber-500` | Blanco | `from-amber-50 to-orange-50` |

Detalles de referencia: en selección, icono blanco sobre círculo translúcido,
flecha blanca y texto secundario blanco al 85 %. Listos utiliza borde
`border-orange-400` y sombra naranja `rgba(245,158,11,0.25)`; deseleccionado,
borde ámbar y texto oscuro. En modo oscuro se conservan los tonos de cada
categoría, con fondo tenue de esa familia y texto claro. Se debe comprobar el
contraste en ambos modos; no sustituir naranja/ámbar de Listos por verde para
resolver un problema de selección.

Alcance: resúmenes grandes de actividad/atención, como «1 pedido listo para
recibir». No redefine colores de las pestañas compactas, tarjetas del pedido,
botones de consentimiento ni efectos glass. Los nombres son identificadores de
presentación; no renombra estados ni acciones de la API.

Precisión sobre el cliente: antes de la corrección, el resumen visible de Listos
tenía un estilo claro fijo y no representaba la selección. El bloque cliente
oculto contenía otra variante ámbar/naranja (`from-amber-500 to-orange-500`).
Esto acredita la familia de colores anterior, no que el resumen visible ya
cambiara correctamente al pulsarlo. La prueba añadida en `683576b` cubre ese
funcionamiento y debe conservarse al recuperar la paleta.

Estado publicado al documentarlo: `683576b7f536ccba0f7171c30ed004837d037e65`
todavía muestra teal oscuro en Listos seleccionado. Ese teal fue una variación
introducida por frontend, no el color anterior recuperado. **Pendiente de
implementar: recuperar naranja/ámbar en la tarjeta visible conservando la
selección, pruebas y acciones existentes.** Después deberá publicarse y revisarse
en Android/iPhone; este registro no afirma que el color ya se restauró.

Esta actualización es solo documental. Sin cambios de código, staging, commit,
publicación, backend, main ni producción. Para futuras modificaciones, usar esta
tabla y registrar cualquier variación solicitada, su commit, capturas y resultado
de revisión; conservar el historial de lo publicado.
