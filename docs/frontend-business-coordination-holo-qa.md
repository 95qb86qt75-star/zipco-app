# UI-BUSINESS-COORDINATION-HOLO-01 — Diseño de contacto en Por coordinar

2026-10-22. Clasificación: solo frontend QA.

Antes: panel plano de Coordinación con botones blancos dentro de la tarjeta
del negocio. Después: reutiliza el fondo holograma, cuadrícula, esfera de
WhatsApp, título «Todo listo para coordinar tu pedido», distintivos de
consentimiento y botones de vidrio del diseño de `AcceptAuthorizeCard.tsx`.
Se reutilizan sus clases CSS; no se monta el diálogo de aceptación ni se
vuelve a aceptar un pedido que ya está aceptado.

Alcance: Mi Negocio, estados COORDINATION_PENDING y COORDINATING. No cambia
la presentación del cliente ni las etapas En curso y Listos. El resumen de
producto/precio y las condiciones aceptadas permanecen en la tarjeta exterior.

Acciones conservadas: Autorizar contacto, Coordinar por WhatsApp, comenzar
pedido y anular, únicamente cuando sus validaciones actuales lo permiten.
Conserva mensajes, bloqueo ocupado, consentimiento independiente del cliente,
confirmación de WhatsApp y recuperación de operaciones inciertas.
No copia «Aceptar y autorizar» ni «Solo aceptar» porque esta etapa ya fue aceptada.
Decoraciones estáticas dentro de la lista para evitar bucles que ralenticen
Android/iPhone; el diálogo aprobado de aceptación no cambia.

Archivos: `src/app/screens/requests/CoordinationActions.tsx`,
`src/styles/index.css`, `scripts/check-order-card-aurora.mjs`, este documento
y el catálogo UI.

Contrato existente, sin campos/endpoints nuevos: lectura de `requestProcess.state`,
`allowedActions`, `coordination.customerContactAuthorized` y
`coordination.businessContactAuthorized`; las operaciones existentes conservan
POST `/request-processes/:id/actions/authorize-contact`, `open-whatsapp`,
`start-work` y `annul-coordination`, sus cuerpos/versiones e idempotencia.
No cambia lógica en coordinationApi/useCoordination; Railway QA no fue necesario.

Validación: 104 pruebas existentes de CoordinationActions, coordinationApi y
useCoordination aprobadas. Build QA/PWA aprobado (aviso de bundle preexistente).
Navegador sintético: 234 casos aprobados, anchos 320/393/400, temas claro/oscuro,
ambos roles y 12 estados. Comprueba ausencia de desborde, acciones separadas
y cero animaciones infinitas en el bloque nuevo. Captura revisada en
`node_modules/.cache/order-card-aurora-browser/business-coordination-holo.png`
(evidencia local ignorada por Git). Sin backend real ni acciones reales.
Código y documentación enviados a GitHub, rama `qa`:
`53816b6c716f96a03f485106a52f968e3308b73c`.
Vercel QA READY `dpl_5SfhadYo7z1yRRbLfD1ZJtjuf3Tu`, SHA y alias habitual
`https://zipco-app-git-qa-zipco-s-projects.vercel.app` verificados.
Este cierre documental también se respalda y publica en QA.

Prueba física pendiente: Mi Negocio → Por coordinar en Android e iPhone;
revisar diseño, desplazamiento, autorización propia/cliente, acceso deliberado
a WhatsApp y acciones según permisos. No se ejecutaron acciones sobre pedidos
reales durante la validación automatizada. Main y producción intactos.
