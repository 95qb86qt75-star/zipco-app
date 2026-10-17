# Registro de revisión visual — Frontend QA

Ronda iniciada el 2026-10-16. Cada publicación es una versión de revisión,
no una aprobación final. El cierre requiere la confirmación expresa de Bastián:
“Ahora estoy conforme con este diseño”.

Base de esta ronda: d5204934b1f6b7b5ac360733af4e641292acbe4c.
El commit que incorpora cada entrada identifica su versión exacta en Git.

## Modificaciones acumuladas: 8

1. **Cliente — orden de pestañas:** Pendientes antes de Coordinación.
   Se conservan los filtros, contadores y las restantes pestañas.
2. **Cliente y negocio — pestañas horizontales:** nombre y contador en una
   fila, ancho según contenido, sin encoger ni cortar el nombre; desplazamiento
   horizontal cuando sea necesario y altura táctil mínima de 44 px.
   Esta distribución con desplazamiento fue reemplazada por el ajuste 5.
3. **Cliente — tarjeta con RequestProcess:** el estado ocupa la esquina
   superior antes destinada al precio. El total compacto se conserva solo en
   la barra de color; después de aceptar procede exclusivamente del acuerdo.
   Los pedidos históricos conservan su presentación existente.
4. **Cliente y negocio — visor de imagen adjunta:** el visor se monta en
   `document.body` para salir del recorte y las capas de las tarjetas. Cierre
   con X de alto contraste, área táctil de 48 px y zonas seguras; conserva el
   cierre al tocar fuera y añade Escape, foco dentro del visor y retorno al
   control anterior. No cambia la URL ni la fuente de la fotografía.
   Referencia: captura de Bastián del visor sin cierre visible en iPhone.
   Bastián confirmó “quedó bien” tras esta publicación; no se atribuye esa
   confirmación a ambos celulares, ya que no especificó los dos dispositivos.
5. **Cliente y negocio — categorías compactas y todas visibles:** se elimina
   el desplazamiento lateral, con nombre y contador juntos en una pastilla
   más pequeña. Se conserva un área táctil de 44 px. Cuando no caben todas en
   una fila, se distribuyen en otra, sin ocultar ni añadir categorías.
   El componente y estilo compartidos se aplican a las categorías actuales y
   quedan disponibles para las futuras. No cambian nombres, orden, contadores,
   filtros ni permisos. Sustituye la distribución del ajuste 2.
   Referencia: imagen y aprobación de Bastián en esta conversación.
   El 2026-10-17 Bastián confirmó que las categorías quedaron bien y aportó
   captura de la vista del cliente en iPhone. Conformidad visual parcial del
   ajuste 5 sobre la versión 4ef8bec3835c510b9176c2ca12437decd65ae317.
   La comprobación independiente de Android negocio sigue pendiente.
6. **Cliente — presentación de coordinación y consentimiento:** referencia
   visual enviada por Bastián el 2026-10-17. Encabezado compacto con icono de
   WhatsApp; consentimiento aprobado sobre el teléfono del perfil conservado.
   Botón “Autorizo iniciar coordinación” verde con efecto glass, iluminación
   del icono y animación de dos ciclos (4,4 s), desactivada con movimiento
   reducido o mientras está ocupado. Continúa ejecutando únicamente
   `AUTHORIZE_CONTACT`; no abre WhatsApp ni comienza el trabajo por ese clic.
   Se conservan “Ahora no” y “Anular solicitud”, esta última con tratamiento
   visual secundario rojo y sus permisos de coordinación existentes.
   Resumen del cliente: icono de condiciones aceptadas y rótulo “Precio total”
   junto al total único del acuerdo; conserva expansión y condiciones del acuerdo.
   No se añade la promesa absoluta “Tu número estará protegido” ni se cambia
   “teléfono del perfil” por otro dato. Revisión real en celulares: pendiente.
7. **Cliente — botones secundarios glass transparente:** “Ahora no” y
   “Anular solicitud” adoptan fondo translúcido, desenfoque, borde luminoso y
   relieve suave según la referencia de Bastián. Se conservan texto verde y
   rojo respectivamente, icono de anulación, foco visible, bloqueo durante
   peticiones y las acciones existentes. El botón principal verde no cambia.
   Sin cambios en negocio, permisos ni contratos. No habilita anulación en
   Pendientes (F1). Revisión en ambos celulares: pendiente.
8. **Cliente — condiciones integradas y consentimiento más compacto:** al
   pulsar “Revisar condiciones”, el detalle se despliega inmediatamente bajo
   la barra del resumen, dentro del mismo bloque, antes de la coordinación.
   Se elimina la segunda tarjeta con título y total repetidos; productos o
   servicio, cantidades, precios unitarios, subtotales, fecha/hora, nota,
   referencia y acceso al acuerdo completo se conservan desde el acuerdo.
   El visor de imagen, su animación y glow no cambian. Se retira la franja
   repetida del candado y su icono pasa al título; el consentimiento aprobado
   sigue íntegro. Las acciones mantienen sus manejadores, bloqueo y permisos;
   no se desmontan al desplegar o contraer el detalle.
   Referencia: dos capturas nocturnas del cliente enviadas por Bastián el
   2026-10-17. Manifestó que le gusta la versión oscura; este ajuste concreto
   sigue pendiente de revisión móvil. Negocio e Historial conservan su detalle
   anterior. No constituye aprobación final del diseño.

Referencia: capturas de Bastián en la conversación del 2026-10-16
(Mis Pedidos, pestaña Coordinación cortada y precio duplicado).

Comprobación visual de categorías en iPhone cliente: conforme según Bastián
y captura del 2026-10-17, sobre 4ef8bec3835c510b9176c2ca12437decd65ae317.
Comprobación visual de esta versión en Android negocio: pendiente.
Aprobación final del diseño: pendiente.

## Pendientes funcionales para coordinar con Backend QA

F1. **Cliente — anular una solicitud inicial en Pendientes.** El 2026-10-17
Bastián señaló que falta “Anular solicitud” inmediatamente después de crear
el pedido, mientras espera la respuesta inicial del negocio. Solicita
recuperar esa posibilidad en su bloque funcional posterior; en este paso
únicamente se registra el pendiente, sin implementar ni habilitar acciones.

Este pendiente no incrementa el contador de modificaciones visuales implementadas.
Clasificación de la futura implementación: requiere diagnóstico y coordinación
frontend/backend sobre contrato, acción permitida, transición y compatibilidad.
El contrato frontend actual de `ANNUL_COORDINATION` se limita a
`COORDINATION_PENDING` y `COORDINATING`; no cubre la espera inicial
`AWAITING_BUSINESS_RESPONSE`. Evidencia: `coordinationApi.ts`, función
`coordinationAllowed`. No debe ampliarse ese permiso ni reutilizarse el flujo
histórico por fuera de RequestProcess sin un contrato acordado con Backend QA.
No se ha inspeccionado ni modificado el repositorio backend en este registro.

Validación local de los ajustes 1–3 (commit c205260): 58 pruebas afectadas aprobadas; suite completa con 720
pruebas aprobadas en 70 archivos. Build Vite/PWA correcto, con la advertencia
ya existente de bundle superior a 500 kB. Salida generada en
`node_modules/.cache/visual-review-build`, sin modificar `dist/index.html`.
Las pruebas de presentación inspeccionan componentes y HTML con datos
sintéticos; no sustituyen la revisión visual ni la integración en celulares.

Validación local del ajuste 4: 50 pruebas afectadas aprobadas; suite completa
con 725 pruebas aprobadas en 71 archivos; build Vite/PWA correcto. Las pruebas
del portal, foco y teclado usan DOM simulado. Bastián confirmó que quedó bien;
no especificó una comprobación independiente en cada celular.

Validación local del ajuste 5: 18 pruebas afectadas aprobadas; suite completa
con 733 pruebas aprobadas en 72 archivos; build Vite/PWA correcto, con la
advertencia de tamaño de bundle existente. Chrome local con el componente
real, CSS compilado y datos sintéticos: a 375, 393 y 430 px las cinco categorías
de cliente y negocio caben en una fila; a 320 px usan dos filas. Seis categorías
históricas se distribuyen en dos filas. En los doce casos comprobados no hubo
recorte ni desbordamiento horizontal, y el área táctil mínima fue 44 px.
Los nombres largos pueden ocupar dos líneas dentro de su pastilla, sin partir
palabras. Estas mediciones no equivalen a validación móvil de la app integrada.

Validación local del ajuste 6: 74 pruebas afectadas aprobadas; suite completa
con 738 pruebas aprobadas en 72 archivos; build Vite/PWA correcto con la
advertencia de bundle existente. Muestra local con el componente real y
operaciones simuladas, sin llamadas a la API: sin desbordamiento horizontal
ni botones recortados a 320, 375, 393 y 430 px; controles de al menos 44 px.
Chrome confirmó animación desactivada al emular movimiento reducido.
La vista estática muestra el resumen tras su animación de entrada. Esta
evidencia no valida consentimiento, WhatsApp ni el recorrido real en celulares.

Validación local del ajuste 7: 29 pruebas afectadas aprobadas (presentación y
hook de coordinación), build Vite/PWA correcto, con la advertencia de bundle
existente. Muestra local en Chrome con datos sintéticos a 320, 375, 393 y
430 px: sin desbordamientos ni botones recortados; área táctil mínima de 44 px.
No se repitió la suite completa para este cambio de clases y estilos.
La transparencia y el relieve en los celulares reales siguen pendientes de
revisión de Bastián; no constituye aprobación final del diseño.

Validación local del ajuste 8: 95 pruebas afectadas aprobadas; suite completa
con 742 pruebas aprobadas en 72 archivos; build Vite/PWA correcto con la
advertencia de bundle existente. Muestra del componente real con acuerdo y
acciones simulados, tras la animación de entrada: modo claro y oscuro a 320,
375, 393 y 430 px, sin desbordamiento horizontal ni controles recortados y con
áreas táctiles de al menos 44 px. Las condiciones se muestran antes del
consentimiento dentro de su resumen; la referencia conserva su componente.
No se hicieron llamadas a la API ni comprobaciones reales de coordinación o
WhatsApp. Revisión de la publicación en los celulares: pendiente.

Alcance: solo presentación frontend; contratos, permisos, estados, agrupación
funcional y backend sin cambios. No se guardan capturas ni datos personales
en este registro.
