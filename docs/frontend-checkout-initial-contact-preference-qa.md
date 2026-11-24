# Primera hoja real de solicitud y preferencia inicial de contacto

Fecha: 2026-10-24. Clasificación: **frontend + backend**, integración S1.

## Resultado y alcance

El checkout de productos abre «Requiero este producto» dentro del recorrido real,
sin crear el pedido. La hoja muestra productos, cantidades, total y horario. La
casilla opcional de WhatsApp comienza marcada; quitarla requiere confirmación.

«Enviar solicitud» conserva artículos, cantidades, nota, imagen y horario. Un
error mantiene la hoja. Un envío incierto conserva cuerpo y clave originales,
congela también la preferencia y bloquea su edición durante el reintento.
Después de una respuesta válida aparece un solo holograma «Consulta enviada»
y se vuelve al perfil del negocio.

El checkout de servicios conserva su petición anterior sin el campo nuevo.
No se implementan disponibilidad, continuación del cliente, retiro, permisos
nuevos ni otras tarjetas. La coordinación posterior conserva su funcionamiento.

## Contrato S1

Contrato definitivo:
`C:/dev/zipco-backend-qa/docs/testing/initial-contact-preference-contract-qa.md`.

- `POST /orders`, JWT e `Idempotency-Key` existentes.
- Campo opcional `customerContactPreference`: `allowed` booleano y
  `textVersion: availability-customer-whatsapp-v1`.
- Texto: «Permitir que este negocio me escriba por WhatsApp».
- Descripción: «Compartiremos tu teléfono con este negocio para coordinar este pedido si se confirma la compra.»
- Lectura en `requestProcess.customerContactPreference`: `allowed`, `textVersion`,
  `recordedAt`, `effective: false` y `requiresReconfirmation`.
- La evidencia inicial no equivale a `AUTHORIZE_CONTACT`, no activa permisos
  ni entrega teléfonos o enlaces. No hay otro endpoint nuevo.

Railway QA confirmado: código `d77b53d0693e076410094dce02c017c560613446`, contexto
`calm-gentleness - zipco-backend` exitoso, deployment
`7897aebb-08bd-4827-91e5-6323fdda59da`. Cero migraciones nuevas. Desde frontend
no se modificó ni desplegó backend.

## Archivos

- `src/app/screens/CheckoutScreen.tsx`: hoja y envío en el checkout real.
- `src/app/screens/createOrderApi.ts`: campo opcional y omisión compatible.
- `src/app/screens/orderCreationIntent.ts`: cuerpo y reintento inmutables.
- `src/app/screens/requests/requestProcess.ts`: lectura de la evidencia inicial.
- `src/app/screens/requests/availability-design/AvailabilityDesign.tsx`: hoja reutilizada.
- `src/app/screens/requests/ActionHologram.tsx`: variante de consulta enviada.
- `checkoutMomentFlow.test.ts`, `orderCreationIntent.test.ts` y
  `requests/requestProcess.test.ts`: integración, reintentos y permisos separados.
- `scripts/check-checkout-consultation.mjs`: checkout real con HTTP interceptado.
- `.gitignore`: excluir configuración local de Vercel.

## Validación

- **1.311 pruebas / 110 archivos**, aprobados.
- Build QA/PWA y build Preview de Vercel aprobados; API Preview comprobada:
  `https://zipco-backend-qa.up.railway.app`.
- Chrome local en **320, 390 y 430 px**: abrir sin POST, casilla marcada,
  mantener/quitar, enviar false, conservar hoja tras error, reintentar con mismo
  cuerpo y clave, un solo holograma de éxito y envío de true.
- Capturas: `node_modules/.cache/checkout-consultation/sheet-{320,390,430}.png`.
- Cero pedidos reales creados por las comprobaciones de navegador.
- `git diff --check` aprobado. Advertencia habitual de tamaño de bundle.

## Publicación QA

El intento CLI `dpl_7D2635ZUbugk6KWMNCqRwgVzvQcm` quedó BLOCKED:
«The deployment was blocked because the commit author doesn’t have permission
to create deployments for this project.» No se reasignó el alias QA a ese intento.

La auditoría revisó 465 despliegues disponibles y 324 SHA únicos. El último
Preview exitoso `dpl_F3ySierxDDGFmfpC4zkcwbXNPuZM` usó el mismo commit base,
autor y correo mediante integración GitHub. Los informes con correos ocultos
quedan fuera de Git en `node_modules/.cache/deployment-identity-audit`.
No se guardan correos completos en esta documentación.

El usuario autoriza ahora conservar la identidad anterior, crear el commit de
los cambios preparados en `qa`, hacer push y comprobar Vercel READY mediante
la integración GitHub. Sustituye para esta entrega la espera anterior de revisión
en teléfono antes del commit. La identidad original se restaura solo en el
worktree QA; no se usa el alias consultado durante el diagnóstico. No se altera
el correo global, la identidad efectiva de main ni commits anteriores.

Al preparar el commit: rama `qa`, base `7b95e60`, publicación del nuevo SHA
pendiente de comprobar. Si vuelve a bloquearse, mostrar el error exacto antes
de cambiar otra configuración. La prueba física queda pendiente del usuario.
`main`, producción y Railway no se modifican en esta entrega frontend.
