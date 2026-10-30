# Tarjeta de coordinación y aviso inferior — archivos de Claude

Fecha: 2026-10-30. Base: 65c74d5. Rama: qa.
**Clasificación: solo frontend.** Se utilizan los siete archivos adjuntos de Downloads como fuente del diseño. El contrato existente ya cubre las acciones; no se requiere backend.

## Implementación

- CustomerCoordinationCard.tsx y CustomerCoordinationDetail.tsx adoptan la banda/bandrow, tamaños, anillo, identidad/precio, estado de guardado, chip Coordinando en la fila del producto y plegado de Más opciones de los adjuntos.
- coordination-v2.css se copia del archivo adjunto normalizando únicamente los finales de línea/BOM. No se vuelve a dibujar la tarjeta desde una descripción.
- StatusToast.tsx se monta una vez en el layout raíz App.renderWithToast. StatusChangeHost conserva la comprobación del recibo/lectura actual, espera de hologramas y final del plegado; ahora conecta ese resultado al aviso global.
- Un aviso nuevo reemplaza al anterior. No se mantiene la cola anterior. El aviso dura aproximadamente 4,5 segundos, incluye Ver, cerrar y la barra temporal del diseño suministrado.
- Ver mantiene el destino concreto del recibo verificado, abre su categoría, hace scroll/foco y marca data-arrived en el artículo de ese pedido durante 2,4 segundos.
- useChipBump y RequestStatusTab usan las animaciones suministradas y los valores reales. Carga inicial, desconocidos y cifras iguales no producen chispeo.
- El guardado de coordinación permanece visible dentro de la tarjeta, con sus controles bloqueados. El resultado y el aviso solo aparecen después de comprobar el estado autorizado; los errores/lecturas inciertas conservan su recuperación y no generan un aviso de éxito.

## Adaptaciones necesarias

- Autorizada muestra Confirmada: no existe fecha de autorización en los campos actuales y no se reutiliza la fecha de aceptación.
- Los identificadores de Más opciones incluyen el requestProcessId; varias tarjetas no comparten el mismo id.
- Retirar mi permiso de contacto ya existe en AvailabilityPostActions y permanece en Más opciones con su confirmación, consentimiento y permisos originales. No se inventa otra API.
- Negocio avisado se reserva a una negativa propia derivada del resumen real; una negativa recibida de la otra parte muestra Falta coordinar.
- Se conserva el texto legal previo en las opciones y la independencia de ProductPreviewControl.
- Se mantienen controles táctiles de 44 px, safe area y espacio sobre la navegación. El CSS del aviso queda limitado a sus chips para no animar otros elementos que tengan data-bump.
- Los imports StatusToast.tsx/statusToast.ts usan extensión explícita para resolver correctamente ambos nombres en Windows.
- La presentación global se aísla por sesión y contexto. Un temporizador o cierre antiguo no puede ocultar el aviso que lo reemplazó.

## API, campos y reglas

Sin cambios de campos, endpoints, headers, estados ni transiciones.

Se conservan GET /orders/my-orders, /orders/business/:businessId, /request-process-capabilities y el acuerdo; POST de CONFIRM_WHATSAPP_COORDINATION, RESPOND_WHATSAPP_COORDINATION y DECLINE_WHATSAPP_COORDINATION, además de las acciones existentes de contacto, anulación y disponibilidad.

Se consumen requestProcess.state/version/allowedActions, whatsappCoordination (initiatedBy/respondedBy/status), whatsappCoordinationInitialDecline, coordinación/consentimientos, acuerdo aceptado y productPreview. expectedVersion, Idempotency-Key, confirmationAccepted, coordinationAccepted, confirmationId y las cabeceras de los contratos existentes permanecen intactos.

declinedBySelf es únicamente una propiedad derivada de presentación; no se agrega al servidor. statusToast.ts contiene memoria local de UI, no persistencia ni eventos de servidor.

## Archivos del bloque

- src/app/App.tsx.
- src/app/screens/requests/CustomerCoordinationCard.tsx, CustomerCoordinationDetail.tsx y coordination-v2.css.
- Nuevos: statusToast.ts, StatusToast.tsx, status-toast.css y statusToast.test.ts.
- Integración: StatusChangeFlow.tsx, statusChangePresentation.ts, status-change.css, RequestStatusTab.tsx, useChipBump.ts, AvailabilityWaitingCard.tsx, WhatsappCoordinationPanel.tsx y useCoordination.ts.
- Prueba de reemplazo: statusChangePresentation.test.ts.
- Fixtures locales: scripts/check-coordination-inline.mjs y scripts/check-availability-status-flow.mjs.

Los diez documentos ajenos no rastreados permanecen fuera del commit. Los adjuntos originales no se modifican.

## Verificación

- Suite existente: **1709 pruebas aprobadas en 129 archivos**.
- Archivo nuevo statusToast.test.ts: **3 pruebas adicionales aprobadas** (1712 pruebas distintas en total), sobre reemplazo/cierre antiguo, suscripción tardía y aislamiento de sesión.
- **18 escenarios de coordinación en navegador** con React/componentes/hooks reales y HTTP sintético: ambos roles; Sí/Falta/Cancelar/Devolver; doble toque; guardado visible; recarga/recuperación; miniatura; permisos; foco/destello; Condiciones, Anular y Retirar permiso; cierre; reemplazo del aviso y destino concreto sin POST adicional.
- **10 recorridos de disponibilidad/propuestas** aprobados con el nuevo host global, conservando los hologramas existentes.
- Build QA/PWA aprobado: **2313 módulos**, precaché generado. Advertencia conocida de bundle principal mayor de 500 kB. No hay scripts separados de lint/typecheck; no se declara su ejecución.
- Capturas locales revisadas: customer-detail-393.png, customer-saving.png, customer-toast-positive.png y customer-toast-negative.png, bajo node_modules/.cache/coordination-inline-browser. Son datos sintéticos.
- No se crearon pedidos, confirmaciones reales ni pushes artificiales.

## Publicación y pendientes

El commit de este informe pertenece a qa; el cierre indica su SHA exacto y el estado Ready de Vercel, tras verificar los artefactos publicados.

QA: https://zipco-app-git-qa-zipco-s-projects.vercel.app

Pendiente: comprobar físicamente el diseño en iPhone y Android. Las capturas locales no sustituyen esa revisión ni permiten prometer igualdad de cada píxel entre dispositivos.

No hubo cambios en Railway, flags, migraciones, main ni producción. El workspace C:/dev/zipco-app permanece intacto. El diagnóstico pausado del clic externo iPhone no forma parte del bloque y no se declara corregido.
