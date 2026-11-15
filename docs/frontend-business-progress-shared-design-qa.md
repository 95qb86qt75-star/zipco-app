# Misma composición de En curso para retiro y WhatsApp

2026-11-14. Solo frontend: presentación de datos existentes y navegación local.
Base QA0dd6a6f. Usuario solicita aplicar a la primera tarjeta de retiro el diseño
de las tarjetas WhatsApp inferiores, conservando significado y acciones.

## Causa y cambio

BusinessProgressCardView seleccionaba BusinessInProgressCard únicamente cuando
availability.path era WHATSAPP. LOCAL_PICKUP salía por otra composición. No era un
problema de caché ni una entrega de CSS incompleta.

- BusinessProgressCardView.tsx: la composición existente se reutiliza también
  para producto IN_PROGRESS LOCAL_PICKUP, no embedded, sin listo/recepción.
  Sigue recibiendo title/colTitle/colSub reales del controlador. Su detalle usa
  reserva/instrucciones/consentimiento/cancelación existentes sin reconstruirlos;
  el aplanado de estilos .zipco-bp-opts permanece exclusivo de WhatsApp.
- ProgressCardShell.tsx: prop opcional channel en la variante business-progress;
  icono tienda y RETIRO EN EL LOCAL para retiro, WhatsApp y su franja para WhatsApp.
  Sin esa variante, cabecera original intacta. Miniatura real y precio conservados.
- BusinessAgendaRow.tsx: reconoce también el estado redundante de esa cabecera
  compartida cuando coincide exactamente con el título inferior. No oculta estados
  distintos. Fecha, filtros, ancho al abrir, swipe y ayuda v2 conservados.
- ReservationPanel.tsx: añade el marcador data-reservation-details y tabIndex=-1
  también a la rama del negocio. El marcador anterior solo estaba en el bloque
  compacto del cliente; ahora Revisar reserva puede localizar el panel real.
  No modifica datos, permisos, formularios ni botones de reserva.
- Mapa de tarjetas y memoria documental actualizados.

Mantiene Pendiente de retiro en el local frente a Preparando el pedido. Misma
jerarquía visual, textos propios. No crea otra copia de la tarjeta. READY, recibido,
servicios, pedidos sin modalidad y embedded conservan sus composiciones. El flujo
informativo localPickupInformation conserva su propietario y contrato anterior.

Sin campos, endpoints, transiciones, permisos ni backend nuevos. Se conservan las
acciones MARK_READY, cancelación, reservas y cierre E207 ya existentes y sus guardas.

## Validación por riesgo

Reutilización del arnés de agenda y cierre, RequestsScreen y componentes reales,
HTTP sintético sin escribir pedidos QA:
- 320/360/390/430: retiro reservado, WhatsApp y retiro NONE; misma composición,
  franja correcta, plegar/desplegar, miniatura/visor sin plegar, sin desborde.
- Reserva real montada y Condiciones aceptadas abre/cierra su hoja real.
- MARK_READY ausente: deslizador deshabilitado, sin inventar permiso.
- Swipe abre hoja real y Escape cierra; no envía un cierre.
- READY conserva composición distinta, no se amplía el rediseño.
- Sin excepciones JS. No se midieron FPS ni se atribuyen mejoras de rendimiento.

Primera comprobación detectó la ausencia del marcador de reserva en la rama
negocio; el panel existía, pero no podía localizarse con ese marcador. Se corrigió
y se repitió el caso y los consumidores afectados. No se repite suite de contratos
porque no cambian controladores, API ni reglas comerciales.

Build Vite QA7,04s y PWA aprobados; aviso de bundle previo conservado. Sin tsc
independiente configurado. iPhone/Android físicos pendientes.
Capturas locales ignoradas: node_modules/.cache/business-closure/shared-*.png;
escenario business-progress-shared-design.mjs, con APIs simuladas únicamente allí.

## Tiempos y publicación

Intervalos medidos: análisis/aplicación43s; preparación68s; ejecución y corrección
del marcador187s. El build corre superpuesto al tramo final de pruebas: no sumar
dos veces. Documentación y publicación se registran al cierre por separado.
Documentación63s y preparación/publicación/verificación49s medidos por separado.
Publicado en qa1a9152d791562227d840efc8477999b1a093032b; Vercel success del SHA
exacto observado por estado GitHub:
https://vercel.com/zipco-s-projects/zipco-app/51bnZSjtHgHA4UTv3JGUFGnCqAct
Railway no necesario. Cierre documental local sin otro push.
Main8295ab8 y producción intactos. No publicar mocks ni capturas.
