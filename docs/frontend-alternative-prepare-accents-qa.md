# UI-ALTERNATIVE-PREPARE-ACCENTS-01 — Clara con acentos

2026-10-21. Clasificación: solo frontend. Rama qa.

Diseño recibido: Downloads/PROPONER_ALTERNATIVA_documento_unico.md.
SHA256: 732C9F21CB4427C97FE4A982D779F20C0D67971A63D72D68F1C4FEB7C0F1FFFB.

## Antes / Después

Antes: formulario claro, fichas con selección tenue y foto grande al seleccionarla.
Después: solicitud original/vigente en tarjeta Aurora con total, cuatro fichas
con gradiente violeta/turquesa y check blanco al guardar, motivo con foco violeta,
resumen de cambios, foto compacta preparada localmente y pie fijo con botones
redondos. Ayuda indica cambio/motivo pendiente y número de cambios preparados.
Revisar alternativa aparece atenuado hasta que la validación existente sea válida
y se cierre/guarde el editor. No cambia los criterios de validación.

Adaptaciones necesarias al código actual: se conserva changeOpen y los props de
horario/base CUSTOM, evitando perder bloqueo de edición o restauración al quitar
un cambio. No se reemplazan handlers ni estado de foto/File; solo su marcado.
El total es source.total, nunca el precio por unidad del artículo sugerido en
el ejemplo. Conserva baselineLabel para contrapropuesta/final. En 320 px muestra
Horario visualmente, manteniendo Disponibilidad accesible. Añade modo oscuro,
foco de teclado, movimiento reducido y envoltura para evitar desborde.

Foto indica «Preparada en este dispositivo»; la carga real sigue ocurriendo al
confirmar mediante el mecanismo existente. Variante aislada sin contrato autorizado
sigue bloqueada. No se atribuye persistencia a una selección local.

## Archivos y contrato

- src/app/screens/requests/AlternativeChangeEditor.tsx: presentación del formulario.
- src/app/screens/requests/PendingAlternativeActions.tsx: cabecera/pie del primer
  paso, ayuda visual y foto compacta; conserva segundo paso y envío.
- src/styles/index.css: estilos/animaciones y accesibilidad.
- AlternativeChangeEditor.test.ts (misma carpeta) y
  scripts/check-business-alternative-draft.mjs: comprobación de diseño responsive.
- Esta ficha y frontend-ui-design-catalog.md.

Sin campos ni endpoints nuevos/modificados. Conserva lecturas
processContract=alternatives-v1, payload de propuestas, allowedActions, versiones,
confirmación, idempotencia, conflictos y carga de imagen existentes.
Sin cambios en AlternativeReviewPanel, alternativeDraft o ProposalNegotiation.
Railway QA no necesario. Backend, main y producción no modificados.

## Validación

1140 pruebas / 97 archivos aprobados. Build QA/PWA aprobado, con advertencia
existente de bundle grande. tsc no disponible como dependencia.
11 escenarios Chrome DOM/React/touch: producto/servicio, 320/393/400 px, varias
líneas, altura corta, movimiento reducido y modo oscuro. Total correcto (no unitario),
pie fijo, selecciones independientes, abrir/guardar/quitar y revisión/foto aprobados.
15 recorridos de negociación: envío con foto, cliente acepta/rechaza,
contrapropuesta/final, permisos, versiones, fallos e idempotencia aprobados.
Capturas claras/oscuras inspeccionadas. diff --check aprobado.
Datos y red sintéticos; sin acciones sobre pedidos ni uploads reales.

Pendiente revisión física de este diseño en Android/iPhone; Chrome no acredita
WebKit. Reintentos fiables de notificaciones continúan pendientes. Avances conservados.

## Publicación

Registrar SHA y comprobación READY/alias después de publicar Vercel QA.
