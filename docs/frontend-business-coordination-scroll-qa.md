# UI-BUSINESS-COORDINATION-SCROLL-01 — Inicio de pedidos Por coordinar

Fecha: 2026-10-19. Clasificación: solo frontend; navegación local. Punto 6.

## Nombre y código oficial

- Nombre: **Mi Negocio — campanita Por coordinar con desplazamiento a resultados**.
- Identificador: `UI-BUSINESS-COORDINATION-SCROLL-01`.
- Commit de código y pruebas: `d9fe36efe18aee79ee10aa85625ae897c8d453b2`.
- Base revisada: `846e7d3e172c88393c655ceb91658a0745241f7c`, rama `qa`.
- Antecedente: `UI-BUSINESS-COORDINATION-SUMMARY-01`, código `2dac8908b266de868f16a5cae5e9004aa882a563`, documenta la campanita, su selección y filtrado. No implementaba scroll. El encuadre de una tarjeta desde notificaciones (`UI-NOTIFICATION-CARD-POSITION-02`) es un recorrido distinto y se conserva.

## Diagnóstico y cambio

El onSelect de CoordinationOrdersSummary en negocio actualizaba requestType, attentionFilter, selectedBusinessActivity y statusViews. No llamaba a ninguna función de desplazamiento ni solicitaba un efecto posterior de scroll. El componente compartido solo delega el clic al onSelect. Por ello la selección funcionaba pero la lista podía permanecer fuera de la vista.

Ahora ese clic solicita un desplazamiento puntual después de que React aplique Pedidos / Por coordinar y filtre la lista. El inicio de los resultados se alinea 12 px debajo del encabezado, desplazando únicamente el contenedor existente de Solicitudes. La fecha y la primera tarjeta de la categoría quedan al inicio del área visible.

No abre acuerdos, detalles o popups, no enfoca un pedido individual ni añade la marca azul. No utiliza destinos externos, ACK, service worker, MutationObserver, ResizeObserver, temporizadores ni seguimiento continuo. El usuario puede desplazarse libremente después. Pulsar de nuevo la misma campanita vuelve al inicio aunque la categoría ya esté seleccionada.

Si se interpone una carga, espera hasta que termine; cambiar de categoría/rol o encontrar un error cancela esa solicitud de scroll. Sin resultados no desplaza hacia un destino inexistente. Las recargas posteriores no vuelven a mover la pantalla. El cambio se limita a la campanita **de negocio** Por coordinar; no modifica otras campanitas ni los botones de categoría.

## Archivos, contrato y validación

- `src/app/screens/RequestsScreen.tsx`: solicitud de scroll local y marcador de inicio de resultados.
- `src/app/screens/RequestsScreen.notificationNavigation.test.ts`: pruebas del clic antes/después del commit de renderizado, selección y filtrado desde Pedidos y Cotizaciones, segundo clic, espera de carga, cancelación por otra categoría y no repetición por recarga. También conserva las pruebas de notificaciones con sesión/listas tardías.
- Este documento.

**915 pruebas aprobadas en 84 archivos**, build QA aprobado y comprobación de diff sin errores. Advertencia habitual de tamaño de bundle de Vite. Las pruebas de geometría utilizan un entorno simulado: revisión física Android/iPhone pendiente.

Usa el agrupamiento y los campos existentes `requestProcess.state`, `status` y disponibilidad normalizada. No agrega ni cambia campos/endpoints, payloads, respuestas, peticiones, recargas, acciones, permisos, estados o contratos push. No ejecuta acciones reales de pedidos, START_WORK ni WhatsApp. No requiere cambios en backend/Railway QA. No se altera la duración de los errores ni se declara resuelta su desaparición anticipada.

## Publicación QA y prueba

Destino exclusivo: equipo zipco-s-projects, proyecto zipco-app, rama `qa`, entorno Preview, origen Git verificable y SHA exacto. Backend QA existente. Mantener por despliegue:

`ZIPCO_QA_LOAD_DIAGNOSTICS=1 ZIPCO_QA_NOTIFICATION_TRACE=0 npm run build -- --mode qa`

El registro temporal del clic y la arquitectura nueva de notificaciones siguen pausados. Sin cambios globales, backend/Railway, `main` ni producción. Todos los documentos locales pendientes anteriores quedan fuera de estos commits y se conservan.

Para probar desde el acceso QA habitual en Android/iPhone:

1. Comprobar el SHA frontend de la nueva publicación. Entrar en Solicitudes → Mi Negocio.
2. Con pedidos existentes Por coordinar, situarse en otra categoría o en Cotizaciones. Pulsar la campanita «N pedidos por coordinar».
3. Verificar Pedidos / Por coordinar seleccionado y desplazamiento automático al inicio de sus resultados, sin abrir el detalle ni accionar pedidos.
4. Desplazarse manualmente y volver a pulsar la misma campanita: debe regresar al inicio otra vez. Una actualización normal de listas no debe provocar ese movimiento por sí sola.
5. Si no hay pedidos en esa categoría, la campanita sigue oculta según la regla anterior. No crear ni modificar pedidos desde este trabajo para forzar la prueba.

Registrar el SHA desplegado, URL, estado READY y destino del alias después de comprobarlos. READY y pruebas automatizadas no equivalen a comprobación física de los celulares.

## Resultado de publicación — 2026-10-19

- Código: `d9fe36efe18aee79ee10aa85625ae897c8d453b2`; ficha oficial guardada en `d8f6ea1108c0d7eec51358a2e96a57ee1f6cd038`.
- SHA desplegado: `d8f6ea1108c0d7eec51358a2e96a57ee1f6cd038`, origen GitHub real, rama `qa`, entorno Preview.
- Preview **READY**: `dpl_5iWs4mhknrhPWFBa2wU66ohrT2er`; URL propia https://zipco-8t6hzxrry-zipco-s-projects.vercel.app.
- Alias habitual https://zipco-app-git-qa-zipco-s-projects.vercel.app comprobado apuntando a ese Preview. Etiqueta esperada: `QA d8f6ea1`.
- Backend QA verificado, comando temporal por despliegue verificado, logs QA completados, auxiliar del recorrido ausente. Configuración global de build nula y rama de producción `main` sin cambios.
- Sin divergencia antes del envío; `git diff --cached --check` aprobado; staging vacío después de ambos commits. Todos los pendientes anteriores conservados fuera de estos commits.
- Revisión física Android/iPhone pendiente. Este añadido de resultados queda local después del despliegue; no provoca otra publicación solo para registrar el resultado. El nombre y el commit de código ya están respaldados en Git por la ficha oficial.
