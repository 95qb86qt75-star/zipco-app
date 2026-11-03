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
Publicado en rama qa: **801b135ac9c204c6b85131abd509339530874407**.
[Vercel success](https://vercel.com/zipco-s-projects/zipco-app/2MBFHR1RcoEjFxSy1CCDQw7b5rhs),
verificado por el estado del commit. Alias QA:
https://zipco-app-git-qa-zipco-s-projects.vercel.app.
El alias requiere SSO; las pruebas visuales/interactivas acreditadas fueron
locales. Pendiente revisión física del usuario.

| Ventana medida | Tiempo |
| --- | --- |
| Análisis inicial | 1 min 42,57 s |
| Copia/adaptación inicial | 6,24 s |
| Preparación inicial de escenarios | 56,88 s |
| Pruebas y correcciones intercaladas | 2 min 46,92 s |
| Build y validación final paralela | 1 min 56,74 s |
| Reanudación y comprobación del repositorio | 1 min 10,58 s |
| Commit, push y observación Vercel | 1 min 2,64 s |

La copia inicial no representa toda la implementación: el ajuste de continuidad
del Provider se realizó durante la ventana de pruebas. El comando de build QA/PWA
tardó 14,08 s dentro de su ventana, sin sumarlo nuevamente. La documentación no
tuvo medición exclusiva completa: el final inicial se aproxima con la escritura
del informe (22:12:05,877 UTC), no como duración de toda la redacción.

La revisión automática no pudo ejecutarse por límite de uso y bloqueó el primer
git restore; no lo consideró inseguro. Intervalo entre última escritura del informe
y reanudación: **2 h 26 min 3,28 s**, separado como interrupción/revisión no
disponible, no desarrollo ni despliegue. Al continuar se ejecutó la aprobación
normal; sin repetir pruebas/build ya aprobados ni eludir controles.
Tiempo transcurrido excluyendo ese intervalo: **9 min 44,23 s**, con coordinación
y esperas incluidas. Cierre documental posterior local, sin otro push/despliegue.
