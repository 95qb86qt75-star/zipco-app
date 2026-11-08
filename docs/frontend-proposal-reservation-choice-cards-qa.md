# Elección de reserva al aceptar propuesta

2026-11-08. Solo frontend: presentación e interacción local.

## Integración focalizada

Tres archivos de producto:

- ReservationChoiceFields.tsx: variante cards e hideSummary opcionales; radios
  nativos con iconos/check, nota y contador de caracteres Unicode. Mantiene el
  límite real de 300, callbacks, disabled y campo de nota del formulario plain.
- ProposalNegotiation.tsx: solo dos conexiones JSX en confirmación del cliente:
  oferta en el boleto con customerProposal; elecciones cards/hideSummary.
- proposal-chat.css: sustituye solo el bloque de estilos de elección por el nuevo.

La entrega contenía una base anterior de ProposalNegotiation y CSS: no se copiaron
sus regresiones. Se conservan customerProposal, miniatura sin segunda cantidad,
los límites de animación y el recorte publicado de botones (df53aa6). execute sigue
idéntico al original. La oferta aparece una vez porque ahora el boleto la muestra
y el fieldset la omite. Variante de negocio y demás archivos de producto sin cambios.

El aviso NO_RESERVATION_WARNING se importa realmente de ReservationDecisionDialog.
Se muestra con oferta NONE o con oferta simplificada y elección NONE; desaparece
al solicitar reserva. Este cambio de presentación afecta también a la variante
plain en contrapropuesta, como pidió el usuario. No cambia el reconocimiento
noReservationAcknowledged, la reserva, sus reglas o lo que se envía al servidor.

Consumidores comprobados: las tres llamadas de ReservationChoiceFields están en
ProposalNegotiation (decisión cliente nueva, composición compartida y borrador de
contrapropuesta); solo la decisión nueva opta por cards/hideSummary.

## Verificación proporcional

- 18 unitarias de elección, resumen y conversación. Nuevos casos: plain/cards con
  oferta gratuita y con pago, aviso condicionado, oferta NONE, salida plain por
  defecto, hideSummary y disabled, dos radios y límite de 300 caracteres Unicode.
- Seis grupos reutilizados en Chromium con los componentes reales y HTTP simulado:
  aceptación gratuita con nota recortada a 320/390/430 px y una oferta en boleto;
  aceptación NONE con noReservationAcknowledged true; WhatsApp; volver del rechazo
  y abrir el formulario real de contrapropuesta sin envío.
- Grupo adicional por coordenadas: radio de reserva oculta aviso, nota Hola muestra
  4/300, radio NONE recupera aviso, volver a reserva conserva Hola, cero POST.
- Cero pedidos o notificaciones reales. Elegir radio/editar nota no envía nada.
- Build QA/PWA aprobado: Vite 10,31 s, 2408 módulos y diez entradas precache.
  Sin tsc configurado; pendiente iPhone/Android físicos. No se repite la suite
  completa de envío por cambiar solo dos props JSX y un componente de presentación.
- Evidencia ignorada .cache/proposal-choice-cards/: results.json, choice-results.json,
  capturas y arneses reutilizados. No herramientas versionadas nuevas.

Campos/endpoints existentes: choice NONE/REQUEST_RESERVATION, nota,
noReservationAcknowledged y términos de reserva; rutas de propuestas y sus acciones
conservadas. Ninguna API, permiso, estado, recuperación o backend cambia.

## Tiempos y publicación

Análisis 53 s; integración/preparación y primeras pruebas 95 s; validación y esperas
90 s. Build Vite 10,31 s en paralelo a la validación, no sumar dos veces. No se
inventa una separación ausente de preparación/ejecución. Documentación inicial y
commit/push: 51 s; espera/verificación de publicación: 72 s. Cierre documental
posterior separado.

Rama qa; publicado `94ea3acb33286a1e69c47abd480cee59c1ae26a5`, Vercel success:
https://vercel.com/zipco-s-projects/zipco-app/5T8SCg34RRnSL9w5H1TD8MaFuHVS
No repetida comprobación independiente de bundles con credenciales locales antes
limitadas por 403 y sin cambios de acceso. Railway no necesario. Main y producción
intactos. Carpeta ajena de handoff conservada y dist generado excluido.
