# Cliente · misma visual WhatsApp para Preparando

2026-11-03, America/Santiago. Clasificación: solo frontend, presentación y
reutilización de navegación local. Solicitud expresa de aplicar la visual
aprobada de Esperando al negocio a la tarjeta Preparando.

## Cambio acotado

- cards/customer/progress/CustomerWhatsappProgressCard.tsx: la composición
  .zipco-wa-w aplica sin readyModel, tanto esperando como preparando. La pastilla
  muestra PREPARANDO TU PEDIDO o ESPERANDO AL NEGOCIO. Texto accesible, mensaje
  y carril siguen indicando el estado real. Misma cabecera, miniatura, total,
  animaciones, control de detalle y cuerpo. No duplica componentes ni CSS.
- CustomerReceiptFlowCardView.tsx: el detalle nuevo aplica también sin modelo
  listo en la rama WhatsApp. Retiro usa su rama independiente y no cambia.
- No cambia controladores, permisos, datos, fechas, recuperación ni contratos.
  Campos y endpoints existentes de pedidos/acuerdo, OPEN_WHATSAPP y consentimiento
  permanecen iguales. No requiere Railway. Main y producción intactos.
- Lista, listo, recibido y finalización conservan su presentación. No cambia
  StatusRail, ReadyPanel, ProductPreviewControl ni las ventanas de condiciones.

## Verificación proporcional

Reutilizado check-whatsapp-waiting-design con --preparing-only. Tres casos a
320/390/430 px: cabecera y carril abren, condiciones y producto reales,
revocación cancelada, foco al ocultar, inert al plegar, sin desbordes y barra
inferior accesible. Captura inspeccionada a 390 px.

Cuarto caso: texto y carril Preparando, contacto real del repo con transporte
sintético, bloqueo durante envío, un POST y navegación simulada; transición a
Pedido listo con ReadyPanel conservado. Primer intento falló por la fixture:
makeReady convertía CONFIRMED en EXPIRED conservando respondedBy/respondedAt,
combinación inválida según whatsappCoordinationContract.ts. Ajuste optativo de
waiting-design: conserva CONFIRMED. Se repitió solo ese caso y pasó. No se cambió
código de negocio ni se contó el intento fallido como caso aprobado adicional.

62 unitarias aprobadas: processCardVisualFlow y CustomerReceiptDialog. Se
repiten por los dos componentes afectados y el cruce con la variante listo.
Parseo/resolución sin errores. Build QA/PWA aprobado con advertencia existente
de chunks grandes. Repo sin tsc configurado; no se declara typecheck completo.

No se repitió la batería completa del diseño anterior ni suites no afectadas.
CSS idéntico: se reutilizan sus pausas y movimiento reducido ya comprobados.
Chrome local con red restringida, sin pedidos/mensajes/confirmaciones reales.
Pendiente comprobar físicamente iPhone/Android y revisar el nuevo texto de estado.

## Publicación y medición

Solo Vercel QA, rama qa; pendiente verificar despliegue. Directorio ajeno sin
seguimiento docs/design-handoffs/claude-cliente-coordinacion-whatsapp-c5f3c85
conservado. Cierre documental local sin push adicional después del despliegue.

Fases en node_modules/.cache/wa-preparing-timing.json. Análisis y lectura inicial
sin temporizador: duración no disponible. El resto se mide por separado.
Unitarias y navegador inicialmente en paralelo; no se suman dos veces. La fase
de ejecución incluye inspección de captura y diagnóstico del fallo sintético.
Reparación y repetición de ese único caso registradas como fases separadas.
Estos tiempos no miden el rendimiento de la app.
