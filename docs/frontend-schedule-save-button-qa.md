# Guardar horarios visible sobre la navegación — QA

Clasificación: solo frontend. El pie del editor quedaba detrás de la navegación de la app. Se coloca sobre los 80 px de navegación, siguiendo el patrón de Guardar cambios de Configuración, y se reserva espacio en el contenido desplazable.

Archivo funcional: `src/app/screens/profile/business-config/ScheduleEditorScreen.tsx`.

El selector mantiene el flujo actual: editar grupo con el lápiz → confirmar hora → Añadir a la lista → Guardar horarios → Guardar cambios. Este ajuste hace accesible Guardar horarios; no añade guardado automático al selector.

Contrato conservado: `BusinessConfigScreen` envía `PATCH /businesses/:id`, con `schedule` como JSON serializado de los días, `enabled`, `open` y `close`. No se cambiaron payload, permisos, fechas, reglas de reserva ni backend.

Validación:

- 12 pruebas de ScheduleCard y SaveChangesBar aprobadas.
- Chrome local con componentes reales y datos sintéticos, en 320×640, 390×844 y 412×823: botón completo encima de navegación, comprobación de hit testing, clic por coordenadas y aplicación del horario editado. Sin llamadas ni cambios de datos reales en QA.
- Build QA/PWA aprobado; aviso previo de bundle mayor de 500 kB.

Publicación: rama `qa` por la integración GitHub → Vercel. Railway no requerido. Pendiente comprobación en Android/iPhone. `main` y producción intactos.
