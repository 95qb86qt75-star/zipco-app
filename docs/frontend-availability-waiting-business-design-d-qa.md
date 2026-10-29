# Negocio: disponibilidad confirmada, tarjeta variante D

2026-10-29. Clasificación: **solo frontend QA**, diseño e interacción local. Se revisaron los cinco archivos aportados desde Downloads, incluida la referencia visual y el documento 12. Se integró la rama nueva mediante cambios puntuales, sin reemplazar indiscriminadamente el archivo del repositorio ni ejecutar la petición documental de cambios backend.

## Resultado y ajustes al paquete

- Nueva tarjeta compacta «Esperando al cliente» para Mi Negocio, después de confirmar disponibilidad. La superficie abre/cierra el detalle mediante botón accesible, con nombre, total solicitado, miniatura, cantidad, indicador confirmado y manito. El retiro queda dentro del detalle.
- Retiro en el local muestra su chip, productos, pedido para, cómo continúan y los textos opcionales. Se confirmó en el formulario existente y el contrato availability-continuation que scheduleOrAddress es texto libre de horario o dirección: se usa **«Dónde y cuándo»** y se omite el chip que lo interpretaba únicamente como hora. No se extraen fechas desde ese texto.
- WhatsApp muestra chip y fila Cómo continúan, sin los campos exclusivos del retiro local. Nota y foto de referencia existentes se conservan.
- Las muescas del ticket son transparentes mediante máscaras en los dos paneles de fondo. Muestran el degradado real de la lista y no requieren adivinar un color fijo ni medir posiciones con JavaScript.
- ProductPreviewControl conserva el producto de la propuesta y su modal con descripción, cantidad, precio unitario y subtotal. El toque no cambia expanded. La miniatura nunca sustituye una foto de producto ausente por customerImage; usa la bolsa. El contador exterior suma las cantidades; con varios productos el modal mantiene el selector existente. No se inventan imágenes.
- El backend de vista previa ya está integrado en este repositorio mediante requestProcess.productPreview y order-product-preview-v1. El comentario del paquete que pide una nueva API de fotos está desactualizado para este workspace: se usan los campos existentes; si el pedido no los trae, funciona el icono neutro.
- Se mantienen allowedActions/WITHDRAW_AVAILABILITY, busy, comprobación de errores y el diálogo existente de retiro. La nueva tarjeta solo se usa con negocio y un plan válido. Un estado inesperado sin plan muestra Actualizar pedido, sin atribuir al cliente que confirmó disponibilidad.
- No se incorporan el interruptor local/WhatsApp ni reiniciar de la maqueta. La decoración respeta reduced-motion y los controles existentes para detener animaciones durante scroll/fuera de pantalla.

## Archivos y contrato

Nuevos `src/app/screens/requests/AvailabilityWaitingCard.tsx` y `availability-waiting.css`; integración en `AvailabilityFlowCard.tsx`. `scripts/check-availability-flow.mjs` actualiza el nombre visible, el estado expandido de la prueba, el paso de horario ya existente y las comprobaciones del rediseño. Esta ficha documenta la entrega.

Campos existentes: customerName, total, products.items (name/quantity/price), needNow/deliveryDate/deliveryTime, note/referencePhoto, requestProcess.availability (path/customerMessage/scheduleOrAddress), allowedActions y productPreview. Las cantidades y precios provienen de datos normalizados. No hay campos, endpoints, estados, permisos, reservas o datos nuevos de servidor. Se conserva el mismo transporte de disponibilidad/retiro y diálogo; no se hace ninguna acción real para verificarlo.

## Validación y publicación

- **1.629 pruebas aprobadas en 126 archivos**, suite completa con --maxWorkers=2.
- **Diez escenarios de navegador aprobados** con checkout, tarjetas y hooks reales y HTTP sintético: retiro local 320/390/430 px; WhatsApp; rechazo sin acuerdo; retiro del negocio; alternativas, contrapropuestas y propuestas finales por ambos caminos. Se comprueban altura compacta, toque físico sobre miniatura, modal sin toggle, precio unitario, abrir desde el nombre, opcionales vacíos, dirección y horario en texto libre, ausencia de filas locales en WhatsApp y ausencia de llamadas API al abrir el producto/detalle. Cero pedidos, notificaciones o mutaciones reales.
- Capturas revisadas en `node_modules/.cache/availability-flow/availability-waiting-pickup-{320,390,430}.png` y `availability-waiting-whatsapp.png`; artefactos locales ignorados, sin datos reales.
- Build QA/PWA aprobado con TEMP/TMP dentro del workspace; el intento inicial con el temporal del perfil falló por permisos al generar PWA y se corrigió usando el directorio autorizado. Advertencia habitual de bundle mayor de 500 kB; no se afirma lint/tsc independiente ni prueba física en teléfonos.
- Publicación exclusivamente desde rama qa mediante git push origin qa y despliegue automático Vercel QA. SHA y Ready se verifican en la entrega final.
- Railway no fue necesario y no se modifica. `main` conserva 8295ab8c6024ab20851ebd371308d2f299b4668f; producción intacta y documentos locales ajenos excluidos. El diagnóstico del clic externo permanece pausado, sin cambios de código de notificaciones.

Pendiente: revisión visual en los celulares actualizados con solicitudes existentes y sus datos disponibles; no se requiere activación o migración backend.

## Ajuste posterior: apertura y cierre suaves

2026-10-29. Solo frontend QA. `AvailabilityWaitingCard.tsx` usa AnimatePresence/motion existentes para desplegar altura automática y desvanecer el detalle: apertura de 320 ms y cierre de 220 ms, sin modificar el estado expandido o las acciones. Cada sección se desmonta al terminar el cierre; mientras sale queda aria-hidden e inert para no recibir foco o clics. Con reduced-motion la duración es cero. `availability-waiting.css` recorta el contenido durante la transición; encabezado y miniatura conservan su comportamiento.

Validación de este ajuste: 37 pruebas focalizadas de contrato/recuperación de disponibilidad y diez escenarios de navegador aprobados. Las nuevas comprobaciones miden alturas intermedias al abrir/cerrar, controles inertes durante la salida, desmontaje final y apertura inmediata con movimiento reducido a 430 px. El build QA/PWA se comprueba antes de publicar; la suite general de 1.629 pertenece al rediseño anterior, no se repite para este ajuste visual. No se afirma prueba física en teléfonos.

Archivos: componente, CSS, `scripts/check-availability-flow.mjs` y esta ficha. Sin campos/endpoints nuevos ni Railway. Se entrega por rama qa y Vercel QA con SHA/Ready en el informe final; main/producción intactos y diagnóstico externo pausado.

## Adaptación solicitada: mismo despliegue de Por coordinar

2026-10-29. Solo frontend QA. Sustituye la transición Motion anterior por las clases existentes `zipco-co-fb` / `zipco-co-fb-in` que usa BusinessCoordinationCard al desplegar «Iniciar coordinación por WhatsApp». Así se comparte exactamente la altura por CSS Grid de 650 ms, cubic-bezier(.65,0,.25,1), desvanecimiento de 350 ms, desplazamiento de -10 px y escala .97, así como su regla reduced-motion. No se modifica la tarjeta de coordinación ni sus estilos globales.

El detalle permanece montado como en la referencia; cerrado ocupa altura cero, queda oculto, aria-hidden e inert, sin aceptar foco o toques. La miniatura y el encabezado permanecen fuera del pliegue y conservan sus funciones. Sin cambios de acciones, datos, campos, endpoints o backend.

Archivos actuales: `AvailabilityWaitingCard.tsx`, `scripts/check-availability-flow.mjs` y esta ficha. Diez escenarios de navegador aprobados, incluyendo alturas intermedias al abrir/cerrar, cierre oculto/inactivo y reduced-motion. Se comprueba build QA/PWA antes de publicar en rama qa/Vercel QA; no se repite la suite general para esta sustitución visual ni se afirma prueba física. Railway no es necesario; main/producción y la pausa del diagnóstico de notificaciones permanecen intactos. SHA y Ready se entregan tras verificar el despliegue.

## Optimización posterior por animación entrecortada en el teléfono

2026-10-29. Solo frontend QA. El usuario reporta que el pliegue compartido se ve pegado. La revisión encuentra dos pliegues de altura simultáneos, transformaciones del texto y máscaras sobre una sección que también contiene fondos desenfocados animados. Es una combinación costosa; no se afirma una causa de rendimiento medida ni FPS del dispositivo.

Se agrupa todo el detalle en **un solo pliegue**, independiente del encabezado de altura fija. La transición local queda en 420 ms con una curva que responde desde el inicio y opacidad de 180 ms, sin transformar/escalar el texto. Los fondos conservan la paleta mediante gradientes estáticos en lugar de capas grandes con blur animado. Las muescas quedan en el contenido interior de tamaño natural que el pliegue recorta; ya no se redimensiona la cabecera con su máscara durante cada fotograma. Se evita el colapso del margen de la primera descripción para no dejar una franja de fondo visible al separar las secciones.

Se conservan controles ocultos/inert, reduced-motion, miniatura independiente, permisos y acciones. Diez escenarios de navegador aprobados, incluyendo una única sección animada, ausencia de capa blur en la cabecera, texto sin transformación, alturas intermedias y cierre accesible. Build QA/PWA verificado antes de publicar. No se repite la suite general ni se declara fluidez física comprobada; queda revisión en el teléfono actualizado.

Archivos: `AvailabilityWaitingCard.tsx`, `availability-waiting.css`, `scripts/check-availability-flow.mjs` y esta ficha. Sin cambios de campos/endpoints, Railway, main, producción o diagnóstico de notificaciones. Publicación únicamente qa → Vercel QA, SHA/Ready comprobados en el informe final.
