# Calendario y tarjetas de reserva en Confirmar horario solicitado

Fecha: 2026-11-13, America/Santiago. Clasificación: solo frontend, presentación.

Integrados completos los dos archivos corregidos de Claude:
forms/proposal/ProposalNegotiation.tsx y cards/shared/proposal/proposal-chat.css.
La comparación confirma que el resto del código previo se conserva. No modifica
la tarjeta exterior, conversación, formulario Glow ni el diseño del cliente.

## Qué cambia

Revisión negocio: título Horario que pidió el cliente, calendario compacto con
día y hora de Chile, Tu mensaje al cliente (mensaje real que enviará el negocio)
y total conservado en negrita. Si el counter es IMMEDIATE muestra reloj/Lo antes
posible, sin inventar una fecha. calendarParts usa America/Santiago para ISO y
UTC solo para calcular el día de semana de una fecha local ya descompuesta.
Formato únicamente; el horario del payload no cambia.

Opciones del SimpleReservationOfferFields real estilizadas como tarjetas desde
zipco-bz-rev: radio 18x18, seleccionada turquesa y foco. lockMode conserva radios
deshabilitados; el monto de PREPAYMENT continúa editable. :has resalta la tarjeta,
pero el radio :checked conserva su indicación aunque un navegador no aplique :has.
No se modifican los componentes reales de horario/oferta, validación, consentimientos
ni controles de recuperación. No se añaden animaciones. La función de envío y
carga se comparó idéntica al bloque anterior.

El mensaje sigue siendo el del negocio, tal como indica esta entrega; no se
reemplaza por una nota del cliente. El aviso exterior sigue genérico: no conecta
counterKind ni incorpora campo/consulta nueva.

## Pruebas y límites

Arnés Chromium reutilizado, controladores/componentes reales con HTTP simulado:

- FREE programada a 320, PREPAYMENT programada a 390 e IMMEDIATE a 430.
- ISO 2099-11-20T07:00Z muestra VIE 20 nov · 04:00 en Chile. El inmediato muestra
  reloj sin calendario ficticio. Capturas del cuerpo y revisión desde arriba.
- Radios bloqueados, indicador 18 px y tarjeta seleccionada turquesa; tocar la
  selección no altera modalidad. Monto editable cambiado a 1200 y comprobado en
  fulfillment.reservationOffer del único POST propose-final simulado.
- Sin POST antes de Confirmar y enviar; estado final esperado, sin desborde.
- Se repitió únicamente el caso 390 para capturar el calendario desde el inicio:
  la primera captura quedaba abajo tras editar el monto. No se repitió suite general.
- Script ignorado node_modules/.cache/prepare-business-calendar-test.mjs y
  business-calendar-browser.mjs. Solo datos sintéticos; no pedidos/push reales.

Build QA/PWA aprobado: Vite 7,88 s, 2412 módulos y diez precaches. Primer intento
de build no se ejecutó porque la revisión automática de permisos agotó su plazo;
se reintentó una vez con éxito. No fue un fallo de código ni una decisión de
seguridad. No tsc configurado; transpilación no se presenta como tipado completo.
Pruebas físicas iPhone/Android y API autenticada real pendientes.

Sin cambio de contrato, campos, endpoints, flags o migraciones: se reutilizan
proposals y propose-final con los mismos términos, consentimientos e idempotencia.
Railway no necesario. Main conserva 8295ab8c6024ab20851ebd371308d2f299b4668f;
producción intacta, handoff ajeno conservado.

## Tiempos y publicación

Lecturas iniciales previas al timer no incluidas. Análisis/integración inicial
33 s conjuntos, sin desglose fiable; preparación de escenario 58 s. Intervalo de
verificación/espera 398 s: incluye la espera externa de revisión de permisos,
reintento de build y prueba en paralelo; no equivale a CPU de pruebas ni al
rendimiento de la app. Build Vite 7,88 s más PWA; no sumar nuevamente ese tiempo.
Captura adicional y cierre documental/publicación se registran al cierre.

Captura adicional, documentación y preparación de publicación: 105 s medidos,
incluye espera de navegador/Git. Publicación y verificación: 55 s desde el push,
incluida espera externa. QA commit 59f92a094741a7618536d4144a4dc9612fde9dd4.
Vercel success comprobado para ese SHA:
https://vercel.com/zipco-s-projects/zipco-app/2pUfu9RzzuNpmvgqTxZEeBbntpBt
No se verificó por separado el bundle protegido ni celular físico. Cierre
documental local sin otro push/despliegue.
