# Observación remota push QA: frontend y worker v11

2026-10-27. Clasificación: **frontend + backend coordinados**. Implementa el contrato E168 autorizado por Bastián, publicado en Railway QA en `78d8bbc31254e6bbd696afa672d6df858d81027b`:
`C:/dev/zipco-backend-qa/docs/testing/qa-push-observation-contract-qa.md`.

El clic del aviso interno funciona físicamente según el usuario. El clic del sistema en iPhone sigue abierto: esta entrega añade evidencia remota, no acredita que se haya corregido ni atribuye una causa a iOS/backend/parser.

## Integración y datos

- En Solicitudes → Diagnóstico temporal QA → Recorrido del clic externo QA aparece Observación remota push QA. Abrir el panel no crea una sesión: requiere pulsar Observar próximo aviso legítimo.
- POST `/qa/push-observations/sessions` envía únicamente `{"contract":"qa-push-observation-v1"}`. GET y DELETE `/qa/push-observations/sessions/:sessionId` leen y revocan la sesión propia. Estas tres operaciones usan el JWT habitual de la página y un transporte separado, sin interceptor comercial ni cierre de sesión por errores del diagnóstico.
- El panel informa TTL de una hora, máximo veinte entregas y memoria volátil de una sola instancia. Permite consultar, copiar un informe saneado y revocar. Conserva en sessionStorage únicamente el informe saneado y su propietario, sin JWT ni comprobantes; limpia al cambiar la sesión de usuario.
- Lectura automática acotada a seis GET separados diez segundos, exclusivamente con ambos paneles de diagnóstico abiertos y página visible. Se detiene al ocultar/cerrar, vencer, cambiar de usuario o fallar. La consulta manual puede reiniciar ese presupuesto; ninguna operación comercial depende de ello. No se reintentan POST/DELETE inciertos.
- Worker `notification-click-attempt-v11`: reconoce el bloque opcional `qaObservation` con `contract`, `traceId`, `reportUrl`, `receiptToken` y `expiresAt`. Solo admite la URL exacta `https://zipco-backend-qa.up.railway.app/qa/push-observations/events`, UUID v4, comprobante base64url de 43 caracteres, vencimiento válido y SHA de build de 40 caracteres.
- El bloque privado permanece en `Notification.data.qaObservation` y memoria del worker. Se excluye de mensajes a la página —incluido el canal foreground—, URL, trazas locales, inventario exportado y copia del panel. No se copia el JWT al worker.
- POST `/qa/push-observations/events` usa exclusivamente Bearer receiptToken. Body: traceId, attemptId, stage, workerBuild, workerRevision y opcionalmente hasTarget/hasEvent/hasClient/ok. Usa credentials omit, cache no-store, redirect error, referrerPolicy no-referrer y límite de 1.500 ms. Sin reintentos. HTTP 400/401/404/410/413/429 detiene futuros reportes de ese comprobante en ese worker; red/timeout no altera el flujo.
- Cada ejecución push y cada clic físico genera su propio attemptId, compartido entre sus etapas. No se espera HTTP para showNotification/openWindow/focus. Los reportes se sujetan al waitUntil del evento y se inician independientemente de la caché de trazas.
- Etapas de worker: PUSH_RECEIVED, SYSTEM_SHOWN, CLICK_RECEIVED, TARGET_NORMALIZED, LAUNCH_REQUESTED, NAVIGATION_POSTED y CLICK_FAILED cuando el handler lanza un error. La página devuelve solo traceId/attemptId/etapa al worker que envió el destino. APP_TARGET_ACCEPTED se confirma al aceptar el destino y CARD_FOCUSED después del callback real de enfoque. El worker comprueba identidad del cliente y del intento; no inventa ACK si perdió el contexto.
- Los avisos comerciales y la navegación conservan su contrato: orderId/processId/processVersion, tag versionado y URL requests-customer existente. El traceId remoto solo correlaciona diagnóstico y código QA del banner; no reemplaza la identidad comercial.

## Compatibilidad y límites

Sin bloque, con bloque inválido o diagnóstico apagado continúa el comportamiento existente. No hay cambios en pedidos, disponibilidad, reservas, autenticación, suscripciones, payload comercial ni destinos. Ninguna repetición de CONFIRM_AVAILABILITY ni creación de pedido/push real para probar.

El comprobante persistido en Notification.data permite reportar el clic tras reiniciar el worker o fallar Cache Storage. Si el worker vuelve a reiniciarse después de iniciar el clic y pierde su contexto de correlación, puede faltar el ACK remoto: no se fabrica evidencia. La ausencia de filas también puede deberse a red, timeout, vencimiento o reinicio del backend. Los receivedAt son del servidor y su orden de recepción no garantiza causalidad de reportes paralelos.

Los módulos auxiliares y la UI se generan solo con las banderas QA existentes. Un build local con sufijo `-local` no reporta etapas remotas: el contrato requiere SHA40; el despliegue Vercel usa el SHA exacto. Un build local de producción excluye los módulos/UI/rutas de sesión remotos y conserva el aviso comercial sin prefijo QA. No se publica producción.

## Archivos de esta entrega

- `public/push-sw.js`, `vite.config.ts`.
- `src/app/App.tsx` y `src/app/notifications/QaNotificationClickTracePanel.tsx`, `qaNotificationClickTrace.ts`.
- Nuevos `src/app/notifications/QaPushObservationPanel.tsx`, `qaPushObservationApi.ts`, `qaPushObservationAcks.ts`, `qaPushObservationWorker.js` y sus tres archivos de pruebas.
- `src/app/notifications/notificationLifecycle.test.ts`, `scripts/check-whatsapp-notification-click.mjs` y nuevo `scripts/check-qa-push-observation.mjs`.

Los nueve documentos locales ajenos/preexistentes quedan fuera del commit.

## Validación y publicación

- Suite general: 1.607 pruebas en 126 archivos aprobadas. Incluye cache indisponible/reinicio simulado, worker sin página, timeout/red, 401/410/429, cuerpos exactos, aislamiento de propietario, saneamiento y ACK de foco real. No equivale a una prueba física de iOS.
- Nueve escenarios de navegador con App real y API/worker sintéticos aprobados: opt-in, copia saneada, pausa por página oculta, cierre del diagnóstico interno y exterior, revocación, flag apagado sin reintento, cambio de propietario y ACK después del enfoque real. Sin tráfico comercial real.
- Once escenarios existentes de navegación aprobados: mensaje/URL/caché, distintos pedidos, clic repetido, sesión/lista tardías y aviso interno desde Inicio/Perfil/catálogo. Builds QA/PWA y producción local aprobados. Advertencia habitual de bundle mayor de 500 kB; no hay script independiente de lint/tsc, por lo que no se afirma su ejecución.
- HTTP público de solo lectura, sesión ficticia: Railway QA responde 404, Cache-Control no-store y `{"statusCode":404,"code":"QA_PUSH_OBSERVATIONS_DISABLED"}`. No se crean sesiones ni se cambian variables.
- Publicación exclusivamente mediante commit de esta ficha en rama `qa` y `git push origin qa`, con despliegue automático GitHub → Vercel QA. El informe final identifica SHA y estado Ready tras verificarlos; no se utiliza un deploy CLI ni se toca Railway.
- `main` conserva `8295ab8c6024ab20851ebd371308d2f299b4668f`; producción intacta.

## Pendiente para coordinación

Backend ya fue necesario y está publicado; no necesita nuevo cambio de contrato para esta integración. **Mantener QA_PUSH_OBSERVATIONS_ENABLED apagado** hasta que backend confirme una sola réplica/proceso QA y se coordine la activación con frontend/worker v11 actualizado en los teléfonos.

Después de activar coordinadamente, el usuario puede abrir una sesión diagnóstica explícita y observar el siguiente aviso legítimo. No repetir la confirmación, crear otro pedido, enviar pushes artificiales, reinstalar o borrar datos. Correlacionar el prefijo QA visible con traceId del informe remoto y la traza local. La validación física final de ambos teléfonos y la resolución del clic del sistema permanecen pendientes.
