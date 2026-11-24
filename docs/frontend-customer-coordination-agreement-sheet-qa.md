# FIX-CUSTOMER-COORDINATION-AGREEMENT-01

2026-10-24. Clasificación: **solo frontend QA**. Incidente informado en iPhone
cliente, versión 69ac50d: Condiciones aceptadas → Ver acuerdo completo no abre
la hoja actual. Se solicita reutilizar únicamente Acuerdo completo, con el
detalle/nota/foto de la entrega anterior.

## Causa y corrección

BusinessCoordinationCard, compartida entre actores en COORDINATION_PENDING y
COORDINATING, solo montaba AgreementSheet para negocio. El cliente cerraba
Condiciones aceptadas y llamaba al padre para desplegar un AcceptedConditionsPanel
antiguo dentro de la tarjeta. No abría el diálogo esperado.

Ahora ambos actores usan el estado local de hoja 'agree' y el mismo AgreementSheet.
Cliente pasa perspective=customer: Tú pediste, El negocio propuso, Tu
contrapropuesta y quién aceptó desde su perspectiva. Se conserva el orden actual
Detalle de esta propuesta → nota → foto y su resumen de acuerdo inmutable.
Se elimina la ruta de detalle embebido y sus props del padre. La transición
cierra Condiciones aceptadas y deja un único diálogo de acuerdo activo.

Se conserva la apariencia existente del botón/hoja de Condiciones aceptadas del
cliente. No cambia autorizar contacto, WhatsApp, acciones, estados o apertura
dirigida por notificación. Cerrar el acuerdo conserva la tarjeta de coordinación.
Foto abre el visor anidado existente; cerrarla devuelve a la hoja de acuerdo.

## Archivos y contrato

Runtime: src/app/screens/requests/BusinessCoordinationCard.tsx y ProcessOrderCard.tsx.
Verificación: processCardVisualFlow.test.ts y scripts/check-business-progress-r.mjs.
Registro: este documento y frontend-ui-design-catalog.md.

Mismos GET /request-processes/:id/agreement y /request-processes/:id/proposals,
con autorización existente. Sin body nuevo. Se conservan agreementPublicId,
requestProcessId, acceptedProposalId, subjectSnapshot, totalPriceClp, scheduledFor,
confirmedAt y fechas reales de aceptación por actor. Las propuestas mantienen
id, sequence, authorActor y snapshots existentes. La ronda acordada sigue
validándose contra el acuerdo; no se elige arbitrariamente la última propuesta.
Si falla el historial, quedan resumen real y Reintentar mediante GET.
Sin nuevos campos, endpoints, permisos, transiciones, POST ni persistencia.
Railway QA no requiere cambios.

## Validación

**1.286 pruebas / 108 archivos aprobados**. Pruebas de componente actualizadas
para abrir/cerrar la hoja compartida desde el callback de condiciones, verificar
perspectiva y evitar el panel antiguo. Build QA/PWA y git diff --check aprobados;
aviso preexistente de bundle >500 kB. No hay scripts lint/tsc independiente.

Chrome móvil: **28 recorridos** R/V2/cliente coordinación aprobados y **13
regresiones de coordinación, errores y notificaciones** aprobadas: total 41.
Nueve recorridos incorporados: ocho aperturas del cliente por toque CDP real
(360/393 px, dos estados, cuatro rondas aceptadas), foto/cierre/retorno y un
historial fallido con resumen y reintento. Se comprueba un solo diálogo activo,
texto de cliente, ronda acordada correcta, tarjeta retenida y ausencia de POST
al abrir o reintentar. Las regresiones del negocio mantienen su hoja existente.

Solo fixtures sintéticos, HTTPS externo bloqueado; sin pedidos, WhatsApp ni push
reales. Capturas revisadas en node_modules/.cache/business-progress-r.
Emulación Chrome/touch no equivale a una prueba nativa de Safari/iPhone.

## Publicación y pendientes

Código respaldado en GitHub, rama qa:
1423d940e5836d7b895973f587d5d902efc88b31. Vercel QA READY:
dpl_EADcfqcgxMmAo1TvZpPEGpq3opU5. Alias
https://zipco-app-git-qa-zipco-s-projects.vercel.app y SHA exacto comprobados por API.
ProductionBranch sigue main y build global intacto. El cierre documental también
se respalda y publica, con el mismo código funcional ya validado.
Main y producción no fueron modificados. Pendiente confirmar en el iPhone del
usuario que el botón existente abre esta hoja con la versión nueva cargada.
