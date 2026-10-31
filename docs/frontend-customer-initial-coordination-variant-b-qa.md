# Cliente: coordinación inicial, variante B de Claude — QA

Fecha local: 2026-10-31. Clasificación: solo frontend, presentación e interacción
local. Base publicada c5f3c85; base documental local 444eaad.

## Alcance y adaptación

Se integran BusinessCoordinationCard.tsx, CoordinationCardShell.tsx y el nuevo
customer-initial-coordination.css recibidos de Downloads. Se compararon con el
repo vigente: conservan las ramas previas del negocio y los detalles embebidos.
La variante se limita a cliente, producto, no embedded y camino WHATSAPP real.

Cabecera con miniatura real, cantidad, nombre, total acordado, estado y Nueva
solo si corresponde. Acciones principales quedan en la tarjeta; Paso N de 3
abre Pasos y opciones con Anular y los controles reales de AvailabilityPostActions.
Ahora no continúa siendo aplazamiento LOCAL de autorización, no una negativa.

La ventana de Condiciones aceptadas se conserva: CoordinationSheets.tsx,
index.css y su contenido/callbacks no se modifican. Tampoco se modifican
useCoordination.ts ni AvailabilityPostActions.tsx. Las clases nuevas están
aisladas y no se aplican al portal original de condiciones.

Ajustes frente a los archivos de Claude:

- Añadir restricción WHATSAPP para no cambiar servicios u otros caminos.
- Sustituir el portal/modal manual por Radix existente, conservando la apariencia
  de la hoja. Overlay/content 900/901 permiten que el diálogo real de Retirar
  permiso (1000/1001) quede encima. Se conserva foco, bloqueo de scroll, Escape
  y modalidad anidada; la hoja registra el overlay de presentación existente.
- Retorno de foco explícito al botón de pasos, sin robar foco al abrir Anular.
- Etiqueta accesible Ocultar tarjeta incluso a 320 px, cuando solo se ve el icono.
- WhatsApp indica Listo para iniciar solo si phase ready y canOpen; sin permiso
  muestra bloqueo/espera. El estado visual no habilita nada por sí mismo.
- La hoja usa la pausa por visibilidad/movimiento reducido y aria-hidden.

No se añaden campos, endpoints, headers o estados de servidor. Las acciones
AUTHORIZE_CONTACT, OPEN_WHATSAPP, ANNUL_COORDINATION y REVOKE_CONTACT_CONSENT
continúan con los controladores, versiones, recibos, consentimiento y recuperación
actuales. Autorizar no implica enviar mensajes o coordinar; volver de WhatsApp
no acredita pago. Se conserva el holograma de redirección y la consulta posterior
dentro del pedido asociado. Sin cambios de Railway ni diagnóstico de push.

## Pruebas adaptadas al riesgo

23 unitarias aprobadas: BusinessCoordinationCard y useCoordinationMotion. Se
repitieron tras añadir la restauración explícita de foco (cambio nuevo relevante).

Nueve recorridos de navegador aprobados, componentes reales y HTTP sintético:

- Tres de controles a 320/393/430: condiciones, producto, pasos, anulación
  abierta/cancelada, diálogo real de retirar permiso abierto/cancelado,
  plegado/reapertura, OPEN único con holograma y regreso a consulta.
- Autorización propia pendiente, Ahora no/Revisar, autorización comprobada,
  carga reducida y OPEN. No reautorizar al cliente que ya venía autorizado.
- OPEN ausente: botón bloqueado y paso sin afirmar que está habilitado.
- Error de transporte: conserva recuperación, sin navegación ni reenvío automático.
- Retirar permiso confirmado con API simulada: regresa a autorización pendiente
  y permanece en Coordinación; no cancela el pedido.
- Una regresión de negocio antes del primer acceso (consumidor compartido).
- Una regresión de aceptación → aviso → Ver en viewport corto.

Antes de integrar se registró la ventana ORIGINAL de Condiciones aceptadas.
Después se comparó a 393 px el contenido, clases y estilos computados de todos
sus elementos (incluidos medidas, colores, fuentes, bordes y sombras): coincidencia
exacta de esa firma con el original. Referencia sintética en
scripts/qa/fixtures/customer-conditions-original.json.

Casos nuevos en check-customer-initial-coordination.mjs y
scripts/qa/customer-initial-cases.mjs, reutilizando navegador, selección y medición
existentes. El fixture coordinación se amplía solo para simular los contratos
existentes de autorización/revocación y permiso OPEN. No hay acciones reales.
No se reejecutan baterías completas ni los casos ya aprobados sin nuevos cambios.
Chrome no acredita Safari físico: pendiente validar el iPhone del usuario.

## Medición y publicación

Inicio 04:40:18 UTC. Análisis/lectura y comparación inicial hasta aproximadamente
04:42:00. Implementación y comprobación unitaria inicial hasta 04:43:49.
Preparación focalizada y ajuste de foco hasta 04:46:44, intercalados con pruebas.
Recorridos principales aprobados antes de 04:48:52; caso adicional de retirada
de permiso terminado 04:49:49. Documentación/cierre desde 04:49:49.
Los reportes qa-pilot separan servidor/navegador/casos; no sumar ventanas
superpuestas como duración total. Build y publicación se miden al cierre.

Publicar únicamente desde qa a Vercel QA después de build QA/PWA. La versión
de aplicación es el commit que incorpora este informe; la entrega registra
SHA, despliegue READY, alias y verificación de artefactos servidos.
El código documental local pendiente se incluye como antecedente autorizado;
la carpeta extraída por el usuario permanece sin cambios ni seguimiento añadido.
Main y producción intactos. Pendiente prueba física del usuario.

## Cierre de publicación y límite de acceso

- Commit de aplicación 5e5cd01f82a4224064836816326dc8e31456169b, rama qa.
- Build QA/PWA aprobado: 04:51:40.409–04:51:50.507 UTC, 10,098 s; advertencia
  conocida de tamaño de bundle. No se repitió después por motivos documentales.
- Push a qa correcto. GitHub get_commit_combined_status para ese SHA devuelve
  Vercel state=success, target:
  https://vercel.com/zipco-s-projects/zipco-app/HCn9gbu8u8cqDuEJo1ERcoQHeyBZ.
- La observación directa de Vercel falló por HTTP 403, forbidden / Not authorized.
  Intento medido 04:52:49.273–04:52:50.191, 0,918 s. El alias sin acceso responde
  302 a SSO. No se creó credencial ni bypass ni se cambió protección/configuración.
- El éxito de GitHub acredita el resultado comunicado por Vercel, pero no se
  pudo verificar el SHA/JS/CSS actualmente servido por el alias. No registrar
  READY autenticado ni assets nuevos como comprobados. La última verificación
  completa de artefactos continúa siendo c5f3c85.
- Comprobación física pendiente: recargar ZIPCO, comprobar QA 5e5cd01, abrir
  Condiciones aceptadas y Pasos y opciones; revisar autorización/WhatsApp según
  permisos reales. Si sigue una versión anterior, revisar acceso/publicación
  antes de repetir acciones del pedido.
- Diagnóstico de acceso/estado remoto por lectura hasta 04:54:44. Cierre
  documental local posterior, sin otro push/despliegue. Permanece pendiente
  restaurar acceso Vercel autorizado para verificar el artefacto servido.
- Railway, main y producción intactos; carpeta extraída del usuario conservada.
