# QA-DOC-CLOSURE-01 — Respaldo documental y cierre de avances QA

**Nota vigente, 2026-10-30:** este cierre conserva la etapa del 19 de octubre.
Consultar [estado actual](frontend-qa-current-state.md) y
[política de trabajo](frontend-qa-working-policy.md). La autorización histórica
de push/despliegue de este documento no se extiende al cierre documental actual
ni al bloque de herramientas pendiente: guardar memoria no autoriza un push QA.

Fecha: 2026-10-19. Clasificación: documentación frontend QA, sin cambios de aplicación ni contratos.

## Regla de entrega vigente

Bastián aclaró que no hay que esperar a terminar todas las pantallas: cada avance terminado debe quedar en Git con código, pruebas y documentación. Después de publicar y probar, se guarda también el resultado en un commit documental de cierre. Una confirmación como «funciona», «ok» o «está correcto» se registra con su alcance y versión comprobada; no exige una frase literal predeterminada ni equivale automáticamente a aprobar todas las pantallas.

La autorización actual permite revisar y subir juntos los documentos que antes se preservaban fuera de los commits de código. Aquella exclusión protegía sus cambios locales; no exige mantener indefinidamente sin respaldo los resultados de publicación. Las frases históricas «queda local», «sin commit» o «pendiente» describen la etapa en que se escribieron. Este cierre respalda esas notas en Git sin borrar el historial.

Para cada bloque registrar nombre e identificador, rutas, commit de código, SHA publicado, pruebas/build, evidencia y aprobación de Bastián si existe. Distinguir implementado, publicado, probado en un dispositivo, aprobación parcial y pendiente. No inventar conformidad, capturas ni una prueba del segundo celular. Toda nota de cierre debe enviarse a Git; no basta con dejarla local.

## Estado al cerrar el respaldo

- Base de aplicación: `f0395ae6f2ca84b9f2c88bf466ffbfb1c7c8d679`, rama `qa`. Última validación de ese código: **919 pruebas en 84 archivos y build QA aprobados**. No se vuelven a ejecutar pruebas de aplicación solo por guardar Markdown; comprobar diff exclusivamente documental, formato y referencias.
- Campanita de negocio: `UI-BUSINESS-COORDINATION-SCROLL-01`, código `d9fe36efe18aee79ee10aa85625ae897c8d453b2`, publicado en `d8f6ea1108c0d7eec51358a2e96a57ee1f6cd038`. Campanita cliente: `UI-CUSTOMER-COORDINATION-SCROLL-01`, código `bd275c0ad95a4567d80f980e6fb51d1b7e00c301`, publicado en la base `f0395ae`. Últimos resultados físicos de ambos ajustes: no se documenta una confirmación específica posterior a esas publicaciones en este cierre.
- Encuadre por notificación: ensayo inicial retirado en `d01b5a5`; versión puntual posterior `846e7d3`. No confundir con las campanitas de categoría. No declarar estabilidad global de notificaciones por sus pruebas automatizadas.
- iPhone: Bastián confirmó que pudo abrir el panel mostrando `c72ca1819d9e4b41b2c743b51f87a721c44b1c2e`. Es evidencia de respuesta de la interfaz en esa prueba; no confirma la causa del bloqueo anterior ni todos los flujos. El registro temporal del clic sigue pausado (`ZIPCO_QA_NOTIFICATION_TRACE=0`).
- loadOrders: el panel mostró cero fallos en la actualización comunicada de Android/iPhone negocio el 2026-10-17; eso no prueba que el error original esté resuelto. Sigue pendiente identificar su causa. No repetir START_WORK para diagnosticar.
- Aviso superior de error: Bastián informó una duración visible aproximada de 2 s; el código configura 7 s más 0,18 s de salida. Sigue pendiente explicar la retirada anticipada; no se aumentó su duración ni se atribuyó una causa confirmada. Referencias: `src/app/screens/Toast.tsx`, `src/app/screens/requests/useRequests.ts` y `src/app/App.tsx`.
- Paleta Listos: la nota histórica sobre teal fue superada por la restauración naranja/ámbar de `66a85a1198e6e1cd4ef45b87e1beda0ffe83bdd3`, publicada como `73f5bfd181dcd6b22d4034ec3554509f6a6abc1e`. Tipografía compacta posterior: texto 10,5 px y contador 11 px; las variantes mayores quedan como historial, no como especificación vigente.
- El traspaso del 2026-10-17 y el diagnóstico inicial de notificaciones son referencias históricas a sus SHAs; no describen por sí solos la aplicación actual. Sus pendientes requieren contrastarse con las fichas posteriores. La arquitectura nueva de notificaciones continúa pausada; producción no está autorizada.

## Inventario de los 23 documentos revisados para respaldo

| Documento | Contenido que se conserva |
| --- | --- |
| [frontend-business-compact-conditions-qa.md](frontend-business-compact-conditions-qa.md) | Condiciones compactas del negocio y resultado publicado. |
| [frontend-business-coordination-scroll-qa.md](frontend-business-coordination-scroll-qa.md) | Punto 6 negocio: código, pruebas, SHA y Preview. |
| [frontend-business-coordination-summary-qa.md](frontend-business-coordination-summary-qa.md) | Campanita de negocio y publicación inicial. |
| [frontend-business-notification-baseline-qa.md](frontend-business-notification-baseline-qa.md) | Aviso de nuevo pedido y límites de la prueba física. |
| [frontend-category-typography-compact-qa.md](frontend-category-typography-compact-qa.md) | Tipografía compacta actual y publicación. |
| [frontend-category-typography-qa.md](frontend-category-typography-qa.md) | Primera variante de tipografía, histórica. |
| [frontend-category-typography-refinement-qa.md](frontend-category-typography-refinement-qa.md) | Variante intermedia de tipografía, histórica. |
| [frontend-contact-authorized-notification-dedupe-qa.md](frontend-contact-authorized-notification-dedupe-qa.md) | Publicación y reapertura por prueba fallida. |
| [frontend-customer-coordination-scroll-qa.md](frontend-customer-coordination-scroll-qa.md) | Campanita cliente: nombre, código, pruebas y Preview. |
| [frontend-customer-coordination-summary-qa.md](frontend-customer-coordination-summary-qa.md) | Resumen persistente de Coordinación del cliente. |
| [frontend-customer-receipt-qa.md](frontend-customer-receipt-qa.md) | Confirmación del aviso y recepción, publicación y límites. |
| [frontend-ios-freeze-recovery-qa.md](frontend-ios-freeze-recovery-qa.md) | Contención del bloqueo y pausa del recorrido temporal. |
| [frontend-new-orders-bell-label-qa.md](frontend-new-orders-bell-label-qa.md) | Nombre Nuevos Pedidos y publicación. |
| [frontend-notification-card-align-once-qa.md](frontend-notification-card-align-once-qa.md) | Encuadre puntual por notificación y Preview. |
| [frontend-order-acceptance-confirmation-copy-qa.md](frontend-order-acceptance-confirmation-copy-qa.md) | Texto de aceptación y publicación. |
| [frontend-push-navigation-fix-qa.md](frontend-push-navigation-fix-qa.md) | Corrección inicial de navegación, publicación y pendientes. |
| [frontend-ready-summary-color-qa.md](frontend-ready-summary-color-qa.md) | Selección y referencia de colores, con su secuencia histórica. |
| [frontend-request-process-ready-qa.md](frontend-request-process-ready-qa.md) | MARK_READY, contrato referido y publicación frontend. |
| [frontend-ui-design-catalog.md](frontend-ui-design-catalog.md) | Catálogo nombre + commit y restauración de paleta. |
| [frontend-visual-review-log.md](frontend-visual-review-log.md) | Revisiones, conformidades específicas y propuestas pendientes. |
| [qa-load-orders-diagnostics.md](qa-load-orders-diagnostics.md) | Acceso, bloqueos, despliegue, CORS y comprobación móvil. |
| [frontend-push-navigation-diagnosis-qa.md](frontend-push-navigation-diagnosis-qa.md) | Diagnóstico histórico inicial aún no versionado hasta este cierre. |
| [frontend-qa-handoff-2026-10-17.md](frontend-qa-handoff-2026-10-17.md) | Traspaso de la etapa del 17 de octubre, con referencias posteriores. |

Este índice es el documento adicional número 24 del cierre. Los 23 anteriores se preservan completos; las aclaraciones nuevas se fechan y no convierten propuestas en implementaciones.

## Comprobaciones y alcance de publicación

En la revisión previa se comprobaron 44 referencias completas a commits: 42 existen en este repositorio frontend y 2 (`ec0c632` y `385de88`) son referencias backend documentadas, cuya existencia no se vuelve a comprobar en este trabajo. No se accede ni modifica backend para respaldar esos informes. No se detectaron patrones de JWT, claves privadas o credenciales Bearer reales en la búsqueda documental; la documentación revisada registra contratos, nombres y URLs QA públicas, sin añadir respuestas completas o secretos.

El commit de cierre debe contener únicamente estas 24 rutas Markdown, sin código, dependencias, archivos generados o configuración. Ejecutar `git diff --cached --check`, comprobar inventario y push limitado a `origin/qa`, con estado Git limpio al cerrar el bloque documental.

El push puede generar un build automático de Vercel. Conservar el Preview QA con las mismas opciones por despliegue y Backend QA, sin ajustes globales: `ZIPCO_QA_LOAD_DIAGNOSTICS=1 ZIPCO_QA_NOTIFICATION_TRACE=0 npm run build -- --mode qa`. El código de aplicación debe ser idéntico a la base `f0395ae`; solo cambia el SHA que identifica el build. Comprobar READY y destino del alias QA habitual. El resultado remoto identifica el commit documental sin necesidad de alterar la aplicación ni producir otra nota local sin respaldo.

Sin campos/endpoints nuevos o modificados, sin acciones de pedidos, sin cambios de backend/Railway, `main` o producción. La documentación no sustituye la aprobación de una versión completa para producción ni publica producción.
