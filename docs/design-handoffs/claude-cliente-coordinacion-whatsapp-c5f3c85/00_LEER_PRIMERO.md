# Entrega a Claude: tarjeta inicial de coordinación del cliente

Fecha local: 2026-10-30. Clasificación: solo frontend, documentación y copia de
código para diseño. Este bloque no modifica la aplicación ni publica.

## Mensaje para pegar en Claude

Rediseña la tarjeta del CLIENTE de ZIPCO en Solicitudes → Mis Pedidos →
Coordinación, usando las capturas adjuntas y el código real completo del ZIP.
La referencia de aplicación es QA c5f3c85dbbaa8b26821b07a908726c6d36d1b2b9.

**Identificación importante:** las capturas muestran una compra YA ACEPTADA,
con Condiciones aceptadas y contacto autorizado, antes de usar Iniciar
coordinación por WhatsApp. No es la tarjeta Disponible con Sí, continuar con la
compra, ni la consulta posterior ¿Coordinación lista por WhatsApp?. El negocio
había confirmado disponibilidad por WhatsApp y el cliente ya continuó la compra.

Aunque se llama BusinessCoordinationCard.tsx, ese archivo pinta también esta
vista del cliente con business=false y embedded=false. Es el archivo principal
de este encargo. CustomerCoordinationCard.tsx corresponde a la consulta posterior
y se adjunta como contexto para que no la confundas ni la sobrescribas.

Lee primero 00_LEER_PRIMERO.md, 01_MAPA_DE_ARCHIVOS_Y_LINEAS.md y
02_ESTADOS_CLICS_Y_ANIMACIONES.md. codigo_actual/ conserva los archivos reales
completos y las rutas del repo. MANIFEST.json identifica tamaños, SHA-256 y
versiones. Las líneas se refieren al código base, sin numeración insertada.
El paquete es una selección de fuentes para diseñar, no un proyecto autónomo
que pueda compilarse sin el resto del repo y sus dependencias.

### Qué queremos de tu diseño

Una tarjeta atractiva, clara y coherente en iPhone, sin perder información o
funciones. Puedes reorganizar visualmente la cabecera, pasos y acciones del
cliente. Mantén reconocible y funcional Condiciones aceptadas y conserva su
hoja real. Conserva fotos de producto, datos reales, precio acordado, permiso
de contacto, anulación, plegado y el acceso a WhatsApp. El producto de las
capturas es solo un ejemplo: nombres largos, varios productos, precios o fotos
ausentes también deben funcionar. No fijes importes, fechas, conteos o nombres.

No cambies la pantalla del negocio, otros estados/tarjetas, backend, contratos,
permisos, peticiones, callbacks, idempotencia ni recuperación. No cambies estados
para conseguir un diseño. Si propones una conducta de negocio nueva, descríbela
aparte como pendiente de acordar: no la simules con variables locales.

El TSX principal y muchas clases zipco-co-* son compartidos. Separa la nueva
presentación del cliente con una clase/componente propio y conserva la rama del
negocio y las variantes embedded. No sobrescribas estilos globales para arreglar
esta tarjeta. Consulta src/styles/index.css completo: allí están sus estilos
base y animaciones; coordination-v2.css no es su única fuente de CSS.

### Entrega obligatoria de vuelta a Codex

1. **Archivos de código completos** de cada archivo nuevo/modificado, con su
   ruta exacta. Sin pseudocódigo, puntos suspensivos, fragmentos omitidos o
   sustituciones por números de línea. Si creas CSS/componente, incluye imports.
2. **Inventario de cambios:** qué cambiaste en cada archivo y por qué; qué
   variantes compartidas comprobaste y cómo aislaste el diseño del cliente.
3. **Especificación visual:** medidas, espaciados, tipografía, colores, bordes,
   sombras, alturas mínimas, imágenes, SVG, truncado/ajuste de textos y botones.
   Explica cómo se ve cerrada, abierta, cargando, bloqueada, con error y sin foto.
4. **Tabla exhaustiva de clics:** para cada control, punto de entrada, callback
   existente, efecto visual inmediato, si abre hoja o envía acción, condiciones
   habilitado/deshabilitado, éxito, error, Cancelar y estado visible final.
   Incluye miniatura, Condiciones, Iniciar WhatsApp, Anular, motivos/Otro,
   Retirar permiso, Actualizar/Reintentar, Ocultar y volver a abrir.
5. **Tabla de animaciones:** elemento, disparador, duración ms, delay, easing,
   propiedades animadas, inicio/final, interrupción, repetición y comportamiento
   con prefers-reduced-motion, app oculta, tarjeta plegada y modal abierto.
   Distingue animaciones decorativas de esperas reales de la operación. No
   alteres los tiempos del controlador para que una maqueta parezca fluida.
6. **Secuencia completa narrada:** pedido aceptado → tarjeta inicial → clic
   WhatsApp → recibo/lectura comprobados → holograma de redirección → WhatsApp
   → regreso → consulta dentro de la tarjeta correcta. Explica también falta de
   consentimiento, permiso ausente, fallo de red y resultado incierto. El regreso
   no acredita que se hayan enviado mensajes, pagado o terminado la coordinación.
7. **Referencias visuales** al mismo ancho de la captura y variantes 320,
   390/393 y 430 CSS px; indica el ancho usado y si hay datos ficticios solo en
   un preview separado. No pases un preview como código listo para producción.
8. **Verificación y límites:** qué compilaste/probaste realmente y con qué
   comandos; qué no pudiste probar. Incluye checklist de integración para Codex.
   No afirmes compatibilidad Safari física sin haberla probado.

Antes de mostrar el resultado, explica brevemente qué tarjeta identificaste y
cómo funciona hoy. Después entrega el diseño y todo lo anterior. Usa las
capturas como referencia visual del estado actual; no inventes una captura
aprobada nueva. No elimines acciones porque no entran en una imagen recortada.

## Controles de integración para Codex

Al recibir la devolución, comparar con el SHA del paquete y el repo vigente,
integrar solo los cambios visuales aprobados, conservar ediciones posteriores
y revisar consumidores compartidos antes de reemplazar archivos enteros.
Validación por riesgo/dependencias, reutilizando escenarios existentes, sin
reenviar confirmaciones, crear pedidos o enviar push reales para preparar tests.
Publicar únicamente QA cuando el usuario autorice implementar ese diseño.

## Entrega y límites de este bloque

ZIP: docs/design-handoffs/claude-cliente-coordinacion-whatsapp-c5f3c85.zip.
Las capturas de iPhone las adjunta el usuario a Claude; no están embebidas en
el ZIP ni se incluyen fotos de perfil, teléfonos o datos de sesión de celulares.
El mapa y los hashes se generan del código vigente y se verifican contra las
copias. Se documentan estados/acciones existentes, sin cambiar API/endpoints.
No se ejecutan pruebas de la app/build: solo controles del paquete y diff.
Vercel conserva c5f3c85; Railway, main y producción intactos. Commit documental
local en qa, sin push ni despliegue. La devolución de Claude queda pendiente.
