# Estado actual y memoria de continuidad — frontend QA

Actualizado: 2026-11-14, America/Santiago.
Workspace C:/dev/zipco-app-qa, rama qa. Entrada de lectura junto con AGENTS.md.
Este documento consolida avances e identifica evidencias; no cambia contratos
ni convierte pruebas sintéticas en aprobación física.

## Decisiones vigentes

- Corrección del reinicio al desplazar en waiting: animation:none condicionado
  a scroll quitaba/recreaba las entradas. Ahora terminan una vez y solo los
  adornos se pausan conservando su línea de tiempo. Reproducción antes/después:
  24/12 reinicios pasan a cero. Build QA/PWA aprobado; QA 4a1702b, Vercel success.
  [Causa, pruebas y tiempos](frontend-waiting-scroll-animation-fix-qa.md).

- Cliente en espera: variante visual canónica de contrapropuesta enviada,
  avance de cuatro pasos, Ver conversación, Enviada y cambios que pediste.
  Se conservan categorías, negocio y cliente que debe responder; contenido
  visible al pausar y miniatura real ajustada. 97 pruebas, tres anchos y build
  QA/PWA aprobados. QA c829616, Vercel success verificado; celulares pendientes.
  [Evidencias y tiempos](frontend-customer-counter-waiting-design-qa.md).

- Cliente: nueva categoría local En espera para AWAITING_BUSINESS_COUNTER_RESPONSE,
  solo visible con solicitudes; Por responder conserva decisiones del cliente.
  Al quedar vacía tras lectura correcta vuelve a Por responder. Tarjeta: espera
  al negocio y Ver conversación. Negocio/cotizaciones/contratos intactos.
  Pruebas dirigidas, tres anchos de pantalla real y build QA/PWA aprobados;
  QA c58c30c, Vercel success verificado; celulares pendientes.
  [Reglas, fuentes y evidencia](frontend-customer-awaiting-business-qa.md).

- Revisar propuesta negocio: Outfit local 400–800 solo en ventana/pop-up y
  paleta violeta/azul común para aceptación directa y renovación. Textos y
  acciones diferentes conservados; cliente/fuente global intactos. Seis
  escenarios visuales y control cliente aprobados; build QA/PWA aprobado.
  QA 177cab8, Vercel success verificado; celulares pendientes.
  [Fuentes, evidencia y tiempos](frontend-business-review-outfit-qa.md).

- Revisar propuesta del negocio CliU39: historial compacto y cambios solicitados,
  rechazo en pop-up con foco explícito, bloqueos y error recuperable.
  43 pruebas, seis escenarios negocio y control cliente aprobados; build QA/PWA
  aprobado. QA 5fe451a, Vercel success verificado; prueba física pendiente.
  [Evidencias, límites y demoras](frontend-business-review-chat-cliu39-qa.md).

- Contrapropuesta exterior negocio: aurora (3).css y cabecera con ArrowLeftRight;
  círculo 38 px centrado, selector corregido y botón 50 px con flecha finita.
  Tres anchos, reduced-motion, disabled y acceso al chat sin POST aprobados.
  QA e16ea7e, Vercel success verificado; celulares pendientes.
  [Evidencia](frontend-business-counter-circle-qa.md).

- Botón exterior de contrapropuesta del negocio: integrado aurora (1).css;
  elimina capas glossy/desenfoque y resplandor del precio solo en la variante
  business counter. Tres anchos y acceso real al chat sin POST aprobados;
  build QA/PWA aprobado. QA 02100ab, Vercel success; celulares pendientes.
  [Evidencia y tiempos](frontend-business-counter-button-clean-qa.md).

- Corrección visual de Confirmar horario solicitado: calendario en Chile y
  opciones de reserva como tarjetas. Dos archivos de Claude, sin modificar
  carga/envío/cliente. Tres variantes/ancho Chromium aprobadas (FREE, PREPAYMENT,
  IMMEDIATE), monto editable y radios bloqueados conservados; build QA/PWA listo.
  QA `59f92a0`, Vercel success; comprobación física pendiente.
  [Detalle, evidencias y tiempos](frontend-business-schedule-calendar-qa.md).

- Diseño del negocio integrado: tarjeta de contrapropuesta, conversación con
  línea de tiempo y revisiones aceptar/rechazar/renovar horario. Mantiene el
  formulario final Glow y el cliente. Aviso genérico sin inventar counterKind.
  43 unitarias, tres anchos negocio y cuatro recorridos de renovación aprobados;
  build QA/PWA listo. QA `b82d6c7`, Vercel success; celulares físicos pendientes.
  [Detalle y tiempos](frontend-business-counterproposal-redesign-qa.md).

- Proponer alternativa final del negocio ahora selecciona el diseño Glow ya
  aprobado en PendingAlternativeActions. Tres anchos, revisión/envío simulado y
  build QA/PWA aprobados; QA `e5b9cb3`, Vercel success y prueba física pendiente.
  No cambia los archivos que Claude está rediseñando.
  [Detalle](frontend-final-alternative-glow-qa.md).

- Diseño Claude integrado en conversación (CSS) y horario dentro de Aceptar
  propuesta. Seleccionar/Aceptar horario vuelve a confirmación; solo Solicitar
  nuevo horario envía counter. Urgente para hoy usa SCHEDULED, no cambia política
  de cierre. Conserva origen de Volver y refresco seguro de versión. 50 unitarias,
  cuatro recorridos y siete comprobaciones Chromium aprobados; build QA/PWA listo.
  Publicado QA `9d07f3f`, Vercel success del SHA exacto; pruebas físicas pendientes.
  [Detalle y tiempos](frontend-inline-schedule-redesign-qa.md).

- Seguimiento E205: captura física de 59a1242 reveló dos scrolls compitiendo por
  altura y Sí, confirmar obsoleto. Corregido dentro del diálogo canónico con fase
  Elegir nuevo horario, un solo scroll y sin aceptación en esa fase. Cuatro
  escenarios Chromium y build QA/PWA aprobados; QA `345c751`, Vercel success del
  SHA exacto. Comprobación física de esta corrección pendiente.
  [Evidencia y límites](frontend-expired-proposal-schedule-qa.md).

- E205: integrado acceso cliente de nuevo horario tras error de oferta vencida,
  con COUNTER disponible, y negocio Sí, puedo para ese horario mediante final
  renovada. Conserva nota/contacto como borrador y aceptación explícita final.
  Backend QA e6a1d75; sin nuevas rutas/campos/flags. 75 unitarias y cuatro
  recorridos Chromium con HTTP simulado aprobados; frontend QA `59a1242`, Vercel
  success del SHA exacto. Celulares físicos pendientes.
  [Detalle, límites y tiempos](frontend-expired-proposal-schedule-qa.md).

- Botones cliente ajustados directamente a las tres referencias del usuario:
  degradado limpio, check pequeño, Aceptar centrado, importe en cápsula cuando
  existe, revisión violeta sin flecha. Solo dos CSS con selectores zipco-pw/pz;
  sin blobs, brillo grande ni backdrop blur. Tres anchos/toques y build QA/PWA
  aprobados. Publicado QA `cf094ac`, Vercel success del SHA exacto;
  comprobación física pendiente.
  [Detalle y tiempos](frontend-proposal-clean-buttons-qa.md).

- Aceptar propuesta: ReservationChoiceFields variante cards/hideSummary integrada,
  dos opciones con iconos/check y contador Unicode 300. Oferta única en boleto.
  Aviso sin reserva condicional en variante cards y plain (también contrapropuesta).
  Conservados recorte de botones y presupuesto gráfico, sin reintroducir insignias
  duplicadas ni cambiar execute. 18 unitarias, siete grupos Chromium y build QA/PWA
  aprobados. Publicado QA `94ea3ac`, Vercel success del SHA exacto;
  celulares físicos pendientes.
  [Detalle](frontend-proposal-reservation-choice-cards-qa.md).

- Botones de acceso de propuesta del cliente: recorte explícito de las capas de
  vidrio a la píldora y backdrop-filter desactivado solo en esos dos accesos.
  CSS acotado a zipco-pw/proposal-entry-actions, foco interior visible. Tres anchos
  y toques aprobados, build QA/PWA aprobado. Publicado QA `df53aa6`,
  Vercel success del SHA exacto;
  comprobación física del artefacto rectangular pendiente.
  [Detalle y tiempos](frontend-proposal-button-clip-qa.md).

- Propuesta por responder del cliente: tarjeta zipco-pw, conversación/confirmación
  zipco-pz y textos de oferta opcionales solo para cliente. Reserva real y aviso
  sin reserva conservados; oferta no se repite en confirmación. Variante negocio
  y núcleo execute sin cambios. 48 unitarias y recorridos Chromium con HTTP
  simulado aprobados; build QA/PWA aprobado. Publicado QA `23788fc`,
  Vercel success del SHA exacto;
  iPhone/Android físicos pendientes.
  [Integración, límites y tiempos](frontend-customer-proposal-redesign-qa.md).

- Presupuesto decorativo de retiro: CSS acotado a zipco-pickup-c, vidrio estático,
  gestos de dos ciclos y sin sombras/fondos en bucle; conserva pliegue e indicadores
  operativos. En comparación Chromium con doce tarjetas: 21 animaciones infinitas
  (tres fuera de vista) pasan a cero persistentes tras asentarse. 19 unitarias,
  estabilidad y controles de reserva aprobados; build QA/PWA aprobado.
  Publicado QA `8b27afc`, Vercel success del SHA exacto;
  rendimiento físico/captura nativa pendiente.
  [Mediciones y límites](frontend-pickup-decoration-budget-qa.md).

- Causa del bucle reproducida tras la precisión del usuario: afecta a la tarjeta
  ámbar de pago pendiente, no a la verde sin reserva. ReservationFold alternaba
  cut -17/45 px y la tarjeta 574/697 px. Corrección: medidas offset internas,
  límites no negativos y ResizeObserver solo en contenido natural, no en la caja
  recortada que redimensiona. Retirada la mitigación general anterior: vuelve el
  pliegue suave original. 19 unitarias, estabilidad de cinco tarjetas y controles
  de reserva/error aprobados; build QA/PWA aprobado. Publicado QA `e6661a0`,
  Vercel success del SHA exacto;
  comprobación física pendiente. [Detalle](frontend-paid-reservation-fold-fix-qa.md).

- Antecedente, mitigación sustituida por e6661a0: usuario informa parpadeo y movimiento continuo de Solicitudes después
  de abrir una tarjeta de retiro. No reproducido en Chromium aislado ni en
  RequestsScreen con cinco tarjetas. Mitigación frontend: pliegue sin interpolar
  altura en pickup-design=line, fundido conservado, panel sin entrada transformada
  y overflow-anchor:none. 19 unitarias, siete grupos de interacción y dos grupos
  de estabilidad aprobados; build QA/PWA aprobado. Publicado QA `5347e7a`,
  Vercel success del SHA exacto. Pendiente prueba
  física: no atribuir causa confirmada a Safari ni declarar resolución.
  [Evidencia y límites](frontend-pickup-fold-stability-qa.md).

- Retiro sin reserva del cliente: reutiliza la composición verde aprobada con
  arrivalDesign y etiqueta Por orden de llegada junto a Retiro en el local.
  Solo IN_PROGRESS, sin reserva ni modelo listo/recibido, con choice NONE u oferta
  NONE explícita. Conserva los estados y botones históricos; E200 no se modifica.
  19 unitarias, siete grupos Chromium y build QA/PWA aprobados. Publicado QA
  `a405535`, Vercel success del SHA exacto; iPhone pendiente.
  [Detalle y tiempos](frontend-arrival-pickup-qa.md).

- Reserva gratuita confirmada del cliente: tres archivos completos de Claude y
  conexión mínima en CustomerReceiptFlowCardView. Variante solo FREE/CONFIRMED,
  IN_PROGRESS y horario advisory, sin modelo listo/recibido. Boleto real, nota,
  condiciones y contacto/opciones con permisos conservados. 18 pruebas y siete
  grupos Chromium aprobados, build QA/PWA aprobado. Publicado QA `65f95f0`,
  Vercel success del SHA exacto;
  celulares pendientes. [Detalle y tiempos](frontend-confirmed-free-pickup-qa.md).

- Decisión de reserva del cliente con Glow integrada en TSX y CSS propio nuevo:
  nota plegable, oferta real, contacto explícito y pie fijo. Consulta, envío,
  excepciones sin preview y bloqueos preservados. 53 unitarias, 14 grupos del
  diálogo y dos recorridos de AvailabilityFlowCard aprobados; build QA/PWA listo.
  Publicado QA `4920bf3`, Vercel success del SHA exacto; comprobación física
  pendiente. Artefactos limitados por acceso local previo 403.
  [Alcance, diferencias, pruebas y tiempos](frontend-reservation-decision-glow-qa.md).

- Modalidad/instrucciones del negocio con Glow: dos archivos de Claude
  integrados, pie fijo y componentes reales. Mensaje conserva su predeterminado
  opcional; pago previo conserva consentimiento explícito (sin autoactivación).
  73 unitarias, 13 grupos visuales más recorrido completo con HTTP simulado y
  build QA/PWA aprobados. Publicado QA `f90c4b0`, Vercel success del SHA exacto;
  celulares físicos pendientes. Artefactos limitados por acceso local previo 403.
  [Alcance, diferencias, pruebas y tiempos](frontend-business-fulfillment-glow-qa.md).

- Cliente Contraponer · 1 vez reutiliza Glow, con frases propias, cambio y
  mensaje obligatorios, sin exigir cambiar una fecha vigente válida. Una prop exclusivamente
  visual desde ProposalNegotiation; límite y envío intactos. 55 unitarias,
  dos recorridos de contrapropuesta, regresión del negocio y build aprobados.
  Publicado QA `abf6e40`, Vercel success del SHA exacto; iPhone/Android físicos
  pendientes. Artefactos no verificados independientemente por acceso previo 403.
  [Alcance, pruebas y tiempos](frontend-counterproposal-glow-qa.md).

- Corregida la propuesta entrante oculta al mantener seleccionado el resumen
  naranja del cliente: responses omitía las decisiones de propuesta inicial y
  final, aunque Por responder sí las contaba. Incluidas sin cambiar API ni
  navegación. 58 pruebas, dos recorridos de navegador y build QA/PWA aprobados;
  publicado QA `dca1a77`, Vercel success del SHA exacto; prueba física pendiente.
  [Causa, evidencia y tiempos](frontend-live-proposal-response-filter-qa.md).

- Glow ampliado a la alternativa inicial normal del negocio: mismo diseño,
  mensaje y cambio real obligatorios, disponibilidad opcional. Atrasadas
  conservan su regla de nueva hora. Un solo archivo de código modificado;
  22 unitarias, tres recorridos de navegador y build QA/PWA aprobados.
  Publicado QA `faf12a5`, Vercel success del SHA exacto; comprobación física
  pendiente. Verificación independiente de bundle limitada por acceso previo 403.
  [Alcance, pruebas y tiempos](frontend-normal-alternative-glow-qa.md).

- D · Glow: formulario inicial de alternativa del negocio para STILL_NEEDED
  integrado desde tres archivos completos de Claude. Filas inline, atajos de
  Santiago, frases, borrador/foto conservados y revisión/envío/holograma reales.
  84 unitarias, ocho grupos de navegador y build QA/PWA aprobados. Publicado QA
  `578fe17`, Vercel success. Verificación adicional de artefactos bloqueada por
  HTTP 403 del acceso local; iPhone/Android físicos pendientes.
  [Alcance, diferencias, pruebas y tiempos](frontend-late-alternative-glow-qa.md).

- CliU28: consulta «¿Todavía necesitas este pedido?» del cliente integrada desde
  los dos archivos completos de Claude. Diseño acotado a AWAITING_CUSTOMER;
  negocio/STILL_NEEDED y avisos conservados. Mano visible/activa, pausa correcta
  por scroll/fuera de vista, permisos individuales, foco al ocultar y fotos reales.
  106 unitarias y nueve escenarios de navegador aprobados; build QA/PWA aprobado.
  Publicado QA `869cf5f`, [Vercel success](https://vercel.com/zipco-s-projects/zipco-app/BkKM1aD7uxTi5JZuXTRPQoyvKn1v).
  Pendiente comprobación física en iPhone y Android.
  [Fuentes, diferencias y tiempos](frontend-late-customer-query-cliu28-qa.md).

- E200 integrado: retiro local informativo solo cuando backend devuelve
  `localPickupInformation`. Negocio Historial al informar; cliente conserva
  decisión, instrucciones y acuse «Confirmo recepción» de las indicaciones.
  Contadores por participante, cabecera negociada, UUID y recuperación real.
  Reservas, WhatsApp y antiguos conservados; admisión QA no activada por frontend.
  19 suites focalizadas y seis escenarios de navegador aprobados, build QA/PWA
  aprobado. Publicado QA `0dc73c0`, [Vercel success](https://vercel.com/zipco-s-projects/zipco-app/9uUYLsAGytKXdzUt4op7bWf5Q1zs).
  Pendiente actualizar ambos teléfonos, coordinar admisión con backend y probar
  solicitudes nuevas. No se activó `LOCAL_PICKUP_INFORMATION_ENABLED` desde frontend.
  [Contrato integrado, fuentes, límites y tiempos](frontend-local-pickup-information-qa.md).

- Corrección visual CliU27: se retiró la pausa global por detalle cerrado que
  inmovilizaba los adornos visibles. Pruebas de avance temporal aprobadas en
  WhatsApp/retiro, cerrada/abierta y pausa/reanudación por scroll/fuera de vista;
  movimiento reducido conservado. Build QA/PWA aprobado. Publicado QA `7821c38`,
  [Vercel success](https://vercel.com/zipco-s-projects/zipco-app/6Y7Trz7t3zHPT8Y98E3JVygbyiLP).
  Pendiente confirmar movimiento en el celular.
  [Causa y comprobaciones](frontend-availability-waiting-cliu27-qa.md).

- Negocio, disponibilidad confirmada esperando cliente: CliU27 integrado en los
  dos archivos visuales autorizados, único diseño para WhatsApp/retiro, error
  visible plegada y visores/retirada reales. 62 unitarias, ocho escenarios
  específicos y dos regresiones reutilizadas aprobados; build QA/PWA aprobado.
  Publicado QA `1e4d490`, [Vercel success](https://vercel.com/zipco-s-projects/zipco-app/3Dj6uqKnEo5seQg7pyCoRkHUXxi3).
  Pendiente comprobación física en ambos celulares.
  [Alcance, pruebas y tiempos](frontend-availability-waiting-cliu27-qa.md).

- Preparando del negocio: ajuste local de apertura/cierre y arrastre reportados
  como trabados. Una fuente CSS: pliegue sin escala/desplazamiento, mismos 420 ms,
  y adornos/blur/glow pausados durante el arrastre. Cinco escenarios funcionales,
  medición local y build QA/PWA aprobados; no acredita aún fluidez en Android.
  Publicado QA `42dd79d`, [Vercel success](https://vercel.com/zipco-s-projects/zipco-app/Bv9qqo7UKJiJYRBz8Ym72Y6Xdkch).
  [Detalle y mediciones](frontend-business-progress-option-a-qa.md).

- Negocio, producto WhatsApp En curso: opción A de Preparando integrada en cuatro
  fuentes visuales, con deslizador real y efecto de paquete/campana dentro de
  la secuencia existente. 61 unitarias, nueve escenarios nuevos y una regresión
  reutilizada aprobados; build QA/PWA aprobado. Publicado QA `61e0dd9`,
  [Vercel success](https://vercel.com/zipco-s-projects/zipco-app/2Zh9TZcnzjhxHeL8k1fRp61w8Fhn).
  Textos del slider actuales y READY conservados. Pendiente celulares físicos.
  [Alcance, pruebas y tiempos](frontend-business-progress-option-a-qa.md).

- Revisión B·Vidrio contra capturas: pie con Retirar permiso y Anular en una
  fila, destello visible repetido y margen inferior conservado en la fila cerrada.
  Reutiliza render existente sin modificar archivos protegidos. 31 unitarias,
  cuatro escenarios específicos y una regresión de foco aprobados; build QA/PWA
  aprobado. Publicado QA `38632ce`, [Vercel success](https://vercel.com/zipco-s-projects/zipco-app/7NzhQwfd2HqXvr7BDUYkPJybmisM).
  [Detalle](frontend-business-initial-glass-qa.md).

- Negocio, tarjeta inicial de producto por WhatsApp: B·Vidrio integrado con
  cabecera, fila plegada, condiciones, pasos y permisos reales. Tres fuentes
  visuales, sin controladores ni contrato nuevos. 80 unitarias, siete escenarios
  nuevos y dos regresiones reutilizadas aprobados; build QA/PWA aprobado.
  Publicado QA `c08404a`, [Vercel success](https://vercel.com/zipco-s-projects/zipco-app/CMBikJhBbepv8sC1uD3Nmt5rWK83).
  Pendiente celulares físicos.
  [Informe, adaptaciones y tiempos](frontend-business-initial-glass-qa.md).

- Carril WhatsApp: texto Pendiente completo en Esperando y Preparando mediante
  distribución flexible y separadores compactos, CSS acotado a .zipco-wa-w.
  Seis comprobaciones geométricas/táctiles y build QA/PWA aprobados. Publicación
  QA `ca0fcdd` verificada: [Vercel success](https://vercel.com/zipco-s-projects/zipco-app/4ySL5JFktMr3GdZwYzeFiwkNpfVJ).
  [Alcance y tiempos](frontend-whatsapp-rail-fit-qa.md).

- Detalle WhatsApp invisible: reproducido con opacidad cero y animación de
  entrada pausada. Corrección local de zipco-wa-w-rise para conservar contenido
  opaco desde el primer fotograma; efectos y pausas se mantienen. Seis casos
  de navegador y build QA/PWA aprobados. Publicado QA `8ec1fa9`,
  [Vercel success](https://vercel.com/zipco-s-projects/zipco-app/ETo9bJuxaR5kDfbueDPCpKjgHns5).
  [Diagnóstico, corrección y tiempos](frontend-whatsapp-detail-entry-visibility-qa.md).

- WhatsApp del cliente: la misma visual aprobada se aplica también a Preparando.
  Pastilla «PREPARANDO TU PEDIDO», mensaje y carril propios del estado. Solo dos
  fuentes de presentación cambiadas, sin controladores/CSS nuevos. 62 unitarias,
  cuatro casos de navegador y build QA/PWA aprobados. Publicado QA `c1fe89c`,
  [Vercel success](https://vercel.com/zipco-s-projects/zipco-app/DjQEUTLwj6KiWoqbmKpjNdpraTPY).
  [Informe de alcance, pruebas y tiempos](frontend-whatsapp-preparing-parity-qa.md).

- WhatsApp del cliente, primer Sí propio y esperando respuesta del negocio:
  diseño completo recibido de Claude integrado en la composición canónica.
  Cabecera/modalidad, carril real, estado, condiciones, contacto y permisos.
  Controles montados de forma estable al cambiar a preparando. 72 unitarias,
  ocho escenarios nuevos y dos regresiones reutilizadas aprobados; build QA/PWA
  aprobado. Publicado QA `de1d9ea`,
  [Vercel success](https://vercel.com/zipco-s-projects/zipco-app/EuPCS6qW96KANEcvnoJ1sJbuMLd7).
  Pendiente iPhone/Android físicos. [Informe y tiempos](frontend-whatsapp-waiting-design-qa.md).

- Retiro del cliente B Línea integrado solo para reserva PREPAYMENT pendiente
  AWAITING_BUSINESS_CONFIRMATION, oferta advisory y pedido IN_PROGRESS. Cabecera
  «Esperando al negocio», pestañas y reserva real plegable; otras variantes intactas.
  72 unitarias, 18 escenarios de navegador y build QA/PWA aprobados. Publicado QA
  `1a39aea`, [Vercel success](https://vercel.com/zipco-s-projects/zipco-app/HrXERd8FG1jMzSEg2HYrnhEtedhJ).
  Pendiente prueba física. [Informe y tiempos](frontend-pickup-line-design-b-qa.md).

- Cliente, negativa guardada de coordinación: diseño B completo integrado con
  recorrido, aviso según actor, detalle y opciones reales. Se estabilizó el árbol
  de Providers para conservar la redirección WhatsApp al volver a question.
  90 unitarias, cuatro escenarios reutilizados, siete nuevos y build QA/PWA
  aprobados. Publicado QA `801b135`,
  [Vercel success](https://vercel.com/zipco-s-projects/zipco-app/2MBFHR1RcoEjFxSy1CCDQw7b5rhs).
  Pendiente revisión física. Interrupción por límite de uso registrada por separado.
  [Informe y tiempos](frontend-customer-coordination-declined-b-qa.md).

- Consulta del negocio «¿Coordinación lista por WhatsApp?» integrada con diseño B
  completo, detalle único, menú y autorización real en el recorrido. Declined,
  cliente y coordinación inicial conservados. 90 unitarias, cuatro recorridos
  reutilizados, seis nuevos escenarios y build QA/PWA aprobados. Publicado QA
  `8f89b86`, [Vercel success](https://vercel.com/zipco-s-projects/zipco-app/4mDQV7He1SD4LwLcAiyyjk9GDL9i).
  El usuario aprobó visualmente la consulta. Las demás pruebas físicas pendientes
  se conservan. [Informe y tiempos](frontend-business-coordination-question-b-qa.md).

- Negocio, Coordinación pendiente (`declined`): integrado el diseño B completo
  con miniatura real, recorrido compacto y Más opciones flotante. Controladores,
  permisos y ventanas reales conservados. 90 unitarias, seis recorridos existentes,
  cuatro grupos nuevos de interacción y build QA/PWA aprobados. Publicado QA
  `8c2e71c`, [Vercel success](https://vercel.com/zipco-s-projects/zipco-app/DBwFvB8wDP7Wq1ENB7WRudTYEfcu).
  El usuario confirmó el diseño y la reapertura de WhatsApp con regreso a la
  consulta. [Informe y tiempos](frontend-business-coordination-pending-b-qa.md).

- El usuario consideró 280 ms demasiado rápido. Disponible WhatsApp/retiro queda
  en **420 ms**, curva más gradual, opacidad de 220 ms sin espera inicial. Solo
  CSS: tres recorridos reutilizados y build QA/PWA aprobados; publicado QA
  `3a35e3d`, [Vercel success](https://vercel.com/zipco-s-projects/zipco-app/BLVKtizQ3rXyuYhqcpKxh29m4rHu).
  Sustituye la duración de 280 ms del antecedente inferior. Pendiente preferencia
  táctil del usuario en iPhone.
  [Alcance y validación](frontend-available-fold-response-qa.md).

- Ajuste de respuesta de Disponible tras aprobación visual CliU19: pliegue común
  WhatsApp/retiro de 650 a 280 ms, sin retraso inicial de opacidad. Solo CSS, sin
  alterar reservas ni acciones. Cinco escenarios de toque/transición aprobados y
  build QA/PWA; publicado QA `c0754aa`,
  [Vercel success](https://vercel.com/zipco-s-projects/zipco-app/2VssW9jxm9oeG2jrS5X8whYDKa3e).
  Ver [medición y alcance](frontend-available-fold-response-qa.md). Pendiente sensación
  táctil en iPhone; no hay perfil FPS/CPU que acredite la causa del tironeo.

- Disponible de retiro local CliU19 integrado sobre el diseño aprobado WhatsApp:
  nueve variantes, reservas reales y salida/recuperación para LOCAL_PICKUP.
  [Informe, pruebas y medición](frontend-available-pickup-cliu19-qa.md): 97 unitarias,
  17 escenarios sintéticos y build QA/PWA aprobados. Publicado QA `1fd8295`,
  [Vercel success](https://vercel.com/zipco-s-projects/zipco-app/4U1jD3FrtRfMvT1F74jgeeQJr364);
  pendiente revisión física. No se alteraron contratos ni backend.

- Disponible del cliente, camino WhatsApp CliU18: diseño completo integrado con
  componentes reales, plegado accesible, recuperación visible y salida de 900 ms
  conectada después del holograma. Retiro y otras confirmaciones conservados.
  [Informe y tiempos](frontend-available-whatsapp-cliu18-qa.md): 109 unitarias,
  12 escenarios sintéticos y build QA/PWA aprobados. Publicado QA `dcd1deb`,
  [Vercel success](https://vercel.com/zipco-s-projects/zipco-app/A6t58hs9pqY54TT6PuwrtsxRoY1e);
  el usuario aprobó visualmente WhatsApp («quedó espectacular»). No equivale a
  comprobar todos los escenarios funcionales físicos; CliU19 aún requiere revisión.

- Retiro local del cliente CliU17 integrado: cabecera, carril sin cortes y detalle
  completo con pestañas «Cómo retirar» / «Contacto y opciones». Una sola composición,
  componentes de reserva y condiciones reales, controladores sin cambios. Ver
  [alcance, pruebas y límites](frontend-pickup-cliu17-qa.md). 107 unitarias distintas,
  18 escenarios sintéticos y build QA/PWA aprobados. Publicado en QA `604cb93`,
  [Vercel success](https://vercel.com/zipco-s-projects/zipco-app/ErqUFn3f6hTUkqBhCqMpNfyETKkq);
  el usuario confirma que el diseño quedó igual al aprobado. Esta confirmación
  visual no acredita todos los escenarios funcionales reales de reservas/recepción.
  Este bloque sustituye el rediseño de retiro pendiente mencionado en los antecedentes.
  El usuario solicita repetir este método en futuros rediseños; quedó incorporado
  a la política de trabajo y a la regla de entrega/integración visual.

- En cada modificación visual de una tarjeta, consultar la
  [regla de entrega a Claude](frontend-card-visual-handoff-policy.md). Entregar en
  el chat rutas y líneas verificadas, archivos editables/referencia explícitos y
  explicación de qué representa, significado de sus partes, motivo de sus botones,
  instrucciones del participante, estados posteriores y objetivo del rediseño.
  Es una regla documental vigente, no solo un acuerdo del historial.

- Guía de tamaño acordada: procurar hasta 400 líneas por archivo editable y
  revisar responsabilidades al superar 500, con excepciones justificadas. Aplicar
  gradualmente, sin fragmentar flujos coherentes, duplicar diseños ni comprimir
  código. Este cierre es documental: no se movió código ni se desplegó.

- Reorganización global de frontend autorizada el 2026-10-31: 12 capacidades en
  `src/app/features`, vistas y controladores separados, tarjetas y estilos con
  propietarios identificables y sin copias ejecutables en `src/app/screens`.
  Consultar el [mapa de fuentes](../src/app/features/README.md), el
  [mapa de tarjetas](../src/app/features/requests/cards/README.md) y el
  [informe de validación](frontend-feature-organization-2026-10-31.md).
  1.743 unitarias y 35 recorridos de navegador sintéticos aprobados; build QA/PWA
  aprobado. Código publicado en `6f239cad792e593a46576a5b07827e017d7909fc`, rama
  `qa`; GitHub informa [Vercel success](https://vercel.com/zipco-s-projects/zipco-app/4wyL3yhQ73mfEpRMtV8RaLnncfjf).
  No se reintentó la lectura de assets con credenciales ya rechazadas; falta esa
  comprobación autenticada y la revisión física en ambos celulares.
  La reorganización conserva contratos, permisos, recuperación y las ventanas
   reales. Ese bloque no incluía el detalle completo, integrado después en CliU17.

- Usuario confirma coordinación cliente correcta, pero señala detalle antiguo en
  retiro local. [Comparación con el paquete de Claude](frontend-pickup-full-design-handoff-diagnosis-qa.md):
  la entrega no traía cuerpo completo de retiro y pedía conservar el existente.
  Ajustes locales de contraste/toques y tres casos aprobados no equivalen al rediseño
  integral pendiente. Ese diagnóstico precede a la reorganización; incluye ajustes
  locales de contraste y toques ahora incorporados y comprobados en el bloque.

- La [vista aislada inicial](frontend-customer-course-design-preview-qa.md) queda
  como antecedente: el contrato backend ya está publicado y se integró en 2c29b27.
  La corrección de [mezcla CliU15](frontend-cliu15-mixed-design-diagnosis-qa.md)
  comparte ahora el retiro y el detalle entre app y vista local. Esta última sigue
  siendo una simulación sin pedidos reales; no sustituye las pruebas de la app.

- Aplicar [política de trabajo](frontend-qa-working-policy.md): alcance acotado,
  pruebas por dependencias/riesgo, reutilización y medición separada.
- El [diagnóstico de tiempos](frontend-qa-development-time-diagnosis-2026-10-30.md)
  está aceptado como orientación; no es una medición del rendimiento de ZIPCO.
- El [bloque de estabilización](frontend-qa-tools-stabilization-proposal.md)
  fue aprobado como piloto acotado y ejecutado. [Resultados y límites](frontend-qa-tools-pilot-2026-10-30.md).
- El cierre documental 14823df guardó la memoria sin push ni despliegue.
  El siguiente pedido del usuario autoriza el ajuste frontend de scroll al abrir
  Detalle del cliente y su publicación QA. La aprobación del piloto llegó
  después, con alcance separado y sin push/despliegue.
- No tocar C:/dev/zipco-app, main o producción. Mantener las reglas de AGENTS.md.

## Versión publicada frente a memoria local

Publicado QA **3a35e3d692d2fb6bf3b4ace7581c9118e5ce4df2**: punto intermedio
de 420 ms en Disponible, sin espera inicial, curva más gradual y opacidad de
220 ms. Tres escenarios y build aprobados; Vercel success. Solo CSS productivo,
sin API/backend/main/producción. Cierre documental local sin otro despliegue.

Publicado QA **c0754aa3292308b13c8a05740cd7444cd81feb94**: respuesta del detalle
Disponible WhatsApp/retiro de 650 a 280 ms, opacidad sin espera inicial. Solo CSS
productivo; cinco escenarios medidos y build QA/PWA aprobados; Vercel success.
Sin cambios en reservas, contratos, Railway, main o producción. Cierre local sin push.

Publicado QA **1fd8295052e64fcaf23acc600f0e362a42cc62ef**: Disponible de retiro
CliU19 completo, FREE/PREPAYMENT y contratos anteriores, recuperación y salida
compartidas, confirmación de cierre oscura. 97 unitarias, 17 escenarios únicos y
build QA/PWA aprobados; Vercel success. Railway/main/producción sin modificaciones.
El cierre documental posterior queda local, sin otro push.

Publicado QA **dcd1deb0a25b91d532221881b9d6a0af3fff3faa**: Disponible WhatsApp
del cliente, CliU18 completo y conexión de salida/recuperación. 109 unitarias,
12 escenarios sintéticos y build QA/PWA aprobados; Vercel success. API/contratos,
retiro, Railway y producción sin modificaciones. Main conserva `8295ab8`.
Cierre documental posterior local, sin otro push/despliegue.

Publicado QA **604cb939110d0916d4bece610cf20e0c7670fb02**: detalle completo CliU17
de retiro del cliente, pestañas con reserva/condiciones reales y opciones separadas.
107 unitarias distintas, 18 escenarios únicos y build QA/PWA aprobados; Vercel
success. Sin cambios de contrato/backend; diseño confirmado por el usuario,
pendientes flujos funcionales físicos completos y assets autenticados.
El cierre documental posterior queda local, sin otro push/despliegue.

Publicado QA **6f239ca**: reorganización global en doce capacidades y composiciones
canónicas. Mapa vigente en `src/app/features/README.md`. 1.743 unitarias, 35 recorridos
distintos y build QA/PWA aprobados; Vercel success. Se conserva el cuerpo de retiro
vigente, con los ajustes locales previos de contraste y toques. Pendiente revisión
física; no se reabre el diagnóstico del clic externo. El cierre documental posterior
queda local y no genera otro despliegue.

Publicado QA b5f37dd: corrección de mezcla visual observada en 2c29b27. Se elimina la tarjeta antigua
anidada en ownPending y el fallback visual de productos READY sin resumen v2.
Compatibilidad de acciones conservada. Seis escenarios únicos y build QA/PWA aprobados;
GitHub Vercel success. Pendiente revisión física, sin verificación autenticada de assets; ver
[diagnóstico y corrección](frontend-cliu15-mixed-design-diagnosis-qa.md).

Publicado QA 2c29b27: [CliU15 y recepción/finalización v2](frontend-customer-receipt-finalization-cliu15-qa.md),
backend QA 5d09106. Panel y carril en WhatsApp/retiro, recepción abierta y cierre
separados, agrupación de ambos roles, idempotencia y recuperación. Trece escenarios
locales aprobados, build QA/PWA y GitHub Vercel success. Pendiente verificación de
assets autenticados y prueba física. Main conserva 8295ab8; Railway no se modificó.

QA b230cf4: ajuste acotado de [carga de miniatura del cliente](frontend-customer-coordination-thumbnail-loading-qa.md):
el usuario confirma foto visible en el detalle pero no en el círculo. Primera
miniatura de la consulta pasa a eager; resto conserva lazy. 16 unitarias y cinco
escenarios y build QA/PWA aprobados. Push correcto; GitHub comunica Vercel success.
No se atribuye todavía una causa Safari confirmada. Pendiente comprobar la
miniatura en el iPhone y los assets servidos cuando exista acceso Vercel válido.

Commit QA 5e5cd01: [variante B inicial del cliente de Claude](frontend-customer-initial-coordination-variant-b-qa.md).
Tres archivos de diseño adaptados; ventana original de Condiciones aceptadas
preservada y comparada en navegador. 23 unitarias y nueve recorridos focalizados
aprobados y build QA/PWA correcto. Push realizado; GitHub informa Vercel success.
La API Vercel devolvió 403 y el alias exige SSO: SHA/artefactos servidos todavía
no comprobados. No confundir éxito de estado con verificación del alias.
Se conserva el flujo de negocio y la consulta posterior; sin backend.

Entrega anterior para Claude: [prompt reducido del cliente antes del primer acceso WhatsApp](PROMPT_CLAUDE_CLIENTE_INICIAR_COORDINACION.md).
Sus rutas y líneas corresponden a aquella versión. Para una entrega nueva usar el
mapa de fuentes vigente y calcular las líneas del código actual, sin adjuntar copias
históricas de la carpeta de traspaso.
El usuario obtiene dos TSX reales y un CSS global solo de referencia de las
rutas indicadas; Claude devuelve los TSX modificados y un CSS nuevo aislado.
Incluye líneas, lógica, clics y animaciones sin JSON ni carpetas de contexto.
Sustituye para este trabajo al paquete amplio anterior, que queda histórico.
Ese bloque solo preparó el prompt. Después el usuario entregó los tres archivos
de la variante B y autorizó su integración; ver el informe enlazado arriba.

Entrega anterior c5f3c85: [tarjeta fusionada de coordinación del negocio](frontend-business-coordination-fused-card-qa.md).
Conserva el diseño original de Condiciones aceptadas y los pasos inferiores,
sin duplicar identidad/importe/acciones. 21 unitarias y siete recorridos
focalizados aprobados. Build QA/PWA y publicación READY verificados. Pendiente
comprobación física del usuario. No requiere Railway.

Entrega anterior 29641b4: [tarjeta compacta del cliente tras Devolver](frontend-customer-declined-compact-card-qa.md).
Solo presentación; conserva permisos y acciones. 27 unitarias y 10 recorridos
focalizados aprobados. Build QA/PWA y publicación READY comprobados. Falta
prueba física del usuario en iPhone. No requiere Railway.

Última versión con artefactos comprobados por lectura (anterior al push 5e5cd01):

- Frontend c5f3c85dbbaa8b26821b07a908726c6d36d1b2b9, rama qa.
- Vercel dpl_2tsHANn2VRMzhyyXYjyYoon1Sz5e, READY.
- Alias https://zipco-app-git-qa-zipco-s-projects.vercel.app.
- JS /assets/index-BIgUK92l.js; CSS /assets/index-BlCqjNmb.css.
- El piloto no publicó una app; sus herramientas se incorporaron después en
  la entrega funcional autorizada 29641b4. Este cierre documental no publica.

Antecedente anterior al ajuste de Detalle:

- Frontend e367ab6809a203462350beb8f60c60ba66d55f85, rama qa.
- Vercel dpl_9kccSSNGodiPZ1MfwhENtZLuAKFC, READY.
- Alias https://zipco-app-git-qa-zipco-s-projects.vercel.app.
- Bundle /assets/index-CVNPCsaH.js y CSS /assets/index-C0YMgPD1.css comprobados
  por lectura autenticada en la entrega; no se vuelve a consultar por este cierre.
- Backend de acceso compartido: Railway QA dd00391, confirmado por el usuario
  y contrato local. Esta memoria no ejecuta una nueva verificación autenticada.

14823df es exclusivamente documental y no representa otra versión de la app.
Se incorpora como antecedente del siguiente ajuste funcional, sin publicación
documental separada. El SHA de la nueva entrega se identifica por el commit que
introduce [el informe del scroll de Detalle](frontend-customer-coordination-detail-reveal-scroll-qa.md);
su cierre comprueba la publicación QA y entrega el SHA exacto.

## Flujo WhatsApp acordado y aplicado

1. Cliente solicita; negocio confirma disponibilidad y elige el camino.
2. Cliente ve Disponible y decide Sí, continuar con la compra, con su permiso
   propio de contacto. Confirmar disponibilidad no es aceptar por el cliente.
3. Compra aceptada sin primer acceso: tarjeta existente «Ya puedes coordinar
   por WhatsApp» con Iniciar coordinación.
4. Cliente o negocio usa OPEN_WHATSAPP autorizado. Se conserva el holograma
   transitorio de redirección y el destino devuelto por backend.
5. El primer acceso autorizado de cualquiera permite a ambos declarar el
   primer Sí. La consulta «¿Coordinación lista por WhatsApp?» pertenece a la
   tarjeta asociada, no a un holograma flotante ambiguo.
6. Primer Sí pasa a En curso y genera ronda PENDING. La contraparte responde
   Sí/No real; Sí mantiene En curso y No devuelve a Por coordinar.
7. Falta abre Devolver/Cancelar. Cancelar no guarda ni avisa. Devolver antes
   del primer Sí registra la negativa, conserva Por coordinar y avisa al otro;
   la consulta queda cerrada tras recargar, con acceso para coordinar después.

Conservar allowedActions, consentimientos, teléfonos válidos, identidad del
acuerdo, versiones, idempotencia y recuperación. Ni GET, regreso a la app,
marcador local o abrir WhatsApp acreditan mensajes, pago o coordinación.
No inferir una ronda ni confirmationId. Un acceso histórico válido no se
resetea para obtener un diseño nuevo.

Contratos backend de referencia, bajo C:/dev/zipco-backend-qa/docs/testing/:
whatsapp-coordination-confirmation-contract-qa.md,
whatsapp-coordination-initial-decline-contract-qa.md y
whatsapp-shared-access-contract-qa.md. Frontend no los modifica en este cierre.

## Entregas recientes y evidencias

| Código | Alcance y resultado | Evidencia |
| --- | --- | --- |
| 612d059 | Pulso del tercer paso WhatsApp y acabado de Condiciones aceptadas; animación pausada al ocultar/cubrir y con movimiento reducido. | [Informe](frontend-customer-whatsapp-step-pulse-qa.md). |
| 4542d7f | Secuencia antes/después del primer acceso, permisos compartidos, controlador estable para no cortar la redirección. Publicado QA. 1.715 unitarias y 38 escenarios aprobados al cierre; no son cifras de la versión e367ab6. | [Informe](frontend-whatsapp-shared-access-sequence-qa.md). |
| 12c3b97 | Una regla CSS permite toques en el detalle expandido; cerrado conserva inert y disabled. QA READY. Cinco recorridos táctiles del cliente y build aprobados. | [Informe](frontend-coordination-detail-touch-fix-qa.md). |
| Sin commit adicional | Comprobación del negocio en 12c3b97: Condiciones abre/cierra, Anular abre y cancela, Iniciar conserva redirección. Tres estados: consulta, negativa y antes del primer acceso; todo simulado. No se confirmó una anulación real ni una prueba física en Android. | Resultado adicional comunicado al usuario; 2:41 y sin build/despliegue nuevo. |
| e367ab6 | Secuencia fotografiada del cliente: tarjeta original visible/bloqueada y estado compacto; aceptación positiva; Ver enfoca cabecera completa dentro de la lista. Holograma conservado. 35 unitarias focalizadas, 13 recorridos y build aprobados. QA READY. | [Informe](frontend-acceptance-transition-presentation-qa.md). |
| Commit de esta actualización | Al abrir Detalle explícitamente, acomoda suavemente la tarjeta del cliente si el contenido sale de vista. Tres casos táctiles y build aprobados; prueba física posterior pendiente. | [Informe](frontend-customer-coordination-detail-reveal-scroll-qa.md). |

Las fuentes de los diseños del cliente siguen siendo CustomerCoordinationCard.tsx,
CustomerCoordinationDetail.tsx, coordination-v2.css y AvailabilityWaitingCard.tsx.
El flujo se decide en ProcessOrderCard.tsx/WhatsappCoordinationPanel.tsx y sus
hooks. Al pedir rutas para Claude, entregar esos archivos reales y líneas de
la revisión vigente, no solo documentos de diseño o copias de Downloads.

## Confirmaciones y pendientes físicos

- El usuario validó en negocio confirmar disponibilidad, pasar a Esperando
  respuesta y mostrar el aviso inferior Ver con desaparición a los segundos.
  La misma ronda incluye capturas del iPhone en 12c3b97; no se inventa un SHA
  de negocio sin captura independiente.
- El usuario informó un intento exitoso de clic en notificación del sistema
  con iPhone en segundo plano: abrió la tarjeta correspondiente de disponibilidad.
  Es éxito puntual, sin correlación diagnóstica nueva ni estabilidad demostrada.
- Capturas del iPhone en 12c3b97 documentaron guardado como bloque alto vacío,
  holograma correcto, aviso negativo incorrecto y cabecera recortada tras Ver.
  Las correcciones están en e367ab6; su prueba física posterior sigue pendiente.
- La prueba manual del flujo completo continúa. No hay aprobación global de
  todas las pantallas ni de un pase a producción.
- El usuario confirmó posteriormente Iniciar coordinación del cliente, el
  holograma, la salida a WhatsApp y el regreso a la consulta dentro de la tarjeta.
  Después señaló falta de scroll automático al abrir Detalle en Devolver/Cancelar.
  Ese ajuste se documenta en la nueva entrega; no se declara probado físicamente.

## Incidente del clic externo iPhone: pausado, no resuelto

El usuario priorizó pantallas y pidió detener el diagnóstico. No pedir nuevas
pruebas de ese incidente ni enviar avisos artificiales/repetir confirmaciones
para retomarlo sin una indicación posterior.

- El aviso interno funcionó en los casos documentados.
- Con app cerrada, e2a0617b/655efcc v11 acreditó tarjeta y categoría correctas.
- Con app en segundo plano hubo fallos documentados. Ausencia de click-received
  en registros limitados/truncados no demuestra que el handler no se ejecutara.
- No atribuir ACK mismatch a la causa sin correlación, ni culpar a iOS/backend
  por hipótesis. No elegir el último pedido como destino alternativo.
- El éxito puntual más reciente no levanta la pausa ni cierra el incidente.
- Pausa de diagnóstico no implica que un flag se haya desactivado. No cambiar
  worker, payload, flags, suscripciones, Railway o arquitectura nativa por inferencia.

Referencias:
[éxito con app cerrada](frontend-iphone-warm-resume-e2a0617b-qa.md),
[evidencia fbf93e11](frontend-iphone-fbf93e11-entry-correction-qa.md),
[retención f9775db](frontend-f9775db-local-click-evidence-retention-qa.md),
[observación QA v11](frontend-qa-push-observation-v11-qa.md).
Las evidencias saneadas existentes se conservan en docs/evidence; no se copian
fotos de perfil, teléfonos, tokens ni payloads privados a esta memoria.

## Trabajos anteriores conservados en sus informes

Estas referencias preservan el recorrido acumulado. Sus fechas, contratos,
activaciones y límites se leen en cada informe; esta tabla no declara que
todos sus pendientes antiguos sigan abiertos ni que estén resueltos.

| Tema | Referencias |
| --- | --- |
| Fuera de hora y consulta al cliente | [Contrato frontend](frontend-late-initial-response-qa.md), [UI negocio](frontend-late-initial-business-ui-qa.md), [recuperación de propuestas](frontend-late-proposal-pending-recovery-qa.md). |
| Reloj sobre navegación inferior | [Corrección](frontend-late-clock-bottom-nav-qa.md). |
| Propuestas y detalles sin repetición | [Chat](frontend-proposal-chat-qa.md), [espera negocio](frontend-proposal-waiting-business-ui-qa.md), [cliente](frontend-customer-proposal-card-ui-qa.md). |
| Imagen, descripción y precio unitario del producto | [Integración](frontend-order-product-preview-qa.md). |
| Tarjetas desapareciendo ante fallos de lectura | [Recuperación](frontend-orders-transient-read-recovery-qa.md). |
| Horario informativo y compatibilidad de reservas | [Informe](frontend-service-hours-informational-policy-qa.md). |
| Mantener categoría al eliminar | [Corrección cliente](frontend-customer-closure-keep-category-qa.md). |
| Disponibilidad y alternativas | [S2](frontend-availability-continuation-s2-qa.md), [negociación](frontend-alternative-negotiation-qa.md). |
| Reservas de retiro | [V2](frontend-pickup-reservations-v2-qa.md), [V3](frontend-pickup-reservations-v3-qa.md). |
| Diseño de espera y transición suave | [Disponibilidad negocio](frontend-availability-waiting-business-design-d-qa.md), [plegado](frontend-coordination-fold-whatsapp-return-qa.md). |
| Coordinación bilateral y negativa guardada | [Bilateral](frontend-whatsapp-bilateral-coordination-qa.md), [consulta en tarjeta](frontend-coordination-in-card-qa.md). |
| Diseño final del cliente | [Rediseño](frontend-coordination-redesign-v2-qa.md), [ajuste Claude](frontend-claude-coordination-exact-qa.md), [final4](frontend-coordination-final4-qa.md). |

Historial más antiguo: [catálogo UI](frontend-ui-design-catalog.md),
[registro visual](frontend-visual-review-log.md),
[traspaso del 17 de octubre](frontend-qa-handoff-2026-10-17.md) y
[cierre del 19 de octubre](frontend-qa-documentation-closure.md).
Conservar sus notas históricas, sin reutilizar recetas de flags/despliegue
como instrucciones vigentes.

## Diez notas históricas incorporadas al respaldo local

Estaban sin commit al comenzar este cierre. Se conservan sus textos y sus
versiones de referencia; guardar una propuesta antigua no autoriza ejecutarla.
Las expresiones «actual», «pendiente» o «sin commit» son del momento descrito.

1. [Diagnóstico inicial de disponibilidad](diagnostico-nuevo-flujo-disponibilidad-contrato-pendiente.md).
2. [Regreso WhatsApp del cliente](frontend-customer-whatsapp-return-diagnosis-qa.md).
3. [Prompt de confirmación del cliente](frontend-customer-whatsapp-return-prompt-diagnosis-qa.md).
4. [Evidencia a1f6da08](frontend-iphone-system-click-a1f6da08-handoff-qa.md).
5. [Traspaso P3](frontend-p3-backend-handoff-qa.md).
6. [Excepción de retiro fuera de horario](frontend-pickup-outside-hours-exception-diagnostic-qa.md).
7. [Campos de retiro](frontend-required-pickup-fields-handoff-qa.md).
8. [Diagnóstico de notificación de disponibilidad](frontend-whatsapp-availability-notification-click-diagnostic-qa.md).
9. [Mapa de flujo para Claude, revisión histórica](mapa-flujo-pedidos-cliente-negocio-para-claude.md).
10. [Prompt histórico de reservas](prompt-backend-reservas-retiro-analisis-qa.md).

## Próximo trabajo autorizado y lo que requiere decisión

El respaldo documental 14823df quedó guardado localmente y pasa a incluirse
en el siguiente ajuste funcional de Detalle. Aplicar la política de validación/
medición a los ajustes autorizados.
El piloto ya autorizado estabilizó únicamente los dos escenarios indicados y
el verificador QA de lectura. Reutilizarlos según dependencias; cualquier
ampliación requiere definir alcance. No hay push ni publicación de herramientas.
Las pruebas físicas pendientes requieren al usuario y sus teléfonos.
