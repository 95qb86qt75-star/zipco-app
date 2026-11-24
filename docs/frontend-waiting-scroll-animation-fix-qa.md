# En espera: entradas sin reinicio al desplazar — QA

2026-11-14. Clasificación: solo frontend, dos hojas CSS de la variante waiting.

Causa reproducida: las reglas agregadas en la integración anterior aplicaban
animation:none al contenido cuando cambiaban data-request-motion/scrolling.
Al quitar la bandera se creaban animaciones nuevas. No era un reinicio del pedido
ni una transición de backend. Antes: tres ciclos de banderas producían 24
animationstart en la tarjeta y 12 en el chat.

Corrección: eliminar únicamente esas reglas condicionales que quitaban entradas.
Las entradas cortas terminan una vez, incluso si comienza un desplazamiento;
los adornos conservan animation-play-state:paused y su línea de tiempo. Reduced
motion sigue intacto. No se eliminan animaciones de carga, guardado ni feedback.
Archivos: cards/shared/layout/aurora.css y cards/shared/proposal/proposal-chat.css,
bajo src/app/features/requests. No hay cambio de TSX, API, campos, permisos,
persistencia, estados o contratos. Railway innecesario.

Validación reutilizada con pantalla real y HTTP simulado, 390 px: tres alternancias
idle/scroll por tarjeta y chat, misma reproducción previa; tras corregir, cero
animationstart nuevos en ambos. Se añadieron cuatro desplazamientos reales de
rueda (arriba/abajo) al arnés. Cero POST y excepciones JS. Script ignorado:
prepare-wt-scroll.mjs / wt-scroll-browser.mjs. La prueba móvil física sigue pendiente.
No se repite suite general: solo dos reglas CSS y se verifica directamente el
ciclo de vida de la animación afectado; ningún controlador cambió.

Build QA/PWA aprobado: Vite 17,75 s, 2412 módulos, diez precaches. No tsc configurado.
Primer intento de navegador no se ejecutó: la revisión automática de permisos
agotó su plazo. Reintento único permitido ejecutado correctamente. No fue un fallo
de código ni una conclusión de seguridad. No confundir esa espera con lentitud
de la app.

Tiempos medidos: análisis/reproducción 159 s, implementación 7 s,
verificación/esperas de aprobación 399 s conjuntos (sin separar CPU y espera),
build y preparación de comprobación adicional 58 s (incluye Vite 17,75 s;
no sumar otra vez). Documentación/publicación al cierre.
Main y producción intactos. Handoff ajeno conservado.

Comprobación adicional/documentación/preparación de publicación 38 s;
publicación/verificación 43 s con espera externa. QA rama qa,
SHA 4a1702b02e80bfcb4c433e8349e55d5b30f0456e, Vercel success verificado:
https://vercel.com/zipco-s-projects/zipco-app/Ge9p4RFrgr67vXx8Eob1JL3jAqVu
Sin verificación independiente del bundle protegido ni prueba física. Cierre
documental local sin otro push/despliegue.
