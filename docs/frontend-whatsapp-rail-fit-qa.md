# WhatsApp cliente · texto Pendiente sin recorte

2026-11-03. Solo frontend, distribución CSS. Antes del ajuste se reprodujo
desborde a 390 px: texto PEDIDO/Pendiente hasta x=365,33, carril hasta x=362.
No faltaban datos. Los pasos flex:none, nodos grandes y separadores agotaban
el ancho disponible, distinto según Esperando o Preparando.

Única fuente productiva modificada: cards/customer/progress/customer-receipt-card.css.
Reglas exclusivas .zipco-wa-w: pasos comparten espacio flexible, gap 4 px,
separadores de 4 px con márgenes 3 px, nodos 26 px sobre 350 px y texto que
puede envolver si lo necesita. No se trunca ni oculta la palabra. Se preservan
los iconos/animaciones, textos y el resto del diseño. StatusRail compartido
no cambia, por lo que retiro y otras tarjetas no reciben estas reglas.

Verificación con scripts/check-whatsapp-rail-fit.mjs y el runner existente:
Esperando y Preparando a 320/390/430 px, seis casos. Rangos de texto dentro
del carril, sin desborde interno ni horizontal de página, apertura por toque
real y captura inspeccionada a 390 px. Cero POST. Control negativo previo:
falló a 390 px antes de corregir. No cuenta como caso aprobado.

Build QA/PWA aprobado, 9,46 s internos; advertencia existente de chunks grandes.
No se repiten suites de acciones: cambio CSS local sin API/controlador afectado.
Campos, endpoints, acciones, estados y permisos intactos. Railway no necesario;
main y producción sin cambios. Chrome local no sustituye iPhone/Android físicos.

Publicación solo Vercel QA `ca0fcddc35e1c8440ee3605a81ffc220ff4f1093`, rama qa,
[Vercel success](https://vercel.com/zipco-s-projects/zipco-app/4ySL5JFktMr3GdZwYzeFiwkNpfVJ)
verificado. Directorio ajeno
sin seguimiento conservado. Cierre documental local sin push adicional.
Tiempos en node_modules/.cache/wa-rail-timing.json: lectura inicial no medida;
reproducción y preparación combinadas, implementación, pruebas, build,
documentación y publicación separadas. No miden rendimiento de la app.

| Fase | Tiempo de pared |
| --- | ---: |
| reproduction-and-test-preparation | 30.3 s |
| implementation | 3.1 s |
| test-execution | 28.0 s |
| build | 45.8 s |
| documentation | 8.6 s |
| publication | 81.5 s |

Build/PWA interno: 9,46 s; intervalo externo incluye espera/lectura e inspección
de captura. Corte anterior al commit documental final.
