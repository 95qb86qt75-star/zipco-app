# E211: categoría cliente y navegación de reserva a WhatsApp

2026-11-15, America/Santiago. Clasificación: solo frontend, presentación y
navegación local; contrato backend leído/aprobado sin cambios de API. Entrega
backend: docs/testing/prepayment-customer-tab-and-whatsapp-return-handoff-qa.md,
respaldo informado fe9686e. Antecedente de diagnóstico E210 no acredita causa
física de la pantalla blanca ni lectura autenticada del pedido técnico175.

## Corrección de categoría

- `domain/requestStatusGrouping.ts`: solo la proyección pickupPrepayment no
  preparable cambia al waiting cliente/Por responder; negocio sigue waiting/
  Esperando respuesta. READY_FOR_PREPARATION sigue active ambos. Counters de otras
  negociaciones permanecen awaiting-business/En espera. Backend sigue enviando
  customerCategory AWAITING_BUSINESS: no cambia parser/enum/contrato.
- `cards/shared/reservations/PickupPrepaymentCard.tsx`: etiqueta Por responder.
- `domain/pickupPrepayment.test.ts`: categorías, contadores y filtros corregidos.
  Deep links y retorno consultan agrupador central; no otra aceptación.

## Apertura y retorno

- `application/reservationWhatsappNavigation.ts`: oferta transitoria en memoria
  de URL validada por whatsappUrl, sesión y versión mínima. No persiste URL,
  teléfono, token, comprobante ni metadatos de pago nuevos. Solo guarda estado UI
  mientras el documento existe; los intents durables existentes no cambian.
- `shared/reservations/ReservationWhatsappNavigationHost.tsx`: acceso único
  compartido para apertura manual y después de aceptar disponibilidad/propuesta.
  Espera a que termine el diálogo/holograma existente. Presenta un enlace nativo
  Abrir WhatsApp con target=_blank y rel=noopener noreferrer. Se requiere ese
  toque directo después de preparar el acceso. No window.open tras await ni
  ventana vacía reservada antes del POST, ni location.assign sobre ZIPCO.
- `application/useReservation.ts`, `application/useAvailability.ts` y
  `forms/proposal/ProposalNegotiation.tsx`: ofrecen el mismo enlace solo tras
  recibo/permiso y relectura verificados. La versión mínima de propuesta incluye
  la posterior apertura, no solo la aceptación anterior. startReservationPayment
  conserva su acción, validación, intento único e incertidumbre.
- `shell/AppShell.tsx`: monta el host fuera de las tarjetas, para sobrevivir a
  su traslado de categoría. No cambia sistema push/clic E185.

Al pulsar el enlace se registra solo un intento de navegación local. Blur,
visibilitychange/pagehide marcan salida; focus/pageshow/visibilidad al volver
ejecutan únicamente GET autenticado, con deduplicación y timeout10s. Verifica
cuenta, pedido, proceso y versión; publica recibo leído/lista y vista real.
El icono al reabrir un documento nuevo usa la carga normal de Solicitudes, sin
reproducir comandos. El estado local/enlace no pretende probar que WhatsApp
abrió, que se envió archivo o que se pagó.

Si el enlace no abre, permanece visible para otro toque sin otro POST. Si falla
la lectura al regresar, muestra error propio y Comprobar estado (solo GET), sin
tormenta de reintentos. Cambio de sesión invalida enlace/lectura; HTTP401 usa la
gestión de sesión caducada existente. Cerrar acceso no cancela/cierra la solicitud.

Se ajustó el texto del holograma EXISTENTE tras CONTINUE con pago pendiente:
Reserva solicitada / el negocio debe confirmar pago y apartado. No afirma En curso.
No se rediseñó tarjeta/holograma: pendiente entrega de Claude. No se añadió
numeración visible ni se cambió la plantilla WhatsApp de backend con IDs internos.

## Contrato conservado

GET /orders/my-orders?processContract=availability-v3 y
/orders/business/:businessId con contratos/cabeceras existentes. La consulta de
retorno usa refreshCoordinationOrder y los normalizadores reales.
POST /request-processes/:id/actions/open-reservation-whatsapp sigue usando
expectedVersion, reservationId, purpose RECEIPT o CLARIFICATION según control,
JWT/Idempotency-Key/cabeceras vigentes. navigation solo la construye backend.
Aceptación, reserva y apertura POST no se repiten por regresar. No confirmar
pago/apartado, no inventar URL/scheme/teléfono ni cambiar recovery de intenciones.

## Pruebas y límites

175 pruebas únicas en10 archivos aprobadas: helper nuevo (12 finales), categorías,
sesión/permisos, lectura vieja/ajena/ausente, fallo de red, HTTP401, no reintento
automático, startReservationPayment, useRequests, avisos, deep links y agrupación.
Se ejecutaron78+96 inicialmente; se añadió1 prueba401 y se repitió solo helper12.
No sumar repetidas como nuevas pruebas. Build QA/PWA final7,14s aprobado, aviso
previo de bundle. Builds previos7,83/7,73/7,20s repetidos por cambios finales de
texto, versión mínima y gestión401; sin tsc independiente.

Navegador con RequestsScreen, hooks, diálogos y HTTP sintético:
- Manual320/390/430: enlace externo nativo, documento/URL/marcador ZIPCO conservados,
  retorno consulta real de lista, tarjeta recuperada sin POST adicional.
-320 fallo503 al volver y recuperación GET explícita.390 navegación impedida
  mediante preventDefault de prueba: no pestaña vacía y enlace reintentable sin POST;
  siguiente toque crea un target externo nuevo. Sesión cambiada quita enlace.
-390 entradas tras disponibilidad y propuesta: un comando de aceptación y uno
  de apertura cada uno; cancelar el acceso no repite ni revierte reserva. Versión
  mínima final comprobada separadamente en propuesta.
- Primera prueba automática intentó tocar CTA con tarjeta plegada; hit testing
  lo rechazó. Se corrigió navegación del arnés desplegando antes, no el producto.
Sin excepciones JS ni desborde. Click por coordenadas/elementFromPoint. wa.me
resuelto a loopback en Chrome; no contacto/WhatsApp/pedido/transferencia real.
Captura ignorada node_modules/.cache/business-closure/reservation-whatsapp-link.png.
Scripts reservation-whatsapp-return/auto/focused/proposal-browser.mjs ignorados.

No acredita Safari/WhatsApp físico. Falta iPhone: entrada por enlace del sistema
y por icono ZIPCO, Safari y PWA, apertura permitida/restringida, red intermitente
y estado real del pedido. Android físico también pendiente. No se afirmó resolver
el error anterior de texto desconocido ni se lo atribuye a una causa no probada.

## Tiempos, ramas y publicación

Análisis/implementación/preparación sin cronómetros exclusivos; no se inventa
reparto. Ventanas de navegador/build/documentación se solapan: no sumarlas dos
veces. Mediciones de ejecución de pruebas y Vite registradas arriba; publicación
y cierre documental se añaden tras verificar SHA. No es medida de FPS/app.
Solo frontend qa. Railway, main y producción no modificados.

Publicado43bffa4b5622c198e8f24a2e742e52f54b14ef58 en origin/qa. Vercel success
verificado para ese SHA:
https://vercel.com/zipco-s-projects/zipco-app/9fgSy8KsfZMkRfrjrpJhHutgdvEU
Main8295ab8c6024ab20851ebd371308d2f299b4668f intacto. Cierre documental local
sin push/despliegue adicional. No modificación de Railway ni contratos.

Ventana medida hasta primera comprobación1040s; desde preparación/ejecución de
navegador654s; documentación309s parcialmente solapada con pruebas/implementación.
No son duraciones exclusivas ni medidas de rendimiento de app. Build final7,14s
por separado; publicación/verificación70s incluida espera externa. No sumar
intervalos solapados ni inventar desglose de análisis/implementación ausente.
