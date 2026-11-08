# Capa rectangular en botones de propuesta del cliente

2026-11-08. Solo frontend, CSS visual. Usuario adjunta rectángulos translúcidos
alrededor de Aceptar y Revisar historial y responder en iPhone.

Inspección local: wrappers y botones tenían radio 999 px y overflow hidden, pero
ambos botones conservaban backdrop-filter blur(5px) saturate(1.9) brightness(1.08).
No había aislamiento ni clip-path explícito en el wrapper. La captura es compatible
con una capa compuesta sin recorte; no se reproduce ni se certifica la composición
de Safari físico desde Chromium.

Cambio único de producto: proposal-waiting.css. Bajo zipco-pw y
zipco-proposal-entry-actions, recorta cada wrapper mediante clip-path inset redondo,
isolation isolate y overflow hidden. Quita backdrop-filter y filter de esos dos
botones; conserva gradientes, iconos, texto y acciones. Foco visible con offset
interior para que el recorte no lo tape. No modifica los botones compartidos ni
el diálogo, el negocio, contratos o API.

Pruebas proporcionales: tres grupos Chromium 320/390/430 px, estilos calculados
de ambos wrappers y filtros, capturas sin rectángulo en Chromium, sin desborde,
toques por coordenadas/elementFromPoint de los dos accesos, volver y Esc, sin POST.
Reutiliza el arnés de propuestas con controles reales y HTTP simulado. No repite
48 unitarias de lógica por este cambio CSS; no cambia permisos, callbacks o envío.
Build QA/PWA aprobado: 2408 módulos, Vite 7,47 s, diez entradas precache.
Sin tsc configurado; pendiente revisión del mismo artefacto en iPhone.

Evidencia local ignorada: .cache/proposal-button-clip/results.json y run.mjs;
capturas fixed-buttons-320/390/430.png en .cache/customer-proposal-redesign/.

Tiempos: análisis/inspección 93 s; implementación, preparación y comprobaciones
46 s. Build 7,47 s Vite en paralelo, no se suma nuevamente. No se inventa una
separación no instrumentada de preparación/ejecución. Documentación/publicación
se completan al cierre. No se cambiaron herramientas.

Rama qa; publicación pendiente al redactar. Railway no necesario. Main y producción
intactos. No se crearon pedidos ni se enviaron decisiones o notificaciones reales.
