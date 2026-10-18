# Catálogo de diseño UI — Frontend QA

Este catálogo vincula nombres de diseño, código y commits para recuperar lo
revisado en QA y comprobar un futuro pase a producción. Es un registro inicial;
no declara que todas las pantallas estén inventariadas ni finalmente aprobadas.
Las notas de revisión locales anteriores se conservan por separado.

## Regla de registro acordada con Bastián

Cada cambio de UI debe registrar nombre estable de pantalla/componente, ruta,
commit completo que contiene el diseño, capturas de referencia/aprobación,
dispositivo comprobado y estado de revisión. Antes del commit se marca local;
después se registra el hash real. La documentación debe quedar también en Git.
Publicado en QA no equivale a aprobado por Bastián. No inventar capturas ni
validaciones de celulares. Cualquier cambio posterior de paleta se registra
explícitamente; el historial anterior se conserva.

## UI-READY-PALETTE-01 — Solicitudes cliente: resumen Listos

- Nombre: **Resumen Listos — naranja/ámbar al seleccionar**.
- Componente: `ReadyOrdersSummary`.
- Código: `src/app/screens/requests/ReadyOrdersSummary.tsx`.
- Pantalla visible: `src/app/screens/RequestsScreen.tsx`, mapa
  `customerAttentionCards`; no depender del bloque JSX oculto.
- Commit de restauración del diseño:
  `66a85a1198e6e1cd4ef45b87e1beda0ffe83bdd3`,
  `fix: restore orange amber ready summary palette`.
- Commit que conectó el componente a la tarjeta visible y probó la selección:
  `683576b7f536ccba0f7171c30ed004837d037e65`. En esa versión se introdujo teal;
  la restauración posterior conserva su funcionamiento y recupera la paleta.
- Referencia anterior recuperada:
  `dbf5bd96f3f4ccfa99cbf59d873c43b87e5556e0`, bloque de resúmenes de actividad
  en `src/app/screens/RequestsScreen.tsx`.
- Seleccionado: `from-orange-500 to-amber-500`, borde `border-orange-400`, texto
  e icono blancos, fondo translúcido del icono y sombra naranja
  `rgba(245,158,11,0.25)`.
- Sin seleccionar: `from-amber-50 to-orange-50`, borde ámbar y texto oscuro;
  variantes oscuras de la misma familia para modo nocturno.
- Conserva selección accesible `aria-pressed`, categoría Listos, contadores,
  textos y las acciones existentes. No cambia campos ni endpoints.
- Estado: implementado y probado localmente; Bastián solicitó el commit para
  visualizarlo en QA. Publicación y revisión móvil se registran posteriormente;
  esta ficha no acredita aprobación final del diseño.
- Capturas: referencias conversadas con Bastián; no se han incorporado archivos
  de capturas a este catálogo. Captura y comprobación del color restaurado en
  Android/iPhone: pendientes tras la publicación.

## UI-PALETTE-01 — Paleta de referencia de resúmenes de actividad

Fuente exacta:
`dbf5bd96f3f4ccfa99cbf59d873c43b87e5556e0:src/app/screens/RequestsScreen.tsx`.
Se registra para mantener la familia visual; no modifica la lógica de estados
ni todos los componentes que usan nombres similares.

| Nombre visual | Degradado seleccionado | Degradado sin seleccionar |
| --- | --- | --- |
| Pendientes | `from-amber-400 to-orange-500` | `from-amber-50 to-orange-50` |
| Esperando respuesta | `from-violet-600 to-purple-500` | `from-violet-50 to-purple-50` |
| En curso | `from-emerald-500 to-cyan-500` | `from-emerald-50 to-cyan-50` |
| Listos | `from-orange-500 to-amber-500` | `from-amber-50 to-orange-50` |

Texto seleccionado blanco; subtítulo blanco al 85 %. El teal oscuro introducido
en Listos no es la referencia recuperada. En el cliente antiguo, el resumen
visible tenía color fijo: no se afirma que entonces ya cambiara correctamente.
Su bloque oculto incluía otra variante ámbar/naranja. Esta tabla aplica a
resúmenes grandes, no redefine pestañas compactas, tarjetas de pedido o glass.

## Validación de UI-READY-PALETTE-01

838 pruebas en 78 archivos correctas. Incluyen seleccionar el resumen en la
pantalla visible, recuperar el resaltado tras cambiar de categoría y confirmar
que seleccionar no envía peticiones ni ejecuta acciones de pedidos.

Build QA correcto, con diagnóstico temporal activo y salida ignorada en
`node_modules/.cache/ready-palette-restoration-qa-build`. Advertencia habitual
de bundle superior a 500 kB. Sin cambios en `dist/index.html`, dependencias,
configuración global o instrumentación de loadOrders.

Publicación prevista exclusivamente en rama qa y Vercel Preview del proyecto
zipco-app, equipo zipco-s-projects, conservando Backend QA y el acceso habitual:
`https://zipco-app-git-qa-zipco-s-projects.vercel.app`.
Override de ese despliegue:
`ZIPCO_QA_LOAD_DIAGNOSTICS=1 npm run build -- --mode qa`.
No se cambia backend, Railway QA, main ni producción. No se ejecutan acciones
de pedidos para verificar el color.
