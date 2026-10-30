# Pantalla 3: coordinación necesaria con backend

Fecha: 2026-10-25. Clasificación: **frontend + backend**.
Frontend QA: `6acb167`. El usuario aprobó las pantallas 1 y 2 y eligió coordinar
backend primero para implementar completa la tercera pantalla, sin una versión
visual parcial que conserve el significado antiguo de aceptación.

## Mensaje para el chat backend

Las pantallas 1 y 2 están aprobadas en celular. S1 ya guarda y lee la preferencia
inicial de contacto. Para la Pantalla 3 necesitamos cerrar el contrato definitivo
y publicar en Railway QA la confirmación de disponibilidad y su continuación.
Hoy `ACCEPT_FIXED_ORDER` crea acuerdo y pasa a coordinación; no podemos llamarlo
«Confirmar disponibilidad» ni usarlo para abrir el nuevo recorrido.

Revisar e implementar el siguiente bloque conforme a
`REQ-AVAILABILITY-CONTINUATION-01`, sin cambiar silenciosamente la aceptación
actual ni convertir pedidos antiguos al flujo nuevo. Confirmar el alcance técnico
antes de frontend; el análisis actual sigue marcado como propuesta.

Necesitamos respuesta concreta de backend con:

1. Contrato definitivo de confirmación de disponibilidad: acción, ruta, DTO,
   respuesta, `allowedActions`, versión e idempotencia. `CONFIRM_AVAILABILITY`
   es el nombre propuesto en el documento; no se considera endpoint publicado.
2. Cómo identificar de forma segura los pedidos del nuevo flujo frente a los
   pedidos y apps actuales; reglas para que rutas antiguas no salten la decisión
   del cliente. No reutilizar timestamps ni asumir que tener preferencia S1
   habilita todo el flujo nuevo.
3. Elección del negocio entre WhatsApp y retiro, instrucciones, horario/dirección
   opcionales y consentimiento independiente sobre su propio teléfono. Definir
   qué datos quedan guardados y qué confirma exactamente el botón de cada paso.
4. Estado intermedio sin acuerdo mientras el cliente decide; acciones para
   continuar, declinar y, si corresponde, retirar disponibilidad. Definir lectura
   suficiente para las tarjetas del cliente y negocio y su agrupación.
5. Continuar crea el acuerdo exacto: WhatsApp pasa a coordinación y retiro a
   En curso con etiqueta «Pendiente de retiro en el local» (D48). Retiro no implica
   reserva ni pago verificado. Cada lado decide únicamente su propio consentimiento.
6. Sin teléfonos ni enlaces que los incluyan antes de continuar y obtener los
   permisos correspondientes. La preferencia S1 sigue siendo condicionada;
   la casilla empieza marcada por decisión funcional del usuario. Confirmar los
   textos/versiones que constituyen evidencia, todavía pendientes de revisión.
7. Cancelación de retiro por cliente o negocio antes de Listo, con motivo y aviso
   al otro; alternativas y contrapropuestas incluidas desde la activación inicial,
   conforme a las cuatro decisiones ya acordadas. No activar una rama incompleta.
8. Si hay migraciones: alcance y riesgos antes de ejecutarlas, según lo ya acordado
   con el usuario. Entregar pruebas, compatibilidad, SHA y despliegue Railway QA
   exitoso, además de ejemplos de solicitudes y respuestas sin datos privados.

Este documento es un pedido de coordinación frontend. No autoriza desde este
workspace a ejecutar cambios de backend, migraciones o despliegues de Railway.
La ejecución se coordina en el chat backend.

## Evidencia del contrato actual

`src/app/screens/requests/ProcessOrderCard.tsx` mantiene la acción real
«Aceptar pedido» en la rama negocio pendiente, gobernada por
`canAcceptFixedOrder`, productos disponibles y estado del registro.

`src/app/screens/requests/requestProcessApi.ts:13` implementa `acceptFixedOrder`:

```text
POST /request-processes/:id/actions/accept-fixed-order
Authorization: Bearer [sesión del negocio]
Idempotency-Key: [clave existente]
Body: { expectedVersion: process.version, proposalId: process.currentProposalId }
```

El normalizador actual exige una respuesta con:

```text
orderId = pedido solicitado
orderStatus = accepted
requestProcess.id = proceso solicitado
requestProcess.state = COORDINATION_PENDING
requestProcess.version > versión enviada
requestProcess.currentProposalId = propuesta enviada
requestProcess.agreementPublicId = identificador no vacío
requestProcess.allowedActions = [] en el recibo de esta acción
```

No se ejecutó una aceptación real para este diagnóstico. Lo anterior describe
el contrato que construye y valida el código, no una nueva respuesta capturada
de un pedido del usuario.

`src/app/screens/requests/useRequests.ts` aplica el recibo y anuncia
«Pedido aceptado» / «El pedido pasó a Por coordinar. Revisa la autorización de
contacto para continuar por WhatsApp.» La confirmación actual se monta en
`BusinessOrdersTab.tsx` y `OrderActionModal.tsx`.

Backend local revisado: último código funcional S1 `d77b53d`, seguido de cierres
documentales `15519df` y `16bd9cf`. La búsqueda en `C:/dev/zipco-backend-qa/src`
no encuentra `CONFIRM_AVAILABILITY`, `confirm-availability` ni
`AWAITING_CUSTOMER_CONTINUATION`. Esos conceptos aparecen únicamente en la
propuesta de contrato. S1 declara expresamente que no activa disponibilidad,
continuación ni retiro.

## Archivos frontend involucrados al recibir el contrato

- `requests/ProcessOrderCard.tsx`: rama negocio pendiente y acción principal.
- `requests/BusinessOrdersTab.tsx` y `OrderActionModal.tsx`: confirmación anterior.
- `requests/requestProcessApi.ts`, `requestProcess.ts`, `coordinationApi.ts`,
  `useRequests.ts`: DTO, normalización, acciones, versiones y recibos.
- `requests/requestStatusGrouping.ts`, `orderTabs.ts` y `RequestsScreen.tsx`:
  agrupación/selección de estados, cuando backend cierre el contrato.
- Componentes de propuesta y alternativas: adaptación al nuevo recorrido,
  preservando acuerdo exacto, controles de actor y compatibilidad.
- Pantalla 4: elección de camino; Pantalla 5: respuesta del cliente. No basta
  cambiar la etiqueta del botón de Pantalla 3.

## Estado de esta revisión

Solo diagnóstico y este documento. Sin cambios de aplicación, acciones sobre
pedidos, pruebas nuevas, build, commit o publicación. Vercel QA sigue en
`6acb167` READY, con las pantallas 1 y 2 aprobadas. Railway requiere el próximo
bloque coordinado; no se ejecutó ninguna acción allí. `main` y producción intactos.
