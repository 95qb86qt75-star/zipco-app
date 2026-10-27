# Tarjeta Fuera de hora del negocio: ajuste visual QA

Clasificación: solo frontend. Integra los archivos entregados en Downloads `10_TARJETA_FUERA_DE_HORA_NEGOCIO.md`, `LateInitialCard.tsx` y `late-initial.css` como especificación visual. No modifica el contrato funcional ni el backend.

## Resultado

- Variante del negocio más compacta, reloj SVG animado, retraso en minutos/horas/días y etiqueta que se acomoda en pantallas angostas.
- Fecha y hora solicitadas en America/Santiago. La comparación de día usa `lateInitialResponse.serverNow`; no redefine plazos con el reloj del celular.
- Botón y diálogo «Eliminar solicitud», conservando la explicación de que se avisará al cliente y quedará en el historial de ambos. No elimina registros del servidor.
- Estado «Consulta enviada. Esperando la respuesta del cliente.»
- Holograma existente de consulta enviada con fondo casi opaco, fundido simple y sin giros/desenfoque. Conserva su texto real y solo se anuncia tras verificar el recibo. No se añade otro disparador ni se cambia `useLateInitial`.
- CSS nuevo acotado al negocio y al holograma `lateQuerySent`; variante del cliente y demás hologramas conservados. Movimiento reducido sin animación. Botones compactos de 38 px y detalle de 30 px según el diseño recibido.

## Archivos y contrato

Modificados: `src/app/screens/requests/LateInitialCard.tsx`, `late-initial.css`, `ActionHologram.tsx` (clase de presentación del aviso) y `scripts/check-late-initial-flow.mjs`. Este documento registra la entrega.

Sin cambios en `ProcessOrderCard`, `useLateInitial`, contratos, intenciones de reintento, permisos o notificaciones push. Campos existentes: `lateInitialResponse.status`, `delaySeconds`, `scheduledFor`, `serverNow` y `allowedActions`.

Se mantienen POST `/request-processes/:id/actions/ask-late-request-need`, `confirm-late-request-need`, `decline-late-request-need` y `close-late-request-unavailable`, con sus cuerpos, headers y recibos actuales. «Eliminar solicitud» sigue usando `CLOSE_LATE_REQUEST_UNAVAILABLE` tras confirmar el diálogo. Lecturas y propuestas existentes conservadas. No se ejecutaron acciones contra pedidos reales de QA.

## Verificación

- 1.471 pruebas / 119 archivos aprobados.
- 15 recorridos de navegador con componentes reales y HTTP sintético: flujos Sí/No, cierre confirmado, nueva hora, errores/recibos inciertos, compatibilidad y dos grupos adicionales de UI.
- UI revisada a 320, 350, 390 y 430 px: retrasos de 57 min, 1 h, 1 h 5 min y 1 d 3 h; sin desbordamiento o superposición de retraso/etiqueta; espera, detalle y movimiento reducido. Cliente sin clase del negocio. Capturas locales en `node_modules/.cache/late-initial-flow`.
- Build QA/PWA aprobado. Permanece el aviso conocido de bundle superior a 500 kB. No se presentan lint/TypeScript independientes como ejecutados.

## Publicación y prueba física

Publicación exclusivamente mediante push de rama `qa` a la integración GitHub → Vercel. Tras verificar Ready, recargar ambos celulares y comprobar la versión de esta entrega. En Android: Solicitudes → Mi Negocio → Pendientes → tarjeta Fuera de hora; revisar plegado/detalle y estado de consulta enviada. En iPhone comprobar que la consulta del cliente conserva su presentación y acciones.

Pendiente: prueba visual física Android/iPhone. Railway QA no es necesario; sin variables, migraciones ni cambios de servidor. Main y producción intactos. Se conservan fuera de la entrega los seis documentos locales previos ajenos.
