# Disponible: retiro local del cliente — CliU19

Fecha: 2026-11-01, America/Santiago. Clasificación: **solo frontend**:
presentación completa de retiro, componentes compartidos y animaciones locales.

## Cambios y fuentes canónicas

- `shared/availability-design/AvailabilityDesign.tsx` y `availability-design.css`
  dentro de `src/app/features/requests`: integración completa de los dos archivos
  CliU19 entregados. `AvailablePickupDesign` sustituye la composición anterior.
  Estado, carril, consentimiento y control de detalle se comparten con WhatsApp;
  retiro agrega oferta, instrucciones tipo ticket, nota y decisiones propias.
- `cards/shared/availability/AvailabilityFlowCard.tsx`: recuperación dentro de
  ambas modalidades, sin botón externo duplicado. Acciones y controladores intactos.
- `shared/feedback/StatusChangeFlow.tsx` y `statusChangePresentation.ts`: salida
  visual de 900 ms para cliente Disponible tanto WhatsApp como LOCAL_PICKUP;
  negocio y otros estados conservan sus transiciones. No cambia el estado servidor.
- `shared/reservations/ReservationOfferSummary.tsx`: prop optativa `compact` que
  omite únicamente la frase de horario informativo en el resumen compacto de esta
  tarjeta. El default, incluido el diálogo real, conserva todas las condiciones.

Se corrigió un fallo de la entrega: `short` estaba referenciado en
ConsultationDesignSheet sin existir allí; se restauró la copia de contacto original
y se aplicó `short` únicamente en ContactConsent. Esto evita romper el envío inicial.
El botón de nota también respeta busy. No se cambió la versión de React ni el
patrón inert existente, que se verificó en el DOM real del navegador del arnés.

La presentación cubre sin oferta, NONE, FREE/PREPAYMENT simplificados, horarios
informativos y contratos antiguos con plazos. La reserva antigua reutiliza su
resumen real con estilos nuevos; no se inventó una línea de tiempo ni datos.
El doble punto preexistente de algunas fechas no se modificó en este bloque.
No quedan dos composiciones ejecutables de retiro. CSS eliminado sin consumidores
comprobados: channel-summary y consent-dark; las reglas de otras tarjetas se conservan.

## Contrato y funcionamiento conservados

Sin cambios de API, permisos, intents, persistencia, recibos ni transiciones de
negocio. Se usan los datos existentes: availability, reservationOffer, mensajes
libres, importe, productos, consentimiento y allowedActions. CONTINUE_REQUEST y
DECLINE_REQUEST conservan sus payloads. El diálogo real sigue leyendo
`GET /request-processes/{id}/reservation-options?processContract=availability-v3`
y comprobando la oferta antes de permitir reservar. No se agregan endpoints/campos.

ReservationDecisionDialog, ProductPreviewControl, AcceptGlassButton, foto de
referencia, condiciones y tarjeta posterior En curso son componentes reales.
No se cambiaron controladores, backend, reservas, trabajadores push ni flags.
Railway no fue necesario. El diagnóstico de clic externo sigue pausado.

## Pruebas por dependencias

- **97 unitarias distintas aprobadas**, incluyendo variantes, consulta inicial,
  resumen compacto/default, fallback de instrucciones, composición, recuperación
  y salida de retiro de 900 ms con destino real En curso.
- **17 escenarios distintos de navegador aprobados**: 13 de retiro y cuatro
  regresiones (controles WhatsApp, aceptación WhatsApp con holograma y tarjeta
  posterior de retiro con condiciones y confirmación oscura de «No, gracias»).
  Retiro prueba nueve variantes, anchos
  320/393/430, nota de 300 caracteres conservada, consentimiento requerido para
  prepago, diálogo real de reserva, recuperación plegada y salida con aviso Ver.
- Toques por coordenadas, componentes reales, HTTP sintético. Sin pedidos,
  pagos, avisos o confirmaciones reales. No se usaron los stubs de Claude.
- Se reutilizó el arnés aprobado. Se corrigieron un selector mal escapado y un
  preview sintético de prepago orientativo con fecha incompatible. Solo se
  repitieron los pendientes. El caso de mensaje vacío se verificó en la vista
  unitaria: no se relajó el normalizador para introducir una respuesta inválida.
- Capturas revisadas con tema y diálogo reales. Build QA/PWA final aprobado:
  **19,39 s**, con advertencia existente de tamaño de chunks. Se repitió el build
  inicial de 14,97 s tras conectar también el diálogo oscuro de cierre en retiro;
  esta última conexión se verificó en un escenario dirigido, sin repetir toda la suite.
  Imports correctos; no existe tsc/script de tipos independiente en este repo.

Resultados locales ignorados en `node_modules/.cache/cliu19-unit*.json` y
`qa-pilot/available-pickup-design`, `available-whatsapp-design`,
`acceptance-presentation`, `pickup-rendering`. Los intentos conservan resultados
históricos; los reintentos no aumentan el número de escenarios distintos.

## Publicación y límites

Publicado **1fd8295052e64fcaf23acc600f0e362a42cc62ef**, rama qa,
[Vercel success](https://vercel.com/zipco-s-projects/zipco-app/4U1jD3FrtRfMvT1F74jgeeQJr364).
El commit de integración inicial `2ee9d30` también hizo push; la revisión final
conectó el diálogo oscuro de cierre al retiro y volvió a compilar antes de publicar.
Solo rama qa / Vercel QA.
Main verificado sin cambios en `8295ab8c6024ab20851ebd371308d2f299b4668f`;
producción y Railway no modificados. La carpeta previa del usuario en design-handoffs
queda fuera del commit. dist/index.html generado se restaura antes de guardar.
Falta revisión física de CliU19 en iPhone/Android. La aprobación visual previa de
WhatsApp se conserva; Chrome sintético no acredita Safari ni pagos externos.
El estado Vercel no acredita los assets protegidos por SSO; no se repiten credenciales
rechazadas para intentar leerlos.

## Tiempos y límites de medición

Fuente local `node_modules/.cache/cliu19-timing.json`, desde primera observación
22:30:07 UTC; lecturas iniciales anteriores sin medir.

| Intervalo registrado | Duración |
| --- | --- |
| Análisis | 9 min 56 s |
| Integración inicial | 18 s |
| Preparación de pruebas | 6 min 53 s |
| Pruebas, correcciones y espacio entre ejecuciones | 63 min 58 s |
| Build y revisión de salida inicial | 1 min 41 s; comando QA/PWA 14,97 s |
| Documentación inicial | 12 s |
| Primera publicación y revisión | 1 min 49 s |
| Última conexión visual, prueba y build | 1 min 50 s; build final 19,39 s |
| Publicación/verificación final | 1 min |

**63 min 58 s no son ejecución continua de tests.** El último grupo de cuatro
escenarios registró 22:56:38–22:57:01 UTC y 22,69 s de proceso. El build comenzó
a las 23:51:14 UTC: hay aproximadamente 54 minutos posteriores sin scripts de
pruebas activos. No hay medición fina que determine la causa de ese intervalo;
no atribuirlo a compilación, gráficos, animaciones ni rendimiento del producto.
Otros navegadores corrieron parcialmente en paralelo; no sumar sus esperas dos veces.
Total de reloj desde primera observación hasta Vercel success: **1 h 27 min 37 s**,
con los intervalos no desglosados indicados arriba. No equivale a tiempo de código
ni de scripts activos. Este cierre documental posterior no repite pruebas/build
y permanece local, sin otro despliegue.
