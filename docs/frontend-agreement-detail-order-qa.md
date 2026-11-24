# UI-AGREEMENT-DETAIL-ORDER-01

2026-10-24. Clasificación: **solo frontend QA**. Bastián solicita quitar la
información duplicada en las rondas de Acuerdo completo y ordenar su contenido:
Detalle de esta propuesta → nota → foto de referencia del cliente.

## Resultado

AgreementSheet conserva la cabecera del acuerdo y el encabezado de cada ronda.
Cuando una ronda se abre, retira su resumen intermedio repetido. Su primer
elemento es Detalle de esta propuesta; después vienen el mensaje/nota y la foto.
Cuando se pliega, conserva el resumen breve que permite reconocer esa ronda.

El detalle conserva las líneas originales con cantidad, producto, descripción,
precio por unidad o por línea y subtotal. La disponibilidad de la solicitud
original aparece dentro del detalle, para conservar la fecha de esa ronda.
Las comparaciones anterior → propuesta y Sin cambios pasan al mismo detalle;
no se pierde el historial de cambios. Se mantuvo conserva sus chips existentes.
Foto usa el visor original, con etiqueta del cliente/negocio según perspectiva.

La hoja es compartida: se aplica a ambas partes desde Por coordinar y también
desde las tarjetas En curso/Listos que abren Acuerdo completo. No se modifica
la selección de ronda acordada, la aceptación, la carga ni las acciones.

## Archivos y datos

Runtime: src/app/screens/requests/AgreementSheet.tsx. Comprobaciones existentes
ampliadas: scripts/check-business-progress-r.mjs y check-customer-progress-s.mjs.
Registro: este informe y frontend-ui-design-catalog.md.

Mismo GET /request-processes/:id/proposals y acuerdo ya obtenido con
GET /request-processes/:id/agreement. Se presentan subjectSnapshot.items,
note/proposalMessage, referencePhoto/proposalPhoto y scheduledFor ya disponibles.
acceptedProposalId y el snapshot inmutable siguen validando la ronda acordada.
Sin campos o endpoints nuevos, sin POST, estados ni persistencia nuevos.

## Validación

1.286 pruebas / 108 archivos aprobados. Build QA/PWA aprobado, con aviso
preexistente de bundle >500 kB. git diff --check sin errores. Sin scripts lint
ni tsc independiente configurados.

19 recorridos R/V2 y 20 S/T aprobados en Chrome con datos sintéticos y HTTPS
externo bloqueado. Se comprueba el primer elemento del cuerpo abierto, nota
posterior, ausencia del resumen intermedio y mantenimiento de la ronda aceptada
en las cuatro secuencias de cada perspectiva. Además se verificó específicamente
abrir el detalle de las cuatro rondas aceptadas del negocio, plegar y recuperar
el resumen, y reabrir. Fotos originales sintéticas incluidas; sin datos reales.
Capturas revisadas de la nueva disposición; artefactos locales en
node_modules/.cache/customer-progress-s y business-progress-r.

## Publicación y pendientes

Código respaldado en GitHub, rama qa:
80d200b04eaab7f611332e4091911791354b33eb. Vercel QA READY:
dpl_hwxk9LBzYKypjGzT72A7He413Wj2. Alias
https://zipco-app-git-qa-zipco-s-projects.vercel.app y SHA exacto comprobados por API.
ProductionBranch sigue main y configuración global de build intacta. El cierre
documental también se respalda y publica, con código funcional idéntico.
Railway QA no necesita cambios. Main y producción no fueron modificados.
Pendiente conformidad visual de Bastián con la nueva disposición en teléfono;
las capturas recibidas son la referencia del cambio, no prueba del resultado.
