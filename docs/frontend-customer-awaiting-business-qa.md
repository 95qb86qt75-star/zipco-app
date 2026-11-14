# Cliente: En espera frente a Por responder — QA

2026-11-13. Clasificación: solo frontend; agrupación y navegación local sobre
datos ya entregados. No se crea un estado de proceso ni se cambia una transición.

## Acuerdo y comportamiento

- AWAITING_BUSINESS_COUNTER_RESPONSE: cliente ve En espera (clave local
  awaiting-business); negocio conserva su categoría y acciones actuales.
- AWAITING_CUSTOMER_CONTINUATION, AWAITING_CUSTOMER_DECISION y
  AWAITING_CUSTOMER_FINAL_DECISION: cliente conserva Por responder.
- La pestaña En espera solo se renderiza con contador >0. Si estaba seleccionada
  y un resultado cargado correctamente confirma que quedó vacía, se vuelve a
  Por responder. No se cambia la selección durante carga o error, ni mientras
  quede otra contrapropuesta. Al llegar la final aparece en Por responder.
- Tarjeta del cliente: Esperando respuesta del negocio; Enviaste tu contrapropuesta.
  Espera la respuesta del negocio.; Ver conversación. No dice que deba responder.
- El resumen de respuestas nuevas ya excluía CUSTOMER_COUNTER en espera: se
  conserva y se prueba. Puede seguir mostrando respuestas de otras solicitudes.
- Se conservan Pendientes, coordinación, recibos, reservas, cotizaciones y negocio.
  El cambio no reclasifica pedidos iniciales históricos ni todos los estados.

## Contrato y archivos

requestProcess.state, currentProposalId y versión provienen del contrato actual
de pedidos (lectura GET /orders/my-orders y propuestas existentes). La categoría
awaiting-business no viaja al backend: es navegación/filtro/contador local.
Sin campos, rutas de API, persistencia de negocio, permisos, notificaciones push,
migraciones, configuración o flags nuevos. No requiere Railway ni contrato nuevo.

Propietarios bajo src/app/features/requests:
- domain/requestStatusGrouping.ts: categoría, conteo y filtro por actor.
- domain/requestProcess.ts: texto de contrapropuesta según actor.
- cards/shared/layout/ProcessOrderCard.tsx: explicación y acceso a conversación.
- screen/components/RequestStatusTabs.tsx: pestaña condicional del cliente.
- screen/application/useRequestsScreenController.tsx: selección vacía, error y
  validación de navegación local; texto vacío.
- application/agreementNavigation.ts: retorno local y enlaces compatibles.
- shared/feedback/statusChangePresentation.ts: aviso de contrapropuesta enviada
  y destino En espera; texto de resultado respetando actor.
Cuatro archivos de pruebas actualizados/agregados. No se duplican tarjetas.

## Evidencia

121 pruebas iniciales aprobadas en ocho suites dirigidas: agrupación, turnos,
conteos, atención, proceso, contrato de propuestas, retorno de navegación,
pantalla y aviso de cambio. Segunda selección por dependencias: cinco suites
aprobadas y una aserción nueva de error fallida. La aserción esperaba el texto
vacío, pero la pantalla correctamente muestra error; se corrigió para comprobar
la selección interna. Las 48 pruebas de pantalla pasan tras esa corrección.
No sumar estos resultados como pruebas únicas: las selecciones se solapan.

Cobertura nueva: espera cliente vs respuesta negocio, final del negocio vuelve
a Por responder, filtros/contadores y alertas coherentes, enlace profundo,
pestaña que desaparece en cero, lectura fallida no redirige y otra solicitud
en espera mantiene la pestaña seleccionada. Sin acciones automáticas.

Arnés real de RequestsScreen + componentes de la app y HTTP simulado:
320/390/430 px, tocar En espera, abrir Ver conversación sin botones de respuesta,
cerrar, recibir final simulada, desaparecer En espera y seleccionar Por responder.
Cero POST y excepciones JS; sin desborde horizontal. Captura 390 inspeccionada.
Scripts ignorados prepare-await-category.mjs y await-category-browser.mjs;
capturas customer-await-category-*. No se envían pedidos ni pushes reales.

Build QA/PWA aprobado: Vite 9,55 s, 2412 módulos y diez precaches.
No tsc configurado: build no acredita tipado completo. Pendiente comprobación
física del flujo cliente/negocio. Main y producción intactos; handoff ajeno conservado.

## Tiempos

Análisis 137 s, implementación inicial 15 s, preparación/primeros tests 82 s
(la suite informa 5,20 s), comprobaciones y ampliación 157 s, build/revisión y
corrección de aserción 57 s conjuntos. No hay separación fiable de todo el tiempo
de preparación vs implementación posterior. Suites adicionales: 5,89 y 4,32 s;
Vite 9,55 s, incluidos en esos intervalos, no sumar de nuevo. Documentación y
publicación se registran al cierre; no son métricas del rendimiento de la app.

Documentación/preparación de publicación 70 s; publicación/verificación 49 s
con espera externa. QA c58c30c05b9e9391e7af0f4fe1f8dabd7b80f194, Vercel success:
https://vercel.com/zipco-s-projects/zipco-app/qgXSnmiN1eV8tEuvwf5azBLxDotr
Sin inspección independiente del bundle protegido ni prueba física. Cierre
documental local sin otro push/despliegue.
