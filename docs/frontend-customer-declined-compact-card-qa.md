# Cliente: tarjeta compacta después de Devolver — QA

Fecha local: 2026-10-30. Clasificación: solo frontend, presentación e interacción
local. Base de aplicación b9512e6; herramientas locales 578e58e.

Después de una negativa confirmada por servidor, la tarjeta del cliente muestra
«Coordinación pendiente», negocio/producto/precio, «Avisaste al negocio que
todavía falta coordinar», Abrir WhatsApp y un solo Ya coordinamos. Si la negativa
provino del negocio, el mensaje lo identifica sin atribuírsela al cliente.
Los pasos, condiciones y opciones quedan en Detalle, con el revelado y scroll
local existente. El chip interior dice Por coordinar en esta variante.

Devolver conserva el detalle durante el envío y lo pliega al recibir el estado
negativo real. No se cambia de categoría. El aviso inferior existente confirma
el resultado. Ya coordinamos usa la acción/permisos existentes; Abrir WhatsApp
conserva consentimiento, recibo, holograma, navegación y recuperación.

## Implementación

- CustomerCoordinationCard.tsx: título/mensaje claros; elimina el acceso de
  cabecera duplicado y ofrece una sola confirmación fuera del detalle.
- customerCoordinationDisclosure.ts: contexto exclusivamente de layout que
  conecta el desplegable y las acciones sin montar otro controlador de pedido.
- CustomerCoordinationDetail.tsx: acción WhatsApp fuera del desplegable solo
  para esta variante; detalle mantiene pasos/condiciones/opciones.
- WhatsappCoordinationPanel.tsx: plegado local al entrar en negativa confirmada
  solo en cliente. No modifica send, allowedActions ni estados de servidor.
- coordination-v2.css: acabado compacto y hit testing del desplegable anidado.
- scripts/qa/coordination-cases.mjs y README: reutiliza casos existentes y añade
  confirmación directa desde la negativa compacta.

Ningún campo, endpoint, header o payload nuevo. Reutiliza los endpoints existentes
decline-whatsapp-coordination, confirm-whatsapp-coordination y open-whatsapp,
los recibos/GET actuales, allowedActions y la identidad de sesión/acuerdo.
Railway QA no requiere cambios. Main y producción intactos.

## Pruebas y alcance

27 unitarias focalizadas aprobadas (BusinessCoordinationCard y requestSummaryScroll).
10 recorridos de navegador aprobados: 9 del cliente (393/320, consulta/negativa,
disabled, revelado normal/reducido, contenido que cabe y confirmación directa)
y una regresión de negativa del negocio. Componentes reales y HTTP simulado.

Se comprueba: no plegar antes del recibo, categoría/conteo conservados, tarjeta
compacta menor de 380 px, detalle cerrado e inert, una sola confirmación,
Condiciones/Opciones táctiles, un solo OPEN, redirección y regreso a la consulta,
y CONFIRM único después de Devolver. Capturas locales revisadas a ancho móvil.

El primer pase detectó bloqueo de botones dentro del nuevo revelado anidado.
Se corrigió el pointer-events solo del contenido abierto. Se repitió el caso
fallido y los pendientes, excluyendo el caso ya aprobado ajeno a esa corrección.
No se repitieron aceptación/checkout, contratos o baterías completas sin cambios.
La comprobación física en iPhone corresponde al usuario después de publicar.

## Publicación y tiempos

Publicar solo Vercel QA desde qa, con build QA/PWA y comprobación de identidad,
READY, alias y artefactos usando el verificador existente. El SHA exacto será
el commit que incorpora este informe; la entrega comunica su despliegue.
El commit local de herramientas 578e58e se incluye como antecedente.

Análisis: 01:24:39–01:27:53 UTC, 3 min 14 s. Implementación inicial:
01:27:53–01:29:06, 1 min 13 s. Preparación focalizada: aproximadamente
01:29:06–01:30:27, 1 min 21 s. Ejecuciones y reparación puntual de CSS
intercaladas hasta 01:32:56; sus tiempos individuales quedan en qa-pilot.
Documentación/cierre desde 01:32:56. Build y publicación se miden por separado
en el cierre, sin sumarlos dos veces si se solapan. No se mide FPS/rendimiento
del producto ni se atribuye demora a gráficos. El clic externo sigue pausado.

## Cierre verificado

- Aplicación 29641b414291b6b9ad534afdbb6fec446a5c5f53, rama qa; push autorizado
  incluye el antecedente de herramientas 578e58e.
- Build QA/PWA aprobado: 01:34:56.804–01:35:07.373 UTC, 10,569 s. Se conservó
  la advertencia conocida de tamaño de bundle; no se amplió el alcance.
- Push qa completado y despliegue dpl_HBACJuThKqCHJSWDpg75SanSaKEA READY.
  Observación GET: 01:35:48.735–01:36:04.455, 15,720 s; no es la duración
  exacta del build remoto porque comenzó después del push.
- Verificador reutilizado: 5 GET, identidad/proyecto/rama/alias/backend QA y
  marcadores de diseño aprobados. JS /assets/index-BABZA0CH.js y CSS
  /assets/index-BzTGpkDu.css. Final de verificación antes de 01:36:53 UTC.
- Alias https://zipco-app-git-qa-zipco-s-projects.vercel.app.
- La entrega física queda pendiente; abrir ZIPCO, comprobar QA 29641b4 y probar
  Devolver, Detalle, Abrir WhatsApp y Ya coordinamos en el pedido correspondiente.
- Memoria de cierre guardada localmente sin otro push/despliegue documental.
  Railway, main, producción y el diagnóstico de clic externo permanecen intactos.
