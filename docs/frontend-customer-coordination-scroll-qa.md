# UI-CUSTOMER-COORDINATION-SCROLL-01 — Inicio de pedidos en Coordinación

Fecha: 2026-10-19. Clasificación: solo frontend, navegación local. Rama `qa`.

## Nombre y código

Nombre oficial: **Mis Pedidos — campanita Coordinación con desplazamiento a resultados**.
Identificador: `UI-CUSTOMER-COORDINATION-SCROLL-01`.
Commit de código y pruebas: `bd275c0ad95a4567d80f980e6fb51d1b7e00c301`.
Base: `d8f6ea1108c0d7eec51358a2e96a57ee1f6cd038`.

Bastián informó que el clic en la campanita del cliente desde iPhone no desplazaba la lista. El Punto 6 anterior (`UI-BUSINESS-COORDINATION-SCROLL-01`, código `d9fe36e`) estaba limitado a negocio. Ahora se aplica el mismo desplazamiento puntual al resumen de Coordinación de Mis Pedidos, para iPhone y Android mediante el frontend compartido.

## Cambio y límites

- `src/app/screens/RequestsScreen.tsx`: el clic del resumen del cliente selecciona Pedidos / Coordinación y solicita scroll después de aplicar el filtro. Se comparte el marcador de inicio de resultados entre ambos roles; el rol que pidió el scroll se conserva para cancelar la solicitud si el usuario cambia de perfil.
- `src/app/screens/RequestsScreen.notificationNavigation.test.ts`: pruebas para cliente y negocio desde Pedidos y Cotizaciones, segundo clic, espera de una carga interpuesta, no repetición por recargas, cancelación por otra categoría y por cambio de rol. Se conservan las regresiones de navegación desde notificación.

Se alinea el comienzo de la lista 12 px bajo el encabezado dentro del contenedor desplazable existente. No expande condiciones ni detalles, no enfoca un pedido individual, no añade borde azul y no altera el recorrido externo de notificaciones. El usuario puede desplazarse libremente después. No se incorporan observadores, temporizadores o seguimiento continuo.

Si la tarjeta cabe entre encabezado y navegación inferior, puede verse completa. Si su contenido supera ese espacio, se presenta desde el inicio y se conserva el desplazamiento manual. Esta actualización no reduce ni oculta contenido para hacerlo caber. El cambio se limita a las campanitas de Coordinación, no a todas las tarjetas de aviso ni a todos los filtros.

## Contrato, pruebas y publicación

Sin campos ni endpoints nuevos o modificados, sin peticiones, recargas o acciones adicionales. Usa `requestProcess.state`, `status` y disponibilidad normalizada ya consumidos. No cambia permisos, estados, contratos push, backend/Railway QA, `main` o producción. No ejecuta acciones reales de pedidos. Arquitectura nueva de notificaciones y registro temporal del clic continúan pausados.

**919 pruebas aprobadas en 84 archivos** y build QA aprobado. Advertencia habitual de tamaño de bundle. Pruebas de geometría simuladas; revisión física en iPhone/Android pendiente.

Publicar solo Preview del proyecto zipco-app, equipo zipco-s-projects, desde Git real y SHA exacto de la rama `qa`, usando Backend QA existente. Mantener por despliegue, sin cambios globales:

`ZIPCO_QA_LOAD_DIAGNOSTICS=1 ZIPCO_QA_NOTIFICATION_TRACE=0 npm run build -- --mode qa`

Los documentos pendientes anteriores se conservan fuera de estos commits. Esta ficha respalda en Git el nombre y el commit de código; registrar después el resultado efectivo del despliegue.

## Prueba desde iPhone cliente

1. Abrir el acceso QA habitual y confirmar la etiqueta del nuevo SHA junto a Solicitudes.
2. En Mis Pedidos, partir desde otra categoría y pulsar «N pedidos en Coordinación».
3. Verificar selección de Pedidos / Coordinación y desplazamiento hasta la fecha/primera tarjeta, bajo el encabezado, sin abrir condiciones automáticamente.
4. Deslizar manualmente: no debe regresar sola. Pulsar de nuevo la campanita: debe volver al inicio.
5. Repetir en Android y comprobar que Mi Negocio / Por coordinar conserva el funcionamiento anterior. No crear o modificar pedidos como parte de este trabajo para forzar la prueba.

## Resultado de publicación — 2026-10-19

Código `bd275c0ad95a4567d80f980e6fb51d1b7e00c301`; ficha oficial respaldada en `f0395ae6f2ca84b9f2c88bf466ffbfb1c7c8d679`, que es el SHA efectivamente desplegado. Rama `qa`, origen GitHub real, entorno Preview.

Preview **READY** `dpl_B7vVVti71SrMkGKqTQTjK8pqbG1n`; URL propia https://zipco-1ok7oi7j5-zipco-s-projects.vercel.app. El alias habitual https://zipco-app-git-qa-zipco-s-projects.vercel.app apunta a ese despliegue. Etiqueta esperada: `QA f0395ae`.

Comprobados SHA, rama, Backend QA, comando temporal por despliegue, logs QA completados y ausencia del auxiliar del recorrido. Build global nulo y rama de producción `main` sin cambios. Sin divergencia antes del envío; diff de staging aprobado y staging vacío al terminar; documentos pendientes anteriores conservados fuera de los commits.

Revisión física en celulares pendiente. Este añadido de resultados queda local después de la publicación para no generar otro despliegue únicamente por su registro; el nombre y commit de código ya quedaron guardados en Git con la ficha oficial.
