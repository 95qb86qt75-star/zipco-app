# Vista aislada del cliente En curso — 2026-10-31

Clasificación: solo frontend, presentación e interacción simulada. El usuario
autorizó preparar el diseño mientras backend define el contrato. No autoriza
conectar acciones nuevas ni desplegar esta vista en la app real.

Se conserva el código de Claude en scripts/qa/previews/customer-course/:
CustomerCoordinationCard.tsx, coordination-v2.css, ReadyBellOverlay.tsx y
StatusSeals.tsx. Las importaciones compartidas apuntan al código real del repo.
index.html, preview.tsx y preview.css constituyen el contenedor aislado. No son
importados por src ni sustituyen componentes de producción.

Abrir con Vite local:
http://localhost:5173/scripts/qa/previews/customer-course/index.html

La cabecera indica datos ficticios. Reiniciar, Simular pedido listo y Simular
error son controles exclusivos de demostración. Recepción y finalización cambian
solo estado React; no hay API, autenticación, persistencia ni pedidos reales.
La ventana del producto usa el componente existente con un producto ficticio sin
imagen. No se modifica Condiciones aceptadas ni la tarjeta real de retiro.

Pendiente de contrato: CONFIRM_RECEIPT integrado actualmente completa el pedido;
el diseño propuesto lo separa de Finalizar solicitud. No se agrega FINALIZE_REQUEST
ni se confunde coordinación confirmada con pedido listo.

Validación reutiliza scripts/qa/browser.mjs, con una comprobación focalizada:
node scripts/check-customer-course-preview.mjs

Tres tamaños aprobados: 320, 393 y 430 px. Toques físicos por coordenadas, detalle,
capa sin variación de altura, contenido posterior inert, recepción con foco en
Finalizar, salida y contadores ficticios. Error/reintento a 393 y movimiento
reducido a 430. Intercepción comprueba cero fetch desde la vista. Chrome local
compila TSX/CSS mediante Vite; no acredita Safari físico ni integración backend.
Capturas y tiempos en node_modules/.cache/qa-pilot/customer-course-preview/.

Primera ejecución: Chrome no inició dentro del sandbox. Reejecución autorizada.
Primera prueba posterior: faltaba habilitar Page para instrumentar fetch; se
corrigió solo el comprobador y se repitieron los tres casos no aprobados.

Tiempos UTC observados (no confundir con rendimiento de app):
- Inicio lectura: 15:56:36. Análisis y preparación inicial de archivos hasta
  15:58:38: 2 min 02 s, incluyendo espera de shell; no hay desglose más preciso.
- Implementación del contenedor: 15:58:38–15:59:22, 44 s.
- Preparación final del comprobador y ejecución/reparación hasta 16:01:29:
  2 min 07 s; no se midieron subfases por separado. La última ejecución tiene
  su propio timing.json. No sumar esperas concurrentes de shell dos veces.
- Documentación y entrega comienzan después de las comprobaciones; duración
  final no medida por separado.
- Build de app: no ejecutado, alcance exclusivo de vista Vite fuera de src.
- Publicación: no ejecutada ni autorizada en este bloque aislado.

Rama qa; sin commit nuevo para este bloque. Sin cambios en Railway, contratos,
main, producción o código funcional de src. La carpeta de handoff preexistente
del usuario queda intacta. Pendiente revisar diseño y acordar contrato backend.

## Corrección de alcance visual — ambas variantes

El usuario aclaró que la referencia incluye WhatsApp y retiro local. Se añade
la segunda tarjeta clara a la misma vista aislada, reutilizando StatusSeals y
ReadyBellOverlay, con estado local independiente. Muestra Tú Aceptaste y
Negocio Preparando, detalle ilustrativo, simulación de listo/recepción/cierre.
No reemplaza la tarjeta real de retiro ni su ventana de condiciones aceptadas.
Los controles de simulación están identificados como tales.

Se amplió la comprobación para ambas variantes en los tres anchos: el cambio
del contenedor justifica repetir el recorrido ya existente. Se comprueban el
detalle y las acciones del retiro por coordenadas, altura invariable al
mostrar la capa y cero llamadas fetch. No se ejecuta otro build ni despliegue.

Medición UTC adicional: análisis a las 16:07:09; implementación y preparación
del comprobador terminadas antes de 16:07:54 (intervalo combinado de 45 s, sin
desglose más fino). La ejecución termina después de 16:08:20; su timing.json
contiene la duración de navegador. Documentación posterior sin cronómetro propio.

## Identificación y detalle en la capa

Se añade al modelo exclusivamente presentacional de la demo un resumen ficticio
con negocio, producto, cantidad y precio unitario. La capa muestra la identidad
y Ver detalle del pedido. Abre un diálogo Radix existente como dependencia, con
foco contenido y retorno al enlace al cerrar. No confirma recepción, no cambia
el paso y no cierra la solicitud. Ambas variantes lo usan; no se altera src.
Se reserva la misma altura antes y después de la capa para alojar ambos controles
con objetivos táctiles de 44 px. Ese cambio implica una tarjeta demo más alta.

Se repiten los tres anchos por modificación de layout de la capa compartida y
se agrega abrir/cerrar detalle para ambas variantes, comprobando paso intacto,
retorno de foco y precio unitario. Se mantiene cero llamadas fetch.
Inicio adicional UTC 16:13:06; tres anchos aprobados al cierre posterior a
16:14:34. Desglose fino de análisis/implementación/preparación no
medido en este ajuste; ejecución registrada en timing.json. Sin build ni despliegue.
