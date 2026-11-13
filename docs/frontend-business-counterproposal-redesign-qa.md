# Tarjeta y conversación de contrapropuesta — negocio

Fecha: 2026-11-13, America/Santiago. Clasificación: frontend, presentación y
navegación local de confirmaciones existentes. Backend/contrato E205 conservados.

## Archivos integrados

- ProcessOrderCard.tsx: clase/variante solo business y AWAITING_BUSINESS_COUNTER_RESPONSE.
- OrderCardAurora.tsx: variante opcional counter. Sin ella, cabecera anterior idéntica.
- aurora.css: estilos acotados a zipco-aurora-card--bz / zipco-aurora-bz.
- ProposalChat.tsx: businessDesign opcional, por defecto false; línea de tiempo y
  comparación real para negocio sin cambiar cálculo ni ventanas compartidas.
- proposal-chat.css: conserva íntegro el CSS previo del cliente y añade zipco-bz.
- ProposalNegotiation.tsx: presentación negocio, revisión de horario, confirmaciones
  aceptar/rechazar, cabecera Volver y error con Actualizar propuestas.
- ProposalChat.test.ts: dos pruebas significativas de historia/comparación inmutable
  y paridad HTML del cliente al recibir la nueva opción de diseño.

Comparado literalmente: bloque load/execute/efectos/selección de acciones sin cambios.
PendingAlternativeActions.tsx no se modifica: conserva el formulario final Glow e5b9cb3.
Los seis archivos recibidos se integraron completos sobre la versión actual.

## Recorrido y decisiones

La tarjeta informa El cliente respondió con una contrapropuesta. counterKind no
se conecta: el resumen público solo identifica CUSTOMER_COUNTER, no un tipo de
cambio hora/precio. No se inventa un campo ni se hacen nuevas consultas. El chat
sí compara los snapshots autorizados y muestra sus diferencias.

Aceptar contrapropuesta conserva ACCEPT_COUNTER_PROPOSAL. Sí, puedo para ese horario
conserva revisión y PROPOSE_FINAL con oferta renovada; no crea reserva automática.
Rechazar sigue confirmándose mediante REJECT_COUNTER_PROPOSAL y cierra negociación.
El cliente debe aceptar expresamente la final renovada. Los controles reales de
horario/condiciones se reutilizan, incluidos lockMode, monto editable y recuperación.
No se reconstruyen ProductPreviewControl, ventanas del pedido/propuesta ni ofertas.

Ajustes de integración: mostrar también el mensaje propio del negocio entre
comillas en su nueva burbuja (sin modificar cliente); detener blobs decorativos
heredados del botón exterior y limitar su reflejo a dos ciclos. Los nuevos gestos
son finitos y reducir movimiento conserva spinner operativo. Las luces de fondo
de esta variante quedan estáticas. Se comprobó cero animaciones infinitas en la
tarjeta exterior, no se extrapola esto a rendimiento nativo de toda la app.

El coordinador continúa por encima del umbral orientativo de 500 líneas. Se revisa
la excepción para esta entrega: misma unidad de sesión, permisos, envío y recuperación,
sin comprimir ni duplicar código. Los componentes de tarjeta/chat están separados;
extraer el resto del coordinador sería otro bloque, no se mezcla con el diseño.

## Validación proporcional

- 43 unitarias en ProposalChat, proposalContract y proposalApi aprobadas. Nuevas
  pruebas comprueban datos e inmutabilidad y que businessDesign no afecta cliente.
- Chromium con componentes reales y HTTP simulado en 320/390/430: tarjeta, apertura,
  tres entradas de historial, ausencia de desborde, ventana real del pedido/cierre,
  confirmaciones aceptar/rechazar y Volver sin POST. Envíos únicos simulados
  accept-counter-proposal y reject-counter-proposal con estados esperados.
- Reutilizadas cuatro combinaciones FREE/PREPAYMENT × hoy/fecha futura del bloque
  cliente: selección sin POST, nota/contacto, counter sin reserva y revisión/final
  renovada del negocio. Confirma que la rama nueva conserva esos callbacks.
- Capturas locales de tarjeta, chat, aceptar y rechazar. Arnés ignorado:
  node_modules/.cache/prepare-business-proposal-design-test.mjs,
  business-proposal-design-browser.mjs e inline-schedule-browser.mjs.
  El transporte/capacidades se simula; no pedidos, notificaciones ni WhatsApp reales.
- La comprobación de tres anchos se repite tras acotar efectos heredados porque
  cambia el CSS de controles; añade aserción de cero bucles infinitos en tarjeta.
- Build QA/PWA aprobado: Vite 7,58 s, 2412 módulos, diez precaches. No tsc configurado;
  no se declara una comprobación completa de tipos. Diff check final aprobado.
- Pendiente prueba física Android/iPhone, sesiones/backend reales y percepción de
  animaciones nativas. No se declara completo el recorrido real por estas pruebas.

## Contrato, tiempos y publicación

Mismos campos y endpoints de propuestas: GET proposals/reservation-options y
acciones POST accept-counter-proposal, reject-counter-proposal, propose-final,
counter-proposal y accept-proposal; versiones, IDs, consentimientos, oferta e
Idempotency-Key existentes. Sin migración/flags/configuración ni despliegue Railway.
Main permanece 8295ab8c6024ab20851ebd371308d2f299b4668f y producción intacta.

Medición desde inicio instrumentado: análisis/comparación 355 s, integración
inicial 60 s, preparación inicial 90 s. Validación/esperas posteriores 177 s,
incluye ajustes de efectos y build parcialmente en paralelo; no es ejecución CPU
exclusiva y no se suma el build dos veces. Unitarias 1,70 s; Vite 7,58 s más PWA.
Documentación y publicación se registran al cierre. Las lecturas iniciales previas
al cronómetro no están incluidas. No se confunde desarrollo con rendimiento app.

Publicación Vercel QA pendiente de comprobar al escribir este informe.
