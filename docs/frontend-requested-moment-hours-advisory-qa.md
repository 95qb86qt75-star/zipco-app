# E219 — Aviso según el momento solicitado: integración frontend QA

2026-11-18 America/Santiago. Clasificación: frontend + backend coordinado.

## Contrato y responsabilidad

Respuesta definitiva recibida del usuario: backend Railway QA739c5a4 publicado
con success del SHA exacto. Se leyó
`C:/dev/zipco-backend-qa/docs/testing/requested-moment-hours-advisory-contract-qa.md`.
Sus1152 pruebas/5 omitidas y110 focalizadas son evidencia backend reportada;
no se atribuyen a esta ejecución frontend. El informe backend no certifica una
petición autenticada a esta ruta en Railway: permanece como límite de prueba.

Programar/Hoy evalúan fecha y hora pedidas; Ahora usa el reloj servidor. La
apertura es inclusiva y el cierre exclusivo, decididos por backend. El aviso
permite enviar voluntariamente fuera de atención y no confirma disponibilidad,
reserva, pago, acuerdo ni entrega. E215 permanece separado y pendiente.

## Cambios por archivo

- `requests/api/requestedMomentAdvisory.ts`: lector canónico v2 y normalizador
  estricto de negocio, modo, eco de fecha/hora, zona, evaluatedAt, dayWindow y
  weeklyHours. Una respuesta200/v1 se rechaza, sin fallback a horario actual.
  Horarios semanales se formatean sin convertir días discontinuos en un rango.
- `requests/application/useSubmissionHoursAdvisory.tsx`: consulta una selección
  inmutable; invalida/aborta resultados obsoletos por negocio, modo, fecha, hora,
  token o usuario. Al volver de segundo plano vuelve a comprobar la selección.
  UNKNOWN no se interpreta como cerrado.400/403/404 y contrato inesperado no
  permiten enviar; red/5xx permiten consulta o envío explícito sin verificar.
 401 conserva el cierre de sesión existente.
- `checkout/domain/orderMoment.ts`: conserva el momento revisado como fecha
  concreta para que Hoy no cambie silenciosamente al día siguiente. No cambia
  el validador previo ni el DTO; backend sigue validando el instante definitivo.
- `checkout/product/application/useCheckoutScreenController.tsx` y
  `checkout/service/application/useServiceCheckoutScreenController.tsx`: pasan
  la selección del formulario, conservan snapshot/UUID de reintentos, mantienen
  errores de selección locales y detienen envío si cambió contexto mientras
  se consultaban capacidades. La selección revisada no se presenta como una
  edición inexistente al reintentar Hoy sin cambiar el formulario.
- `checkout/product/CheckoutScreenView.tsx`,
  `checkout/service/ServiceCheckoutScreenView.tsx`,
  `checkout/service/components/ServiceOrderSummary.tsx`: destino de foco en el
  selector. Buscar otro horario cierra revisión/aviso y enfoca ese destino.
- `quotes/shared/QuoteRequestModal.tsx`: integra v2 y mismo retorno local,
  mantiene mensaje/foto/fecha y conserva payload/clave originales si el envío
  fue incierto. Sin cambios al contrato ni al transporte POST de cotizaciones.
- `requests/api/requestedMomentAdvisory.test.ts` y
  `checkout/tests/checkoutMomentFlow.test.ts`: pruebas de contrato, parámetros,
  límites, invalidación y recuperación afectadas.

No hay estilos globales nuevos ni composición alternativa silenciosa. El lector
v1 usado por la compatibilidad del contrato de respuesta del negocio se conserva;
ningún formulario migrado vuelve a v1 si falla la evaluación seleccionada.

## Endpoints, datos y acciones

GET `/businesses/:id/submission-advisory` autenticado/no-store:

- `contract=request-submission-advisory-v2&mode=IMMEDIATE` sin fecha/hora inventadas.
- `contract=request-submission-advisory-v2&mode=SCHEDULED&requestedDate=YYYY-MM-DD&requestedTime=HH:mm`.

Sin body, UUID ni cabeceras nuevas en ese GET. `checkedAt` es consulta servidor;
`evaluatedAt` es instante evaluado. Se presentan negocio/días/horas reales de
`weeklyHours`, ventana `dayWindow` y próxima apertura desde `nextWindow`.

Enviar de todas formas continúa un único POST habitual con la misma selección;
Buscar otro horario no hace POST ni navega a otro negocio, conserva borrador y
no reutiliza la confirmación para otra selección. Siguen los POST de pedidos por
capacidad V1/V2/V3, servicios `/orders` y cotizaciones `/quotes`, con los DTO y
mecanismos de idempotencia existentes. No cambian estados/contadores de pedidos.

## Pruebas y límites

-122 pruebas unitarias focalizadas aprobadas en seis archivos: lector v2,
 contrato de horarios vigente del negocio, selector, intención de creación,
 conexión producto/servicio y transporte de cotizaciones. Se repitieron al
 añadir protección del contexto durante capacidades y pruebas de parámetros;
 las repeticiones no aumentan el número de casos únicos.
-Chrome/CDP con React, CSS y formularios reales a320/390/430. El arnés usa la
 función pura real `requestedMomentAdvisory` del backend, cargada en memoria
 con calendario ficticio L–V08:00–15:00; HTTP y creación son simulados, sin DB.
 A viernes13:00 no hay aviso aunque se consulte lunes21:00; después del cierre
 aparece el nombre y horario correctos; cambiar vuelve al selector, conserva
 fecha/nota y reconsulta la selección nueva. Foco verificado en los tres
 formularios y botones tocados por coordenadas con elementFromPoint.
-Comprobados envío voluntario fuera, sábado cerrado, Ahora, UNKNOWN, red,
 respuesta v1 rechazada y respuestas tardías tras cambio de sesión/negocio/
 selección. Producto, servicio y cotización pasan. Sin excepciones JavaScript.
-Build QA/Vite/PWA final aprobado (11,46s Vite). Advertencia previa de chunk
 >500kB. No hay tsc/lint independientes configurados/disponibles en este workspace;
 build transforma TS, no acredita un chequeo completo de tipos.

Evidencia ignorada: node_modules/.cache/requested-hours-v2/ y scripts
prepare-requested-hours-browser.mjs/requested-hours-browser.mjs. Un primer
fallo fue de comillas en el selector del fixture, corregido sin cambiar UI.
El primer reemplazo del hook no se aplicó por verificación de apply_patch;
se aplicó correctamente después, sin conservar otra versión ejecutable.

Pendientes: sesión autenticada con API Railway QA, iPhone y Android físicos,
campos nativos y recorrido real. No se crearon solicitudes reales ni se cambió
el reloj de Railway. No declarar validado el flujo físico con estas pruebas.

## Publicación y medición

Frontend origin/qa publicado:8f6a1edea8a9a48ede447e8235ff0ec45ec7ff49. GitHub
combined status del SHA exacto devuelve Vercel success:
https://vercel.com/zipco-s-projects/zipco-app/2t2tF8bnDSi2q61TkLqZboF8DKop.
Alias QA: https://zipco-app-git-qa-zipco-s-projects.vercel.app.
Para la prueba física comprobar QA8f6a1ed en pantalla. El status del despliegue
no acredita la sesión autenticada ni el bundle que ya tiene abierto el teléfono.
Backend existente739c5a4, sin intervención adicional desde frontend. Main
8295ab8c6024ab20851ebd371308d2f299b4668f y producción intactos; archivos ajenos
no versionados preservados.

Primer reloj registrado01:18:42UTC. Análisis/implementación/preparación/pruebas
se intercalaron; hubo petición del usuario de continuar tras límite, sin timer
exclusivo de esa espera. No repartir ni sumar minutos solapados como exclusivos.
Vitest final2,98s; Vite final11,46s, PWA sin timer propio. Inicio de revisión/
documentación final registrado01:40:42UTC. Push completado antes del reloj
01:43:24UTC; consulta posterior verificó success. Sin timer exclusivo de espera
de Vercel. Cierre documental local sin push/redeploy; no sumar ese intervalo a
ejecuciones que ya están incluidas ni inventar tiempo de la interrupción.
