> Referencia vigente: paquete codex_final2. Implementar sobre el repositorio, sin sobrescribir sus componentes con adjuntos.
> Correcciones de contrato: coordinationAccepted (no decision); conteos calculados en frontend desde listas reales. Falta inicial sigue Por coordinar; RESPOND false vuelve allí; RESPOND true ya estaba y permanece En curso. Ningún contador se altera por reproducir una captura.
> Un envío incierto no puede decir «No se guardó»: conserva la recuperación y el reintento exacto. «Ya coordinamos» abre el detalle; solo una acción autorizada y confirmada cambia la negativa persistida. No se reabre por un marcador local.
> No existe una fecha de autorización en coordination: el paso muestra Confirmada, sin reutilizar acceptedAt/updatedAt. Fotos y detalle usan productPreview ya publicado, nunca customerImage. La tarjeta de disponibilidad normal ya existe y conserva sus correcciones v2.
> Los hologramas de resultado existentes se conservan; no se restaura el antiguo diálogo flotante de pregunta de coordinación. La consulta sigue dentro de su tarjeta. El aviso espera a que termine el holograma y se encola.
> La copia adjunta BusinessCoordinationCard carece del soporte embedded del HEAD actual; se conserva y modifica el archivo del repositorio.

# 14 · Consulta «¿Coordinación lista por WhatsApp?» en la tarjeta · NEGOCIO

Ya implementada en `CoordinationWaitingCard` (AvailabilityWaitingCard.tsx) + `WhatsappCoordinationPanel`. Este documento pide AJUSTES, no reescritura.

1. **Botones Sí / Falta con vida** (solo CSS, `zipco-avw-query-*`): «Sí» verde con halo que late (box-shadow 2,2 s), brillo diagonal que barre cada ~3 s y ✓ que da un saltito; «Falta» **rojizo** (degradado #fb7185→#e11d48, X blanca más gruesa, halo rojo desfasado, rebote suave cada ~4 s) — hoy es blanco y casi no se nota. Al tocar: hundimiento a escala .86 y rebote; hover (solo con mouse) eleva 2 px. «Cancelar» de la confirmación queda neutro (blanco) y «Devolver» ámbar con su halo ámbar. Desactivar con `prefers-reduced-motion` y con las compuertas de movimiento.
2. **Ícono de WhatsApp orbitando:** la insignia verde gira en círculo alrededor del anillo de la foto (misma velocidad que el borde holográfico, 4 s) y se mantiene derecha (contra-rotación). Estado resultado: ✓ verde (Sí) / reloj ámbar (Falta).
3. **Flujo de respuesta:** adoptar el patrón del doc 13 (guardando → resultado → salida → aviso → contadores). Textos existentes se mantienen (`CoordinationWaitingCard` ya trae «Guardando respuesta…», «¿Devolver a Por coordinar?», «Se indicó que todavía falta coordinar…»).
4. **Sí → En curso** (un toque); **Falta → confirmación dentro de la tarjeta** (Devolver/Cancelar) → pedido sigue/vuelve a Por coordinar (`declined`).
5. Mantener el detalle plegable (`DetailReveal`) y el embed `data-coordination-embedded`.
Referencias: `referencia-negocio-flujo-si.png`, `referencia-negocio-flujo-falta.png`.
