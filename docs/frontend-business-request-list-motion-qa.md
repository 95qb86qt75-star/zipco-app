# Listado de negocio: movimiento y desplazamiento QA

2026-10-27. Clasificación: solo frontend. Reporte: al tocar la campana de cinco nuevos pedidos, el descenso se ve entrecortado; la campana de siete esperando al cliente funciona bien.

## Diagnóstico y ajuste

Ambas campanas usan scrollToRequestResults. Con pantalla/CSS reales y datos sintéticos, una lista de cinco tarjetas Fuera de hora mantenía treinta animaciones CSS; treinta tarjetas mantenían ciento ochenta, incluyendo ciento sesenta y dos en tarjetas fuera de vista. No se atribuye el problema a una respuesta del servidor ni se modifica su contrato.

BusinessOrdersTab ahora instala un único IntersectionObserver para sus tarjetas. Los relojes y otros adornos se pausan fuera del área visible. Un listener pasivo de scroll pausa los adornos durante el movimiento y los reanuda al terminar, con scrollend y respaldo de 160 ms tras el último evento. La página oculta también los pausa. No usa estado React para cada frame ni fuerza recargas; limpia observador, listeners y timer al desmontarse/cambiar la lista. Sin IntersectionObserver conserva el recorrido y la pausa durante scroll.

El CSS se limita a relojes, brillos, luces y anillos decorativos. No pausa indicadores de carga, feedback de acciones ni modifica geometría, altura, foco o contención de los modales. Se conserva prefers-reduced-motion. LateInitialCard reutiliza los tres Intl.DateTimeFormat de Santiago en lugar de crearlos nuevamente por tarjeta/render; mantiene los mismos textos y zona horaria. El retraso continúa proviniendo del backend.

## Archivos y contrato

- src/app/screens/requests/BusinessOrdersTab.tsx: referencia al contenedor existente.
- src/app/screens/requests/useRequestListMotion.ts y request-list-motion.css: pausa local y visibilidad.
- src/app/screens/requests/LateInitialCard.tsx: formateadores compartidos.
- src/app/screens/requests/businessOrderModal.test.ts: mock useRef para el hook adicional.
- scripts/check-request-list-motion.mjs: navegador real con datos sintéticos y esta ficha.

Sin endpoints, campos, acciones, permisos, estados, API, notificaciones push ni datos nuevos. Usa únicamente las tarjetas normalizadas existentes. No se necesita Railway QA, migración ni activación.

## Validación

- 1.558 pruebas aprobadas en 122 archivos; build QA/PWA correcto. Advertencia habitual de bundle mayor de 500 kB. Diff sin errores; no se afirma lint/tsc independiente.
- Seis escenarios de navegador con CPU limitada a 4x: cinco y treinta pedidos nuevos, cinco y treinta Fuera de hora, siete esperando al cliente, cinco Fuera de hora con movimiento reducido. Clic por coordenadas, alineación de resultados a 12 px, desplazamiento posterior libre, cero animaciones decorativas activas fuera de pantalla, pausa real durante scroll y reanudación visible comprobados. Todas las tarjetas siguen presentes.
- Comparación determinista de treinta Fuera de hora: antes 162 animaciones fuera de vista; después cero. En las tres tarjetas visibles se reanudan 18, y se pausan al desplazar. Esto acredita reducción de trabajo visual, no un objetivo de FPS ni una prueba del Android físico. El muestreo local de frames incluye montaje inicial y varía con la máquina; no se usa como garantía de rendimiento ni se afirma que desaparezca todo coste de montar treinta tarjetas a la vez.
- Once escenarios de regresión de disponibilidad/notificaciones con App real aprobados. Ninguna red backend, notificación real ni acción sobre pedidos.
- El harness histórico de campanas usa un mock anterior a readStatus; no se cuenta como aprobado. La comprobación de esta entrega usa el fixture actualizado del script nuevo, además de las pruebas vigentes de navegación.

## Entrega

Rama qa; commit de implementación es el que incorpora esta ficha. Publicar solo mediante git push origin qa y verificar Ready, SHA y CSS/JS servidos en el alias QA. Resultado/SHA se informan al usuario al concluir. Pendiente comprobar en Android las campanas Nuevos pedidos y Esperando al cliente con sus solicitudes existentes; no hace falta crear ni cambiar pedidos para probar el scroll.

main conserva 8295ab8c6024ab20851ebd371308d2f299b4668f. Producción y Railway intactos. Los ocho documentos locales de diagnósticos anteriores quedan fuera del commit.
