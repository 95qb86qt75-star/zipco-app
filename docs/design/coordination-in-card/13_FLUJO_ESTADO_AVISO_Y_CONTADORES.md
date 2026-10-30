> Referencia vigente: paquete codex_final2. Implementar sobre el repositorio, sin sobrescribir sus componentes con adjuntos.
> Correcciones de contrato: coordinationAccepted (no decision); conteos calculados en frontend desde listas reales. Falta inicial sigue Por coordinar; RESPOND false vuelve allí; RESPOND true ya estaba y permanece En curso. Ningún contador se altera por reproducir una captura.
> Un envío incierto no puede decir «No se guardó»: conserva la recuperación y el reintento exacto. «Ya coordinamos» abre el detalle; solo una acción autorizada y confirmada cambia la negativa persistida. No se reabre por un marcador local.
> No existe una fecha de autorización en coordination: el paso muestra Confirmada, sin reutilizar acceptedAt/updatedAt. Fotos y detalle usan productPreview ya publicado, nunca customerImage. La tarjeta de disponibilidad normal ya existe y conserva sus correcciones v2.
> Los hologramas de resultado existentes se conservan; no se restaura el antiguo diálogo flotante de pregunta de coordinación. La consulta sigue dentro de su tarjeta. El aviso espera a que termine el holograma y se encola.
> La copia adjunta BusinessCoordinationCard carece del soporte embedded del HEAD actual; se conserva y modifica el archivo del repositorio.

# 13 · Patrón único de cambio de estado: resultado → salida → aviso inferior → contadores (cliente Y negocio)

Aplica a TODA acción que mueva un pedido de estado desde una tarjeta (coordinación Sí/Falta, disponibilidad confirmar/retirar/continuar/rechazar, aviso de listo, recepción, etc.), en las pantallas de cliente y de negocio. Un solo componente reutilizable; la lógica de cada acción no cambia.

## Secuencia
1. **Guardando** (`operation.busy`): botones reemplazados por spinner + «Guardando»; la línea de estado dice «Guardando respuesta…». Sin doble toque.
2. **Resultado** (acción aplicada y verificada con el servidor, como hoy en `presentCustomerProgress`): ~1,5 s con la tarjeta del mismo tamaño. Color: verde = avanza (p. ej. En curso), ámbar = queda/vuelve pendiente (Por coordinar), rosa = error.
3. **Salida:** si el pedido cambia de pestaña, la tarjeta se pliega (alto→0, opacidad→0, sube ~28 px y se encoge, ~0,5 s) y desaparece de la lista actual. Si sigue en la misma pestaña, no sale: solo cambia de estado.
4. **Aviso inferior (toast)** sobre la barra de navegación, ~4,5 s: icono de color + título + una línea + botón «Ver». «Ver» abre la pestaña de destino y resalta la tarjeta recién llegada (destello verde ~2,4 s). Ejemplos: «Pedido en curso / Avisamos al negocio. Falta que confirme.» · «Sigue en Por coordinar / Avisamos al negocio que aún falta coordinar.» (negocio: «Pedido en curso / Ya lo encuentras en la pestaña En curso.» · «Volvió a Por coordinar / Falta coordinar con el cliente antes de empezar.»). El texto y el destino salen del estado REAL devuelto por el servidor.
5. **Hologramas existentes se mantienen** (p. ej. «¡Pedido recibido!», aviso listo): corren completos y, cuando terminan, aparece el aviso inferior con «Ver». El aviso no los reemplaza ni se superpone.
6. **Contadores de pestañas:** cuando un número cambia (sube o baja) el chip hace un «chispeo» ~0,8 s: el número rebota (escala 1→1,7→1 con halo verde) y salen 4 destellos ✦ (amarillo, verde, rosa, cian). Se dispara por cambio del valor real (tras `refresh()`), no por temporizador; si el valor no cambia, no hay animación (p. ej. Falta del cliente no cambia el contador de Coordinación). Alternar dos nombres de animación para poder re-disparar.
7. **Error:** la tarjeta NO sale; vuelven los botones y la línea de estado dice en rosa «No pudimos confirmar el envío; comprueba el estado». Se conservan «Actualizar estado» y «Reintentar el mismo envío».

## Componentes sugeridos
`StatusChangeFlow` (idle/confirm/saving/success/error), `StatusToast` (portal fijo sobre la nav, apilable en cola, `role="status"`), `useChipBump(value)`. Reutilizar tipografías/colores Aurora existentes.

## Referencias
`referencia-cliente-2-falta-si-en-curso.png` (aviso + En curso), `referencia-negocio-flujo-si.png`, `referencia-negocio-flujo-falta.png`.

## Alcance comprobado de esta entrega

Se aplica a las acciones de pedidos versionados ya integradas en StatusChangeFlow (ambos roles). Las cotizaciones y recorridos legados sin requestProcess conservan su comportamiento existente. No se afirma que se hayan rediseñado esos recorridos distintos. El resultado conserva la altura real de la tarjeta; el foco espera al pedido concreto si sus condiciones llegan después de navegar.
