# Registro de revisión visual — Frontend QA

Ronda iniciada el 2026-10-16. Cada publicación es una versión de revisión,
no una aprobación final. El cierre requiere la confirmación expresa de Bastián:
“Ahora estoy conforme con este diseño”.

Base de esta ronda: d5204934b1f6b7b5ac360733af4e641292acbe4c.
El commit que incorpora cada entrada identifica su versión exacta en Git.

## Modificaciones acumuladas: 3

1. **Cliente — orden de pestañas:** Pendientes antes de Coordinación.
   Se conservan los filtros, contadores y las restantes pestañas.
2. **Cliente y negocio — pestañas horizontales:** nombre y contador en una
   fila, ancho según contenido, sin encoger ni cortar el nombre; desplazamiento
   horizontal cuando sea necesario y altura táctil mínima de 44 px.
3. **Cliente — tarjeta con RequestProcess:** el estado ocupa la esquina
   superior antes destinada al precio. El total compacto se conserva solo en
   la barra de color; después de aceptar procede exclusivamente del acuerdo.
   Los pedidos históricos conservan su presentación existente.

Referencia: capturas de Bastián en la conversación del 2026-10-16
(Mis Pedidos, pestaña Coordinación cortada y precio duplicado).

Comprobación visual de esta versión en iPhone cliente: pendiente.
Comprobación visual de esta versión en Android negocio: pendiente.
Aprobación final del diseño: pendiente.

Validación local: 58 pruebas afectadas aprobadas; suite completa con 720
pruebas aprobadas en 70 archivos. Build Vite/PWA correcto, con la advertencia
ya existente de bundle superior a 500 kB. Salida generada en
`node_modules/.cache/visual-review-build`, sin modificar `dist/index.html`.
Las pruebas de presentación inspeccionan componentes y HTML con datos
sintéticos; no sustituyen la revisión visual ni la integración en celulares.

Alcance: solo presentación frontend; contratos, permisos, estados, agrupación
funcional y backend sin cambios. No se guardan capturas ni datos personales
en este registro.
