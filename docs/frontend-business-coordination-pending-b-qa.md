# Negocio · Coordinación pendiente · Diseño B

Fecha: 2026-11-02. Clasificación: **solo frontend**, presentación y navegación local.
Entrega: tres archivos completos de Claude sobre las fuentes vigentes.
Alcance exclusivo: `mode === 'declined'`, negativa de coordinación guardada, sin
anular la solicitud ni cambiar su categoría. Question, confirm y ownPending
conservan su composición y acciones.

## Integración

En `src/app/features/requests/cards/business/coordination/`:

- `BusinessCoordinationWaitingCard.tsx`: banda oscura, miniatura real, cliente,
  producto y total. Entrega el aviso exacto mediante `BusinessPendingNote` al
  único detalle consumidor. Mantiene permisos, callbacks, ids y recuperación.
- `BusinessPendingCoordinationDetail.tsx`: recorrido compacto, aviso y acciones,
  condiciones y pasos originales dentro del desplegable. Más opciones abre un
  panel flotante con los controles reales, conservados montados al cerrarlo.
- `business-coordination-pending.css`: diseño y efectos acotados a esta variante,
  responsive, foco, pausa y movimiento reducido.

Adaptaciones necesarias respecto de la entrega:

- El panel se monta en portal y se posiciona junto a Más opciones. Los contenedores
  animados originales tienen overflow oculto y recortarían un menú absoluto.
  No se modifican DetailReveal ni los estilos compartidos.
- El panel hereda el bloqueo efectivo de sus ancestros mediante observación de
  `inert`. No permite operar por fuera del bloqueo de guardado/presentación.
- Escape respeta primero el diálogo abierto; luego cierra el panel y devuelve el
  foco. Cierra al tocar fuera o desplazar el contenedor exterior. Los controles
  permanecen montados para conservar estado y recuperación. No usa role=menu
  porque contiene también consentimiento y controles de formulario.
- Se oculta Más opciones si sus nodos reales no tienen contenido visible básico.
- Fondo con especificidad propia, pausa al cubrir el detalle y cantidad única:
  el componente real ya dibujaba una cantidad además del badge de la cabecera.

Las ventanas reales de Condiciones aceptadas, Anular y permiso de contacto no
fueron rediseñadas. No se modificaron controladores, hooks de acciones, API,
contratos, permisos, estados, package.json, index.css ni workers.

## Datos y acciones conservados

Datos existentes: líneas y cantidad, total, acceptedAt, consentimiento propio,
allowedActions, whatsappCoordinationInitialDecline y ronda de coordinación.
Miniatura y ventana originales: ProductPreviewControl. Total desconocido no
se convierte en cero. Textos libres/servidor conservan su significado.

Acciones existentes: AUTHORIZE_CONTACT, OPEN_WHATSAPP,
CONFIRM_WHATSAPP_COORDINATION, DECLINE_WHATSAPP_COORDINATION,
ANNUL_COORDINATION y REVOKE_CONTACT_CONSENT, mediante los controladores originales.
Lecturas `/orders/my-orders`, `/orders/business/:id`, capacidades y acuerdo;
rutas existentes `/request-processes/:id/...` de coordinación/contacto. No hay
campos, headers, endpoints, persistencia ni contrato nuevos.

## Verificación

- **90 pruebas unitarias** aprobadas: BusinessCoordinationCard,
  processCardVisualFlow y AvailabilityPostActionsView.
- **Seis recorridos existentes**: controls negocio/cliente a 393 px, declined
  negocio a 320/393, declined-incoming a 320 y declined-disabled a 393.
  Ventanas, permisos bloqueados, holograma y navegación sintética WhatsApp.
- `scripts/check-business-pending-design.mjs`: menú a 320/393, foco, Escape,
  toque exterior/Inicio, prioridad del diálogo real, bloqueo heredado, miniatura
  real sin despliegue, cantidad única, autorización con un envío, movimiento
  reducido y recuperación de envío incierto conservada sin reintento automático.
  Cuatro grupos de escenarios; capturas revisadas en Chrome local.
- Imports/parse resueltos sin errores. Build QA/PWA final aprobado. Advertencia
  previa de chunk grande; no se instala ni se afirma ejecutar tsc independiente
  (el proyecto no dispone de esa comprobación configurada).

Todo HTTP y la navegación externa de las pruebas usa transporte sintético
restringido a localhost. No se enviaron pushes ni se modificaron pedidos reales.
No equivale a prueba física de iPhone/Android: queda pendiente con el usuario.

Se adaptaron solo selectores afectados del caso aprobado y se añadió una variante
optativa a su fixture. No se cambió el runner, navegador ni herramientas comunes.
Fallos de preparación conservados en los registros: selección CLI con dos nombres
no soportada; espera de capacidades y aserción de botón pendiente ajustadas al
controlador real. El fallo funcional Escape/dialog sí se corrigió en la vista.

## Medición

Evidencia local ignorada: `node_modules/.cache/business-pending-b-timing.json`,
`business-pending-b-unit.json` y `qa-pilot/business-pending-design-b/`;
históricos del runner `qa-pilot/coordination-detail/`.

- Análisis desde primer reloj: 3 min 49,76 s. Lecturas anteriores no medidas.
- Copia inicial de implementación: 8,54 s. No representa toda la implementación;
  los ajustes de portal/foco/CSS posteriores se intercalaron con la validación.
- Preparación inicial de pruebas: 1 min 59,06 s.
- Ventana de pruebas/ajustes: 5 min 51,05 s hasta iniciar el primer build.
- Ventana paralela de builds/validación final/ajustes: 3 min 45,76 s. No es tiempo
  exclusivo del compilador. Tres comandos QA/PWA: 14,31 s, 8,58 s y 10,03 s;
  los dos últimos se justifican por nuevos cambios CSS de pausa y cantidad.
- Documentación inicial: 1 min 41,80 s. Commit, push y observación de Vercel:
  1 min 12,93 s, incluidas esperas entre consultas. Total desde primer reloj
  hasta publicación verificada: 18 min 28,89 s. Cierre documental posterior local,
  sin otro push ni repetición de controles.

Las ventanas incluyen preparación adicional, correcciones y coordinación entre
llamadas; no hay medida exclusiva para cada ajuste intercalado. No se suman de
nuevo los comandos concurrentes. No son mediciones de rendimiento de la app.

## Publicación

Publicado en rama qa: **8c2e71c79fbde9a55c6dc4ebaa85836b59c910ee**.
[Vercel success](https://vercel.com/zipco-s-projects/zipco-app/DBwFvB8wDP7Wq1ENB7WRudTYEfcu),
verificado por el estado del commit. Alias QA:
https://zipco-app-git-qa-zipco-s-projects.vercel.app.
La autenticación SSO del alias limita la lectura automática del sitio publicado;
la verificación visual/interactiva descrita fue local, con componentes reales.
Railway no necesario. Main y producción intactos; se conserva fuera del commit
el paquete antiguo no rastreado de docs/design-handoffs del usuario.
