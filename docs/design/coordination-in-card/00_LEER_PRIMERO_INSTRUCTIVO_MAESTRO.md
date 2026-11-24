> Referencia vigente: paquete codex_final2. Implementar sobre el repositorio, sin sobrescribir sus componentes con adjuntos.
> Correcciones de contrato: coordinationAccepted (no decision); conteos calculados en frontend desde listas reales. Falta inicial sigue Por coordinar; RESPOND false vuelve allí; RESPOND true ya estaba y permanece En curso. Ningún contador se altera por reproducir una captura.
> Un envío incierto no puede decir «No se guardó»: conserva la recuperación y el reintento exacto. «Ya coordinamos» abre el detalle; solo una acción autorizada y confirmada cambia la negativa persistida. No se reabre por un marcador local.
> No existe una fecha de autorización en coordination: el paso muestra Confirmada, sin reutilizar acceptedAt/updatedAt. Fotos y detalle usan productPreview ya publicado, nunca customerImage. La tarjeta de disponibilidad normal ya existe y conserva sus correcciones v2.
> Los hologramas de resultado existentes se conservan; no se restaura el antiguo diálogo flotante de pregunta de coordinación. La consulta sigue dentro de su tarjeta. El aviso espera a que termine el holograma y se encola.
> La copia adjunta BusinessCoordinationCard carece del soporte embedded del HEAD actual; se conserva y modifica el archivo del repositorio.

# 00 · Instructivo maestro — Consulta de coordinación en la tarjeta (negocio y cliente), cambio de estado con aviso y contadores

Repos: front `C:\dev\zipco-app-qa\src\app\screens\requests\` · back `C:\dev\zipco-backend-qa`. UI en español (Chile).
**Esta entrega REEMPLAZA a la anterior (docs 12/13/14 viejos).** Los archivos de `archivos_actuales_del_repo/` son los vigentes: trabajar sobre ellos, no sobre copias antiguas.

## Qué se pide (resumen)
1. **Cliente:** rediseñar la tarjeta de «¿Coordinación lista por WhatsApp?» y su detalle (doc 15). Hoy el detalle ocupa toda la pantalla.
2. **Negocio:** pulir lo ya implementado en `CoordinationWaitingCard` (doc 14): botones animados, «Falta» rojizo, etc.
3. **Toda la app (cliente y negocio):** patrón único de cambio de estado: guardando → resultado → la tarjeta sale → **aviso inferior con «Ver»** → **contadores de pestañas con chispeo** (doc 13). Los hologramas existentes se MANTIENEN; el aviso aparece cuando el holograma termina.

## Lo que ya existe en el código (confirmado en los archivos adjuntos; no rehacer)
- `CoordinationWaitingCard` + `CoordinationCardModel` (modos `question|confirm|ownPending|declined`) y `WhatsappCoordinationPanel` con render-prop.
- Acciones: `CONFIRM_WHATSAPP_COORDINATION`, `RESPOND_WHATSAPP_COORDINATION` (decisión true/false), `DECLINE_WHATSAPP_COORDINATION` (+ `whatsappCoordinationInitialDecline`, capacidad `initialDecline`).
- Sí → el pedido queda **En curso** (`ownPending` mientras la otra parte responde). Falta → confirmación («Devolver»/«Cancelar») y el pedido **sigue/vuelve a Por coordinar** (`declined`: «Se indicó que todavía falta coordinar. El pedido sigue en Por coordinar.»).
- `useCoordination` (busy/pending/retry/update/storageWarning), `useStartWorkPrompt`, capacidades por sesión.

## Orden de trabajo
**A. Auditoría backend (reportar antes de programar)** → **B. Corregir lo que falte en backend (con tests) y avisar** → **C. Frontend (docs 13, 14, 15)** → **D. Pruebas**.

### A. Preguntas de backend (responder con archivo:línea; no suponer)
1. `DECLINE_WHATSAPP_COORDINATION` / `RESPOND ... coordinationAccepted:false`: ¿deja el pedido en «Por coordinar» (`COORDINATING`), cierra la ronda, permite una nueva consulta después y **notifica a la otra parte**?
2. `RESPOND/CONFIRM ... true`: ¿pasa/deja el pedido en **En curso** y notifica a la otra parte?
3. Tras cada acción, ¿la lista/`refresh` devuelve estado y **conteos por pestaña** actualizados (cliente: Pendientes, Por responder, Coordinación, En curso, Historial; negocio: Pendientes, Por coordinar, Esperando respuesta, En curso, Listo y notificado, Historial)? Si los conteos se calculan en el front, indicar de dónde salen.
4. Idempotencia/concurrencia: doble toque, respuesta simultánea de ambas partes, `process.version`, reintento (`operation.pending/retry`).
5. ¿Funciona igual para consulta iniciada por negocio y por cliente (`initiatedBy`)?
Si algo falta: implementarlo en backend con tests, documentar el contrato final y entregarlo. Mientras no exista, el botón correspondiente queda deshabilitado.

## Reglas transversales
- Mantener TODOS los textos legales/existentes («ZIPCO no recibe ni verifica pagos.», «Indicaste que ya coordinaron. El pedido está En curso; falta que la otra parte responda.», etc.).
- No incluir controles de los tableros de diseño (selector A–E, «Error al guardar», reinicio).
- Accesibilidad: objetivos táctiles ≥44 px de área, `aria-label` en botones, toast `role="status"`, foco a la lista al desaparecer una tarjeta, `prefers-reduced-motion` (sin animaciones, solo cambios de estado), compuertas de movimiento existentes (`data-request-motion`, scroll).
- No inventar endpoints, estados ni reglas: si el contrato real difiere de lo descrito, corregir estos documentos y avisar qué cambió.

## Documentos de este paquete
`13_FLUJO_ESTADO_AVISO_Y_CONTADORES.md` · `14_CONSULTA_COORDINACION_NEGOCIO.md` · `15_PANTALLA_CLIENTE_CONSULTA_Y_EN_CURSO.md` · `12_TARJETA_DISPONIBILIDAD_CONFIRMADA_NEGOCIO.md` (nota v3) · imágenes `referencia-*.png`.

## Pendientes conocidos de entregas anteriores (backend)
Foto por producto (+ descripción opcional) en `Product`; persistencia de `lateInitialResponse`; fecha de envío de la propuesta y retiro de propuesta.
