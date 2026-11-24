# Funcionamiento actual que el diseño debe conservar

## Identidad y recorrido

Las capturas no son la decisión Disponible. Muestran compra aceptada en Coordinación,
antes del primer acceso autorizado. ProcessOrderCard monta WhatsappCoordinationPanel
desde antes del acceso y decide si usa la tarjeta inicial o la consulta posterior.
BusinessCoordinationCard con business=false y embedded=false es la tarjeta inicial.
El controller debe sobrevivir al refresco para terminar la redirección.

El acuerdo inmutable entrega nombre/descripción/cantidad/precios/fecha aceptada.
La foto corresponde al productPreview real, con fallback neutro. El precio de
cabecera es el total ACORDADO; el detalle del producto distingue precio unitario
y subtotal. No sustituir el total por un precio unitario ni inventar fecha de
autorización. Nueva procede de isUnread y no es una etiqueta decorativa fija.

## Estados a describir y representar

| Situación | Fuente y presentación actual | Límite |
|---|---|---|
| Cargando acuerdo | CoordinationCardShell, precio por verificar y retry si falla | No habilitar acciones desde datos incompletos |
| Aceptado, contacto propio pendiente | canAuthorize/allowedActions; autorización explícita y Ahora no del cliente | No confundir permiso del negocio con el del cliente |
| Autorización enviada | phase requesting; bloqueo y recuperación reales | No anunciar éxito al tocar |
| Autorización comprobada reciente | latest verificado; phase loading, progreso decorativo y después ready | No desbloquear por un timer sin consentimiento servidor |
| Ya autorizado | ready directamente al entrar | No repetir la animación de nueva autorización |
| OPEN ausente | Botón bloqueado y explicación/actualización según fuente | No habilitar por teléfono, CSS o localStorage |
| Iniciar WhatsApp | POST/recibo y GET actuales; holograma redirecting, destino validado del servidor | No construir wa.me ni teléfono en la UI |
| Regreso | Consulta en tarjeta si la lectura/allowedActions permite confirmar o responder | Regresar no confirma mensajes, pago o coordinación |
| Operación incierta | Mensaje y recuperación, mismos datos/clave si procede | Sin reintentos automáticos |
| Permiso retirado | Cambia solo el consentimiento según respuesta/recuperación real | No cancela pedido ni retira números ya vistos |

## Cada clic existente

| Control | Recorrido actual | Resultado/errores que se conservan |
|---|---|---|
| Cabecera/miniatura de producto | ProductPreviewControl abre imagen y descripción del producto, con precios/cantidad cuando existen | Cierra su propio diálogo; el toque no debe plegar tarjeta ni enviar acciones |
| Abrir tarjeta / Ya puedes coordinar por WhatsApp | setFolded(false); notificationOpen puede abrir explícitamente | Solo UI, sin POST; conservar enfoque y aria-expanded |
| Condiciones aceptadas | setSheet('cond'); ConditionsSheet usa el acuerdo real | Abrir/cerrar no envía acciones. El cliente no debe ganar accesos adicionales de negocio |
| Autorizo iniciar coordinación | unlock y AUTHORIZE_CONTACT, consentimiento propio, recibo/GET | Bloqueo de doble toque; conserva texto de autorización, error y recuperación |
| Ahora no / Revisar autorización | deferred local | No registra negativa ni cambia estado del pedido |
| Iniciar coordinación por WhatsApp | go y OPEN_WHATSAPP con permisos/consentimiento | Bloqueado con busy/loading/recovery/pending; holograma y navegación solo con comprobaciones existentes |
| Anular solicitud | setSheet('anul'); elegir motivo de ANNUL_REASONS y detalle si OTHER | Abrir/cancelar no envía. Confirmar llama annul. Error conserva hoja; anulación real puede pasar a Historial según servidor |
| Otro motivo | textarea obligatoria, maxLength 1000, texto no vacío | No inventar otros reasonCode |
| Retirar mi permiso de contacto | AvailabilityPostActions abre diálogo revoke; Confirmar REVOKE_CONTACT_CONSENT | Acción REAL. No eliminarla por creer que era solo visual. Volver/X sin POST; resultado según hook existente |
| Actualizar estado / permiso | operación update y reconciliación de lectura existente | No reemplazar por reenviar una confirmación |
| Reintentar operación pendiente | retry de la intención existente cuando se ofrece | Misma intención/clave/cuerpo; nunca reintento automático |
| Ocultar tarjeta | setFolded(true); cuerpo permanece montado, inert y aria-hidden | La reapertura no debe perder formularios ni cortar la operación |

El comportamiento de anulación/permiso puede abrir diálogos globales. Conservar
portal, bloqueo durante envío, foco, Escape y cierre exterior de Radix. Mantener
el espacio de la barra inferior y la cabecera fija; no superponer botones invisibles.

## Después de WhatsApp: contexto, no objetivo del rediseño

El servidor habilita CONFIRM cuando procede el primer Sí (incluido acceso válido
de cualquiera). Primer Sí pasa a En curso con ronda pendiente; la contraparte
responde Sí/No. Falta abre Devolver/Cancelar: solo Devolver guarda. La negativa
inicial conserva Por coordinar y permite retomar después. Estas tarjetas usan
CustomerCoordinationCard y variantes distintas; no sustituirlas por la inicial.
No inferir el primer acceso desde el marcador local ni cambiar categorías al cargar.

## Animaciones actuales y cómo documentar la propuesta

- Plegado zipco-co-fb / zipco-co-colrow: cuerpo retenido, CSS real en index.css.
  Revisar reglas completas/overrides/reduced-motion; no deducir duración desde
  una captura. Mantener inert, aria-hidden y foco durante el plegado.
- Autorización NUEVA: LOAD_MS=3900; reducido LOAD_MS_REDUCED=500. Cuando se
  verifica consentimiento se reproduce decoración y luego ready; feedback de
  autorización se agenda 2900 ms después en movimiento normal, 0 reducido,
  sujeto a identidad/sesión y sin sustituir una acción más reciente.
- Redirección: WHATSAPP_REDIRECT_MS=3000 en ActionHologram; el hook conserva
  waitForWhatsappPreview y revalida sesión/acuerdo/permiso antes de navegar.
  La duración visual del host y la espera previa a navegar son conceptos distintos.
- Chispas, anillo, brillo de botón, línea de progreso: leer coordinationSparks,
  index.css y useCoordinationMotion. Decoran; no prueban un evento de negocio.
- useCoordinationMotion controla visibilidad, documento oculto, movimiento
  reducido y modal que cubre la tarjeta. No incorporar un setState por frame.
- No animar altura de todo el ticket cada frame ni escalar texto para ocultar
  saltos. Áreas táctiles >=44 CSS px, iconos SVG consistentes iPhone/Android,
  sin capas que atraviesen navegación inferior o intercepten otros controles.

Claude debe devolver cada duración/delay/easing propuesto, disparador, elemento,
propiedades, pausa/interrupción y versión reducida. Las duraciones de CSS deben
citarse desde su regla vigente o señalarse como propuesta nueva. No acelerar
los hooks/tiempos operativos ni las llamadas para maquillar un preview.

## API: solo referencia, no implementar otra capa

POST /request-processes/{id}/actions/{actionPath}; el cliente usa coordinaciónApi
y availabilityApi con expectedVersion, consentimiento y headers existentes.
GET de pedidos/acuerdo y normalización son la fuente del estado. El código de
hooks/API adjunto es solo lectura: no recrear fetch, headers, URLs, permisos o
intenciones desde los componentes de diseño. Cualquier contrato nuevo se propone
aparte para coordinar backend antes de implementar.

## Criterios de devolución

Explicar estado inicial, cada clic, animación, deshabilitados y cada final real.
Entregar todo código modificado completo con rutas/imports y lista de cambios.
Incluir captura/preview cerrado y abierto al ancho de referencia; estados
sin imagen, textos largos, múltiples productos, carga, error, recovery y
movimiento reducido. Expresar qué se verificó y qué queda por validar en repo
y Safari físico. El snapshot no incluye infraestructura suficiente para afirmar
que se compiló el proyecto completo fuera de su repositorio.
