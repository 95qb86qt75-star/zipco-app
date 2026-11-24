# UI-BUSINESS-ALTERNATIVE-EDITOR-01 — Cuadritos y cambios guardados

2026-10-20. Clasificación: **solo frontend**, diseño y estado de edición local.
Base preservada: qa `61786eb3f73f85d4802eb1e0d9c83da44ae54fc2`.
Contrato, condiciones y bloqueo anteriores:
[frontend-business-alternative-draft-qa.md](frontend-business-alternative-draft-qa.md).

## Fuente del diseño y adaptación

Bastián aportó dos archivos preparados con Claude: AlternativeChangeEditor.tsx y
PendingAlternativeActions.tsx. Se leyeron y compararon con el código actual antes
de integrarlos. SHA256 de los originales recibidos, que se mantienen intactos:

- AlternativeChangeEditor.tsx: 98f364651733deb155ac4730dd1c2f9d10bb8c8d00f7bef1d1180a99f2925f0f.
- PendingAlternativeActions.tsx: 08186324d5db2000308fbd5b3cc16856f9220313800dcc824d5771b5b3df74a2.

Diseño aplicado: Precio, Cantidad, Disponibilidad y Producto en una fila; al tocar
abre un editor compacto. **Guardar** aplica al borrador local el cambio de ese
editor, activa su check y agrega el resumen original → propuesto. **Quitar cambio**
restaura sus condiciones de referencia. Motivo debajo con contador /1000, foto y
pie fijo con Volver/Revisar alternativa. Se conservan colores violetas y clases de
ZIPCO; no se introduce el azul del ejemplo gráfico. En pantallas de hasta360px,
Disponibilidad se presenta como **Horario** para conservar las cuatro opciones
legibles; el nombre accesible continúa siendo Disponibilidad.

## Correcciones sobre los archivos recibidos

- Se conserva UI-BUSINESS-ALTERNATIVE-SELECTION-01: Producto **no selecciona,
  deselecciona o bloquea automáticamente Precio**. Precio puede editar el total
  cuando existe CUSTOM; etiqueta y resumen indican total, sin dividir por cantidad.
  Producto pide su total obligatorio en su propio editor, sin marcar Precio.
- Se separa la memoria del precio por unidad del original y el total CUSTOM.
  Quitar Precio con CUSTOM restaura el total indicado al guardar Producto;
  Quitar Producto recupera el precio unitario independiente, sin convertir un
  total del conjunto en un precio unitario. La cantidad conserva su propio cambio.
  La revisión sigue exigiendo una diferencia material: un check local no acredita
  que el conjunto final difiera del original ni una propuesta guardada en servidor.
- Guardar queda bloqueado para importes fraccionarios, negativos, notación
  exponencial, límites excedidos o valores iguales a la referencia; nombre CUSTOM
  trim1–120 y descripción hasta500. Cantidad1–99; servicio conserva1.
- Disponibilidad exige una diferencia y horario futuro válido en America/Santiago,
  sin horas ambiguas/inexistentes. Se reutiliza santiagoDraftTime del modelo existente.
  Guardar no permite afirmar válido un horario por tener dos campos no vacíos.
- Abrir editor no aplica valores ni marca check. **Cerrar edición sin guardar**
  descarta sus valores temporales. Mientras un editor está abierto se bloquea
  Revisar alternativa, evitando revisar silenciosamente valores anteriores.
  Cambiar de editor/línea descarta la edición no guardada; conserva cambios guardados.
- Una versión/propuesta/permiso obsoleto bloquea edición/aplicación/revisión.
- La foto pertenece a toda la propuesta y se mantiene fuera del editor con key por
  línea: cambiar el artículo a modificar no la descarta. Sigue siendo local,
  con validación de tipo/tamaño y limpieza de object URL al cerrar o reemplazar.
- Pie fuera del cuerpo desplazable: controles visibles al desplazar, también con
  viewport reducido. Se conservan foco/modal Radix, cierre y clases de modo oscuro.

## Conservado y pendiente

alternativeDraft.ts y sus validaciones no se modifican. El envío continúa bloqueado
literalmente; no se negocia alternatives-v1, no se conecta POST, upload o handler
legacy. Guardar aplica solo al borrador en memoria; cerrar descarta, sin mensaje
de envío exitoso ni propuesta simulada. Motivo3–1000 y explicación de precio,
total global máximo50.000.000 y demás reglas se validan también al revisar.

**AlternativeProposalFields.tsx se conserva**: lo utilizan BusinessOrdersTab
(pedidos legacy) y QuotesPanel (cotizaciones), además de sus tipos. No se elimina
ni se modifica por quedar fuera del nuevo editor de procesos.
Sin cambios en endpoints/campos API, peticiones, recargas, permisos, estados de
pedidos, notificaciones, backend/Railway, configuración global, main o producción.
No se ejecutan acciones de pedidos ni subidas. Activación y recorrido integrado de
alternativas, privacidad y avisos fiables conservan sus pendientes anteriores.

## Archivos y validación

- src/app/screens/requests/AlternativeChangeEditor.tsx: componente nuevo adaptado.
- src/app/screens/requests/PendingAlternativeActions.tsx: integración, memoria local,
  revisión, foto global y pie fijo.
- AlternativeChangeEditor.test.ts y PendingAlternativeActions.test.ts: pruebas.
- scripts/check-business-alternative-draft.mjs: recorrido DOM real actualizado.
- Esta ficha y referencias de cierre en documentos existentes.

**1067 pruebas en 92 archivos aprobadas**, build QA aprobado (Vite/TSX); no se
afirma chequeo semántico independiente con tsc. Después del ajuste responsive de
texto se repitieron45 pruebas relacionadas y el build con resultado correcto.
Advertencia habitual de bundle >500kB.

**8 escenarios táctiles Chrome**: producto/servicio en400×870,393×852,320×700;
producto con dos líneas y viewport393×500. Se comprueban abrir, Guardar, check,
resumen, revisión, cierre/reapertura, selección independiente, total CUSTOM
obligatorio, Quitar Precio conservando Producto, foto al cambiar de línea y pie
inmóvil al desplazar. Backend/servicios externos bloqueados, cero fetch de la app,
cero persistencia/envío. Chrome emulado no acredita Safari/iPhone físico.

Capturas sintéticas locales inspeccionables en node_modules/.cache/
business-alternative-browser/design-claude-393.png y design-claude-320.png;
artefactos regenerables, fuera de Git, sin personas/pedidos reales.

## Publicación y comprobación móvil

Publicar solo qa, Vercel Preview desde Git real/SHA exacto, Backend QA conservado.
Override por despliegue:
`ZIPCO_QA_LOAD_DIAGNOSTICS=1 ZIPCO_QA_NOTIFICATION_TRACE=0 npm run build -- --mode qa`.
Mantener configuraciones globales y producción. Registrar resultado en cierre
documental versionado, con nombre y código del diseño.

**Pendiente Bastián en Android/iPhone**: abrir solicitud inicial de negocio,
Proponer alternativa; tocar cada cuadrito, editar/Guardar/Quitar, comprobar checks
y resúmenes. Producto debe pedir precio total y dejar Precio disponible. Comprobar
servicio cantidad1, horario, contador y foto local; desplazar y comprobar pie fijo.
Revisar conserva Confirmar y enviar deshabilitado. Cerrar no modifica la solicitud.
No se declara aprobado físicamente el diseño ni comprobado un envío integrado.

## Resultado de publicación — 2026-10-20

Código, pruebas, script y ficha (6 rutas) enviados a origin/qa en
`fde40c6124b3a0e1ddd4eff35b60cb50fa7f1a3d`.
Preview funcional **READY**: `dpl_7CeDZHJXnpgAPFTxPwTVMnqRJop6`, URL propia
https://zipco-6xn0j47qm-zipco-s-projects.vercel.app. Fuente GitHub real, SHA
exacto, rama qa y Preview verificados; alias habitual
https://zipco-app-git-qa-zipco-s-projects.vercel.app apunta a ese despliegue al
comprobarlo. Build qa completo con override temporal conservado; Backend QA
verificado como https://zipco-backend-qa.up.railway.app. Build global null y rama
de producción main preservados. Sin cambios en Railway ni acciones de pedidos.

Este resultado y las referencias se conservan en un cierre documental posterior
en qa, cuyo despliegue mantiene el mismo código funcional y override. Su SHA
será la versión visible final. Envío sigue bloqueado. La prueba física y conformidad
del diseño continúan pendientes de Bastián; READY no las acredita.

## Continuidad del resumen

El resumen posterior a Revisar alternativa se actualizó en
UI-BUSINESS-ALTERNATIVE-REVIEW-01, código d79de228fc3be9046e33d90c29ffba9a54bec770.
[Origen, archivos, validación y publicación](frontend-alternative-review-qa.md).
Editor, selecciones independientes y envío bloqueado conservados.
