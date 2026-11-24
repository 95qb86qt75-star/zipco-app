# Consulta de coordinación del negocio · Diseño B

2026-11-02. Clasificación: solo frontend, presentación e interacción local.
Integra los cinco archivos completos entregados por Claude para la consulta
«¿Coordinación lista por WhatsApp?», incluidos confirmación y espera.
No cambia las transiciones de pedidos ni los permisos del servidor.

## Fuentes y adaptación

En cards/business/coordination, BusinessCoordinationWaitingCard.tsx presenta
pastilla, miniatura real, cliente/productos, total acordado, recorrido y Sí/Falta.
Se conserva el diseño B de declined; BusinessPendingCoordinationDetail y su CSS
no se modifican. El usuario confirmó ese diseño y el regreso desde WhatsApp en
QA 8c2e71c antes de solicitar este siguiente rediseño.

En cards/shared/coordination, InitialCoordinationCardView.tsx usa BusinessAskDetail
únicamente para negocio embebido con el contexto de consulta. Conserva la
composición original para los demás consumidores. El detalle nuevo reúne
condiciones, pasos, autorización, WhatsApp y opciones reales, sin segunda cabecera.
Las ventanas de condiciones, acuerdo y anulación conservan su implementación.
coordination-query.css, coordination-query-motion.css y
coordination-query-responsive.css contienen los nuevos selectores business-ask.
Las reglas anteriores siguen siendo necesarias para otros consumidores.

Adaptaciones de integración:

- Menú de anulación en portal posicionado junto al botón, para evitar el recorte
  por los contenedores del desplegable. Respeta ancestros inert, fase y ventanas;
  Escape devuelve foco, tocar fuera o desplazar el exterior lo cierra. Retirar
  permiso permanece en AvailabilityPostActions, como especificó la entrega.
- BusinessCoordinationCardView pasa el estado de ventana que ya tiene el
  controlador. Es un puente visual adicional de una propiedad, sin cambiar hooks
  ni acciones. Permite que el menú respete la ventana activa.
- El contenido de la consulta se bloquea por ref durante busy. Se verificó inert
  en el navegador; no se infiere su comportamiento solo del atributo JSX vacío.
- Se evita duplicar la cantidad que ya dibuja ProductPreviewControl. Se conservan
  sus controles y la ventana real del producto.
- La pausa del detalle cubierto se aplica con la tarjeta abierta. Un detalle
  plegado no pausa la manito visible en la cabecera cerrada.
- ProcessOrderCard pasa el booleano existente businessContactAuthorized; el tipo
  de props admite authorized opcional. Se ve Aceptado / Contacto / Tu respuesta
  con datos reales. Si falta el dato, se conserva el fallback de dos segmentos.
  No hay campo nuevo ni autorización inferida.
- Se mantienen selectores estables de detalle y Sí/Falta para navegación y pruebas.

El contexto importado desde shared hacia business es un módulo independiente
que solo define createContext; no importa el renderizador shared. No introduce
un ciclo entre estos componentes.

## Validación proporcional

- 90 unitarias aprobadas: BusinessCoordinationCard, processCardVisualFlow y
  AvailabilityPostActionsView. Los dos primeros arneses invocan presentaciones
  fuera del render de React: se adaptó solo su contexto de consulta, manteniendo
  los demás contextos reales. Sin modificar el helper compartido de pruebas.
- Cuatro escenarios existentes: controls negocio, controls cliente, declined
  negocio y ready negocio, a 393 px. Conservan ventanas, permisos y WhatsApp.
- scripts/check-business-ask-design.mjs: seis escenarios con componentes reales.
  Tres tamaños 320/390/430: cerrado/abierto, miniatura, condiciones, menú y foco,
  toque exterior, anulación sin enviar, pliegue inert y Falta/Cancelar sin POST.
  Además primer Sí con envío retenido/inert y un único POST, envío incierto con
  recuperación visible sin reintento automático, y movimiento reducido.
- Capturas locales revisadas. Manito cerrada comprobada en running, tres
  segmentos conectados al consentimiento real. Sin desborde horizontal.
- Imports/parse resueltos. Build QA/PWA aprobado; advertencia preexistente de
  chunk grande. No hay tsc independiente configurado en este repo y no se instaló.

Se repitieron solo los grupos afectados al conectar authorized y tras ajustar
la pausa CSS. El primer fallo unitario correspondía al nuevo useContext en el
arnés superficial, no al navegador; se acotó la simulación al contexto correcto.
El selector inicial de cierre del escenario se adaptó al nombre real de la hoja.
No se sustituyeron condiciones, permisos, controlador ni APIs para aprobar casos.

Transporte y navegación externos simulados y restringidos a localhost; sin
pedidos, pushes ni conversaciones reales. Falta revisión física iPhone/Android.

## Contrato y alcance conservados

Datos existentes: producto/cantidad/total, acceptedAt, allowedActions,
businessContactAuthorized y coordinación/negativa. Acciones conservadas mediante
los controladores existentes: AUTHORIZE_CONTACT, OPEN_WHATSAPP,
CONFIRM_WHATSAPP_COORDINATION, RESPOND_WHATSAPP_COORDINATION,
DECLINE_WHATSAPP_COORDINATION, ANNUL_COORDINATION y REVOKE_CONTACT_CONSENT.
Lecturas existentes de pedidos, capacidades y acuerdo; rutas existentes
/request-processes/:id/... de coordinación. Sin nuevos headers, endpoints,
campos persistidos o reglas comerciales. Railway no necesario.

No se modifican package.json, index.css, controladores, API, workers ni contratos.
Main y producción intactos. El paquete antiguo no rastreado del usuario en
docs/design-handoffs permanece fuera del commit.

## Medición y publicación

Registros locales ignorados: business-ask-timing.json, business-ask-unit.json y
qa-pilot/business-ask-design-b en node_modules/.cache. Las ventanas de validación
incluyen correcciones y esperas; build y navegador corrieron en paralelo.
No son mediciones de FPS/CPU ni se suman dos veces fases concurrentes.
Medición desde primer reloj hasta Vercel success: **11 min 37,51 s**.

| Ventana | Tiempo |
| --- | --- |
| Análisis | 1 min 31,88 s |
| Implementación y preparación inicial | 50,43 s |
| Pruebas, adaptación de arnés y correcciones | 4 min 25,96 s |
| Build, conexión authorized y validación paralela | 2 min 56,41 s |
| Documentación inicial | 46,56 s |
| Commit, push y observación Vercel | 1 min 6,27 s |

Preparación de pruebas y correcciones intercaladas no tienen contador exclusivo;
no se presentan como tiempos de implementación o ejecución pura. Los dos builds
QA/PWA tardaron 25,39 s y 18,54 s dentro de esas ventanas; el segundo corresponde
a la conexión posterior del dato autorizado. No se suman nuevamente.
El cierre documental posterior queda local, sin nuevo push ni despliegue.

Publicado **8f89b86ea92d06c52c765693310bcd04b3eee3a2**, rama qa.
[Vercel success](https://vercel.com/zipco-s-projects/zipco-app/4mDQV7He1SD4LwLcAiyyjk9GDL9i),
verificado por el estado del commit. Alias:
https://zipco-app-git-qa-zipco-s-projects.vercel.app.
El alias tiene autenticación SSO: la revisión visual/táctil acreditada es local,
con componentes reales. Pendiente prueba física de esta versión con el usuario.
