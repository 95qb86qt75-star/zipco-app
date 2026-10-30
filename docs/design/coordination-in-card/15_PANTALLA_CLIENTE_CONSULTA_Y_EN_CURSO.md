> Referencia vigente: paquete codex_final2. Implementar sobre el repositorio, sin sobrescribir sus componentes con adjuntos.
> Correcciones de contrato: coordinationAccepted (no decision); conteos calculados en frontend desde listas reales. Falta inicial sigue Por coordinar; RESPOND false vuelve allí; RESPOND true ya estaba y permanece En curso. Ningún contador se altera por reproducir una captura.
> Un envío incierto no puede decir «No se guardó»: conserva la recuperación y el reintento exacto. «Ya coordinamos» abre el detalle; solo una acción autorizada y confirmada cambia la negativa persistida. No se reabre por un marcador local.
> No existe una fecha de autorización en coordination: el paso muestra Confirmada, sin reutilizar acceptedAt/updatedAt. Fotos y detalle usan productPreview ya publicado, nunca customerImage. La tarjeta de disponibilidad normal ya existe y conserva sus correcciones v2.
> Los hologramas de resultado existentes se conservan; no se restaura el antiguo diálogo flotante de pregunta de coordinación. La consulta sigue dentro de su tarjeta. El aviso espera a que termine el holograma y se encola.
> La copia adjunta BusinessCoordinationCard carece del soporte embedded del HEAD actual; se conserva y modifica el archivo del repositorio.

# 15 · Pantalla del CLIENTE · consulta de coordinación + paso a «En curso» (diseño aprobado: cabecera B + detalle A)

Referencias: `referencia-cliente-1-cerrada-detalle-falta.png`, `referencia-cliente-2-falta-si-en-curso.png`. Pantalla: Mis Pedidos → pestaña «Coordinación». Base de código: la misma `CoordinationWaitingCard` (modo cliente) y el detalle embebido (`BusinessCoordinationCard`, `data-coordination-embedded`) — **inspeccionar cómo se renderiza hoy para el cliente** (cabecera con mini-botones + detalle de pantalla completa con pasos, «Iniciar coordinación por WhatsApp», «Anular solicitud», «Retirar mi permiso de contacto») y rediseñar sin cambiar su lógica.

## 1. Problema actual
(a) Cerrada: el nombre del negocio sale cortado y no se ve el precio ni qué pedido es. (b) Al tocar «Detalle» la tarjeta se estira y ocupa toda la pantalla.

## 2. Tarjeta cerrada (cabecera B)
- **Banda superior clara** (degradado suave) con rótulo «COORDINACIÓN», la pregunta «¿Coordinación lista por **WhatsApp**?» (WhatsApp con degradado animado) y píldora «Detalle» (manito) a la derecha.
- Debajo, fila principal: **anillo holográfico con la foto** (con insignia de WhatsApp orbitando, ver doc 14 punto 2) · a la derecha del anillo: **nombre del negocio en grande** (puede ocupar 2 líneas, nunca truncado), chip «1× {producto}» y **precio** ($12.000) · a la derecha, botones redondos **Sí** (verde) y **Falta** (rojizo), con la animación del doc 14 punto 1.
- La línea de estado bajo el negocio cambia según estado: «Guardando respuesta…», «Pasa a En curso», «Negocio avisado», «Solo Devolver guarda» (confirmación), «No pudimos confirmar el envío; comprueba el estado».
- Altura ≈ 130 px. Toda la información clave se entiende sin abrir.

## 3. Detalle compacto (el de la propuesta A; se despliega DENTRO de la tarjeta con `DetailReveal`, sin ocupar pantalla completa)
Separado por línea punteada: fila producto («1×», nombre, precio, chip «Coordinando») · **tres pasos en una fila** (Aceptado ✓ fecha · Autorizada ✓ fecha · WhatsApp ● «Ahora») con línea de progreso · texto «Acuerda pago y entrega con {negocio}. **ZIPCO no recibe ni verifica pagos.**» · botón verde ancho «Iniciar coordinación por WhatsApp» (`OPEN_WHATSAPP`/acción existente) · dos botones chicos «Condiciones aceptadas ›» (abre `ConditionsSheet` existente) y «··· Más opciones» (pliega: «Anular solicitud» (`ANNUL_COORDINATION`, con su confirmación existente), «Retirar mi permiso de contacto» y el texto «Autorizo compartir el teléfono de mi perfil con la otra parte para coordinar exclusivamente este pedido.»). Los datos de pasos/fechas salen de `requestProcess` como hoy.

## 4. Flujo de respuesta (cliente)
- **Sí** (un toque): `RESPOND/CONFIRM_WHATSAPP_COORDINATION` → patrón del doc 13. Resultado verde «Coordinación lista · Pasa a En curso» → la tarjeta sale de «Coordinación» (contador Coordinación −1, banner «N pedidos en Coordinación» −1) → **llega a la pestaña «En curso»** (contador En curso +1 con chispeo) → aviso «Pedido en curso · Avisamos al negocio. Falta que confirme.» con «Ver».
- En «En curso» la tarjeta llega con destello verde: foto con ✓, nombre, chip producto, precio, estado «En curso · esperando al negocio» y el texto existente «Indicaste que ya coordinaron. El pedido está En curso; falta que la otra parte responda.» (modo `ownPending`).
- **Falta**: no guarda; confirma en la misma tarjeta («¿Devolver a Por coordinar?» · «Sí, devolver» ámbar / «Cancelar»). Al confirmar: `DECLINE_WHATSAPP_COORDINATION` (o equivalente real) → la tarjeta queda ámbar «Falta coordinar · Negocio avisado», con botón «Ya coordinamos» para abrir el detalle y continuar con una acción autorizada por backend (sin reapertura local); **no cambia de pestaña ni de contador**; aviso «Sigue en Por coordinar · Avisamos al negocio que aún falta coordinar.».
- Banner superior verde «N pedidos en Coordinación — Revisa la autorización de contacto y los siguientes pasos.» se mantiene (plegable).

## 5. Verificar con backend (ver doc 00 §A)
Cambio de estado y conteos del cliente tras cada acción; aviso a la otra parte; idempotencia. Si el cliente no tiene aún `DECLINE`/`initialDecline` habilitado en backend, «Falta» queda deshabilitado hasta tenerlo.

## 6. Pruebas
Cerrada con nombre largo (2 líneas) y sin foto; abrir/cerrar detalle; Sí → En curso (contadores, aviso, «Ver», destello); Falta → Cancelar; Falta → Devolver → «Ya coordinamos»; error y reintento; varias tarjetas (el espacio entre tarjetas se conserva al plegarse una); ≤350 px; reduced-motion; que Anular/Retirar permiso/Condiciones sigan funcionando igual.
