# Botones de propuesta — ajuste a las referencias

2026-11-08. Solo frontend, presentación. Usuario aporta referencias suficientes;
no necesita volver a pedir código a Claude para este ajuste acotado.

Archivos: proposal-chat.css y proposal-waiting.css. Bajo zipco-pw/zipco-pz:
degradados verdes/turquesa y violeta limpios, check menor con borde, texto sin
sombra, sin blobs ni brillo superior grande. Aceptar sin importe queda centrado;
cuando existe importe conserva su cápsula a la derecha. Revisar historial y
responder queda violeta, centrado y sin flecha, según referencia.

Mantiene el recorte redondo y aislamiento de las capas; extiende ese recorte a
los botones de aceptar del diálogo y elimina allí backdrop blur. Foco visible
interior. Preserva iconos/gradientes y botones Volver/Contraponer/Rechazar del
diseño aprobado. No modifica componentes compartidos ni acciones, API, campos,
permisos o recuperaciones. No hay animación permanente nueva.

Verificación proporcional: tres grupos Chromium a 320/390/430 px con componentes
reales y HTTP simulado, estilos calculados de recorte/radio/aislamiento/filtro,
sin desborde, toques por coordenadas en Aceptar/Revisar historial, volver y Esc,
cero POST. Capturas de tarjeta, conversación y confirmación inspeccionadas.
No se repiten unitarias de envío: no cambia TSX ni lógica. Build QA/PWA aprobado,
Vite 9,78 s, 2408 módulos y diez entradas precache. No hay tsc configurado.
Pendiente comprobación física y comparación al mismo ancho en iPhone.

Evidencia ignorada: .cache/proposal-clean-buttons/run.mjs y results en
.cache/proposal-button-clip/results.json; capturas clean-* en
.cache/customer-proposal-redesign/. No se enviaron decisiones ni pedidos reales.

Tiempos: análisis 61 s; implementación/preparación, validación y build en paralelo
51 s. Build Vite 9,78 s incluido en ese intervalo; no sumar dos veces. No se
inventan subdivisiones sin instrumentación. Documentación/publicación se completan
al cierre.

Rama qa, publicación pendiente al redactar. Railway no necesario. Main y producción
intactos. Solo estilos de los botones del cliente, no otras variantes de negocio.
