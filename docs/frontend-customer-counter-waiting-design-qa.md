# Cliente: contrapropuesta enviada y espera — QA

2026-11-14. Clasificación: solo frontend, presentación. Alcance:
!business && AWAITING_BUSINESS_COUNTER_RESPONSE, sin cambios de contrato.

## Integración canónica

Se integran los seis archivos completos de Claude sobre el repo actual:
cards/shared/layout/OrderCardAurora.tsx, ProcessOrderCard.tsx, aurora.css;
cards/shared/proposal/ProposalChat.tsx, proposal-chat.css;
forms/proposal/ProposalNegotiation.tsx (bajo src/app/features/requests).
Las secciones previas de ambos CSS coinciden con el repo antes de la entrega.

Variante waiting de cabecera: negocio, importe «Tu contrapropuesta», cuatro
pasos, «Enviaste tu contrapropuesta» y Ver conversación con icono de chat.
Conversación waitingDesign solo cuando cliente/turno wait: historial compacto,
Enviada, cambios solicitados usando comparisonRows y franja de espera. Condiciones
rotuladas como propuesta aún sin acuerdo, sin modificar AvailabilityPlanSummary.
El botón usa ProposalDraftButton real; icon por defecto sigue siendo arrow.

Se conservan En espera condicional, contadores y retorno a Por responder al
llegar la final; cliente que debe actuar, negocio, rechazo, Outfit, callbacks,
lecturas, envíos, permisos, recuperación e idempotencia. Sin cambios de campos,
endpoints ni transiciones. Solo se consultan pedidos/propuestas ya existentes;
ninguna llamada nueva. Railway no necesario. No se modifica el estado de datos.

## Ajustes necesarios sobre la entrega

- backwards no garantiza contenido visible si una entrada se pausa durante el
  retraso. Reglas solo de esta variante desactivan entradas de contenido durante
  idle/scroll y dejan los adornos pausados. Reduced motion conserva todo visible.
- Miniatura real: el componente compartido mide más que los slots simulados.
  CSS acotado adapta thumbs a 24/34 px, conserva la cantidad y añade área de toque
  invisible para la miniatura única. Múltiples líneas conservan su scroll propio.
  No se modifica ProductPreviewControl ni su contrato.
- Se separan rótulos del avance y se añade wbr a Contrapropusiste para evitar
  rótulos pegados o una letra aislada. El texto accesible permanece completo.

## Validación proporcional al cambio

97 pruebas aprobadas: ProposalChat (incluye nuevos casos de enviado, inmutabilidad
y aislamiento por actor/turno), contrato/API de propuestas, categoría del cliente
y navegación de pantalla. Sin suite general por rutina.

Arnés de pantalla real RequestsScreen con controladores y componentes reales,
HTTP sintético: 320/390/430 px. Cuatro pasos, importe rotulado, En espera,
miniatura abre su visor real y vuelve, Ver conversación muestra Enviada y el
cambio de horario real, aviso de espera, pie sin acciones. Detalle de propuesta,
actualizar y cerrar funcionan, final simulada vuelve a Por responder. Cero POST,
sin excepciones JS y sin desborde. Pausa idle y scroll no ocultan contenido;
reduced motion deja cero animaciones activas en el chat.

Se repitieron esos casos tras corregir tamaño real de miniatura y rótulos,
y luego solo capturas de tarjeta tras añadir wbr. No se repitieron las unitarias
aprobadas para esos ajustes de presentación. Capturas 390 inspeccionadas.
Scripts ignorados prepare-wt-design.mjs/wt-design-browser.mjs y
prepare-wt-card-final.mjs/wt-card-final.mjs, capturas waiting-design-*/waiting-card-final-*.
Los datos son sintéticos (una línea con preview real sin imagen remota); no
acreditan fotografías reales ni todos los casos de varios productos en teléfono.

Build final QA/PWA aprobado: 2412 módulos, Vite 14,57 s, diez precaches.
Builds previos 10,84/15,53 s aprobados, repetidos porque después hubo cambios
visuales. No tsc configurado: transpilación no equivale a tipado completo.
Pendientes: revisión física en iPhone/Android y fotografías/datos reales.
Sin pedidos ni pushes reales. Main y producción intactos; handoff ajeno conservado.

## Tiempos

Análisis 69 s; integración inicial 48 s; preparación y unitarias 132 s conjuntos
(unitarias informan 6,76 s). Primera verificación navegador/inspección 36 s.
Ajustes visuales y repetición del arnés/builds 170 s hasta segunda inspección;
comprobación final/cierre se registra al publicar. No hay desglose fiable de cada
subfase posterior: no sumar tiempos de herramientas otra vez a esos intervalos.
No son mediciones del rendimiento de la app.

Comprobación final y tercer build tras wbr: 228 s; documentación/preparación
de publicación 15 s; publicación/verificación 480 s, incluye espera externa.
Rama qa, commit c829616524c5c7654fa63ed71a8aaff04fc1851d, Vercel success:
https://vercel.com/zipco-s-projects/zipco-app/B56hC9TyypawfaYW33wW3wfykXj5
Sin inspección independiente del bundle protegido ni teléfono físico. Cierre
documental local sin otro push/despliegue.
