# Solicitar otro horario de una propuesta vencida — E205

Fecha: 2026-11-13, America/Santiago. Clasificación: integración frontend de
comportamiento coordinado con backend, publicado por backend en Railway QA e6a1d75.
Contrato: C:/dev/zipco-backend-qa/docs/testing/expired-proposal-simple-schedule-handoff-qa.md,
especialmente secciones 2–6 y 8. No modifica el contrato ni activa configuración.

## Implementación

- ProposalNegotiation.tsx integra la evidencia de RESERVATION_SCHEDULE_EXPIRED
  recibida del servidor, ligada a versión y propuesta concretas. No se concede
  COUNTER por comparar el reloj del teléfono. V3, retiro reservable, sin acuerdo
  ni reserva, BUSINESS_PROPOSAL y permiso COUNTER siguen siendo necesarios.
- ExpiredProposalSchedule.tsx y expired-proposal-schedule.css contienen los
  accesos Lo antes posible / Agendar nueva fecha, revisión y ayuda. Solo horario,
  sin cambiar productos, cantidades o total. Explica el consumo de la única
  contrapropuesta y que rechazar cierra la negociación. Sin bucles decorativos.
- expiredProposalSchedule.ts construye schedule IMMEDIATE o SCHEDULED (Chile),
  conserva precio, compone el mensaje con la nota y guía la renovación del negocio.
  El servidor sigue siendo la autoridad para validar la excepción.
- La intención COUNTER con horario explícito, precio intacto y sin cambios de
  líneas no requiere reservar la oferta vencida. Conserva lectura autorizada
  antes de enviar, UUID por intención, versión/ID, errores y recuperación.
  ACCEPT conserva siempre readReservationOptions y los controles existentes.
- Negocio: Sí, puedo para ese horario abre revisión, condiciones de reserva reales
  y consentimiento propio. Confirmar y enviar utiliza PROPOSE_FINAL; no usa
  ACCEPT_COUNTER_PROPOSAL para heredar términos vencidos. Conserva la alternativa
  de proponer cambios reales y el rechazo con cierre.
- Cliente acepta explícitamente la final con offerId y termsVersion renovados.
  La evidencia de vencimiento anterior no bloquea una propuesta/version distinta.
- proposalScheduleDraft.ts conserva nota, elección y contacto como borrador en
  sessionStorage por usuario/proceso; nunca token, teléfono o aceptación. Solo
  restaura contra historia autorizada que contiene el counter y oferta compatible.
  Si el nuevo plan no permite contacto lo desactiva. No garantiza persistencia al
  cerrar la app/tab ni con almacenamiento inaccesible; no autoriza automáticamente.

Fuentes nuevas: domain/expiredProposalSchedule.ts y su test;
application/proposalScheduleDraft.ts y su test;
forms/proposal/ExpiredProposalSchedule.tsx y su CSS. Conexión canónica en
forms/proposal/ProposalNegotiation.tsx, sin duplicar otra pantalla/formulario.
El coordinador queda en 505 líneas: excepción revisada al umbral orientativo;
los campos, política y almacenamiento están extraídos. Se mantiene un solo
execute para no duplicar recuperación, permisos, fases y envío.

## API y límites

Rutas existentes: GET /request-processes/:id/proposals y reservation-options;
POST actions/counter-proposal, propose-final y accept-proposal. Cabeceras actuales
availability-v3, horario informativo cuando corresponda, JWT e Idempotency-Key.
Campos existentes: expectedVersion, proposalId, confirmationAccepted, schedule,
totalPriceClp, message, customerContactPreference, reservationChoice y fulfillment.
No se agregan campos/endpoints/flags, ni migraciones, ni se modifica Railway.

Fuera del caso admitido conserva flujos normales V1/V2, WhatsApp, reservas ya
creadas y final sin otra contrapropuesta. Ante final vencida sin COUNTER explica
el límite, sin crear pedido, cancelar ni abrir otra ronda.

## Validación y evidencia

- 75 pruebas unitarias, seis archivos: política nueva, borrador aislado, borrador
  alternativo, elección de reserva, transporte y protección de intenciones.
  Reutilizadas porque cambia la selección del preflight y la ruta de envío.
- Chromium local con componentes/controladores reales y HTTP simulado:
  FREE/PREPAYMENT × IMMEDIATE/SCHEDULED, anchos 320/390/430. Toques mediante
  coordenadas y elementFromPoint: error inicial sin POST, nota retenida, counter
  con precio intacto sin reserva, revisión negocio y final, aceptación gratuita
  usando términos nuevos, y borrador restaurado en final. No cambia datos QA.
- Arnés reutilizado en node_modules/.cache/expired-schedule-browser.mjs,
  generador prepare-expired-schedule-test.mjs. Escenarios/capturas locales ignorados.
  Reintentos por errores del fixture: selección de radio ausente, escape de
  selector, capacidad advisory ausente y fecha mock con offset en vez de ISO Z.
  No se alteraron validadores productivos para acomodar el fixture.
- Build QA/PWA final aprobado. El primer intento compiló pero PWA falló por
  EPERM del temporal del sistema; ejecución con permisos necesarios completó PWA.
  Repetido tras cambios reales de borrador/bloqueo final. Sin tsc configurado en
  este repo: Vite transpila, no se presenta como comprobación completa de tipos.
- Pendiente: iPhone/Android físicos, backend real desde los teléfonos y recorrido
  final con pago previo/confirmación de pago. Las pruebas backend E205 constan en
  el contrato, no se reejecutaron desde frontend.

## Tiempos

Análisis inicial sin cronómetro independiente. Tramo instrumentado desde lecturas
hasta unitarias/navegador: aproximadamente 11 minutos; incluye implementación y
preparación/reparaciones del fixture, sin desglose fiable entre ambas. No se
inventan tiempos de fase ausentes. Ejecución unitaria final: 1,14 s; build final
Vite: 6,81 s, más generación PWA/espera. Build y pruebas corrieron parcialmente
en paralelo, por lo que no se suman dos veces. Publicación/documentación se
registran al cierre. Este tiempo de desarrollo no mide rendimiento de la app.

## Publicación

Pendiente al escribir este informe: commit/push frontend y verificación del SHA
en Vercel QA. No hay nueva publicación Railway ni acciones reales de pedido.
Main permanece 8295ab8c6024ab20851ebd371308d2f299b4668f; producción intacta.
