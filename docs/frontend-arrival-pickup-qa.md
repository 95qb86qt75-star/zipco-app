# Retiro sin reserva — reutilización visual

2026-11-08. Solo frontend: presentación e interacción local. Usuario pidió replicar
el diseño recién aprobado de reserva gratuita, identificado como Por orden de llegada.

## Cambio

- CustomerReceiptFlowCardView calcula arrivalDesign: retiro, IN_PROGRESS, sin
  modelo listo/recibido ni reservation, con reservationChoice.choice NONE u oferta
  NONE explícita. Pasa la señal a tarjeta y detalle.
- CustomerPickupCard reutiliza su cabecera verde y muestra Retiro en el local.
- CustomerReceiptDetails reutiliza las pestañas y controles de la composición
  confirmada, sin duplicar el componente. Sustituye únicamente el boleto de reserva
  por las instrucciones reales con Por orden de llegada y la advertencia de stock.
- customer-pickup.css añade cinco reglas acotadas al bloque nuevo.
- Prueba de selección ampliada y mapa de tarjetas actualizado.

No cambia APIs, payloads, permisos ni estados. Cancelar, condiciones, contacto y
recuperación son los existentes. No se declara compra, pago, reserva ni entrega.
Listo/recibido, reservas y WhatsApp mantienen su selección. El recorrido informativo
nuevo E200 tiene otro propietario y no se modifica ni se migra ningún pedido.

## Validación

19 pruebas: nueve del contenedor y diez existentes de piezas/permisos/recuperación.
Se repiten por tocar la composición compartida y su selector.

Siete grupos Chromium reutilizados: 320/390/430 sin desborde, tarjeta y detalle,
condiciones y cancelación reales, pestañas y pliegue con toques por coordenadas y
elementFromPoint; exclusión de FREE, PREPAYMENT y READY; contenido visible en reposo
y movimiento reducido. HTTP simulado, red externa bloqueada, cero POST reales o
simulados en estos escenarios. Evidencia ignorada en
node_modules/.cache/arrival-pickup-design/. El primer fixture fue rechazado por
normalización porque añadía importe a una oferta NONE; se corrigió el fixture,
sin modificar el contrato ni el código para aceptar datos inválidos.

Build QA/PWA aprobado: 2408 módulos, Vite 12,78 s, diez entradas precache. No hay
tsc configurado; build no equivale a tipado completo. Celulares físicos pendientes.

## Medición

Análisis 15 s; implementación y primera ejecución unitaria 91 s (sin separar el
tiempo de esa ejecución); preparación del arnés 27 s; pruebas, reparación del
fixture y espera 108 s. Build ejecutado en paralelo al final de las pruebas:
12,78 s Vite, no se suma nuevamente a esos intervalos. Documentación y publicación
se completan en el cierre. No se cambiaron herramientas, configuraciones o dependencias.

Rama qa. Publicación pendiente al redactar. Railway no necesario; main y producción
intactos. Dist generado excluido y carpeta previa ajena conservada.
