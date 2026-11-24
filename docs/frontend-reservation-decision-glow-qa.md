# Cliente: decisión de reserva con Glow

Fecha: 2026-11-08. Clasificación: solo frontend, presentación e interacción local.

## Integración

Entrega completa de Claude integrada en shared/reservations/ReservationDecisionDialog.tsx
y reservation-decision.css (nuevo). Oferta real, nota plegable, contacto,
advertencia y pie fijo con decisiones. Nueva X y progreso mientras busy. Tema
claro también dentro de un host oscuro, tal como especifica la entrega.

Props, consulta readReservationOptions, comprobaciones de versión/oferta y
termsVersion, callbacks y condiciones disabled existentes conservados. Se
comprobó igualdad de fuentes del efecto de carga anterior/posterior. noteOpen
y pick son estado visual, no campos de API. Nota opcional 300 caracteres,
onConfirm(true,note.trim()) y onConfirm(false,'') sin cambios. Elegir ir sin
reserva primero cambia la vista y no envía. Consentimiento recibido del padre
sin autoactivación. canChooseWithoutPreview conserva su lista de errores.

Única adaptación sobre la entrega: la explicación con needId se renderiza
fuera de contactField, para conservar una razón accesible del bloqueo de pago
incluso cuando no se ofrece el control de contacto. Sin cambiar permisos ni
habilitar una acción adicional. ReservationOfferSummary y demás archivos
protegidos intactos; doble punto de fecha preexistente no corregido aquí.

API sin cambios: GET /request-processes/:id/reservation-options con contrato
availability-v3 y cabecera de horarios existente; el padre conserva POST
/request-processes/:id/actions/continue-request, conditionsAccepted,
customerContactPreference, reservationChoice, offerId, termsVersion, note y
noReservationAcknowledged según corresponda. Mismos UUID/headers/permisos.
No migraciones ni variables nuevas; Railway innecesario. Main/producción intactos.

## Verificación proporcional

- 53 unitarias aprobadas: simplifiedReservationContract, reservationTermsErrors,
  serviceHoursAdvisory. Seleccionadas por las dependencias de las condiciones y
  su recuperación. No se repitieron pruebas de otras tarjetas sin dependencia.
- 14 grupos Chromium con React/Radix, resumen, sesión y parser/API de opciones
  reales; transporte/cuentas sintéticos. Responsive 320/390/430; nombre largo;
  nota plegada/conservada/recortada; pago con permiso explícito; ir sin reserva
  con contacto opcional; oferta NONE; sin contacto ofrecido; carga bloqueada;
  error permitido sin preview frente a error de red/cambio de oferta; actualizar
  condiciones; error externo; nota de 400 recortada a 300; busy bloquea campos,
  X, Escape y clic fuera; movimiento reducido; host oscuro con diálogo claro.
- Dos recorridos adicionales con AvailabilityFlowCard real, transporte sintético
  del arnés V3 ya existente: solicitar reserva gratuita y confirmar sin reserva.
  Un POST por recorrido, elección/nota/ack correctos; la gratuita queda confirmada
  por la oferta de prueba. Elegir la variante sin reserva no envía por sí solo.
- Evidencias temporales ignoradas: node_modules/.cache/reservation-decision-design/.
  No cambios de herramientas, dependencias, contratos o configuración. Cero
  pedidos, pagos, uploads y notificaciones QA reales.
- Build QA/PWA aprobado, 2408 módulos, 10 entradas precache, bundling 21,48 s;
  aviso conocido de chunks grandes. Repo sin configuración/compiler tsc: no se
  afirma comprobación completa de tipos. git diff --check aprobado.
- Pendientes iPhone/Android físicos, fluidez percibida y backend real. Chromium
  con datos sintéticos no acredita interacción física ni entrega WhatsApp/push.

## Tiempos y publicación

Lectura inicial previa al cronómetro no estimada. Análisis 66 s; implementación
121 s; preparación 38 s; ejecución/revisión 186 s (incluye preparar los dos
escenarios adicionales del padre). Build y unitarias (1,96 s runner) solapados
con esa ventana, sin sumarlos otra vez. Documentación/preparación del commit
76 s; publicación/verificación 72 s, incluidos push 3,56 s y espera.
Cierre documental posterior no incluido. No son mediciones del rendimiento de la app.

Publicado en qa: 4920bf3cf423a2e61d18856c7c16ac3ddc45d837. Vercel success para
ese SHA: https://vercel.com/zipco-s-projects/zipco-app/HVU2LR2ttjrH8sMu8kU77XAVVyCn.
Cierre documental local, sin segundo push/despliegue. Verificación independiente de artefactos
limitada por acceso local 403 anterior; no se cambian credenciales/protección.
