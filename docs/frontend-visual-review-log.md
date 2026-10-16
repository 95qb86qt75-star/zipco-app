# Registro de revisión visual — Frontend QA

Ronda iniciada el 2026-10-16. Cada publicación es una versión de revisión,
no una aprobación final. El cierre requiere la confirmación expresa de Bastián:
“Ahora estoy conforme con este diseño”.

Base de esta ronda: d5204934b1f6b7b5ac360733af4e641292acbe4c.
El commit que incorpora cada entrada identifica su versión exacta en Git.

## Modificaciones acumuladas: 5

1. **Cliente — orden de pestañas:** Pendientes antes de Coordinación.
   Se conservan los filtros, contadores y las restantes pestañas.
2. **Cliente y negocio — pestañas horizontales:** nombre y contador en una
   fila, ancho según contenido, sin encoger ni cortar el nombre; desplazamiento
   horizontal cuando sea necesario y altura táctil mínima de 44 px.
   Esta distribución con desplazamiento fue reemplazada por el ajuste 5.
3. **Cliente — tarjeta con RequestProcess:** el estado ocupa la esquina
   superior antes destinada al precio. El total compacto se conserva solo en
   la barra de color; después de aceptar procede exclusivamente del acuerdo.
   Los pedidos históricos conservan su presentación existente.
4. **Cliente y negocio — visor de imagen adjunta:** el visor se monta en
   `document.body` para salir del recorte y las capas de las tarjetas. Cierre
   con X de alto contraste, área táctil de 48 px y zonas seguras; conserva el
   cierre al tocar fuera y añade Escape, foco dentro del visor y retorno al
   control anterior. No cambia la URL ni la fuente de la fotografía.
   Referencia: captura de Bastián del visor sin cierre visible en iPhone.
   Bastián confirmó “quedó bien” tras esta publicación; no se atribuye esa
   confirmación a ambos celulares, ya que no especificó los dos dispositivos.
5. **Cliente y negocio — categorías compactas y todas visibles:** se elimina
   el desplazamiento lateral, con nombre y contador juntos en una pastilla
   más pequeña. Se conserva un área táctil de 44 px. Cuando no caben todas en
   una fila, se distribuyen en otra, sin ocultar ni añadir categorías.
   El componente y estilo compartidos se aplican a las categorías actuales y
   quedan disponibles para las futuras. No cambian nombres, orden, contadores,
   filtros ni permisos. Sustituye la distribución del ajuste 2.
   Referencia: imagen y aprobación de Bastián en esta conversación.
   Revisión real de esta versión en iPhone y Android: pendiente.

Referencia: capturas de Bastián en la conversación del 2026-10-16
(Mis Pedidos, pestaña Coordinación cortada y precio duplicado).

Comprobación visual de esta versión en iPhone cliente: pendiente.
Comprobación visual de esta versión en Android negocio: pendiente.
Aprobación final del diseño: pendiente.

Validación local de los ajustes 1–3 (commit c205260): 58 pruebas afectadas aprobadas; suite completa con 720
pruebas aprobadas en 70 archivos. Build Vite/PWA correcto, con la advertencia
ya existente de bundle superior a 500 kB. Salida generada en
`node_modules/.cache/visual-review-build`, sin modificar `dist/index.html`.
Las pruebas de presentación inspeccionan componentes y HTML con datos
sintéticos; no sustituyen la revisión visual ni la integración en celulares.

Validación local del ajuste 4: 50 pruebas afectadas aprobadas; suite completa
con 725 pruebas aprobadas en 71 archivos; build Vite/PWA correcto. Las pruebas
del portal, foco y teclado usan DOM simulado. Bastián confirmó que quedó bien;
no especificó una comprobación independiente en cada celular.

Validación local del ajuste 5: 18 pruebas afectadas aprobadas; suite completa
con 733 pruebas aprobadas en 72 archivos; build Vite/PWA correcto, con la
advertencia de tamaño de bundle existente. Chrome local con el componente
real, CSS compilado y datos sintéticos: a 375, 393 y 430 px las cinco categorías
de cliente y negocio caben en una fila; a 320 px usan dos filas. Seis categorías
históricas se distribuyen en dos filas. En los doce casos comprobados no hubo
recorte ni desbordamiento horizontal, y el área táctil mínima fue 44 px.
Los nombres largos pueden ocupar dos líneas dentro de su pastilla, sin partir
palabras. Estas mediciones no equivalen a validación móvil de la app integrada.

Alcance: solo presentación frontend; contratos, permisos, estados, agrupación
funcional y backend sin cambios. No se guardan capturas ni datos personales
en este registro.
