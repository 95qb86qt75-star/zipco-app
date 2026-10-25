# Pantallas 1–5: vista de diseño y reconciliación con contrato

Fecha: 2026-10-24. Clasificación: esta entrega es **solo frontend, presentación aislada**. El flujo funcional completo sigue siendo frontend + backend, pendiente de implementación/publicación del contrato.

Referencia frontend: rama `qa`, HEAD `56fb0e97`. Contrato revisado: `C:\dev\zipco-backend-qa\docs\testing\availability-continuation-contract-qa.md`, actualizado por backend con las decisiones E124 / commit documental indicado `3a7ce20`.

## Fuente de esta revisión

Paquete completo en `C:\Users\Basti\Downloads\MODIFICACION PANTALLAS\zipco-entrega-codex\codex\`: 00–08, 08b, las cinco maquetas HTML y siete capturas. Se leyeron especificaciones, estilos y estructura de referencia; no se copió el runtime de la maqueta ni sus variantes/controles A–D.

Este documento actualiza el diagnóstico anterior: ahora están las referencias faltantes de pantalla 3, pantalla 4 completa y pantalla 5 WhatsApp. Las decisiones funcionales ya confirmadas por Bastián prevalecen sobre los apartados antiguos que todavía las llaman pendientes.

## Decisiones aplicadas al diseño

1. **WhatsApp después de continuar:** en la tarjeta Disponible de retiro, si el negocio permite contacto, el botón se muestra deshabilitado con explicación. No existe URL ni número oculto. Si no permite contacto, se omite el botón.
2. **Casilla inicialmente marcada:** se puede desmarcar. En la hoja inicial, apagarla abre Quitar/Mantener; reactivarla no abre otra confirmación. El permiso es independiente de continuar comercialmente.
3. **Cancelación de retiro antes de Listo por cualquiera, con motivo y aviso:** decisión registrada; no se añade a las tarjetas de seguimiento actuales, que están fuera del diseño 1–5 y no tienen todavía el contrato funcional nuevo.
4. **Alternativas y contrapropuestas desde el inicio:** se conserva su lugar en el diseño; su adaptación de camino y consentimientos es parte de la integración pendiente. No se conectaron handlers antiguos a acciones nuevas ni se bloquearon alternativas en la aplicación actual.

Revisión de los textos definitivos de consentimiento: pendiente. No se declara validada por esta entrega.

## Qué quedó preparado

- Hoja Requiero este producto: resumen, interruptor, alerta para quitar el permiso y callback de envío.
- Ticket En espera: plegado/desplegado, datos originales, nota, precio, fecha, permiso informativo conocido/desconocido y ubicación de anulación.
- Ticket Nuevo pedido: cabecera compacta, confirmación, lugar de alternativas/rechazo y detalle plegable.
- Diálogo de disponibilidad: opción WhatsApp y retiro, mensaje editable con placeholder/restauración natural, límites 120/80, permiso del negocio apagado por defecto, cambiar opción y volver.
- Ticket Disponible: dos caminos, consentimiento editable, Sí/No y diálogo de cierre; bloqueo de contacto anticipado.
- Estilos `zipco-av-*` aislados, accesibilidad de Radix, indicadores de expansión, foco de diálogos y movimiento reducido.

Los componentes reciben datos y callbacks de presentación, no estados/endpoints inventados. No importan la API, sesión o almacenamiento. La muestra lleva una franja visible incluso con diálogos: **Diseño en revisión · Datos de ejemplo · Sin conexión al backend**.

## Discrepancias resueltas y pendientes

- La captura p5 retiro permite escribir antes del Sí: se corrige con el bloqueo explicado, respetando E124.
- El aviso de p3 afirmaba compartir teléfono al confirmar sin saber todavía si se elegirá retiro sin WhatsApp: se reemplaza por «En el siguiente paso eliges cómo continuar y si compartes tu teléfono.» La explicación específica se muestra en la elección del camino.
- En p4, abrir retiro no guarda nada: la ayuda ahora dice «Elige cómo continuar. La disponibilidad se confirma al guardar.» El placeholder del mensaje es texto de ayuda, no contenido que el foco deba borrar manualmente.
- No se muestra un holograma de éxito al pulsar los botones de esta vista. Solo se informa que es una decisión preparada de diseño y que no se guardó ni compartió nada. Los hologramas nuevos se conectarán a resultados verificados del backend, no a estados locales.
- La primera entrega de backend está acotada a productos fijos. Servicios/cotizaciones y nuevas reglas de alternativas deben distinguirse en el contrato antes de cambiar la creación real.
- La tarjeta de espera del negocio (pantalla 6), la coordinación (7), el retorno de WhatsApp (8), la cancelación de retiro y los textos finales pendientes no se inventaron en esta entrega.

## Archivos nuevos

- `src/app/screens/requests/availability-design/AvailabilityDesign.tsx`: componentes de presentación.
- `src/app/screens/requests/availability-design/availability-design.css`: estilos acotados, sin modificar clases compartidas existentes.
- `src/design-preview/AvailabilityDesignPreview.tsx`: datos de ejemplo e interacción de revisión.
- `src/design-preview/availability.tsx`: entrada exclusivamente de desarrollo, con guardia `import.meta.env.DEV`.
- `src/design-preview/availability-preview.css`: marco de revisión.
- `availability-design.html`: entrada separada; no modifica index.html, App, PWA ni rutas de pedidos actuales.
- `scripts/check-availability-design.mjs`: comprobación visual/interactiva en Chrome con perfil temporal y sin API.
- Este documento.

No se cambiaron CheckoutScreen, ProcessOrderCard, los parsers, las acciones de aceptación, los permisos de coordinación ni los componentes de seguimiento existentes. Los componentes nuevos todavía no están conectados a los pedidos reales de QA.

## Cómo revisar

La revisión estática está en `C:\dev\zipco-app-qa\node_modules\.cache\availability-design\revision.html`; se abre como archivo y reúne las capturas generadas, sin iniciar servidor ni iniciar sesión. Capturas y reporte: misma carpeta.

Para pruebas del desarrollador: `node scripts/check-availability-design.mjs`. Abre Chrome sin interfaz, utiliza Vite solo en loopback con puerto temporal, y cierra ambos al terminar. No restaura la herramienta de acceso local QA cancelada; no publica red LAN, no habilita CORS, no usa sesión ni datos reales.

La entrada de desarrollo admite `availability-design.html?screen=1` hasta `screen=5`; parámetros de fixture opcionales `expanded=1`, `path=pickup`, `contact=0`, `businessContact=0`, `unknownContact=1`, `long=1`, `detail=1`, `noSchedule=1`. No son controles del producto ni se agregaron selectores de variantes a las pantallas.

## Validación y límites

Chrome: cinco grupos de escenarios aprobados, incluyendo 320/360/390 px, interruptor marcado, Mantener/Quitar/reencender, detalle, diálogos de anular/cerrar, cambio de opción con texto conservado, límites de campos, retiro sin contacto, contacto anticipado bloqueado, nombres largos, teclado y movimiento reducido. Cero llamadas a endpoints de pedidos; cero excepciones de JavaScript en la comprobación.

Build normal de producción y verificador de exclusión Dev Auth aprobados, usando una clave centinela sintética y temporales dentro del workspace. Se comprobó además que el bundle no contiene `zipco-av-ticket`, el aviso de la vista ni su entrada HTML. Se conserva la advertencia existente de tamaño del bundle. `dist/index.html`, generado por la validación, se restauró a su contenido inicial; no se publica ese build.

Estas son comprobaciones de componentes con ejemplos, no pruebas del nuevo flujo contra backend ni pruebas en un iPhone físico. La integración debe validar errores de red, concurrencia, versionado, idempotencia, notificaciones y persistencia cuando exista Backend QA.

No se ejecutaron acciones de usuarios, cambios de esquema, migraciones o despliegues. No se cambió main, producción ni Railway QA. Vercel QA sigue sin publicar estas vistas. No se generó commit nuevo en esta entrega; cambios de diseño preparados en la rama qa. Los documentos locales anteriores se conservaron.

## Continuación: acceso desde celulares por Vercel QA

Ante el aviso de Bastián de que no veía las pantallas en sus celulares, se prepara una entrada explícita en el build Preview de la rama qa: `/?design=availability&screen=1` (pantallas 1 a 5; para retiro, `screen=4&path=pickup` o `screen=5&path=pickup`). La ruta normal conserva los pedidos reales y las acciones actuales.

Cambios adicionales: `src/main.tsx` selecciona la revisión únicamente si el build lo habilita y el usuario abre el enlace exacto; no monta la aplicación ni registra el service worker en esa revisión. `scripts/qa-availability-design-config.mjs` y `vite.config.ts` habilitan la entrada en Preview de rama qa o modo local qa; la bloquean en producción y otras ramas. No agrega autenticación, campos o endpoints.

Validación actualizada: **1.296 pruebas en 109 archivos** aprobadas, incluidos 10 casos de límites del build; **6 grupos de escenarios de navegador**, incluido abrir la revisión desde el entrypoint real de la app sin llamar a pedidos ni autenticación. Build QA/PWA aprobado; build de producción y verificador Dev Auth aprobados; comprobada exclusión de la revisión y sus assets del bundle de producción. Se conserva únicamente la advertencia preexistente de tamaño. Publicación QA se verificará contra el SHA del commit antes de informar los enlaces como disponibles.
