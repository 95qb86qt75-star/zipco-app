# Controles del detalle de coordinación — QA

Fecha: 2026-10-30. Rama qa, base 4542d7f. Clasificación: **solo frontend**.

## Causa y cambio acotado

La captura del cliente muestra la consulta cerrada como «Falta coordinar», con el detalle desplegado. El contenedor compartido zipco-avw-reveal impone pointer-events:none. El detalle compacto del cliente heredaba ese valor: los botones parecían habilitados, pero el toque físico alcanzaba el elemento situado detrás.

Se reprodujo antes de corregir: Condiciones aceptadas tenía pointerEvents none y elementFromPoint no devolvía el botón ni uno de sus hijos.

availability-waiting.css agrega una sola regla que permite pointer-events:auto en el cuerpo de coordinación cuando su contenedor inmediato está expandido. No cambia el diseño, handlers, navegación, consentimiento, permisos ni estado del pedido. Los detalles cerrados conservan inert y el bloqueo de interacción; los botones disabled conservan ese estado.

Archivos del bloque:

- src/app/screens/requests/availability-waiting.css.
- scripts/check-coordination-detail-taps.mjs.
- Este informe.

## Validación ajustada al riesgo

- Cinco recorridos focalizados aprobados en Chrome local con Input.dispatchTouchEvent (touchStart/touchEnd) y comprobación de elementFromPoint. No se usa HTMLElement.click() para validar los controles reportados.
- A 393 y 320 px: Condiciones abre/cierra el diálogo, Más opciones despliega/pliega sus controles, Iniciar ejecuta un solo OPEN y conserva la redirección. Se prueba tanto consulta normal como negativa guardada («Falta coordinar»).
- Cerrar detalle lo vuelve inert y sin interacción; ausencia de permiso mantiene Iniciar deshabilitado, sin POST, mientras Condiciones y Más opciones siguen funcionando.
- Build QA/PWA aprobado: 2.313 módulos, precaché generado; advertencia de tamaño del bundle ya conocida.
- No se repitió la suite completa ni los 38 recorridos aprobados del bloque anterior: la fuente productiva cambia exclusivamente una regla CSS. La prueba nueva cubre específicamente el fallo que aquellas verificaciones mediante click por código no detectaban.

Se reutiliza el fixture existente, con componentes y hooks reales, HTTP y destino externos simulados. No se crean pedidos, confirmaciones, mensajes ni pushes reales. Chrome no sustituye una prueba física en Safari/iPhone.

## Contrato y publicación

Sin campos, endpoints, payloads, variables ni permisos nuevos. Los handlers conservan OPEN_WHATSAPP y las consultas existentes de condiciones; el CSS no envía acciones. Railway QA no fue necesario y no se modificó.

Commit de este informe en qa; el cierre entrega su SHA y verifica Ready, alias y artefacto CSS de Vercel QA. El diagnóstico del clic externo del iPhone sigue pausado. Main, C:/dev/zipco-app y producción intactos.

Pendiente: comprobación física en el iPhone tras actualizar frontend QA.

## Medición

Marcas UTC tomadas con reloj de herramientas (hora local: UTC−3):

- Inicio: 21:33:02.
- Diagnóstico inicial identificado: 21:34:11.
- Implementación/preparación de prueba focalizada y reproducción anterior terminadas: 21:37:10.
- Build terminado y comienzo de validación final: 21:37:33.

Los tiempos finales de pruebas y despliegue se entregan al cerrar el bloque, tras comprobar Vercel. Se mide tiempo transcurrido, incluidas esperas de herramientas. La preparación de la nueva prueba táctil consumió más tiempo que el ajuste CSS; no se atribuye esa preparación al servidor.
