# Disponible del cliente: Aurora Pro compartido

Fecha: 2026-11-19, America/Santiago. Rama qa. Clasificación: solo frontend.

## Alcance y composición

El usuario aprobó reutilizar el diseño de Disponible PREPAYMENT, publicado en
QA cf15f75, para las otras confirmaciones de disponibilidad del cliente. Todas
usan `AvailableRequestDesign` en `shared/availability-design/AvailabilityDesign.tsx`:
WhatsApp, retiro sin reserva, reserva gratuita y pago previo. Se eliminaron los
renderizadores anteriores de WhatsApp y retiro. El archivo queda por debajo de
400 líneas; formularios del negocio y ventanas compartidas permanecen intactos.

Archivos de aplicación: AvailabilityDesign.tsx, availability-design.css y su
AvailableDesign.test.ts. Documentación: este informe, estado actual y mapa de tarjetas.
El CSS nuevo se acota a zipco-avpro, incluido contacto claro con área táctil de 44px.

## Datos, acciones y compatibilidad

- Total solicitado: data.total. Monto de reserva: reservationOffer.requiredAmountClp.
- Fecha de oferta simplificada: simplified.scheduledFor, formateada en Santiago;
  conserva data.immediate/data.schedule como alternativa de presentación existente.
- Sin reserva no se muestra una oferta de apartado: atención por orden de llegada,
  producto sin guardar y sujeto a disponibilidad. WhatsApp no muestra retiro ni reserva.
- FREE y PREPAYMENT mantienen ReservationOfferSummary real. El contrato antiguo
  conserva sus plazos, instrucciones, nota opcional, onReserve e Iré sin reserva.
- Permiso de contacto visible antes de continuar en los consumidores que lo recogen
  en la tarjeta. En retiro simplificado lo conserva ReservationDecisionDialog.
- Continuar, reservar, declinar, contacto y detalle mantienen sus callbacks. No hay
  enlaces WhatsApp nuevos, envíos automáticos ni cambios de allowedActions.
- Error/recovery siempre fuera del pliegue; disabled por busy e inert DOM al plegar
  y salir. Movimiento finito, pausa y reduced motion preservados.

No cambian campos, endpoints ni payloads. La ventana existente consulta GET
`/request-processes/:id/reservation-options?processContract=availability-v3` y conserva
CONTINUE_REQUEST/DECLINE_REQUEST. No requiere Railway, migración ni flags. E215
continúa pendiente e independiente. Los estados posteriores conservan sus propietarios.

## Verificación proporcional

Se repiten los escenarios del diseño cf15f75 porque ahora afectan cinco variantes
adicionales y nuevos controles visibles de contacto/reserva antigua. La revisión
usa los componentes reales y CSS global real en Chrome local, con sesión/datos y
HTTP simulados; nunca crea pedidos ni envía mensajes WhatsApp en QA.

- Unitarias focalizadas: 70 aprobadas (AvailableDesign, simplifiedReservationContract,
  availabilityRecovery y availabilityContract). Incluyen distinción de importes,
  fecha en Santiago, permisos, FREE/NONE y contratos anteriores.
- Navegador: resultados finales y capturas en
  `node_modules/.cache/available-pickup-pro/shared-result.json` y `shared-*.png`.
  Fixture local `check-shared.mjs`, derivado del escenario anterior, no productivo.
  Seis variantes a 320/390/430, cerradas/abiertas, nombres largos y varios productos,
  toques por coordenadas/elementFromPoint, miniatura real, acciones, recuperación,
  busy, contenido visible al pausar, salida/inert y reduced motion aprobados.
- Revisión adicional de controles en `shared-controls-result.json`: ventanas reales
  FREE/NONE y rechazo WhatsApp, sin POST; nota antigua con límite de 300 caracteres,
  conservación al plegar y controles deshabilitados durante busy.
- Compara por código la conservación literal de formularios del negocio y ventanas
  anteriores al límite de Disponible. No mantiene comparaciones obsoletas que exijan
  el diseño oscuro eliminado por la petición del usuario.

Build QA/PWA aprobado: 2435 módulos, advertencia de tamaño de chunk ya existente.
Publicado en la rama qa: `5ba68dd3c15c2bb578f03c2ec835d4a8d23ff8bc`.
GitHub confirmó Vercel success para ese SHA exacto:
https://vercel.com/zipco-s-projects/zipco-app/4qMRMPCp518SxQnsAgo91GSCAeVS .
El cierre documental se guarda localmente sin otro despliegue. No hay comando
tsc ni compilador TypeScript instalado en este frontend; Vite no acredita typecheck.
No se ejecuta lint sin configuración. Pendiente iPhone/Android físicos, sesión real
y aceptación visual del usuario. Una prueba Chrome con HTTP simulado no cierra esos casos.

main no fue modificado: conserva `8295ab8c6024ab20851ebd371308d2f299b4668f`.
Producción y Railway no fueron modificados.

## Tiempos medidos y límites

- Unitarias: 1,91s (70 casos); build Vite: 17,17s más generación PWA no medida aparte.
- Revisión responsive/táctil completa: 137,723s incluyendo servidor, comparación
  de fuentes, arranque de Chrome, ejecución y capturas. No es una medición de FPS.
- Build y pruebas de navegador se solaparon; no sumar sus tiempos como duración total.
- Análisis, implementación, preparación/reparación del fixture y documentación no
  tienen cronómetros independientes: no se inventan tiempos de esas fases.
- Revisión adicional de controles: 32,979s incluyendo preparación de Vite/Chrome,
  ejecución y esperas; resultado aprobado. Publicación se verifica por SHA exacto.
- Publicación/verificación sin cronómetro independiente. No se atribuye a gráficos
  ni al rendimiento del producto la duración del trabajo de integración.
