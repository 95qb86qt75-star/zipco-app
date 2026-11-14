# Agenda detrás de la barra inferior

2026-11-14, America/Santiago. Solo frontend/presentación. Base QA 1b327f7.
Único archivo de aplicación: screen/components/business-agenda.css.

## Causa y ajuste

La agenda tenía z-index 40 y BottomNav real z-30. RequestsScreen y BottomNav
son hermanos dentro del contenedor relativo de AppView; los filtros y su texto
podían pintar e interceptar toques encima de la navegación al cruzar su zona.
Se reduce únicamente .zipco-agenda-toolbar a z-index 20, incluidos sus paneles
y scrim descendientes. Sigue encima de las tarjetas, debajo de BottomNav.
No se modifica navegación global, geometría, scroll, transiciones ni callbacks.

## Reproducción y validación

Reutilizado arnés con RequestsScreen y BottomNav reales en contenedor relativo
como AppView. HTTP/cuentas sintéticos. Se añadió espacio en el arnés antes del
toolbar para reproducir una lista larga con filtros cruzando la navegación.
No es contenido nuevo de la app. Anchos 320/390/430.

Antes: elementFromPoint en los centros de los cuatro botones inferiores
devolvía el contenido superpuesto (0/4 accesibles en los tres anchos).
Después: 4/4 accesibles en los tres anchos. Toques reales por coordenadas
ejecutan Inicio/Perfil/Favoritos/Solicitudes con el panel de filtro abierto.
Fecha/Tipo/Orden siguen abriendo; Esc cierra y restaura foco. Cero POST y
cero excepciones JavaScript. Capturas before-scroll/after-scroll y JSON
de resultados en node_modules/.cache/business-agenda-tabbar/.

Preparación: se corrigió solo un identificador de evidencia duplicado al
reutilizar el arnés. Tras baseline aprobado, un arranque de Chrome agotó 10 s
sin DevToolsActivePort; se repitió con margen conocido de 30 s. No se debilitó
la app ni cambió configuración de herramientas. No se repiten pruebas API/
dominio/slider: no se modifican esas dependencias. Build QA/PWA aprobado,
2418 módulos y diez precaches, Vite 6,77 s. Sin tsc configurado en el repo.
Pendiente reproducción física en el teléfono del usuario.

## Fases y alcance

Inicio UTC 19:38:49. Diagnóstico/preparación intercalados hasta 19:40:27;
no se inventa un reparto exclusivo. Reproducción baseline aprobada a 19:40:58.
Cambio CSS y lanzamiento de verificación posterior registrados a 19:41:17.
Build y navegador se solaparon: build/PWA aprobado al verificar 19:42:12,
resultado táctil confirmado 19:42:45. Vite 6,77 s está incluido en ese intervalo.
Documentación/publicación posteriores se registran al cierre. Esperas del
arnés no son lentitud de la app. No hubo perfilado físico CPU/GPU/Safari.

Campos/endpoints ninguno nuevo o modificado. Railway innecesario; main y
producción intactos. Solo rama qa; handoffs ajenos quedan fuera del commit.

Publicado en origin/qa: ecbf928e66c59df1cd79c95d338ee9cb06932a10.
Push confirmado 19:43:31 UTC; Vercel success verificado 19:44:10 UTC
(39 s desde push confirmado, incluye espera externa).
https://vercel.com/zipco-s-projects/zipco-app/42GJuPyE7rq2dmDvDsTMwnNh7Jsp
Documentación/Git: 19:42:45–19:43:31, 46 s. Cierre documental local sin
otro push ni build. Sin inspección independiente del bundle protegido.
