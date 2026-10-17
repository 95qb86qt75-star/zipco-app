# Pedido listo — integración local Frontend QA

Fecha: 2026-10-17. Identificador de seguimiento: READY-01.

Clasificación: frontend sobre contrato coordinado frontend + backend. Backend QA
publicado en `ec0c6327d6501a5f8e4412056fe0e2f067b35d1d`, según el contrato
`C:/dev/zipco-backend-qa/docs/testing/request-process-ready-qa.md` y la confirmación
de Bastián. Este trabajo no cambia backend ni ejecuta acciones sobre pedidos QA.

Rama frontend: `qa`, base `6f42aedac7352ad99dd61cb2d4901c0ad6e9b26a`.
Implementación local sin staging, commit, push ni publicación. Vercel QA conserva
la versión publicada anteriormente; este documento no acredita validación móvil.

## Cambios realizados

1. Negocio / En curso del proceso nuevo: el panel muestra únicamente **Notificar
   pedido listo** si `allowedActions` incluye `MARK_READY`. Se retira WhatsApp de
   esa presentación; coordinación previa y permisos del servidor se conservan.
2. La acción usa `POST /request-processes/:id/actions/mark-ready`, donde `:id`
   es el proceso. Cuerpo exacto `{ expectedVersion }` y cabecera `Idempotency-Key`
   UUID mediante el mecanismo existente. No requiere contacto ni consentimiento,
   no abre WhatsApp y no envía flags adicionales.
3. El recibo se valida como `READY/ready`, con versión incrementada. Se aplica a
   listas de ambos participantes, manteniendo la protección frente a recibos y
   lecturas anteriores. Se concilia mediante las lecturas ya existentes:
   `GET /orders/my-orders` y `GET /orders/business/:businessId`.
4. Ambas vistas presentan **Pedido listo**, conservan el acuerdo inmutable y
   agrupan en Listos. Los contadores y la atención del cliente incluyen READY.
   El negocio usa Listos cuando hay procesos READY, también en listas mixtas;
   conserva Listo y notificado cuando solo existen pedidos antiguos listos.
   No se afirma entrega de push, entrega física, pago, cierre ni recepción.
5. WhatsApp del cliente sigue sujeto a `allowedActions` y a los consentimientos
   existentes en READY. Se admite el recibo de contacto con `orderStatus: ready`.
6. Doble toque bloqueado; respuesta perdida conserva clave y cuerpo. Tras éxito
   confirmado y fallo del GET, solo se ofrece actualizar sin repetir la acción.
   Una intención recuperada requiere conciliación antes de permitir un reintento.

No se modifican START_WORK, las peticiones de carga, su instrumentación temporal,
credenciales, configuración, alias, pedidos antiguos ni el contenido del acuerdo.

## Archivos del bloque

Código:

- `src/app/screens/RequestsScreen.tsx`
- `src/app/screens/requests/CoordinationActions.tsx`
- `src/app/screens/requests/ProcessOrderCard.tsx`
- `src/app/screens/requests/coordinationApi.ts`
- `src/app/screens/requests/coordinationIntent.ts`
- `src/app/screens/requests/orderTabs.ts`
- `src/app/screens/requests/requestAttentionSummary.ts`
- `src/app/screens/requests/requestProcess.ts`
- `src/app/screens/requests/requestStatusGrouping.ts`
- `src/app/screens/requests/useCoordination.ts`
- `src/app/screens/requests/useRequests.ts`

Pruebas:

- `src/app/screens/requests/CoordinationActions.test.ts`
- `src/app/screens/requests/coordinationApi.test.ts`
- `src/app/screens/requests/coordinationIntent.test.ts`
- `src/app/screens/requests/orderTabs.test.ts`
- `src/app/screens/requests/processCardVisualFlow.test.ts`
- `src/app/screens/requests/requestAttentionSummary.test.ts`
- `src/app/screens/requests/useCoordination.test.ts`
- `src/app/screens/requests/useRequestsContract.test.ts`

Documentación: este archivo. Los tres documentos con cambios locales previos
permanecen fuera del bloque, sin reescribir su historial.

## Comprobaciones y pendientes

Resultado local: `npm.cmd test`, **797 pruebas en 75 archivos, todas correctas**.
`npm.cmd run build -- --mode qa --outDir node_modules/.cache/mark-ready-qa-build`
correcto. `git diff --check` correcto; staging vacío y `dist/index.html` sin cambios.

Pruebas con respuestas sintéticas, sin llamadas de escritura a QA. Cubren ruta y
cuerpo, permisos, contacto ausente, recibo incompatible, doble toque, pérdida de
respuesta, fallo del GET posterior, recuperación de intención, almacenamiento,
estado y acuerdo en ambas tarjetas y protección frente a versiones anteriores.

Build QA local generado en `node_modules/.cache/mark-ready-qa-build`, fuera de
`dist/index.html`. Advertencia habitual de bundle superior a 500 kB.

Pendientes: revisión y publicación frontend por separado; luego validación con
Bastián en Android e iPhone de negocio y cliente, incluido pedido antiguo. No se
ha probado MARK_READY contra pedidos reales ni se garantiza recepción del push.
Outbox y preparación para producción siguen siendo responsabilidades pendientes
del trabajo coordinado con backend. `main` y producción no se modificaron.

## Publicación QA autorizada — 2026-10-17

Bastián autorizó publicar este bloque después de las comprobaciones locales.
Se prepara exclusivamente en `qa`, preservando los tres documentos anteriores
con cambios locales fuera del commit. Destino: Preview del proyecto `zipco-app`,
equipo `zipco-s-projects`; acceso habitual
`https://zipco-app-git-qa-zipco-s-projects.vercel.app`.

Se conserva el diagnóstico temporal mediante el override exclusivo del despliegue
`ZIPCO_QA_LOAD_DIAGNOSTICS=1 npm run build -- --mode qa`, sin cambiar el build
global ni producción. La configuración pública Preview fue comprobada contra
Backend QA. Este registro de autorización no declara el despliegue terminado ni
la validación móvil realizada; el resultado se añadirá después de verificarlo.
