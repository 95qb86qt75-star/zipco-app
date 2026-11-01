# Retiro local del cliente — integración CliU17

Fecha: 2026-10-31, America/Santiago. Clasificación: **solo frontend**, presentación
y navegación local por pestañas. Sustituye el detalle pendiente señalado en el
diagnóstico anterior; no modifica contratos ni transiciones.

## Alcance aplicado

Se integraron los siete archivos entregados desde Downloads sobre las fuentes
canónicas, conservando los controladores actuales:

- `src/app/features/requests/cards/customer/local-pickup/CustomerPickupCard.tsx`:
  producto y estado en elementos propios, sin recortar el carril.
- `src/app/features/requests/cards/customer/local-pickup/customer-pickup.css`:
  tema claro completo, carril apilado, pestañas, instrucciones, contacto y opciones.
- `src/app/features/requests/cards/customer/progress/CustomerReceiptDetails.tsx`:
  export `CustomerPickupDetails`; el default de WhatsApp conserva su presentación.
- `src/app/features/requests/cards/customer/progress/CustomerReceiptFlowCardView.tsx`:
  selecciona esa composición exclusivamente cuando corresponde retiro local.
- `src/app/features/requests/cards/shared/availability/AvailabilityPostActions.tsx`
  y `AvailabilityPostActionsView.tsx`: callback `render` opcional de composición.
  Sin callback mantienen orden/clases anteriores; los diálogos existen una sola vez.
- `src/app/features/requests/cards/shared/availability/PickupInstructions.tsx`:
  única implementación de instrucciones, con presentación default y customer.

Las instrucciones, reserva real, condiciones y aviso de pagos van en «Cómo retirar».
WhatsApp permitido, consentimiento, autorización/revocación y cancelar van en
«Contacto y opciones». Ambas pestañas permanecen montadas; el panel inactivo usa
`hidden`. Si no existen dos áreas con contenido, no aparece una barra vacía.
Los errores generales quedan antes de las pestañas. Un error nuevo de la reserva
revela su panel oculto, sin apropiarse del foco situado fuera del detalle.

Se corrigieron durante la adaptación: clases nuevas acotadas al render optativo,
flechas de teclado con retorno al primer/último tab, detección de cambios del texto
de error además de inserciones, contraste del error real de ReservationPanel,
ajuste de textos largos y pausa de efectos bajo la compuerta real de movimiento.
No se cambió la ventana de Condiciones aceptadas, ReservationPanel, DetailReveal,
StatusRail, ReadyPanel, APIs, controladores, permisos ni recuperación.

## Datos y acciones existentes

Se usan `availability.path`, `customerMessage`, `scheduleOrAddress`, reserva/oferta,
`reservationChoice`, `allowedActions`, coordinación y recepción ya normalizados.
El texto libre no se interpreta como fecha/dirección estructurada.

Lecturas existentes de pedidos y acuerdo; acciones existentes de autorización,
WhatsApp, revocación, cancelar retiro, declarar recepción y finalizar. No se agregan
campos, endpoints, eventos de servidor, migraciones ni variables. Railway QA conserva
el contrato de recepción/finalización publicado por backend (`5d09106`).

## Verificación proporcional al riesgo

- **107 unitarias distintas aprobadas**: 97 de composición, coordinación compartida,
  recuperación y diálogo de recepción; 10 nuevas del render optativo/default,
  fallback null, slots/permisos y composición accesible. El último grupo también
  comprueba que los errores preceden a la barra de pestañas.
- **18 escenarios distintos de navegador aprobados** con componentes reales,
  HTTP sintético y toques por coordenadas: 10 de pestañas/reservas/permisos/diálogos/
  errores/movimiento; tres estados de retiro; tres recorridos recepción-finalización
  en 320/393/430 px; una regresión WhatsApp y otra de controles de negocio.
- Condiciones reales abre/cierra; teclado incluye flechas, Home y End; el motivo de
  cancelación se conserva tras refrescar/cambiar de pestaña. La reserva real detecta
  un fallo de lectura en panel oculto, lo revela y permite recuperar sin POST.
- Capturas revisadas en el arnés existente: tema claro completo y carril sin corte.
- Build QA/PWA aprobado una vez: **9,15 s** del comando, incluido precache. Advertencia
  existente sobre tamaño de chunks; no se alteró la estrategia de bundles.
- Análisis de imports sin errores. El repo no dispone de script/config de typecheck
  independiente ni `tsc`; el build no se presenta como comprobación de tipos.

Se reutilizaron los scripts del piloto. Solo se añadieron escenarios y datos
optativos a su fixture, sin cambiar herramientas compartidas ni dependencias.
La primera preparación de reservas omitía metadata necesaria de prepago; se reparó
el fixture, sin relajar el normalizador. También se corrigió una expectativa de
texto orientativo. Una selección incorrecta repitió cuatro escenarios aprobados:
se registra como repetición innecesaria, no como casos adicionales. Las siguientes
ejecuciones excluyeron explícitamente los escenarios aprobados.
El nuevo test se adaptó al patrón `.test.ts` existente, sin cambiar la configuración.
Los informes de intentos y capturas están en `node_modules/.cache/qa-pilot/` y los
JSON unitarios en `node_modules/.cache/pickup-cliu17-unit*.json` (locales, ignorados).

## Publicación y límites

Publicado **604cb939110d0916d4bece610cf20e0c7670fb02**, rama `qa`,
[Vercel success](https://vercel.com/zipco-s-projects/zipco-app/ErqUFn3f6hTUkqBhCqMpNfyETKkq).
Antes del commit del diseño, un fallo de comillas al guardar el mensaje dejó pasar
primero los tres commits documentales previos (`eedabac`); ese push fue innecesario
y no cambió el código de la app. Se corrigió usando un archivo de mensaje y se
publicó el commit completo. No se oculta ese despliegue intermedio en la medición.
Solo rama qa y Vercel QA. El archivo generado `dist/index.html` se restaura y no se
incluye en el commit. La carpeta de traspaso previa no relacionada queda fuera.

Pendiente: revisión física Safari/iPhone, animaciones/tacto real y reservas con la
API QA. Chrome sintético no acredita esas pruebas. No se afirma verificación de
assets autenticados: el alias Vercel requiere SSO y las credenciales previas fueron
rechazadas. No se repiten esos accesos inválidos.

No hubo pedidos nuevos, pushes artificiales ni confirmaciones reales. El diagnóstico
del clic externo sigue pausado. Main y producción no se modifican.

## Tiempos

Medición local desde 01:46:22 hasta 02:06:14 UTC, **19 min 52 s** hasta verificar
Vercel. Fuente: `node_modules/.cache/pickup-cliu17-timing.json`.

| Fase medida | Tiempo transcurrido |
| --- | --- |
| Análisis | 2 min 58 s |
| Implementación de aplicación | 1 min 52 s |
| Preparación inicial de pruebas | 4 min 32 s |
| Pruebas y reparación de fixtures | 5 min 9 s |
| Build y revisión de salida | 28 s; comando QA/PWA 9,15 s |
| Documentación y revisión final | 2 min 47 s |
| Commit, push y verificación Vercel | 2 min 5 s |

La fase de documentación incluye preparación tardía del test `.test.ts` y su
ejecución de 1,4 s; no se dispone de una separación fina de ese intervalo.
La ejecución de pruebas incluye correcciones del fixture, sin medición fina aparte.
Los navegadores corrieron parcialmente en paralelo: no sumar sus tiempos al total.
El cierre documental posterior se mide aparte y no ejecuta otra suite/build ni push.
Estas cifras describen desarrollo, no rendimiento de la app.
