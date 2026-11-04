# Negocio: disponibilidad confirmada, esperando al cliente

Fecha: 2026-11-03, America/Santiago. Clasificación: solo frontend, presentación
e interacción local. No cambia comportamiento de negocio ni contratos.

## Alcance y fuentes

Se integraron completos los dos archivos entregados por Claude: la composición
canónica `AvailabilityWaitingCard.tsx` y el bloque `UI-AVAILABILITY-WAITING-01`
de `availability-card-foundation.css`. El prefijo CSS anterior se conservó
íntegro. Todo lo nuevo queda bajo `.zipco-aw*`.

Franja de modalidad, estado, cliente, cantidad e importe; explicación y productos
con subtotales; instrucciones libres únicamente en retiro local; nota y foto;
retirar y ocultar. El error queda fuera del plegado. Se mantienen
`ProductPreviewControl`, `OrderReferencePhoto`, `DetailReveal` y el diálogo real.

Adaptaciones de integración: foco al control de cabecera al ocultar; chevron
sin la animación de la mano; raíz con `overflow:clip` y `flow-root` para evitar
scroll interno; decoraciones pausadas al plegar. No se modificaron controladores,
tiempos de envío, permisos, otras tarjetas ni ventanas compartidas.

Campos existentes: items (nombre, cantidad, precio unitario), total, schedule,
note, referencePhoto, availability.path/customerMessage/scheduleOrAddress y
allowedActions. Lecturas y `WITHDRAW_AVAILABILITY` siguen por el transporte
existente `/orders/...` y `/request-process/.../actions/withdraw-availability`;
no se agregaron rutas, payloads ni cabeceras. Retirar requiere el permiso real,
respeta busy y conserva la confirmación y recuperación.

## Verificación proporcional

- 59 pruebas existentes de `processCardVisualFlow.test.ts` aprobadas por afectar
  presentación compartida; 3 pruebas nuevas de permisos, busy y modalidad aprobadas.
- 8 escenarios de `check-availability-waiting-design.mjs` aprobados: WhatsApp y
  retiro a 320/390/430, recuperación y movimiento reducido/pausa en scroll.
  Transporte sintético, componentes y visores reales; toques por coordenadas.
  Foto/miniatura no pliegan; retirada cancelada no envía; error visible plegada;
  comprobar estado no repite el POST fallido; foco e inert verificados.
- Dos regresiones reutilizadas: disponible WhatsApp y retiro del cliente a 393.
- Se repitieron solo escenarios fallidos: selector de foto mal escapado, cierre
  real del diálogo tras error y atributo de scroll colocado en el contenedor
  incorrecto del fixture. No se repitieron los seis responsive ya aprobados.
- La prueba nueva se renombró de `.test.tsx` a `.test.ts` por la selección actual
  de Vitest; no cambió la configuración ni las herramientas.
- Build QA/PWA aprobado: 2403 módulos, precache 13 entradas. Advertencia existente
  de chunks grandes. No hay configuración/compiler TypeScript en el proyecto:
  build/transpilación aprobados, no se afirma un tsc completo.
- Diff revisado. Los cambios posteriores al build son pruebas/documentación.

No acredita Safari físico ni backend real. Pendiente iPhone/Android: aspecto,
fluidez, ventanas y retorno de foco. La prueba de movimiento reducido acredita
decoraciones propias; no certifica ausencia de animación JS en la foto compartida.

## Tiempos y entrega

Medidos por reloj de pared, sin sumas de procesos solapados. Inicio cronometrado
02:26:43 UTC; lectura inicial previa no medida. Análisis 290 s; implementación
57 s; preparación inicial de escenarios 68 s; ejecución/reparación/revisión de
pruebas 238 s. El último bloque incluye ajustes del escenario y lectura de
resultados, no solo ejecución del navegador.

Build efectivo QA/PWA: 11 s; ventana de orquestación/espera del build: 60 s
(contiene esos 11 s, no se suman). Documentación incluye además preparar y
ejecutar las tres pruebas de permisos; no hubo cronómetro independiente para
esa porción y no se inventa su duración. Publicación se registra al verificar.

Publicación QA: pendiente al preparar este informe. Railway innecesario.
Rama `qa`; `main` y producción fuera del alcance. Las preguntas sobre otras
tarjetas, brillos y etiqueta del retiro cliente siguen pendientes, sin cambios.
