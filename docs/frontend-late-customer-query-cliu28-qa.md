# CliU28: consulta tardía al cliente

Fecha: 2026-11-07, America/Santiago. Clasificación: solo frontend (presentación
e interacción local). Rama qa. No modifica contratos, estados ni backend.

## Integración y diferencias justificadas

Fuentes completas de Downloads: `LateInitialCard (1).tsx` y `late-initial (1).css`.
Únicos archivos productivos modificados:
`cards/shared/late-initial/LateInitialCard.tsx` y `late-initial.css` dentro de requests.
`CustomerQuery` se selecciona solo para !business y AWAITING_CUSTOMER. Cabecera,
pregunta, decisiones, detalle, errores y efectos propios integrados completos.
El CSS anterior (49 líneas) se conservó como prefijo; estilos nuevos exclusivos
`.zipco-late-card--query` y `.zipco-lq-*`. Sin estilos globales nuevos.

Adaptaciones comprobadas con componentes reales:
- En el proyecto idle significa fuera de vista: mano animada visible/activa,
  pausada por idle y scroll, desactivada con movimiento reducido.
- Botones Sí/No se muestran según el permiso individual; el controlador real
  conserva bloqueos, intentos pendientes, UUID, guardado y recuperación.
- `answering` se limpia al terminar la operación para no indicar envío durante
  una comprobación GET posterior. No añade espera ni otra operación.
- ARIA controls apunta a un contenedor existente aun plegado. Ocultar devuelve
  foco al botón superior. overflow:clip evita scroll interno por foco.
- Miniatura real acotada a 44 px; se muestra la primera y se preserva el visor.
  Detalle conserva productos, subtotales, nota, foto y fechas reales.
- Se reemplazó «Por alta demanda, su respuesta se demoró» por «La hora solicitada
  ya pasó»: el contrato no aporta la causa de la demora. No se inventa esa causa.

Se conservan useLateInitial, ProductPreviewControl, OrderReferencePhoto, la
variante del negocio, STILL_NEEDED y sus avisos existentes. No se cambió Railway,
notificaciones push, flags ni el resto de los recorridos.

## Datos y acciones conservados

Datos actuales: lateInitialResponse (estado, queryId, scheduledFor), productos,
total, note, referencePhoto, createdAt y allowedActions. Hora del servidor, sin
recalcular retrasos con el teléfono. POST confirm-late-request-need y
decline-late-request-need bajo /request-processes/:id/actions/, con los cuerpos,
contratos y UUID del controlador existente. Comprobar pedido sigue siendo GET.
Sí conserva STILL_NEEDED y requiere acordar nueva hora; No conserva cierre e
Historial de ambos. No se declara compra, reserva ni disponibilidad al responder.

## Validación proporcional

- 106 unitarias existentes aprobadas: lateInitial.test.ts y processCardVisualFlow.
- Nueve escenarios con fixture acceptance existente y transporte sintético:
  responsive 320/390/430 con nombre largo/tres productos, visores reales de producto
  y foto, apertura/cierre/foco, mano avanzando en tiempo, pausa/reanudación y
  reducir movimiento; Sí y No con guardado bloqueado y un único envío; error y
  recuperación GET seguida de reintento del mismo UUID/cuerpo; sin permisos;
  regresiones del negocio y cliente STILL_NEEDED. Todos aprobados sin reparación
  posterior ni repetir baterías aprobadas.
- Fixture ampliado optativamente con late-query; prueba nueva
  scripts/check-late-customer-query.mjs. No frameworks ni herramientas nuevas.
- Build QA/PWA aprobado (2407 módulos, 13 entradas); aviso conocido de chunks.
  Repo sin configuración/compiler tsc: transpilación/build, no typecheck completo.
- Pendiente iPhone/Android físicos, flujo con backend real y fluidez percibida.
  No se enviaron notificaciones ni se modificaron pedidos reales en las pruebas.

## Medición y publicación

Lectura inicial previa al cronómetro no estimada. Análisis 86 s; implementación
75 s; preparación de pruebas 62 s; ejecución/revisión 63 s. Unitarias y navegador
parcialmente solapados, no sumar sus duraciones a la ventana de ejecución.
Build efectivo QA/PWA 11,8 s dentro de ventana de orquestación de 46 s; no sumar
ambos. Documentación/publicación se completan tras verificar Vercel.

Publicación QA pendiente al redactar. Main/producción fuera del bloque;
Railway innecesario. Los cierres documentales posteriores se conservan locales
sin otro push que produzca un despliegue solo por memoria.
