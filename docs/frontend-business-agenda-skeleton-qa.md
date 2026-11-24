# Skeleton de En curso del negocio

Fecha: 2026-11-21. Clasificación: solo frontend QA.

## Problema y cambio

La agenda presentaba cualquier horario aún no cargado como unverified, por lo
que mostraba COMPROBAR/SIN HORA antes de recibir el acuerdo. ProgressCardShell
usaba además la composición oscura anterior durante esa misma lectura.

businessAgenda y useAgreedScheduleResolver distinguen ahora loading (lectura
pendiente local) de unverified (lectura terminada sin horario verificable o con
error). AgendaGroupHeading y AgendaRow muestran placeholders neutros durante
loading. Los filtros mantienen placeholders pendientes hasta poder comprobar
su fecha, sin asumir que pertenecen a Hoy ni inventar un horario.

ProgressCardShell del negocio muestra un skeleton claro, sin importe ni estado
de preparación simulado. Al fallar muestra el error real con reintento. El shell
del cliente conserva su composición. progress-card-shell.css pertenece a ese
estado compartido, sin reescribir las tarjetas cargadas ni sus acciones.

## Contrato

Sin cambios de API, endpoints, permisos, estados técnicos ni payloads. Lectura
existente GET /request-processes/{id}/agreement; horario desde scheduledFor y
subjectSnapshot.needNow. Se conserva readSharedAgreement y su caché compartida;
no se agregan consultas nuevas, polling ni escrituras. No requiere Railway.

## Validación

- 37 pruebas focalizadas aprobadas: businessAgenda, ProgressCardShell,
  useAgreement, sharedAgreementRead y processPresentation. Incluyen separación
  loading/unverified, ausencia de importe o estado falso, error/reintento y shell
  del cliente sin cambios.
- RequestsScreen real con seis pedidos, API y cuentas sintéticas, y respuestas
  de acuerdos retenidas intencionalmente: 320/360/390/430 px. Primero skeletons
  de horario y tarjeta, sin COMPROBAR/SIN HORA ni shell oscuro; después cinco
  tarjetas cargadas y un error real con botón de reintento. Sin desbordes, errores
  de ejecución ni POST. Último ajuste de fondo claro comprobado otra vez a 390.
- Build QA aprobado. Advertencia existente de chunks grandes. No hay comando
  typecheck ni TypeScript instalado; no se declara tsc aprobado.
- Evidencia local ignorada en node_modules/.cache/business-agenda-skeleton/.
  La ejecución de 390 px final reemplazó el JSON de evidencia; los otros anchos
  ya se habían comprobado en la ejecución anterior.
- Pendiente: comprobación física Android/iPhone tras Vercel QA. Chrome local
  con datos simulados no acredita backend real ni prueba física.

## Tiempos y alcance de publicación

Suite focalizada final: 3,14 s. Build Vite final: 7,81 s; PWA terminó después,
sin medición independiente. Hubo un build anterior de 7,94 s antes de ajustar
el fondo del contenedor. Navegador y build se solaparon: no sumar duraciones.
Análisis, implementación, preparación de prueba, documentación y espera de
Vercel no tienen medición independiente y no se estiman.

Publicación solo en rama qa y Vercel QA, verificando el SHA exacto. Main,
producción y Railway quedan fuera del cambio.
