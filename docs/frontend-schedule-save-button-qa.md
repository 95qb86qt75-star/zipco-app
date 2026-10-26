# Guardar horarios visible sobre la navegación — QA

Clasificación: solo frontend. El pie del editor quedaba detrás de la navegación de la app. Se coloca sobre los 80 px de navegación, siguiendo el patrón de Guardar cambios de Configuración, y se reserva espacio en el contenido desplazable.

Archivo funcional: `src/app/screens/profile/business-config/ScheduleEditorScreen.tsx`.

El primer ajuste hizo accesible el botón, pero conservaba un fallo: confirmar una hora modificaba el formulario interno y Guardar horarios recogía la lista anterior cuando se omitía Añadir a la lista.

La corrección posterior conecta el borrador de ScheduleCard con ScheduleEditorScreen. Al pulsar Guardar horarios, se aplican también las horas y días seleccionados pendientes. Flujo corregido: editar grupo con el lápiz → confirmar hora → Guardar horarios → Guardar cambios. Añadir a la lista sigue disponible para preparar varios grupos.

Guardar horarios vuelve a Configuración mostrando el horario nuevo; Guardar cambios realiza la persistencia mediante el endpoint existente. Cambiar una hora sin seleccionar días mantiene el editor abierto con una indicación. Volver atrás advierte de ediciones pendientes, aunque todavía no se hayan añadido a la lista. No se realiza guardado automático ni se inventan días.

Contrato conservado: `BusinessConfigScreen` envía `PATCH /businesses/:id`, con `schedule` como JSON serializado de los días, `enabled`, `open` y `close`. No se cambiaron payload, permisos, fechas, reglas de reserva ni backend.

Validación:

- 12 pruebas de ScheduleCard y SaveChangesBar aprobadas.
- `node scripts/check-schedule-editor.mjs`: Chrome local con componentes reales y datos sintéticos, en 320×640, 390×844 y 412×823: botón completo encima de navegación, hit testing, clic por coordenadas y aplicación de la edición sin Añadir a la lista. También cubre ausencia de días seleccionados, aviso al salir, conservación de otros días y recorrido completo de Configuración: PATCH simulado con horario nuevo y relectura al reabrir. Cinco escenarios aprobados, sin cambios de datos reales en QA.
- Build QA/PWA aprobado; aviso previo de bundle mayor de 500 kB.

Archivos: `ScheduleCard.tsx`, `ScheduleEditorScreen.tsx`, `scripts/check-schedule-editor.mjs` y este documento.

Publicación: rama `qa` por la integración GitHub → Vercel. Railway no requerido. Pendiente comprobación en Android/iPhone. `main` y producción intactos.
