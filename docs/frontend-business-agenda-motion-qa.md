# Apertura/cierre de agenda · transición local

2026-11-14, America/Santiago. Clasificación: solo frontend, presentación.
Base publicada e1731c5. Único archivo de aplicación modificado:
src/app/features/requests/screen/components/business-agenda.css.

## Diagnóstico con medición

Se reutilizó el arnés real RequestsScreen/BusinessProgressCardView, acuerdos y
HTTP simulados. Son mediciones Chromium local a 390 px, no Safari/Android físico.
Se registraron estilos calculados y rectángulos/opacidad por requestAnimationFrame
durante 1,3 s después de un clic real por coordenadas, retiro y WhatsApp.

Retiro heredaba .65 s de pliegue, opacidad .35 s y escala de texto .97 con
traslación -10 px; invitación plegada añadía .12 s de espera. WhatsApp tenía
detalle .42 s pero la invitación mantenía la transición compartida .65 s.
Estos tiempos medidos explican una espera visual; no acreditan por sí solos
un cuello de botella CPU/GPU. El cambio lateral/banda permanece conforme al diseño;
no se atribuye un fallo de rendimiento a ese cambio sin otro perfilado.

| Variante/gesto | Último cambio geométrico/opacidad antes | Después |
| --- | --- | --- |
| Retiro abrir | 709 ms | 492 ms |
| Retiro cerrar | 661 ms | 394 ms |
| WhatsApp abrir | 491 ms | 432 ms |
| WhatsApp cerrar | 422 ms | 392 ms |

Los valores incluyen render/frames y cambios de contenido; no equivalen a la
duración declarada CSS ni a un benchmark físico del móvil. El máximo intervalo
entre frames osciló 17–50 ms: no se afirma una mejora de FPS con esa muestra.
JSON completo en node_modules/.cache/business-agenda-motion/motion-before.json
y motion-after.json; script reutilizable business-agenda-motion.mjs.

## Ajuste

Solo bajo .zipco-agenda-row .zipco-co-dk: detalle con grid-template-rows 360 ms,
opacidad 200/160 ms, sin transformar/escalar texto. Invitación con altura 280 ms,
opacidad 160 ms y márgenes/padding 200 ms, sin retraso inicial. Se conserva el
ocultamiento al terminar, pointer-events, permisos, foco y manejo existente.
Reducir movimiento elimina las transiciones. Ninguna regla se aplica a tarjetas
fuera de la agenda del negocio activo; slider, spinners y feedback no cambian.

## Validación proporcional

Medición antes/después más regresión real de retiro/WhatsApp a 320/360/390/430:
miniatura/visor real sin desplegar, ancho compacto/banda completa, ausencia de
desborde, botón de 44 px, estados redundantes/no redundantes, observador quieto,
reduced motion y estado final correcto después de tres aperturas/cierres
interrumpidos a 80 ms (stress de callbacks; no se presenta como prueba física).
Cero POST y cero excepciones. Reutilizados arneses existentes, sin fallos nuevos.

No se repiten unitarias/API ya aprobadas: solo se toca transición CSS local.
Build QA/PWA aprobado, 2418 módulos, diez precaches, Vite 14,12 s; no hay tsc
configurado. Pendiente sensación física y fluidez en el móvil del usuario.
Campos/endpoints ninguno cambiado; Railway innecesario; main y producción intactos.

## Fases

Primer reloj UTC 19:27:09. Diagnóstico/preparación intercalados hasta lanzamiento
de la medición base (primer punto posterior 19:28:33); no hubo cronómetro exclusivo
para separar ambas actividades. Código CSS integrado y medición posterior en
curso a 19:29:39; resultado a 19:30:08. Preparación de regresión y lanzamiento de
build/navegador hasta 19:31:07, ambos aprobados al verificar a 19:31:32. Vite
14,12 s está dentro del intervalo solapado, no se suma nuevamente.
Documentación empieza 19:31:32; publicación/verificación se registra al cierre.
No son tiempos de rendimiento del producto. No se inventan duraciones aisladas
de implementación/preparación cuando no quedaron cronometradas individualmente.

QA publicado: 1b327f7a938c6accc5d8b51979afa845166d9e3a, origin/qa.
Push confirmado 19:32:27 UTC; Vercel success verificado 19:33:06 UTC
(39 s desde push confirmado, incluye espera externa).
https://vercel.com/zipco-s-projects/zipco-app/39JqED5dKLcdWCxV2znUNPmEr7jB
Documentación/Git hasta push: 19:31:32–19:32:27 (55 s). Cierre documental
posterior local sin push adicional. No se inspeccionó el bundle protegido
independientemente; prueba física sigue pendiente.
