> Referencia vigente: paquete codex_final2. Implementar sobre el repositorio, sin sobrescribir sus componentes con adjuntos.
> Correcciones de contrato: coordinationAccepted (no decision); conteos calculados en frontend desde listas reales. Falta inicial sigue Por coordinar; RESPOND false vuelve allí; RESPOND true ya estaba y permanece En curso. Ningún contador se altera por reproducir una captura.
> Un envío incierto no puede decir «No se guardó»: conserva la recuperación y el reintento exacto. «Ya coordinamos» abre el detalle; solo una acción autorizada y confirmada cambia la negativa persistida. No se reabre por un marcador local.
> No existe una fecha de autorización en coordination: el paso muestra Confirmada, sin reutilizar acceptedAt/updatedAt. Fotos y detalle usan productPreview ya publicado, nunca customerImage. La tarjeta de disponibilidad normal ya existe y conserva sus correcciones v2.
> Los hologramas de resultado existentes se conservan; no se restaura el antiguo diálogo flotante de pregunta de coordinación. La consulta sigue dentro de su tarjeta. El aviso espera a que termine el holograma y se encola.
> La copia adjunta BusinessCoordinationCard carece del soporte embedded del HEAD actual; se conserva y modifica el archivo del repositorio.

# Tarjeta «Esperando al cliente» tras confirmar disponibilidad · Negocio (maqueta aprobada: variante D) — VERSIÓN v3

> **Corrección v2:** la fuente de verdad ahora son los archivos actuales del repo (carpeta `archivos_actuales_del_repo/`), que ya incluyen mejoras posteriores a la maqueta: plegado animado del detalle (`DetailReveal`/`zipco-avw-reveal`), degradado `zipco-avw-top`/`zipco-avw-bottom`, muescas del ticket con `mask-image` (ya no se usa `--zipco-page-bg`), insignia de cantidad fuera del anillo giratorio, etiqueta «Dónde y cuándo» y compuertas de movimiento (`data-request-motion`). **No sobrescribir esos archivos con versiones anteriores.** Los puntos «A revisar» 1, 2 y 5 de más abajo quedan RESUELTOS por esa versión. Esta tarjeta ahora también puede transformarse en la tarjeta de consulta de coordinación: ver `14_CONSULTA_COORDINACION_NEGOCIO.md`, `15_PANTALLA_CLIENTE_CONSULTA_Y_EN_CURSO.md` y `13_FLUJO_ESTADO_AVISO_Y_CONTADORES.md`.


Referencia visual: `referencia-disponibilidad-esperando.png` (cerrada · abierta con **Retiro en el local** · abierta con **Coordinar por WhatsApp**). Solo aplica al **negocio**.

## Qué resuelve
Mi Negocio → Esperando respuesta → disponibilidad confirmada. Hoy es el `<article className="zipco-aurora-card">` de `AvailabilityFlowCard.tsx` (líneas 72–77): cabecera Aurora, texto fijo, botón «Ver detalle» y, abierto, texto suelto + un botón «Retirar disponibilidad» sin estilo. La tarjeta nueva es más compacta (~100 px cerrada, para listas largas), no tiene botones sueltos y se entiende sola.

## Archivos
**Nuevos:** `requests/AvailabilityWaitingCard.tsx`, `requests/availability-waiting.css` (prefijo `zipco-avw-`).
**Se modifica:** `requests/AvailabilityFlowCard.tsx` (entregado completo sobre la versión que mandaste). Cambios: (1) import nuevo en la línea 15 y se quita el import de `AuroraProposalHeader` (ya no se usa ahí; sigue exportado en `OrderCardAurora.tsx` para otros estados); (2) las líneas 72–77 (rama `<article>` aurora) se reemplazan por `<AvailabilityWaitingCard …/>` (3 líneas).
No se tocan `OrderCardAurora.tsx`, `index.css`, contratos, `useAvailability`, `DesignConfirmation` ni backend. El diálogo «¿Retirar la disponibilidad?» / «La solicitud se conservará en Historial.» sigue siendo el de `AvailabilityFlowCard` (`setDecline(true)`).

## Comportamiento
- **Toda la tarjeta** es el botón de ver/ocultar detalle (un `<button>` que cubre la tarjeta; `aria-expanded`). Antes eran botones chicos. Se quitó la ✕ de la tarjeta cerrada.
- **Pista de toque:** manito con ondas animadas + texto «Ver detalle» / «Ocultar detalle» en el espacio libre bajo el precio (posición absoluta, no suma altura).
- **Miniatura del producto** (anillo girando + ✓ verde + «N×»): sigue usando `ProductPreviewControl` como hoy (abre la vista del producto). Ese control **no debe** abrir/cerrar la tarjeta: el contenedor del anillo tiene `pointer-events:auto` por encima del botón de la tarjeta; si `ProductPreviewControl` ya hace `stopPropagation`, queda igual. Si no hay foto (`customerImage`) se muestra el icono de bolsa; el contador es la suma de cantidades de los productos.
- **Cerrada:** miniatura, nombre, chip «Esperando al cliente», precio con «SOLICITADO» (`data.total`).
- **Abierta (ambos caminos):** «Confirmaste disponibilidad. El cliente debe decidir si continúa.» · chips · productos (cantidad, nombre, total) · divisor tipo ticket · filas «Pedido para» (`data.schedule`) y «Cómo continúan» · nota (si hay) · foto de referencia (`reference`, ya existente) · «Mientras el cliente decide, puedes retirar la disponibilidad.» · botón «Retirar disponibilidad».
- **Retiro en el local** (`plan.path==='LOCAL_PICKUP'`): chip «Retiro en el local» + chip de horario; filas extra «Mensaje» (`plan.customerMessage`) y «Horario» (`plan.scheduleOrAddress`). Cada una solo si trae texto.
- **Coordinar por WhatsApp** (cualquier otro `path`): chip «Coordinar por WhatsApp», icono WhatsApp-style (`MessageCircle`); **sin** Mensaje ni Horario (igual que hoy: solo se muestran en retiro local).
- «Retirar disponibilidad» solo aparece si `availabilityAllowed(process,true,'WITHDRAW_AVAILABILITY')`; deshabilitado mientras `operation.busy`. `error` (bloque «Comprobar pedido») se muestra al final del detalle como hoy.
- `prefers-reduced-motion`: sin animaciones. Pantallas ≤350 px: precio y nombre más chicos, filas con salto de línea.

## Qué NO va (solo maqueta)
El interruptor «Retiro local / WhatsApp» y el botón de reiniciar de la barra superior de la maqueta son de prueba; no se implementan. Las variantes A/B/C/E del tablero se descartaron: solo D.

## A revisar (frontend)
1. **`plan.scheduleOrAddress`:** la maqueta lo muestra como «Horario» («Hasta las 19:00»). Confirmar qué trae realmente en retiro local; si puede ser una dirección, cambiar la etiqueta de la fila a «Dónde y cuándo» y quitar el chip de la cabecera del detalle.
2. **Fondo de las muescas del ticket:** el divisor usa `var(--zipco-page-bg, #f2f4fa)` para simular el recorte. Poner el color real del fondo de la lista de solicitudes.
3. **`ProductPreviewControl`:** verificar que su raíz acepte la contra-rotación (`.zipco-avw-ring>*:first-child`) y que el clic no dispare el toggle de la tarjeta.
4. **Rama de cliente:** esta rama de `AvailabilityFlowCard` era un fallback; si algún estado de cliente sin `plan` puede llegar ahí, mostrará el texto «Confirmaste disponibilidad…» (igual que antes). Revisar con el flujo de estados.
5. Nombre de la clase de fondo: `.zipco-avw` replica el degradado de `.zipco-aurora-card` (`#1c1650→#101434→#0c1a2e`, manchas violeta/turquesa). Si el equipo prefiere reutilizar la clase `zipco-aurora-card` directamente, se puede, quitando esas reglas de `.zipco-avw`.

## Backend

La miniatura y el detalle consumen productPreview ya publicado. No se usa customerImage para un producto ni se solicita persistir otra imagen como parte de este rediseño. Sin imagen se conserva la bolsa neutra y el funcionamiento del pedido.

## Prueba
Negocio con estado de disponibilidad confirmada: retiro en el local y WhatsApp; con y sin `customerMessage`/`scheduleOrAddress`; con y sin nota/foto de referencia; 1 y varios productos; abrir/cerrar tocando cualquier parte de la tarjeta; tocar la miniatura (abre producto, no el detalle); retirar → diálogo → Historial; `busy`/error; ≤350 px; reduced-motion; que la tarjeta del cliente y el flujo «Confirmar disponibilidad» no cambien.
