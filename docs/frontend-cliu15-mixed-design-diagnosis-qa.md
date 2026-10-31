# CliU15: diagnóstico de mezcla y corrección — 2026-10-31

Clasificación: solo frontend, selección de presentación y navegación local.
No cambia contrato, roles, permisos, endpoints ni transiciones del servidor.
El usuario confirma que observaba la versión 2c29b27; no se atribuye el fallo a
una caché antigua, a Safari, a Railway o al service worker sin evidencia.

## Causas demostradas en código

1. ProcessOrderCard envolvía la variante ownPending con CoordinationWaitingCard
   y le pasaba CustomerProgressCard embebida. Cambió la cabecera, pero al abrir
   Detalle seguía mostrando el componente anterior completo. Esa combinación
   era una selección explícita de componentes, no un problema de CSS aleatorio.
2. La selección ClientProgress excluía el rediseño cuando existía coordinationView
   o cuando READY no traía customerReceipt. Eso vinculaba la apariencia al formato
   de datos compatible, en lugar de separar compatibilidad de presentación.
3. La vista local tenía su propia réplica JSX de retiro y un párrafo de muestra
   como detalle de WhatsApp. No ejercitaba el árbol real que generaba la mezcla.
   Las pruebas anteriores acreditaban acciones y responsive, pero no ausencia de
   componentes antiguos dentro del detalle ni paridad entre ambos renderizadores.
4. Existen estilos antiguos compartidos para estados que no cambian en este bloque.
   Su presencia no prueba interferencia. No se elimina CSS global usado por otros
   recorridos ni se sustituye todo CustomerProgressCard, que conserva servicios.

## Corrección

- Productos IN_PROGRESS/READY del cliente usan CustomerReceiptFlowCard también en
  ownPending y sin resumen v2. ownPending deja de envolver una tarjeta anterior.
  La espera de respuesta conserva su significado, distinto de preparar el pedido.
- CustomerPickupCard y CustomerReceiptDetails son presentadores compartidos entre
  la app real y la vista local, usando las mismas clases y componentes.
- La compatibilidad sigue en las acciones: sin v2, Confirmar aviso conserva
  ACK_READY_NOTICE y Confirmar recepción conserva CONFIRM_RECEIPT y su diálogo.
  Un ACK no se presenta como producto recibido ni ofrece FINALIZE_REQUEST.
  Con v2 permanecen DECLARE_PRODUCT_RECEIVED y FINALIZE_REQUEST del contrato QA.
- ReadyPanel admite textos compatibles mediante props de presentación. Se conservan
  allowedActions, bloqueo de envíos, UUID, recuperación y confirmaciones existentes.
- ConditionsSheet y sus estilos no se editan. Su botón recupera la estructura
  original de etiqueta/valor y flecha, compartida por vista local y app.

## Archivos

ProcessOrderCard.tsx, CustomerReceiptFlowCard.tsx, ReadyPanel.tsx,
CustomerPickupCard.tsx y CustomerReceiptDetails.tsx. Vista local preview.tsx;
fixture coordination.tsx y comprobador check-customer-design-parity.mjs.
Sin cambios en package.json, CSS global, backend ni diagnóstico de push pausado.

## Validación y límites

Cuatro escenarios de paridad: ownPending a 320 y 393 px, compatible anterior a
393 y comparación local/app de estructura y estilos calculados de retiro.
Comprueban ausencia de artículos/card anteriores anidados, detalle único, toques
por coordenadas y apertura/cierre de la ventana real de condiciones aceptadas.
Se completó el caso compatible hasta ACK y recepción/cierre con sus endpoints
originales. El carril queda listo después del ACK, sin simular recepción física.
Dos regresiones v2, WhatsApp y retiro a 393, verifican recepción y finalización
reales del controlador contra HTTP simulado. Tras ajustar el acabado del botón,
se repitió solo ownPending/393. Se revisó captura de detalle expandido.

Son seis escenarios únicos aprobados, con repeticiones justificadas registradas
en node_modules/.cache/qa-pilot/customer-design-parity y receipt-finalization.
Chrome local, sin pedidos ni proveedores externos. No acredita todavía iPhone físico
ni lectura autenticada del bundle servido por el alias QA.

## Tiempos

Lectura/análisis: UTC 17:03:02–17:05:12 (2 min 10 s observados).
Primera implementación hasta 17:06:50 (1 min 38 s). Una llamada posterior devolvió
wall time 18 376,7 s mientras las ejecuciones anidadas informaron 0,86 y 1,22 s;
el siguiente reloj observado fue 22:14:16. Se registra el intervalo de espera de
herramienta/orquestación separado: no se atribuyen esas horas a programación ni
al rendimiento de la app. No hay evidencia para determinar su causa interna.
Preparación/pruebas y adaptaciones restantes alternan hasta 22:26:55; sin desglose
fino completo. Cada ejecución de navegador tiene timing.json. No sumar el tiempo
de las tres regresiones concurrentes como trabajo secuencial.
Build final y publicación se anotan al cerrar; documentación posterior a pruebas.

## Pendiente al redactar

Build final, commit/rama qa y publicación Vercel QA. Railway no necesita cambios.
No tocar main ni producción. Revisión física del usuario después de publicar.

Build final QA/PWA aprobado UTC 22:27:50.227–22:28:06.956: 16,73 s.
JS local index-D4HtMWeS.js, CSS index-DC4zDgC8.css. El CSS de la app no cambió
respecto del bloque anterior: la corrección sustituye la composición de componentes.
diff --cached --check aprobado. Se registra SHA y resultado Vercel al publicar.

## Publicación

App b5f37dd42e40b836c1de99fb21ea18e37ac4d943, rama qa. Push correcto observado
UTC 22:29:00. GitHub comunica Vercel success para ese SHA:
https://vercel.com/zipco-s-projects/zipco-app/Cah7NGrp8MJTEGwGQJ4awv1b2zhs.
Alias QA https://zipco-app-git-qa-zipco-s-projects.vercel.app.
No se repitió la API Vercel 403 ni se afirma lectura autenticada del asset servido.
Publicación/verificación: unos segundos después del push, sin error observado.
El cierre documental queda local, sin otro push/despliegue. Railway, main y
producción intactos. Sigue pendiente la revisión física en el iPhone del usuario.
