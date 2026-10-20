# Registro de revisión visual — Frontend QA

Actualización 2026-10-19: Bastián indicó guardar cada bloque terminado con
código, pruebas y documentación, y el resultado posterior en un cierre documental.
Las confirmaciones de funcionamiento se registran con su alcance y versión;
no se exige una frase literal para dar conformidad a un ajuste concreto.
La aprobación de un ajuste no implica aprobación global de todas las pantallas.
El [cierre documental QA-DOC-CLOSURE-01](frontend-qa-documentation-closure.md)
respalda los pendientes previos y distingue sus notas históricas del estado reciente.

Ronda iniciada el 2026-10-16. Cada publicación es una versión de revisión,
no una aprobación final. El cierre requiere la confirmación expresa de Bastián:
“Ahora estoy conforme con este diseño”.

Base de esta ronda: d5204934b1f6b7b5ac360733af4e641292acbe4c.
El commit que incorpora cada entrada identifica su versión exacta en Git.

## Modificaciones acumuladas: 9

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
   2026-10-17. Manifestó que le gusta la versión oscura. Posteriormente
   Bastián confirmó “quedó bueno” con capturas del iPhone cliente sobre la
   versión 6bfc308a1d41e8a2da2eec91e3d338841d27afe6. La comprobación independiente
   en Android negocio sigue pendiente. Negocio e Historial conservan su detalle
   anterior. No constituye aprobación final del diseño.
9. **Navegación local — volver del acuerdo a su pestaña de origen:** los
   enlaces “Abrir acuerdo” conservan participante y categoría de la lista
   mediante parámetros de navegación validados. “Volver a Solicitudes” vuelve
   a Coordinación cuando el acuerdo se abrió desde esa categoría; también se
   conserva En curso o Historial según el origen, sin enviar al cliente a la
   vista del negocio. Los enlaces antiguos de Historial siguen funcionando.
   Solo se admiten las categorías locales reconocidas; no se acepta una URL
   arbitraria de retorno ni se copian parámetros ajenos. No se almacena nueva
   información de la cuenta, ni se modifican API, permisos o estados.
   Reportado por Bastián el 2026-10-17 tras aprobar visualmente el ajuste 8.
   Comprobación de la navegación publicada en celulares: pendiente.

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

## Propuestas pendientes de definición — no implementadas

P1. **Posible ajuste 10 — avance compacto dentro de Revisar condiciones.**
Bastián solicita mostrar qué se ha completado y cuál es el paso actual, en
el detalle integrado de la solicitud, sin otra tarjeta grande. Fuente:
conversación y referencias visuales del 2026-10-17. Idea solicitada; textos,
hitos y presentación definitivos todavía por cerrar. No incrementa los nueve
ajustes implementados ni constituye aprobación final del diseño.

Diagnóstico: requiere decidir el alcance antes de implementar. El contrato
actual del acuerdo expone `customerAcceptedAt`, `businessAcceptedAt` y
`confirmedAt` (`agreement.ts`). La aceptación fija confirmada devuelve
`COORDINATION_PENDING` y `agreementPublicId`; las condiciones se consultan
por `GET /request-processes/:id/agreement`, donde `:id` es el proceso
(`requestProcessApi.ts`). No se envió ninguna petición en este diagnóstico.
El proceso también diferencia `COORDINATING` e `IN_PROGRESS`
(`requestProcess.ts`). Esto permite presentar el acuerdo confirmado y la
fase vigente sin inventar una transición ni un nuevo endpoint.

Propuesta mínima: “Solicitud registrada” y “Condiciones aceptadas por ambas
partes” completadas, con “Coordinación pendiente” como fase actual cuando el
proceso y el acuerdo válidos lo acrediten. Ubicación: al principio del detalle
que se despliega bajo el resumen de condiciones, sin tarjeta exterior nueva,
sin porcentajes ni “3 de 4” hasta definir todos los hitos.

No confirmado: un hito independiente “Negocio confirmó disponibilidad” o
“Pedido recibido por el negocio”. Los DTO actuales no incluyen evidencia
separada de esa confirmación, entrega de notificación o lectura. Consultar a
Backend QA si disponibilidad es únicamente la aceptación del pedido o una
acción distinta. No duplicar la aceptación como dos eventos diferentes, usar
`createdAt`/`updatedAt` con otro significado ni afirmar WhatsApp abierto o
mensaje enviado. Si se necesita una confirmación adicional, acordar primero
su contrato; no se propone todavía un campo, endpoint ni estado nuevo.

Compatibilidad requerida: pedidos antiguos sin proceso sin cambios; proceso
malformado o estado desconocido sin marcas ficticias; carga y error del acuerdo
sin presentar hitos confirmados; consentimiento no inferido de datos ausentes.
La fase y el mensaje de atención deben corresponder a los datos del servidor;
no pedir autorización de contacto si el cliente ya la otorgó. No ampliar
Alternativas u otras fases por esta propuesta.

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

Validación local del ajuste 9: 69 pruebas afectadas aprobadas; suite completa
con 753 pruebas aprobadas en 73 archivos; build Vite/PWA correcto, con la
advertencia de tamaño existente. Las pruebas reproducen el fallo anterior y
comprueban enlaces reales renderizados, retorno por participante y selección
de categoría al cargar Solicitudes, con listas y sesión simuladas. Cubren
Coordinación, En curso, Historial, enlaces antiguos y parámetros desconocidos.
No se ha comprobado todavía el recorrido publicado en ambos celulares.

Alcance: solo presentación frontend; contratos, permisos, estados, agrupación
funcional y backend sin cambios. No se guardan capturas ni datos personales
en este registro.

## Referencia de colores de los resúmenes — UI-PALETTE-01

El 2026-10-17 Bastián pidió dejar documentados los colores anteriores de selección
después de detectar que Listos había pasado a verde teal. Se añade una referencia
explícita para no depender únicamente del historial Git:

- Pendientes: ámbar/naranja; texto blanco al seleccionar.
- Esperando respuesta: violeta; texto blanco al seleccionar.
- En curso: verde/cian; texto blanco al seleccionar.
- Listos: naranja/ámbar; texto blanco al seleccionar; fondo ámbar claro sin
  seleccionar. Teal oscuro no es el color de referencia de Listos.

La tabla de clases exactas, fuente Git, diferencias cliente/negocio, alcance y
pendiente de restauración están en
[frontend-ready-summary-color-qa.md](frontend-ready-summary-color-qa.md), sección
«Paleta de referencia recuperada — UI-PALETTE-01».

Este registro no suma una modificación de UI a las nueve enumeradas arriba:
documenta la referencia de color. Los bloques posteriores de Pedido listo,
confirmaciones y corrección de selección se registran por separado en sus
informes. No se declara un total global nuevo ni cierre del diseño.

QA publicado sigue en `683576b`, con teal en el resumen Listos. Restaurar el
naranja/ámbar permanece pendiente de implementación y comprobación móvil. La
documentación de un diseño no acredita que ya esté desplegado ni sustituye las
capturas y la versión que Bastián confirme posteriormente.

## Regla de identificación y recuperación del diseño

Bastián indicó que nombre + commit deben quedar siempre documentados para
recuperar los diseños y comprobar el futuro pase a producción. Para cada cambio
de UI, registrar:

- Nombre estable de pantalla/componente y del ajuste, con identificador de
  seguimiento cuando exista y ruta de código.
- Commit completo de 40 caracteres que contiene el ajuste. Antes de crearlo,
  indicar «local, sin commit»; actualizar la referencia después de crearlo.
- Versión publicada en QA y despliegue, si corresponde; no confundir el commit
  de referencia con el que está publicado o con uno aprobado por Bastián.
- Capturas de referencia/aprobación y dispositivo comprobado, cuando existan;
  marcar lo pendiente y no inventar conformidad de otro celular.
- Estado: propuesto, implementado localmente, publicado para revisión,
  conformidad parcial o aprobación expresa, según la evidencia disponible.

El commit identifica una versión completa de frontend; el nombre y la ruta
permiten localizar la parte del diseño. Una captura del chat debe incorporarse
al registro de aprobación o quedar referenciada como pendiente de conservar.
El documento también necesita su propio commit para quedar respaldado en Git:
una anotación local no se considera documentación versionada ni publicada.
No incluir automáticamente documentos pendientes en commits de otro bloque.

Al pasar a producción, contrastar el catálogo con el commit completo aprobado,
las capturas y la configuración de cada ambiente. No reconstruir el diseño ni
seleccionar únicamente el último arreglo visual. La aprobación final sigue
requiriendo la confirmación expresa indicada al inicio de este registro.
# Ajuste de tipografía de categorías — UI-CATEGORY-TYPE-01

Registro: 2026-10-18. Clasificación: solo frontend QA.
Bastián solicitó texto de categorías de 13 px y número del contador de 14 px,
aplicado por igual a cliente y negocio.

- Implementación local: `src/styles/index.css`, reglas `.zipco-status-tab`
  y `.zipco-status-tab-count`, utilizadas por el componente compartido
  `src/app/screens/requests/RequestStatusTab.tsx`.
- El texto reemplaza el tamaño adaptable anterior de 8–11 px. El contador
  ahora tiene letra de 14 px; los 14 px mencionados antes eran su alto mínimo,
  no el tamaño anterior de la letra.
- Validación: 26 pruebas existentes aprobadas en tres archivos (pestaña
  compartida, pantalla mixta y selección de resúmenes); build QA aprobado.
  El build conserva la advertencia de tamaño de bundle superior a 500 kB.
- Se conservan colores, contadores, filtros, área táctil mínima de 44 px y
  distribución adaptable sin desplazamiento horizontal. Con el texto mayor
  pueden caber menos categorías por fila; seis categorías mantienen tres
  columnas y dos filas.
- Estado: local, sin commit ni publicación de este ajuste. Conformidad visual
  en Android/iPhone pendiente. No se interpreta la solicitud como aprobación
  final de todos los diseños.
- Sin campos o endpoints nuevos, cambios backend, Railway QA, `main` o producción.

## UI-BUSINESS-NEW-ORDERS-01 — Nombre del resumen con campana

2026-10-18. Clasificación: solo frontend QA. Bastián solicitó reemplazar
«pedidos pendientes» en la tarjeta con campana por «Nuevos Pedidos».

- Archivo: `src/app/screens/RequestsScreen.tsx`, título del resumen de pedidos
  de negocio para la categoría interna `pending`.
- Singular: «1 Nuevo Pedido». Plural: «2 Nuevos Pedidos», según contador real.
- Subtítulo conservado: «Toca para revisar y responder.»
- Se mantienen diseño, colores, campana, contador, selección y filtro. Las
  categorías y las cotizaciones conservan sus nombres actuales.
- Validación: 18 pruebas existentes aprobadas en dos archivos y build QA aprobado.
- Estado: local, sin commit nuevo ni publicación de este cambio; rama `qa`.
- Sin campos o endpoints nuevos. Vercel QA y Railway QA no se modificaron;
  `main` y producción intactos. Documentos pendientes conservados.

## Actualización F1 — UI-CUSTOMER-PENDING-CANCEL-01 — 2026-10-20

Se conserva el pendiente histórico F1 como antecedente. Backend QA publicó
REQ-CUSTOMER-CANCEL-PENDING-01 en 577c0c7 y frontend integró el contrato en
`be2614aa3c1fd174966a142b4f8229e8ae12c88d`, rama qa, Preview funcional READY.
Cliente puede anular antes de la primera respuesta únicamente con permiso;
confirmación Sí / No y conservación en Historial, sin motivo ni nuevo aviso.
975 pruebas y build aprobados. **Prueba y conformidad en celulares pendientes**;
no se declara F1 aprobado por Bastián todavía. No afecta otros pendientes.
[Contrato, archivos y publicación](frontend-customer-pending-cancellation-qa.md).

## UI-BUSINESS-PENDING-REJECT-01 — Compatibilidad y rechazo inicial — 2026-10-20

Bastián reportó en QA c505bae una solicitud en Por coordinar con resguardo de
proceso no disponible. Incompatibilidad reproducida con datos sintéticos:
Backend 772b78a añade REJECT_PENDING_REQUEST, desconocida por ese frontend.
No se capturó la respuesta real de esa solicitud ni se modificó su estado.

Integración completa en `6778c2ad4ff8b72647f44ea12db75a105bfb4be0`, rama qa:
respuesta válida en Pendientes, permiso de aceptación conservado, selección de
motivo/confirmación de rechazo y cierre en Historial de ambos participantes.
Se conservan diseño y navegación anteriores; sin cambios de backend o producción.
1021 pruebas y build QA aprobados, 24 regresiones táctiles sin backend; Preview
funcional READY. **Prueba y conformidad móvil pendientes**, sin declararlas hechas.
[Contrato, archivos y publicación](frontend-business-pending-rejection-qa.md).
