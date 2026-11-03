# Cliente · negativa de coordinación guardada · Diseño B

2026-11-02. Clasificación: **solo frontend**, presentación e interacción local.
Alcance: Mis Pedidos → Coordinación → mode declined. El pedido permanece abierto;
la negativa puede proceder del negocio o del propio cliente.

## Integración completa

Cuatro fuentes en src/app/features/requests/cards/customer/whatsapp:

- CustomerCoordinationQuestionCard.tsx: composición declined nueva, pastilla,
  miniatura real, negocio/producto/total; clona el botón del controlador para
  conservar su apertura, desplazamiento y ARIA. Aviso según declinedBySelf mediante
  CustomerDeclinedNote; conserva callbacks y permisos de Ya coordinamos.
- CustomerCoordinationDetail.tsx: recorrido, aviso y acciones visibles; una
  tarjeta de detalle con condiciones, productos múltiples, pasos y opciones reales.
  Options permanece montado en su panel plegable, sin reconstruir sus controles.
- customer-coordination.css y customer-coordination-detail.css: estilos nuevos
  acotados a declined, animaciones, tamaños, foco y movimiento reducido.

Adaptaciones respecto de los archivos entregados:

- Tipado concreto al clonar el botón; selector estable de detalle conservado.
- Una sola cantidad en la miniatura real y especificidad suficiente para el anillo
  de 54 px: la regla compartida de cliente tenía más especificidad que la entrega.
- Área táctil adicional real de Más opciones mediante pseudo-elemento, sin
  confundir un margen negativo con superficie interactiva. Su pliegue queda en
  420 ms, como el detalle y el diseño solicitado.
- Pausa cuando el detalle queda cubierto/idle, además de la pausa de la lista.
- Continuidad de montaje: clave estable del Provider exterior y Provider de nota
  presente también en los otros modos, con null. La entrega cambiaba la estructura
  de Providers al pasar de declined a question y remontaba el controlador de
  WhatsApp antes de completar navegación/holograma. Se reprodujo con el escenario
  real sintético y se corrigió sin modificar el controlador ni su temporización.

Question/confirm conservan su markup visual y ownPending sigue en su composición
de progreso. El wrapper uniforme es una adaptación no visual para conservar el
controlador al cambiar de modo. No quedan dos diseños activos para declined.

## Contrato conservado

Campos existentes: líneas/cantidad/importe, acceptedAt, autorización propia,
allowedActions y negativa/ronda de coordinación. Contextos nuevos son locales de
presentación, no datos de API. Sin campos, headers, endpoints o persistencia nuevos.
Se conservan las lecturas de pedidos, capacidades y acuerdo, y las acciones
existentes de AUTHORIZE_CONTACT, OPEN_WHATSAPP, CONFIRM_WHATSAPP_COORDINATION,
RESPOND_WHATSAPP_COORDINATION, DECLINE_WHATSAPP_COORDINATION, ANNUL_COORDINATION
y REVOKE_CONTACT_CONSENT mediante los controladores originales.

No se tocaron controlador, API, AvailabilityPostActions, ventanas de condiciones,
acuerdo/anulación ni permiso de contacto. No se alteran reserva, retiro local,
estados, permisos, workers, package.json ni index.css. Railway no necesario.

## Verificación y límites

- **90 unitarias aprobadas** reutilizadas: BusinessCoordinationCard,
  processCardVisualFlow y AvailabilityPostActionsView. Sin alterar esos tests.
- **Cuatro escenarios existentes**: declined cliente 393/320, controls cliente
  393 y controls negocio 393. Ventanas, opciones, WhatsApp, holograma y regreso.
  Se adaptaron únicamente selector de Más opciones y aserción de texto del botón,
  que ahora incluye segunda línea. No se cambió el runner ni herramientas comunes.
- **Siete escenarios nuevos** en scripts/check-customer-declined-design.mjs:
  negativa del negocio a 320/390/430 (miniatura real, condiciones, anulación,
  retirar permiso/Volver sin enviar, opciones y detalle inert); negativa propia
  con Ya coordinamos, un solo envío y bloqueo busy; envío incierto con recuperación
  visible sin reintento; negativa del negocio con navegación WhatsApp/regreso;
  movimiento reducido sin animación ni transición del panel.
- Capturas locales revisadas. Sin desborde horizontal; manito activa en cerrado.
- Imports/parse correctos y build QA/PWA aprobado una vez. Advertencia anterior de
  chunk grande. No se afirma tsc independiente: no está configurado en este repo.

El primer intento del caso declined detectó el remonte: recibió el cambio de
estado, pero no completó holograma/navegación. Tras estabilizar Providers pasaron
ambos anchos y el caso de negativa de la contraparte. Se repitieron los casos
afectados por el ajuste de árbol/estilos; no la suite completa.

HTTP y navegación externa simulados y restringidos a localhost. No hay pedidos,
pushes, teléfonos o conversaciones reales. Falta revisión física iPhone/Android.
Las variantes visuales raras descritas por Claude con stubs no se presentan aquí
como verificaciones físicas o pruebas adicionales del repo.

## Memoria, tiempos y publicación

El usuario aprobó el diseño de consulta del negocio QA 8f89b86 antes de este bloque;
eso no sustituye la validación física del rediseño actual del cliente.
Main y producción intactos. El paquete ajeno no rastreado de docs/design-handoffs
se conserva fuera del commit.

Evidencia local ignorada: customer-declined-b-timing.json,
customer-declined-b-unit.json y qa-pilot/customer-declined-design-b/ bajo
node_modules/.cache. Build y validación final corrieron en paralelo; no sumar sus
comandos nuevamente. Las ventanas de pruebas incluyen el diagnóstico/corrección
de continuidad; no son mediciones de rendimiento de la app.
Se completan versión, publicación y tiempos al verificar Vercel QA.
