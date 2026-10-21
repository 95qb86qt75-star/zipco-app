# UI-REJECT-GLASS-01 — Rechazar solicitud con cristal rojo

2026-10-21. Clasificación: **solo frontend**. Rama `qa`.
Base limpia `78fa618b79cb779c770208d4391aca9f7f3bcd3d`, sincronizada con origin/qa.

## Antes / Después

Antes: botón de borde rojo para abrir el rechazo inicial del negocio.
Después: diseño liquid glass rojo entregado por Bastián, con X, luces,
reflejo y animación. Cambia únicamente el botón de entrada Rechazar solicitud.
Motivos, explicación de Otro, Continuar, Volver, confirmación, errores,
recuperación, permisos, bloqueo y acción de rechazo conservan el código anterior.
Se preservan autorización de contacto, botones verdes aprobados y tarjeta Aurora.

## Archivos y origen

Material de Downloads revisado sin modificar originales:

| Archivo | SHA256 |
| --- | --- |
| PendingRejectionActions.tsx | 8260929706BF06C09E13054093ECFB8B107ACE6D7B0BCAB551733FE8B5466C9D |
| RejectGlassButton.tsx | DB6729145C679D733C7BD61E3B0A5B079181F3D923B80583FD049C70399602D5 |
| index.css.reject-button.css | 30D06877969DF85F67798CECC9782BE5E836EECA04A288E9F611BD4208041200 |

Archivos modificados:

- `src/app/screens/requests/PendingRejectionActions.tsx`: material entregado,
  sustituye botón nativo por RejectGlassButton; mismo onClick, disabled y ref.
- `src/app/screens/requests/RejectGlassButton.tsx`: componente visual nuevo.
- `src/styles/index.css`: estilos específicos del botón rojo. Adaptación de
  tipografía/salto de texto en 320 px y foco dentro del contenedor que recorta.
- `PendingRejectionActions.test.ts`: localiza el componente nuevo para conservar
  las comprobaciones de motivos, confirmación, permisos, cierre y recuperación.
- `scripts/check-accept-glass-button.mjs`: añade modo `--reject`, sin perder
  la comprobación anterior de los botones verdes.
- Esta ficha, catálogo y referencia en la documentación funcional del rechazo.

La clase zipco-reject-icon también existe en un SVG legacy de MyOrderCard.
Se limitan los estilos nuevos a `.zipco-reject-btn > .zipco-reject-icon` para
conservar tamaño, forma y animación del icono antiguo. No se reemplaza su CSS.

## Contrato y validación

Sin campos, endpoints, payloads, permisos o estados nuevos/modificados.
Se conserva allowedActions/REJECT_PENDING_REQUEST y el POST existente
`/request-processes/:id/actions/reject-pending-request` con expectedVersion,
confirmationAccepted, reasonCode y reasonDetail cuando corresponde. La acción
sigue en useCoordination/coordinationApi, sin cambios en este trabajo.

- **1137 pruebas / 97 archivos aprobados**.
- **Build QA y PWA aprobados**; aviso habitual de bundle grande. No tsc separado.
- Chrome local, React real/CSS compilado: **8 combinaciones del botón rojo**
  (320/360/393/400 px, claro/oscuro), sin texto cortado. Comprobados disabled,
  clic táctil único, propagación, movimiento reducido e icono legacy conservado.
- **8 combinaciones de regresión de los botones verdes aprobados**.
- Datos sintéticos; sin acceso al backend, acciones de pedidos o fotos reales.
- Diff del formulario entregado revisado: solo import/componente del botón.
  Capturas en node_modules/.cache/reject-glass-browser, sin versionar.

Prueba física pendiente: en Mi Negocio → Pedidos, desplegar una solicitud inicial
con permiso y revisar el botón rojo. Abrirlo y volver debe cerrar sin rechazar.
No confirmar un rechazo real únicamente para revisar el diseño.

Sin cambios en backend, Railway QA, worker, push, main o producción. Se conserva
Backend QA y todos los avances. Los pendientes generales de notificaciones no
se cierran con esta modificación visual.

## Publicación

Commit/push a origin/qa y Vercel Preview QA, con alias habitual y override vigente:
`ZIPCO_QA_LOAD_DIAGNOSTICS=1 ZIPCO_QA_NOTIFICATION_TRACE=0 npm run build -- --mode qa`.
Registrar READY en cierre documental, guardarlo y publicarlo con el mismo código.

## Publicación comprobada — 2026-10-21

Código `92f94d742fea80310187208ad9b06ddf3a6c1d29`, enviado a origin/qa.
Preview funcional **READY**, `dpl_yjEQFdoWQSsYjMHFaLufhYraPtWs`, URL propia
https://zipco-knol64765-zipco-s-projects.vercel.app. Por API se comprobaron
GitSource/SHA exacto, rama qa, target Preview y alias habitual
https://zipco-app-git-qa-zipco-s-projects.vercel.app apuntando a este despliegue.
Backend QA y override de build conservados; build global null y rama de
producción main sin cambios. Git limpio y sincronizado después del push.

Este resultado y el catálogo se guardan en un cierre documental posterior,
publicado con el mismo código funcional/opciones. Su SHA identifica la versión
final. Las pruebas visuales/DOM fueron locales; conformidad física del botón
rojo en Android/iPhone pendiente. No se modifica ni repite ningún pedido real.

## Conformidad de Bastián — 2026-10-21

Sobre QA `b5369ef`, Bastián confirmó «excelente funcionando» y solicitó después
plegar/ordenar las acciones de la tarjeta. Queda aprobado el diseño del botón
UI-REJECT-GLASS-01; no indicó dispositivo o cada escenario, por lo que no se
acreditan ambos sistemas móviles ni el flujo completo de rechazo por separado.
La nueva disposición corresponde a UI-BUSINESS-PENDING-RESPONSES-01 y requiere
su propia revisión; no altera el diseño rojo aprobado.
