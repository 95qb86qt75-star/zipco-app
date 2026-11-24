# Detalle visual del producto — integración frontend QA

Clasificación: frontend + backend coordinados. Backend ya publicado en Railway QA `c6ab2b1ff32ceb85754c466f38aa0b739e40cbc3`; se leyó `C:/dev/zipco-backend-qa/docs/testing/order-product-preview-contract-qa.md`. Esta entrega solo modifica frontend. No necesita activación, migración ni otro despliegue backend.

## Resultado

Miniaturas del producto en tarjetas de negocio y cliente: solicitud inicial/disponibilidad, Fuera de hora, espera de propuesta, coordinación, En curso/Listo e historial. Las cabeceras reutilizan un control común, conservando nombre del participante, total y acciones existentes. La conversación y los detalles de propuestas/acuerdos también permiten consultar su producto propio.

Al tocar una miniatura aparece una hoja con imagen ampliada, nombre, descripción, cantidad, **precio unitario** y **total de ese producto** (subtotal de línea). El total del pedido no se utiliza como precio unitario. Ejemplo probado: cantidad 3, unitario $4.000, subtotal $12.000. CUSTOM con unitario null muestra «No informado»: no divide subtotal por cantidad. Cierre mediante Cerrar, X o Escape; devuelve el foco a la miniatura.

Varias líneas: cada miniatura está vinculada a proposalId + lineIndex y abre su línea; la ventana permite cambiar entre productos de la misma propuesta. Original, alternativa y acuerdo tienen rótulos distintos. No se mezcla la foto del original con texto/precio del reemplazo.

Sin captura histórica, imagen null/rota o metadata inválida: icono neutro o presentación anterior compatible; los detalles y acciones existentes siguen disponibles. Nunca se busca una imagen del catálogo actual para completar pedidos antiguos. Las fotos de referencia del cliente y las adjuntas a la propuesta conservan su función y no se convierten en imágenes de producto. Una alternativa CUSTOM no hereda fotos.

El proveedor visual conserva metadata conocida solo para la misma sesión, proceso y propuesta inmutable cuando un recibo omite el preview. Cambiar la propuesta descarta esa referencia y cierra el producto anterior. La normalización visual inválida no invalida el estado ni los permisos del pedido.

## Contrato utilizado

Campos opcionales `requestProcess.productPreview`, `requestedProductPreview`; `productPreview` de cada propuesta y del acuerdo aceptado. Contrato `order-product-preview-v1`: proposalId, items con lineIndex, catalogItemId, source, name, description, imageUrl, quantity, unitPriceClp y subtotalClp. Preview vigente exige ID vigente; historial/acuerdo se contrastan con su snapshot inmutable (texto, cantidades y precios). URLs de producto se limitan al formato Cloudinary HTTPS que admite backend; si no son válidas se usa el icono neutro.

Endpoints privados actuales: GET `/orders/my-orders`, `/orders/business/:businessId`, `/request-processes/:id`, `/request-processes/:id/proposals` y `/request-processes/:id/agreement`. JWT, query y headers de negociación conservados. Abrir/cerrar el producto no hace llamadas API, crea eventos ni envía acciones. No se envían campos visuales nuevos en la creación ni en POST de acciones. Se mantienen las comprobaciones de recibos, idempotencia, reservas y consentimientos.

Las pruebas de transporte usan HTTP e imágenes SVG sintéticas interceptadas, identificadas como Producto QA. No se leyeron ni mutaron pedidos reales en QA. La prueba física requiere una solicitud creada después de la publicación backend, porque no hay backfill.

## Archivos

- Nuevos: `productPreview.ts` (contrato/normalización), `ProductPreviewControl.tsx` (miniaturas, contexto y hoja), `product-preview.css`, `productPreview.test.ts`, `scripts/check-product-preview.mjs`.
- Datos: `requestProcess.ts`, `proposalContract.ts`, `agreement.ts`.
- Ámbito visual: `ProcessOrderCard.tsx` y `ProcessHistoryCard.tsx`; se mantiene el cuerpo de cada tarjeta bajo un proveedor sin DOM adicional.
- Cabeceras: `LateInitialCard.tsx`, `ProposalWaitingCard.tsx`, `CustomerPendingCard.tsx`, `OrderCardAurora.tsx`, `CoordinationCardShell.tsx`, `ProgressCardShell.tsx`, `availability-design/AvailabilityDesign.tsx`.
- Snapshot propio: `ProposalChat.tsx`, `ProposalNegotiation.tsx`, `AcceptedConditions.tsx`, `CoordinationSheets.tsx`, `AgreementSheet.tsx`.
- `processCardVisualFlow.test.ts`: sus pruebas superficiales inspeccionan el cuerpo de la tarjeta, conservando sus controles de acciones/precios; el proveedor y el portal real se comprueban en navegador.

## Validación

- 1.500 pruebas / 120 archivos aprobados, incluidas 16 nuevas de contrato visual, identidad, metadata inválida y precios.
- 22 escenarios de producto en navegador real con componentes completos y transporte sintético: ambos roles, cinco fases, 320/390/430 px, imagen válida/rota/null, dos líneas, CUSTOM, pedidos antiguos/metadata inválida, historia original/alternativa, retorno del foco/Escape, metadata omitida en recibo y cambio de propuesta sin reutilizar la imagen anterior.
- Regresión de la barra inferior: tres escenarios aprobados con toques por coordenadas y diálogos por encima.
- Build QA/PWA aprobado; permanece el aviso conocido de bundle superior a 500 kB. No se presentan lint/TypeScript independientes como ejecutados.
- 23 regresiones V3 aprobadas: disponibilidad, reservas gratuitas/pagadas, consentimiento, WhatsApp, alternativas/contrapropuestas/propuesta final y recuperación de incertidumbre. La primera ejecución concurrente agotó el tiempo de arranque del navegador sin llegar a montar la app; la repetición aislada aprobó todos los escenarios.

## Publicación y prueba física pendiente

Solo rama qa → integración GitHub/Vercel QA. Actualizar Android e iPhone y crear solicitud nueva desde un producto con imagen y descripción. Elegir cantidad mayor a uno para comprobar unitario frente a subtotal; abrir foto desde ambos roles. En una alternativa comprobar el producto vigente y el original dentro del historial. Pedidos anteriores pueden continuar sin miniatura histórica.

Railway QA no modificado por frontend. Main y producción intactos; los seis documentos locales previos ajenos permanecen fuera de esta entrega.
