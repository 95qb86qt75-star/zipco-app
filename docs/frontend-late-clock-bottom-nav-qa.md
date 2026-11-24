# Reloj Fuera de hora sobre la barra inferior

Clasificación: solo frontend, capas visuales y recepción de toques. Captura del usuario: reloj visible sobre Inicio e impidiendo navegar.

Reproducido antes de corregir: en App/RequestsScreen/BottomNav reales, al desplazar el reloj bajo Inicio, `elementFromPoint` devolvía contenido de la tarjeta en lugar de la barra. El SVG del reloj tenía z-index 1 y no estaba contenido en un contexto propio; la barra inferior no tenía una capa explícita.

Cambios:

- `src/app/screens/requests/late-initial.css`: aislamiento de capas en la tarjeta del negocio y reloj decorativo con pointer-events:none. Conserva la animación y acciones de la tarjeta.
- `src/app/screens/BottomNav.tsx`: z-30 para mantener la barra por encima del contenido y por debajo de los diálogos.
- `scripts/check-bottom-nav-layers.mjs`: reproducción con App y barra reales; HTTP sintético, sin pedidos reales ni mutaciones.

Validación: tres escenarios de navegador a 320, 390 y 430 px. Se coloca intencionalmente el reloj bajo Inicio, se comprueba que la barra recibe el toque, que un diálogo de confirmación sigue por encima y que un clic por coordenadas abre Inicio. Capturas revisadas en `node_modules/.cache/bottom-nav-layers`. Build QA/PWA aprobado; aviso conocido de bundle superior a 500 kB. No se repite la batería funcional anterior para estas tres reglas de presentación.

Sin campos ni endpoints nuevos. Se utilizan las lecturas actuales de listas y capacidad en la reproducción sintética; no se envían acciones de pedido. No cambia el contrato, permisos, estados ni push.

Publicación únicamente rama qa mediante integración GitHub → Vercel QA. Pendiente confirmación física Android/iPhone del usuario tras recargar la versión publicada. Railway QA no es necesario; main y producción intactos. Documentos locales ajenos conservados fuera del commit.
