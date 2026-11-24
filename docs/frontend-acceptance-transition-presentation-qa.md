# Aceptación del cliente: transición y llegada a Coordinación — QA

Fecha: 2026-10-30. Rama qa, base 12c3b97. Clasificación: **solo frontend**.

## Alcance confirmado por la secuencia de fotos

Cliente pulsa Sí, continuar con la compra, aparece guardado, luego el holograma Solicitud confirmada, resultado transitorio, aviso inferior con Ver y tarjeta de Coordinación.

Se conserva el holograma, el consentimiento, la aceptación real, categorías y estados. Se corrigen presentación del progreso, texto de aceptación y posición de llegada.

## Diagnóstico y corrección

- La reproducción midió 613,28 px antes y durante el guardado: el reemplazo usaba toda la altura expandida como un bloque casi vacío. Ahora la tarjeta original permanece renderizada y bloqueada con inert/aria-hidden, conservando su altura, y el guardado/resultado se presenta en una franja compacta superpuesta. La salida animada se conserva. No se cambia la compra ni se manda otra acción.
- COORDINATION_PENDING tras aceptar se anunciaba como Falta coordinar; el aviso además se sobrescribía con el texto de una negativa. Ahora dice Solicitud confirmada / Ya puedes revisar el contacto e iniciar la coordinación. Solo las negativas reales conservan Sigue/Volvió a Por coordinar y su aviso correspondiente.
- Ver centraba la caja del artículo incluyendo su margen de scroll y podía desplazar el contenedor externo. Ahora alinea su cabecera dentro de data-requests-scroll, reutiliza el espacio inferior existente de la lista y mantiene foco y destello en el pedido concreto. Una sustitución/cambio de tamaño del artículo durante la llegada vuelve a posicionarlo; no recupera el foco si el usuario lo llevó a otro control.

## Archivos

- StatusChangeFlow.tsx: fuente visible bloqueada, resultado compacto y llegada dentro del scroller.
- status-change.css: capa de progreso/resultado, sin modificar los diseños de las tarjetas ni los hologramas.
- statusChangePresentation.ts: texto de aceptación y separación de las negativas.
- requestSummaryScroll.ts: posicionamiento explícito del pedido dentro de la lista.
- statusChangePresentation.test.ts y requestSummaryScroll.test.ts: regresiones de copy, negativas y scroll.

Los anteriores están bajo src/app/screens/requests/.
Nuevo scripts/check-acceptance-presentation.mjs y este informe. Documentos ajenos no rastreados conservados fuera del bloque.

## Validación

- 35 pruebas focalizadas aprobadas: presentación, scroll, recuperación de disponibilidad y aviso inferior. No se repitió la suite completa.
- Tres secuencias completas en navegador: 393/320 px y viewport corto 393×540, con cabecera fija, resúmenes dentro de la lista y margen inferior. Toques por coordenadas para aceptación y Ver.
- Guardado: altura original exactamente conservada, 613,28 px a 393 y 629,38 px a 320; estado compacto de 108/112,27 px, tarjeta original visible e inert.
- Holograma Solicitud confirmada conservado, resultado y aviso positivos, categoría seleccionada mantenida hasta pulsar Ver.
- Ver: cabecera 12 px dentro del scroller, window.scrollY=0, pedido correcto enfocado y resaltado. Tres POST sintéticos en toda la secuencia: crear, confirmar disponibilidad y continuar. Ningún envío adicional para presentar/navegar.
- Diez regresiones existentes aprobadas: retiro local 320/390/430, WhatsApp sin consentimiento, rechazo, retirada y alternativas/contrapropuestas.
- Build QA/PWA aprobado: 2.313 módulos; Vite 8,92 s y precaché generado. Advertencia ya conocida del bundle principal mayor de 500 kB.
- Capturas del guardado y la llegada revisadas. La primera ejecución de la prueba nueva detectó una espera que devolvía un nodo DOM al protocolo de Chrome; se corrigió a booleano. La condición de viewport corto se añadió para cubrir el riesgo de recorte.

HTTP y destinos simulados, componentes/hooks reales. No se crearon pedidos, confirmaciones ni notificaciones reales. No equivale a validación física en iPhone.

## API, publicación y pendientes

Sin campos, endpoints, payloads, flags, permisos ni transiciones nuevos. Continúa usando CONTINUE_REQUEST, CONFIRM_AVAILABILITY, las lecturas existentes y sus recibos verificados. El aviso se deriva del estado confirmado del servidor.

Publicación exclusivamente mediante qa en Vercel QA; el cierre entrega el SHA y verifica Ready y artefactos. Railway no fue necesario y no se modifica.

Main, C:/dev/zipco-app y producción intactos. El fallo del clic externo iPhone sigue pausado. Pendiente: comprobar en el teléfono la secuencia fotografiada con la nueva versión.

## Tiempos

Marcas UTC de herramientas:

- Inicio: 22:08:06.
- Análisis y reproducción inicial terminados: 22:13:16.
- Implementación y preparación de pruebas terminadas: 22:18:01.
- Validación final de pruebas terminada: 22:22:18.

Build ejecutado en paralelo con la validación final: Vite registró 8,92 s; PWA aprobado sin cronómetro separado. Los tiempos de cierre y despliegue se entregan tras comprobar Vercel. El principal costo fue reproducir la secuencia y preparar la prueba con la geometría del scroller, no el despliegue.
