# Prompt para Claude — cliente, antes de iniciar WhatsApp

Copia desde «Inicio del prompt» hasta «Fin del prompt», y adjunta los tres
archivos originales indicados más las capturas de iPhone. No uses el ZIP anterior.

## Archivos que debes obtener

| Archivo | Carpeta del repositorio | Uso en este encargo |
| --- | --- | --- |
| BusinessCoordinationCard.tsx | C:\dev\zipco-app-qa\src\app\screens\requests | Principal: modificar solo la presentación inicial del cliente. |
| CoordinationCardShell.tsx | C:\dev\zipco-app-qa\src\app\screens\requests | Cabecera: modificar únicamente si hace falta, aislando la variante cliente. |
| index.css | C:\dev\zipco-app-qa\src\styles | Solo referencia del estilo actual. No reemplazar ni devolver modificado. |

El CSS nuevo que Claude entregue se llamará customer-initial-coordination.css
y se integrará en src/app/screens/requests. No existe todavía: no hay que buscarlo.
No adjuntar package.json, MANIFEST.json ni carpetas de contexto del paquete viejo.

---

## Inicio del prompt

Quiero rediseñar visualmente la tarjeta del CLIENTE que muestran estas capturas
de ZIPCO QA c5f3c85. Adjunto solo los archivos reales necesarios. Necesito que
analices su funcionamiento, hagas el diseño y devuelvas el código completo,
explicando exactamente cómo funcionará cada parte, clic y animación.

### 1. Qué tarjeta es y cuál no es

Las capturas son Solicitudes → Mis Pedidos → Coordinación. El negocio confirmó
disponibilidad con el camino WhatsApp y el cliente YA aceptó continuar la compra.
Se ve Pedido aceptado y el contacto autorizado. Todavía está pendiente iniciar
WhatsApp. No es la tarjeta Disponible con Sí, continuar con la compra ni la
consulta posterior ¿Coordinación lista por WhatsApp?.

Aunque su nombre diga Business, BusinessCoordinationCard.tsx también dibuja
esta pantalla del cliente: business=false y embedded=false. En este encargo
solo rediseñamos esa variante, para producto y camino WhatsApp. Conserva negocio,
variantes embedded, servicios y otros caminos como están. No amplíes el rediseño
a todas las tarjetas que utilizan las mismas clases o cabecera.

### 2. Dónde está cada parte en el código actual

Las líneas son de los archivos base adjuntos; después de editar cambiarán.
No debes devolver fragmentos por número de línea: devuelve archivos completos.

BusinessCoordinationCard.tsx, 297 líneas:

| Líneas | Responsabilidad |
| --- | --- |
| 27–38 | Duraciones de autorización, formato de fecha, chispas y componente Step. |
| 41–48 | Props: pedido, perspectiva, datos del negocio, acuerdo y callbacks. |
| 50–76 | Versión actual verificada, operación, hojas, plegado, consentimiento propio y fase visual. |
| 79–104 | Permisos, recuperación, acceso WhatsApp y comportamiento legado de negocio/foco. Conservar reglas. |
| 108–136 | unlock: autorizar contacto, verificar resultado, decorar y llegar a ready. |
| 137–146 | go: abrir WhatsApp autorizado. annul: confirmar anulación. |
| 148–163 | Diálogos existentes de condiciones, acuerdo, anulación y negocio. No sustituirlos ni eliminarlos. |
| 164–180 | Variante embebida de negativa del negocio: fuera del rediseño. |
| 181–193 | Detalle compacto embebido del cliente posterior: fuera del rediseño. |
| 194–203 | Inicio de la tarjeta de estas capturas, root e identidad/cabecera. |
| 204–210 | Contenido plegable y franja Condiciones aceptadas. |
| 211–219 | Check luminoso, Pedido/Propuesta aceptada y mensaje introductorio. |
| 220–229 | Mensajes de error, reconciliación y reintento manual existente. |
| 230–253 | Pasos Aceptado / Autorizar o Autorizada; Ahora no y progreso reciente. |
| 254–272 | Tercer paso WhatsApp: bloqueado, preparando y listo para iniciar. |
| 274–280 | Aviso sobre pagos, Anular solicitud, opciones de disponibilidad y Ocultar tarjeta. |
| 283–292 | Fila cerrada: Ya puedes coordinar por WhatsApp / Autorizar contacto / Preparando. |
| 294–296 | Diálogos montados junto a la tarjeta. |

CoordinationCardShell.tsx, 46 líneas:

- 5–23: CoordinationCardHeader, foto de producto, nombre, Nueva si corresponde,
  estado y total ACORDADO. La miniatura usa ProductPreviewControl real.
- 26–45: placeholder mientras se comprueba el acuerdo; no es la tarjeta cargada.
  No habilitar botones desde el placeholder ni cambiar sus reglas de retry.
- Esta cabecera es compartida. Si la rediseñas, añade una variante de presentación
  opcional usada solo por la tarjeta objetivo, conservando el aspecto por defecto.

index.css, 2627 líneas, referencia completa, no editar:

- 2097–2251: estilos base de coordinación, franja, pasos, botones y animaciones.
- 2253–2343: fila cerrada, overrides de movimiento y plegado final.
- 2330–2332: transición de plegado 650 ms cubic-bezier(.65,0,.25,1), opacidad
  350 ms ease; cerrado desplaza -10 px y escala .97, con visibilidad diferida.
- 2336: animaciones del cuerpo plegado se pausan.
- 2343: movimiento reducido quita la transición del plegado.
- Ojo con la cascada: 2167–2181 define brillo/entrada, pero 2283–2317 contiene
  overrides posteriores. Por ejemplo 2310 elimina una animación de glowup y
  2312 redefine su sheen. Lee las reglas completas; no copies solo la primera.
- El archivo también contiene estilos de otras tarjetas. No hacer reemplazos
  globales de zipco-co-*. Crea CSS con un prefijo propio para cliente inicial.

### 3. Qué hace actualmente cada clic

| Control | Comportamiento actual que se conserva |
| --- | --- |
| Mostrar coordinación / fila cerrada | Abre con setFolded(false), llama onInspect si existe. Solo UI, sin POST. |
| Ocultar tarjeta | setFolded(true). Retiene el cuerpo montado con inert/aria-hidden; no corta operaciones o formularios. |
| Miniatura de producto | ProductPreviewControl abre imagen, descripción y datos reales del producto. No debe plegar/abrir la tarjeta ni enviar acciones. |
| Condiciones aceptadas | Abre ConditionsSheet con el acuerdo inmutable. Cerrar no envía nada. Conservar la franja reconocible y su ventana actual. |
| Autorizo iniciar coordinación | unlock → AUTHORIZE_CONTACT, con consentimiento propio y permisos del servidor; comprueba el resultado antes de desbloquear. |
| Ahora no / Revisar autorización | Cambia deferred local; no guarda una negativa ni cancela el pedido. |
| Iniciar coordinación por WhatsApp | go → OPEN_WHATSAPP. Solo con autorización propia, phase ready, permiso canOpen, sin busy/pending/recovery. |
| Anular solicitud | Abre AnnulSheet, no envía al abrir. Usa motivos reales de ANNUL_REASONS. Otro exige texto no vacío, máximo 1000 caracteres. |
| Confirmar anulación | annul → ANNUL_COORDINATION. El resultado y destino los determina el servidor; no cambiar pestaña anticipadamente. Error conserva la hoja. |
| Volver/X/cancelar diálogo | Cierra sin enviar; durante operaciones respeta el bloqueo de cierre existente. |
| Actualizar estado | operation.update: lectura/reconciliación. No es reenviar una confirmación. |
| Reintentar operación pendiente | operation.retry: misma intención/cuerpo/clave cuando el flujo lo permite; nunca automático. |
| Retirar mi permiso de contacto | Lo renderiza AvailabilityPostActions en línea 278. Es una acción REAL: abre diálogo, Confirmar envía REVOKE_CONTACT_CONSENT; Volver/X no envía. No cancela pedido ni puede retirar números ya vistos o mensajes externos. |

AvailabilityPostActions es una dependencia existente que debes conservar en
el TSX con sus props order/business/refresh. No hay que adjuntarla ni reescribirla:
mantén su integración y sus diálogos. Puedes estilizar su zona dentro de la nueva
raíz del cliente, pero no ocultar sus controles o reconstruir sus peticiones.
Conserva también ConditionsSheet, AnnulSheet y ProductPreviewControl: no están
en este encargo de rediseño de tarjeta sus ventanas ni sus implementaciones.

### 4. Secuencia y estados que el diseño debe respetar

1. Acuerdo cargando: placeholder y reintento si falla, sin inventar total/datos.
2. Aceptado sin consentimiento propio: autorizar explícitamente o Ahora no.
3. Autorizar: requesting mientras se envía; errores y recuperaciones actuales.
4. Tras consentimiento VERIFICADO reciente: loading decorativo y luego ready.
   LOAD_MS=3900; movimiento reducido=500. El aviso de autorización se agenda
   después con 2900 ms normal, 0 reducido, solo si la sesión/versión sigue válida.
5. Si ya venía autorizado, entra en ready; no reproduce la autorización reciente.
6. Iniciar WhatsApp usa el controlador existente: POST/recibo y lectura verificados,
   holograma de redirección y URL validada del backend. La espera previa actual
   de redirección es 3000 ms; no sustituirla por una URL o teléfono construido.
7. Al regresar puede aparecer la consulta dentro de la tarjeta según los permisos
   y el estado reales del servidor, incluido acceso autorizado iniciado por la otra
   parte. Eso lo controla otro componente. No lo recrees ni lo adelantes aquí.
8. Volver de WhatsApp no demuestra mensajes, pago o coordinación terminada.
9. Falta de permiso, lectura fallida o envío incierto mantiene error/recuperación.
   No anunciar éxito por animación, desbloquear con CSS ni reintentar al volver.

Los datos provienen del pedido/acuerdo: nombre, foto, productos, cantidades,
precios, fechas e isUnread. Cabecera muestra TOTAL acordado, no precio unitario.
No fijar Flores, $5.000, fechas o Nueva como decoración; son ejemplos de captura.
No usar una fecha de aceptación como fecha de autorización.

### 5. Qué puedes cambiar visualmente

Puedes reorganizar la tarjeta objetivo, compactar repeticiones y rediseñar
espacios, tipografía, iconos SVG, fondos, bordes y transiciones. Conserva visibles
y accesibles las acciones y textos de consentimiento/pagos correspondientes.
Diseña abierta y cerrada, nombres largos, varios productos, sin imagen, carga,
error, envío bloqueado y movimiento reducido. Referencia iPhone y anchos de
320, 390/393 y 430 CSS px. No tocar cabecera fija, pestañas ni barra inferior.

Usa customer-initial-coordination.css, en la carpeta de los TSX, con import real
desde el TSX. Activa su raíz/variante SOLO para cliente inicial, producto y
camino WhatsApp; el componente también tiene consumidores de negocio/servicio.
Mantén hooks, callbacks, props, reglas, diálogo y controladores. No cambies IDs
del pedido ni claves de montaje para redirigir mejor o conseguir otra apariencia.
Mantén áreas táctiles de 44 px, foco, teclado, aria-expanded/controls, inert,
safe area y movimiento reducido. Pausa decoración si está oculta o cubierta.
No añadir librerías, modificar package.json o nuevos campos/estados/API.

### 6. Qué debes devolver exactamente

1. BusinessCoordinationCard.tsx completo con el nuevo diseño, conservando todas
   las ramas fuera del alcance y la lógica de acciones.
2. CoordinationCardShell.tsx completo SI lo modificaste, con variante opcional
   que preserve sus consumidores actuales. Si no cambia, indícalo expresamente.
3. customer-initial-coordination.css completo, nuevo y aislado. No devolver
   index.css reescrito ni archivos JSON/configuración.
4. Explicación por archivo de TODO cambio: clases, props visuales, organización,
   tamaños, colores, sombras, iconos y por qué no afecta los otros recorridos.
5. Tabla de CADA clic: control → callback → efecto visual inmediato → acción o
   diálogo → guardado → éxito/error/cancelación → estado visible final.
6. Tabla de CADA animación: elemento, disparador, duración, delay, easing,
   propiedades, repetición, fin/interrupción y alternativa reduced-motion.
   Distingue propuesta nueva de comportamiento existente y decoración de espera
   de API. No cambies los tiempos del controlador como un arreglo de estilo.
7. Relato completo desde tarjeta aceptada hasta WhatsApp/regreso, sin saltarte
   permisos, mensajes, errores, anulación o retirada de consentimiento.
8. Referencia visual abierta/cerrada al mismo ancho que la captura. Indica ancho
   y datos de ejemplo. Una demo/maqueta separada no sustituye el TSX integrado.
9. Qué compilaste/probaste realmente y qué queda pendiente de Codex/iPhone.
   Si no tienes el repo completo, no afirmes que compiló toda la aplicación.

Primero explica qué tarjeta identificaste y cómo funciona hoy. Después entrega
el diseño, los archivos completos sin puntos suspensivos ni pseudocódigo, y la
explicación detallada pedida. Si necesitas modificar una dependencia adicional,
identifica el archivo y el motivo; no inventes su implementación ni amplíes el
alcance silenciosamente. Yo trasladaré esa necesidad a Codex.

## Fin del prompt

---

Control documental: fuentes revisadas en QA c5f3c85; rama qa, HEAD documental
a5f64ec antes de este trabajo. No se modifica app/API/configuración ni se ejecuta
build o despliegue. Las capturas las adjunta el usuario. La carpeta extraída del
paquete anterior que apareció sin seguimiento al iniciar se deja intacta.
