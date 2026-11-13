# Conversación y horario dentro de Aceptar propuesta — integración Claude

Fecha: 2026-11-13, America/Santiago. Clasificación: frontend, presentación y
navegación local sobre contrato E205 existente. Railway QA e6a1d75 no se modifica.

## Alcance y archivos

Integrados completos sobre la versión vigente: forms/proposal/ProposalNegotiation.tsx,
ExpiredProposalSchedule.tsx, expired-proposal-schedule.css y
cards/shared/proposal/proposal-chat.css. ProposalChat.tsx no cambia: el plan plano
y la nota con icono se presentan mediante CSS acotado al cliente zipco-pz.
Agregado ExpiredProposalSchedule.test.ts para fechas/etiquetas en zona Chile.

Aceptar conserva la confirmación de propuesta, reserva, nota y contacto. Tras
RESERVATION_SCHEDULE_EXPIRED se muestra Elegir nuevo horario dentro de esa
confirmación. Seleccionar el horario y Aceptar solo prepara un borrador y vuelve;
el envío ocurre desde Solicitar nuevo horario. Se mantienen los datos y el
producto/total, sin aceptar ni reservar automáticamente.

Volver desde selector regresa a la aceptación. Desde aceptación, si se entró por
Aceptar de la tarjeta, cierra; si se entró desde conversación, vuelve a ella.
Cambiar horario conserva selección. Refrescar la misma versión no cierra ni
sobrescribe lo escrito. Si cambian versión/ID se descarta el horario pendiente
y se exige revisar, sin enviar. Rechazo/errores/actualización siguen accesibles.

El execute completo, payloads, idempotencia y recuperación coinciden con el
original (comparación literal del núcleo). El negocio conserva composición,
renovación de oferta, revisión y confirmación de envío. Sin rutas nuevas.
El coordinador supera el umbral orientativo (565 líneas), revisado: se mantiene
el ciclo único de carga/envío/recuperación durante esta integración; campos y
política están extraídos. No se comprime código ni se duplica controlador. Una
extracción mayor de vistas deberá ser un bloque separado, sin mezclar rediseño.

## Ajustes necesarios respecto a la entrega

- El botón que envía COUNTER_PROPOSAL dice Solicitar nuevo horario, en vez de
  Sí, confirmar: evita confundirlo con la aceptación y conserva texto contractual.
- El latido se limita a dos ciclos, con movimiento reducido; no se agrega un
  efecto permanente. Conserva la entrada/atenuado finitos del diseño.
- Reserva/nota/contacto quedan bloqueados cuando se muestra el resumen pendiente,
  evitando que la nota del payload diverja del mensaje ya revisado.
- Refresco con keepDecision solo conserva borrador si versión y propuesta coinciden;
  no restaura caché sobre ediciones locales durante ese refresco.
- Sin COUNTER disponible, no se ofrece elegir otro horario ni una ronda nueva.
- Fuente del campo nativo declarada correctamente como font-family/font-size/
  font-weight; 16 px explícitos. El shorthand entregado era inválido.

Urgente para hoy es SCHEDULED con fecha sugerida en America/Santiago y hora
elegida; no IMMEDIATE ni prioridad/garantía de atención. El reloj del navegador
solo sugiere fecha; no concede permisos. Servidor y validación de Santiago
existente comprueban futuro. No se añadió rechazo por cierre: con política
informativa no corresponde inventar ese bloqueo. Sigue disponible representación
de IMMEDIATE para propuestas existentes. No hay cambios de contrato/backend.

## API y pruebas

Mismas rutas GET proposals/reservation-options y POST counter-proposal/propose-final/
accept-proposal. Mismos campos expectedVersion, proposalId, confirmationAccepted,
schedule, message, totalPriceClp, customerContactPreference, reservationChoice,
fulfillment y cabeceras de contrato/autenticación/idempotencia.

50 pruebas unitarias en cinco archivos aprobadas: cuatro nuevas para fecha Chile
y etiqueta, más política de vencimiento, borrador, intenciones y transporte.
No se repiten suites generales sin dependencia afectada.

Arnés real reutilizado con HTTP simulado, sin pedidos/push QA ni WhatsApp real:

- Cuatro recorridos FREE/PREPAYMENT × hoy/fecha futura a 320/390/430, toques por
  coordenadas y elementFromPoint. Verifica ausencia de POST al elegir, counter
  único con horario SCHEDULED y nota/contacto correctos, sin reserva creada,
  revisión/final del negocio. Capturas de aceptación, selector y horario preparado.
- Siete comprobaciones: regreso por tarjeta, regreso por chat, fecha pasada sin
  salir, refresco con nota/contacto, regreso selector, movimiento reducido y
  nueva versión sin envío ni horario obsoleto.
- Error del arnés corregido: textarea.disabled no refleja fieldset deshabilitado;
  se usa matches(':disabled'), que comprueba el bloqueo nativo real.
- Scripts locales ignorados: node_modules/.cache/prepare-inline-schedule-test.mjs,
  inline-schedule-browser.mjs, prepare-inline-schedule-edges.mjs y sus capturas.

Build QA/PWA final aprobado: Vite 7,54 s, 2412 módulos y diez precaches. Se repitió
tras el ajuste real de fuente nativa; sin dependencias/configuración nueva.
No hay tsc configurado: build/transpilación no equivale a tipado completo.
Pendiente iPhone/Android físicos, teclado/campos nativos y backend real desde
celulares. El negocio se ejercitó en navegador, no se presume probado físicamente.

## Tiempos y publicación

Análisis 54 s; implementación inicial 70 s; preparación inicial de pruebas 58 s.
El intervalo posterior de validación incluye ejecución, preparación del escenario
de navegación, reparación del fixture y corrección de fuente; no equivale a CPU
ni exclusivamente ejecución. Unitarias finales 0,996 s y build Vite 7,54 s,
con navegador/build parcialmente en paralelo; no se suman dos veces.
Documentación y publicación se registran al cierre. Sin atribuir desarrollo
a rendimiento de la app. No se modificaron main ni producción.

Publicación Vercel QA pendiente de verificación al escribir. Cierre documental
posterior será local sin otro despliegue. Cambio ajeno de handoff conservado.
