# UI-WHATSAPP-PREVIEW-3S-01 — Tres segundos antes de WhatsApp

2026-10-23. Solo frontend QA. Ajuste solicitado explícitamente: dejar el
holograma visible tres segundos antes de redirigir a WhatsApp.

Antes: OPEN_WHATSAPP mostraba el holograma y navegaba inmediatamente.
Después: tras POST y GET verificados, muestra «Te estamos redirigiendo a
WhatsApp», espera **3.000 ms** y abre el enlace existente. Aplica al cliente y
negocio cuando la vista activa el feedback. Movimiento reducido conserva los
tres segundos solicitados, sin añadir animaciones. La duración normal del
holograma Q no cambia; al salir a WhatsApp se interrumpe su visualización.

Durante la espera se mantiene el bloqueo de operación, evitando dobles envíos.
Abortar por desmontaje o cambio de sesión cancela el timer y la navegación.
Antes de abrir se comprueban nuevamente sesión/contexto, acuerdo y permiso de
la lectura más reciente disponible en la vista. La marca de regreso de WhatsApp
se escribe justo antes de navegar, conservando su comportamiento existente.
No se abre una ventana vacía ni se solicita otro POST durante el retraso.

El cierre cancelado elimina solo el holograma de su propia operación mediante
su identificador; no oculta un aviso posterior distinto.

Archivos: `src/app/screens/requests/useCoordination.ts`, `useCoordination.test.ts`
y `ActionHologram.tsx`; este documento y el catálogo de diseño.
Contrato intacto: POST `/request-processes/:id/actions/open-whatsapp` con
expectedVersion, consentAccepted y la misma Idempotency-Key existente; respuesta
navigation.url y recibo validados; GET de listas con
processContract=alternatives-v1. Sin nuevos campos, permisos ni estados.

Validación: **1.216 pruebas / 104 archivos aprobados** y build QA/PWA aprobado
(aviso preexistente por tamaño de bundle). No hay tsc independiente configurado.
Pruebas del hook comprueban cero navegación a los 2.999 ms y una
navegación a los 3.000 ms para ambos actores, un POST/GET y bloqueo del doble
toque; cambio de sesión o desmontaje cancela la salida. HTTP y navegación
simulados, sin pedidos reales. El holograma redirecting mantiene un mínimo de
3.000 ms también en movimiento reducido, para no desaparecer antes de la salida.

Pendiente Android/iPhone: iniciar coordinación, comprobar los tres segundos y
que el navegador abra WhatsApp; después volver y comprobar el flujo existente.
No se declara probado el lanzamiento real de la aplicación móvil.
Los reintentos fiables de notificaciones siguen pendientes del cierre general.

Rama qa; respaldo/publicación al cierre. Railway/backend no requeridos.
Main y producción intactos.
