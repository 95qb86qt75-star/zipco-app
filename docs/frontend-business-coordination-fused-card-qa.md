# Negocio: coordinación pendiente fusionada — QA

Fecha local: 2026-10-30. Clasificación: solo frontend, presentación e interacción
local. Base publicada: 29641b4; memoria local previa: 163f165.

## Diseño autorizado

Para la negativa guardada, una sola tarjeta reúne la cabecera compacta Aurora,
foto/producto/cliente/precio, aviso ámbar que identifica quién indicó la falta
de coordinación y las acciones Abrir WhatsApp / Ya coordinamos cuando se permiten.
Se elimina Coordinar después como acceso ambiguo al detalle.

Dentro de Ver detalle se conserva la franja original de Condiciones aceptadas:
icono, resumen, flecha y la misma hoja/modal y acuerdo. Se conserva el bloque
inferior con check luminoso y línea vertical, con menos espacio entre pasos.
No repite la foto, identidad, importe o acción WhatsApp. Anular solicitud y las
opciones existentes quedan en Más opciones. El desplegado usa DetailReveal,
inert y movimiento reducido actuales. No se cambia de categoría al guardar.

Si la negativa es propia: Avisaste al cliente. Si procede del cliente: El
cliente indicó que todavía falta coordinar. Se usa declinedBySelf derivado del
servidor; no se inventan notificaciones, timestamps o datos persistentes.

## Archivos y compatibilidad

- AvailabilityWaitingCard.tsx: variante visual de negocio pendiente y contexto
  de layout; el controlador hijo mantiene su identidad durante OPEN/redirección.
- businessCoordinationDisclosure.ts y BusinessPendingCoordinationDetail.tsx:
  composición local con botones, pasos, condiciones y opciones plegables.
- BusinessCoordinationCard.tsx: entrega los callbacks, consentimiento, permisos,
  recuperación y diálogos actuales a la variante pendiente embebida.
- WhatsappCoordinationPanel.tsx: pliega también negocio al entrar en negativa
  real, igual que cliente; no cambia send, allowedActions ni transición de API.
- coordination-v2.css: acabado scoped del negocio, espacios y hit testing.
- scripts/qa/coordination-cases.mjs y README: casos afectados reutilizados,
  cobertura 320, negativa entrante desde cliente y OPEN no permitido.

No hay campos, headers, payloads o endpoints nuevos. Se conservan los GET y las
acciones existentes decline-whatsapp-coordination, confirm-whatsapp-coordination,
open-whatsapp, consentimiento y anulación. No cambia la lógica de reservas,
permisos, idempotencia o recuperación. Railway no requiere cambios.

## Validación proporcional

21 unitarias de BusinessCoordinationCard aprobadas. Siete recorridos de navegador
aprobados: seis de negocio (consulta, antes de primer acceso, negativa propia
393/320, negativa del cliente 320 y OPEN ausente) y una regresión de cliente.
Componentes reales, HTTP sintético y toques por coordenadas; ninguna acción real.

Verificados Condiciones aceptadas abre/cierra sin POST, Más opciones plegado e
inert, Anular abre/cancela sin confirmar, cabecera compacta y una sola acción
WhatsApp/confirmación, categoría conservada, un solo OPEN con holograma y
destino correcto y regreso a la consulta. OPEN ausente permanece deshabilitado
sin envío. La decoración se pausa al cubrir con la hoja de condiciones.
Capturas a 393/320 revisadas. No equivale a prueba física Android/iPhone.

No se repiten checkout, aceptación, contratos o suites ajenas al cambio. Los
casos ya aprobados se excluyeron al ejecutar los nuevos estados/permisos.

## Tiempos y publicación

Inicio: 01:45:58 UTC. Análisis hasta 01:47:10 (1 min 12 s). Implementación
principal hasta 01:48:35 (1 min 25 s). Preparación focalizada inicial hasta
aproximadamente 01:49:05 (30 s). Pruebas y preparación adicional intercaladas
hasta 01:52:22; tiempos por caso en qa-pilot. Unitarias: 2,66 s.
Documentación/cierre desde 01:52:22. Build QA/PWA y observación/verificación
Vercel se registran separadamente al finalizar, sin sumar fases superpuestas.

El SHA de aplicación será el commit que introduce este informe. Publicar solo
qa/Vercel QA, verificar READY, SHA, alias, assets y marcadores mediante el
verificador existente. Sin modificar main, producción ni Railway. La entrega
indica versión, despliegue y tiempos reales. Pendiente prueba física del usuario.
El diagnóstico de clic externo permanece pausado.

## Cierre verificado

- Aplicación c5f3c85dbbaa8b26821b07a908726c6d36d1b2b9, rama qa.
- Build QA/PWA aprobado, 01:54:04.622–01:54:18.360 UTC: 13,738 s. Advertencia
  conocida de bundle grande, sin cambios fuera del alcance.
- Push qa correcto. Vercel dpl_2tsHANn2VRMzhyyXYjyYoon1Sz5e READY.
- Observación GET del despliegue: 01:54:54.455–01:55:19.852, 25,397 s;
  es la ventana observada después del push, no tiempo exacto del build remoto.
- Verificación de identidad, proyecto, rama, alias, backend QA y marcadores:
  5 GET, proceso 3,219 s. JS /assets/index-BIgUK92l.js y CSS
  /assets/index-BlCqjNmb.css. Completada antes de 01:55:38 UTC.
- Alias https://zipco-app-git-qa-zipco-s-projects.vercel.app.
- Prueba física pendiente: recargar ZIPCO, comprobar QA c5f3c85 y revisar la
  tarjeta del negocio con negativa guardada, Condiciones, opciones y WhatsApp.
- Memoria final local, sin otro push/despliegue por documentación. Sin cambios
  en Railway, main o producción.
