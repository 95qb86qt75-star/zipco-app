# Outfit y paleta de acciones del negocio — QA

2026-11-13. Clasificación: solo frontend, presentación. Propuesta aprobada por
el usuario: cargar Outfit 400–800 solo en Revisar propuesta del negocio y su
pop-up, unificar violeta/azul en aceptación directa y renovación, sin cambiar
textos ni acciones. No modificar cliente ni fuente global.

## Cambios

src/app/features/requests/cards/shared/proposal/proposal-chat.css importa
fonts/proposal-outfit.css. Esa hoja declara la familia privada Zipco Proposal
Outfit (fuente Outfit real), rango variable 400 800, normal y font-display:swap.
Se usa solamente en .zipco-bz y .zipco-bz-pop. No se declara Outfit genérica,
para evitar activar reglas de otras tarjetas que ya mencionan ese nombre.
Body y cliente mantienen la fuente del sistema.

Se usa una variable CSS de fondo para .zipco-bz-same/.zipco-bz-send y el
AcceptGlassButton dentro de .zipco-bz. Importe con fondo violeta. Los callbacks,
permisos, validaciones, endpoints y campos no cambian. Aceptar contrapropuesta
conserva ACCEPT_COUNTER_PROPOSAL; Aceptar y confirmar conserva la revisión
de PROPOSE_FINAL. No son acciones equivalentes aunque compartan paleta.

Archivos nuevos en fonts/: proposal-outfit.css, outfit-latin.woff2 (32292 bytes),
outfit-latin-ext.woff2 (14808 bytes) y OFL.txt original. Fuentes descargadas del
proveedor oficial, sin dependencia de red externa al abrir la ventana:
https://fonts.googleapis.com/css2?family=Outfit:wght@400..800&display=swap
https://fonts.gstatic.com/s/outfit/v15/QGYvz_MVcBeNP4NJtEtq.woff2
https://fonts.gstatic.com/s/outfit/v15/QGYvz_MVcBeNP4NJuktqQ4E.woff2
https://raw.githubusercontent.com/google/fonts/main/ofl/outfit/OFL.txt
Vite genera nombres de assets con hash. Sin cambios de dependencias/configuración.

## Verificación

Arnés existente con componentes reales y HTTP simulado. Dos variantes por
tres anchos (320/390/430): document.fonts.load para 400,500,600,700,800 y texto
Latin Extended, ambas caras cargadas, pesos 400 800 y familia calculada correcta.
Recursos WOFF2 locales, body conserva familia anterior. Fondos calculados de
ambas acciones idénticos; sin desborde y controles del pie >=44 px. Toques por
coordenadas abren sus revisiones diferentes y no hacen POST automáticamente.
Control cliente 390: fuente anterior y degradado verde conservados. Sin
excepciones JavaScript. Scripts ignorados prepare-bz-outfit.mjs/bz-outfit-browser.mjs.
La primera preparación tenía un escape de comillas incorrecto: corregido solo
en el arnés. No se repite suite funcional/API general: no se tocó TSX ni dominio.

Build QA/PWA aprobado: Vite 8,66 s, 2412 módulos, diez precaches; incluye assets
de fuente locales. No tsc configurado. Pendiente prueba física Android/iPhone.
Sin nuevas llamadas de API ni pedidos/push reales. Railway innecesario.
Main y producción intactos; handoff ajeno conservado.

## Tiempos

Análisis/adquisición de assets 66 s; implementación 49 s; preparación inicial
42 s; ejecución/corrección del arnés 42 s; build/verificación 22 s, incluye Vite
8,66 s (no sumar otra vez). No son mediciones del rendimiento de la app.
Documentación y publicación se registran al cierre.

Documentación/preparación de publicación 53 s; publicación/verificación 44 s,
incluye espera externa. Rama qa, commit 177cab80ef6e0e27f53fe3207f184a6ddd89dbba.
Vercel success verificado para ese SHA:
https://vercel.com/zipco-s-projects/zipco-app/A519SxzKQKBP55o9ijyqgNhj8Uyz
Sin inspección independiente del bundle protegido ni teléfono físico. Cierre
documental local sin push para evitar otro despliegue.
