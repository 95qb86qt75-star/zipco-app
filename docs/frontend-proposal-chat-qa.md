# UI-PROPOSAL-CHAT-01 — Revisar propuesta en burbujas

2026-10-21. Clasificación: solo frontend. Rama qa.

## Antes / Después

Antes: comparación de solicitud original y propuesta vigente mediante fichas.
Después: versiones en orden original, negocio, contrapropuesta y final; propias
a la derecha en violeta, otra parte a la izquierda Aurora. Comparación con la
versión anterior, cambios primero y datos conservados después. Fecha/hora Chile,
turno de respuesta, espera o rechazo/Historial y ayuda de única contrapropuesta.
Conserva aceptar con diseño verde, confirmación exacta y todos los permisos.
Contraproponer/Rechazar quedan en fila; texto completo y marca 1 vez responsive.

Fuente: cuatro archivos entregados en Downloads por Bastián. SHA256:

- ProposalChat.tsx: A3070C039603220CFDEABBC74017287A1349DF0135DA532BD6C2C8CFF55D03EF.
- ProposalNegotiation.tsx: 0625A2FB52C3E7D0BCA82A40D0FD2287DFCCC05E76112213DDF25D26D264D20C.
- index.css.chat-proposal.css: 5F7E338A2F62E11BD1AF7032715608C053796C74198F9F830A8AACB661CE89C1.
- INSTRUCCIONES_CODEX_revisar_propuesta_chat.md: 24FDBD1BF6BECAD50A39F01535D7EAB4426BC369BF53708FCF7CA8AB7C0DDD64.

Adaptación: no copiar a ciegas la agrupación de varios productos del ejemplo.
Conserva descripción, cantidad, precio y subtotal de cada línea; servicios sin
cantidad editable, CUSTOM total de opción y catálogo precio unitario explícitos.
Las propuestas propias conservan detalle plegable; las ajenas lo muestran.
Usa authorActor del contrato, fecha con año y turnos según acciones actuales.
La atribución de foto distingue cliente/negocio; visor anidado Radix con capa
superior para abrir y cerrar dentro del diálogo, sin perder foco/revisión.
Los usos existentes de OrderReferencePhoto conservan valores por defecto.
CSS adaptado a modo oscuro, foco, textos largos y movimiento reducido.

## Archivos y contrato

- src/app/screens/requests/ProposalChat.tsx (nuevo), ProposalChat.test.ts.
- src/app/screens/requests/ProposalNegotiation.tsx (solo presentación y acciones
  reagrupadas; load/execute/AlternativeDraftDialog sin cambios funcionales).
- src/app/screens/requests/OrderReferencePhoto.tsx: textos opcionales/visor anidado.
- src/styles/index.css; scripts/check-alternative-negotiation.mjs.
- Esta ficha y frontend-ui-design-catalog.md.

Sin campos/endpoints nuevos o modificados. Conserva GET
/request-processes/:id/proposals, processContract=alternatives-v1 en listas,
POST /request-processes/:id/actions/:action y carga Cloudinary existente.
Campos leídos: propuestas authorActor, sequence, createdAt, subjectSnapshot,
totalPriceClp, scheduledFor, process/allowedActions/closure. Sin reinterpretar
timestamps. Payload, versiones, propuesta exacta, confirmación, idempotencia,
conflictos y notificaciones existentes intactos. Sin backend ni Railway necesarios.
main y producción no modificados; avances aprobados conservados.

## Validación

1145 pruebas / 98 archivos aprobados. Build QA/PWA aprobado; advertencia existente
de bundle grande, tsc no disponible en dependencias. Cinco pruebas nuevas de
comparación/autor/servicio/varias líneas/CUSTOM/escape/turno/fotos.
21 recorridos Chrome DOM/React/touch sintéticos: cliente y negocio, contrapropuesta
y final, rechazo e historial sin acciones, aceptar, conflicto, error/reintento,
idempotencia, permiso revocado y entrada directa al formulario conservada.
Vista foto anidada: control de cierre por encima del diálogo y retorno a revisión.
320/393 px, claro/oscuro y movimiento reducido. Capturas inspeccionadas.
Sin acceso Backend QA, acciones sobre pedidos reales ni uploads reales.

Pendiente prueba física de diseño en Android/iPhone y conformidad del usuario.
Chrome no acredita Safari/WebKit. Reintentos fiables de notificaciones pendientes.

## Publicación

Código funcional `73800d9896b7cac13ed9eb31dbf9c718b73f0d2d`, enviado a origin/qa.
Preview `dpl_98XWtpgYVhLXAkybnsmvXSq3j9jN` READY y alias habitual
https://zipco-app-git-qa-zipco-s-projects.vercel.app comprobados por API.
GitSource SHA/ref qa exactos. Backend QA confirmado en preflight;
build global null y productionBranch main conservados. Build override:
ZIPCO_QA_LOAD_DIAGNOSTICS=1 ZIPCO_QA_NOTIFICATION_TRACE=0 npm run build -- --mode qa.
Este resultado y catálogo se respaldan en cierre documental y se publican
con idéntico código funcional/opciones QA. Conformidad física aún pendiente.
