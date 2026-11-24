# PERF-ACCEPTED-CONDITIONS-01 — Apertura de condiciones sin redimensionar por cuadro

2026-10-22. Clasificación: solo frontend QA.

Reporte: Revisar condiciones se siente lento en la tarjeta del negocio.
Hallazgo en código: `ProcessOrderCard.tsx` animaba altura 0→auto y auto→0 con
Motion/AnimatePresence, desplazando la tarjeta decorada de coordinación en cada
cuadro. `useAgreement` depende del proceso/acuerdo y reintento, no de desplegar;
el clic no inicia por sí solo una lectura nueva. No se atribuye el reporte a
latencia backend ni se afirma una medición física de Android/iPhone.

Cambio: desplegar resuelve la altura final de inmediato y aplica únicamente
opacidad durante 120ms; ocultar retira el detalle inmediatamente. Con movimiento
reducido no hay animación. Conserva el diseño holograma, contenido completo,
fotos, enlace Abrir acuerdo, condiciones aceptadas, controles y estado pendiente
de coordinación. Se aplica al desplegable compartido de ambos actores.

Archivos: `src/app/screens/requests/ProcessOrderCard.tsx`,
`src/styles/index.css`, `scripts/check-order-card-aurora.mjs`, este documento
y el catálogo UI.

Campos/endpoints nuevos: ninguno. La lectura existente del acuerdo y las
acciones de coordinación conservan su contrato. No se cambia useAgreement,
useCoordination, permisos, acciones, datos ni estados del pedido. Railway QA
no fue necesario. Main y producción intactos.

Validación: 87 pruebas aprobadas en cuatro archivos: CoordinationActions,
useCoordination, useAgreement y AgreementRoute. Build QA/PWA aprobado; aviso
de bundle preexistente. Navegador: 234 casos visuales aprobados (320/393/400,
ambos roles/temas y 12 estados). Además, con CPU 4x, tres ciclos de abrir/cerrar
por actor y modo de movimiento: altura estable entre cuadros, animación solo
de opacidad ≤120ms, sin animación en movimiento reducido, controles conservados,
cero lecturas adicionales del acuerdo y cero acciones de pedido. No equivale a
una medición física de rendimiento. El primer intento de esta comprobación
falló al serializar una referencia DOM en el script; corregido el retorno de
la comprobación y repetido satisfactoriamente.

Código respaldado en GitHub `qa`: `7e06f77ba14d01bb686d3aec8f8207882fe67d6c`.
Vercel QA READY `dpl_7pZruktBUgfsPFKbuyaXbpZh2dXh`, SHA y alias habitual
`https://zipco-app-git-qa-zipco-s-projects.vercel.app` comprobados.
Este cierre documental también se respalda y publica en QA.

Pendiente físico: Mi Negocio → Por coordinar → Revisar condiciones/Ocultar
condiciones varias veces en Android e iPhone; comprobar fluidez, contenido y
continuidad del diseño. Reintentos fiables de push siguen pendientes del cierre
general; este cambio no modifica notificaciones.
