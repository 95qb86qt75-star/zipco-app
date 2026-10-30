# Rediseño de coordinación codex_final2 — frontend QA

Fecha: 2026-10-30. Rama: qa. Base: 681d8cc.
**Clasificación: solo frontend.** Auditoría previa: [01](design/coordination-in-card/01_AUDITORIA_Y_TRASPASO_BACKEND_QA.md).
El contrato existente de Railway QA c3da34e ya cubre las acciones; no se necesita modificar backend.

## Resultado

- Cliente: cabecera B con banda clara, negocio sin truncar, producto, cantidad y precio. El detalle A reutiliza el controlador real, con tres pasos horizontales, WhatsApp, Condiciones y Más opciones. Anular y retirar permiso conservan sus confirmaciones, permisos y recuperación.
- Negocio: conserva su estructura; Sí tiene halo/brillo/salto, Falta es rojizo y la insignia WhatsApp orbita derecha. Cancelar permanece neutro y Devolver ámbar. La tarjeta normal de disponibilidad no se rehace.
- Ambas negativas se presentan cerradas a partir del resumen real: inicial activa o ronda DECLINED. Ya coordinamos abre el detalle; la confirmación positiva posterior continúa siendo una acción explícita autorizada. No se cambia el estado mediante marcadores locales.
- El resultado conserva la altura medida de la tarjeta. Solo sale al cambiar de categoría; se conserva la pestaña elegida. Los hologramas existentes terminan antes del aviso inferior. Los avisos se encolan; Ver abre el destino y resalta/focaliza ese pedido durante unos 2,4 segundos, también cuando sus condiciones cargan después.
- Contadores y banner conservan las listas reales y el chispeo existente. No se inventan números por animación.
- Movimiento reducido, compuertas de scroll/visibilidad, controles táctiles de 44 px, producto independiente y navegación inferior conservados.

## Contrato y diferencias frente a las referencias

Campos consumidos, sin ampliación: requestProcess.state/version/allowedActions, coordination.customerContactAuthorized/businessContactAuthorized, whatsappCoordination (incluido initiatedBy/status), whatsappCoordinationInitialDecline, capacidad initialDecline, acuerdo aceptado, items/subtotalClp y productPreview.

Endpoints existentes:

- GET /orders/my-orders, /orders/business/:businessId, /request-process-capabilities y /request-processes/:id/agreement.
- POST de coordinación: confirm-whatsapp-coordination, respond-whatsapp-coordination, decline-whatsapp-coordination, authorize-contact, open-whatsapp y anulación; las rutas reales permanecen en coordinationApi.
- Disponibilidad/propuestas/listo/recepción y retiro de consentimiento conservan sus endpoints, cuerpos, headers, consentimiento e idempotencia.

Se mantienen coordinationAccepted, confirmationAccepted, expectedVersion, confirmationId, Idempotency-Key y las cabeceras de contrato ya integradas. No se introduce decision ni otro campo/endpoint.

Correcciones documentadas: RESPOND true permanece En curso; una negativa inicial sigue Por coordinar y una negativa de contraparte vuelve allí. Un envío incierto no afirma que no se guardó. No existe fecha de autorización en coordination: se muestra Confirmada, sin reutilizar acceptedAt/updatedAt. productPreview ya está disponible. Una de las siete copias adjuntas carecía de embedded; se preservó la implementación actual del repositorio.

## Archivos

Bajo src/app/screens/requests:

- Nuevos: CustomerCoordinationCard.tsx, CustomerCoordinationDetail.tsx, coordination-v2.css, statusOverlay.ts.
- Tarjetas: AvailabilityWaitingCard.tsx, BusinessCoordinationCard.tsx, ProcessOrderCard.tsx, WhatsappCoordinationPanel.tsx.
- Presentación: StatusChangeFlow.tsx, statusChangePresentation.ts, status-change.css, ActionHologram.tsx, DealSuccess.tsx.
- Conservación del feedback: useCoordination.ts, useAvailability.ts, ProposalNegotiation.tsx, useLateInitial.ts.
- Pruebas: statusChangePresentation.test.ts.

Script ampliado: scripts/check-coordination-inline.mjs. Maneja el bloqueo temporal de DevToolsActivePort al arrancar Chrome en Windows.

Documentos activos: 00, 01, 12, 13, 14 y 15 en docs/design/coordination-in-card. El paquete final reemplaza las especificaciones anteriores; se retiró el mensaje viejo de ampliación pendiente. Git conserva el historial. Los diez documentos ajenos no rastreados se mantienen fuera del bloque.

## Validación

- **1709 pruebas aprobadas en 129 archivos.** Se incluyen espera/pausa por hologramas, cola de avisos, destino específico y aislamiento por sesión/rol.
- **17 escenarios de navegador aprobados**, con componentes y hooks reales y HTTP sintético: ambos roles, Sí/Falta/Cancelar/Devolver, persistencia y recarga, coordinación posterior, doble toque, envío incierto y reintento exacto, recibo confirmado con lectura pendiente, capacidades, Listo invalidando una confirmación, varias tarjetas, miniatura, foco de Ver, nombre largo a 320 px, detalle compacto, Condiciones, cancelación de Anular/Retirar permiso y espera del holograma.
- **10 recorridos de regresión de disponibilidad/propuestas aprobados** con checkout real del proyecto y transporte sintético: retiro/WhatsApp, 320/390/430 px, consentimiento, rechazo, retirada y propuestas/contrapropuestas.
- Build QA/PWA aprobado: 2310 módulos, precaché generado. Advertencia conocida de bundle principal mayor de 500 kB. No existen scripts separados de lint/typecheck en package.json; no se declara su ejecución.
- Capturas revisadas: cliente compacto abierto, varias tarjetas, negocio y nombre largo a 320 px. Los nombres extremos pueden aumentar la altura para conservar su lectura.
- No se crearon pedidos, repitieron confirmaciones reales ni enviaron notificaciones/pushes artificiales.

## Publicación, alcance y pendientes

El commit de este informe pertenece a qa; su SHA exacto y el estado Ready de Vercel se entregan al cerrar. Se verifican el alias QA y el bundle publicado.

Alias: https://zipco-app-git-qa-zipco-s-projects.vercel.app

**Pendiente:** comprobar físicamente iPhone y Android. La evidencia local no equivale a esa validación. Cotizaciones y recorridos legados sin requestProcess conservan su presentación; este bloque rediseña los pedidos versionados descritos.

No se modificaron Railway, flags, migraciones, main ni producción. El workspace C:/dev/zipco-app permanece intacto. El diagnóstico del clic de notificación externa del iPhone continúa pausado y no se declara resuelto.
