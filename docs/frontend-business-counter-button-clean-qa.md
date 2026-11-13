# Botón limpio de contrapropuesta del negocio — QA

Fecha: 2026-11-13. Clasificación: solo frontend, presentación CSS.

El adjunto aurora (1).css todavía difería del CSS publicado: QA conservaba
las capas glossy del botón y el resplandor del importe. No era otro estado.
Se incorporó el archivo completo; el cambio afecta exclusivamente al bloque
zipco-aurora-card--bz. Las primeras 107 líneas compartidas se conservan.
Se ocultan blobs, pseudoelementos y backdrop-filter del botón, se conserva
su callback real, se permite el foco fuera del wrapper y se elimina text-shadow
del precio. El aviso genérico no se transforma en «otra hora» sin datos explícitos.

Archivo productivo modificado: src/app/features/requests/cards/shared/layout/aurora.css.
Sin cambios de campos, endpoints, permisos, contratos, TSX ni backend; Railway
no necesario. La lectura de propuestas conserva su API y no se envía un POST
al tocar Revisar propuesta y responder.

## Verificación según riesgo

Reutilizado el arnés real de ProcessOrderCard/ProposalNegotiation con HTTP
simulado. Tres anchos: 320, 390 y 430 px. Comprobados estilos calculados:
backdrop-filter y text-shadow none, pseudoelementos none, blobs display none,
altura >=48 px, ausencia de animaciones infinitas y ausencia de desborde de página.
Toque por coordenadas/elementFromPoint abre el chat real, con cero POST.
Sin excepciones JavaScript. Captura 390 inspeccionada visualmente.

La primera aserción consideraba scrollWidth del article, que incluye sus luces
decorativas recortadas. Se corrigió el criterio a desborde de página y se repitió
el escenario. No se cambió la aplicación para satisfacer el arnés.
Scripts y capturas ignorados: node_modules/.cache/prepare-counter-button-fix.mjs,
counter-button-fix-browser.mjs y customer-proposal-redesign/counter-button-clean-*.
No se repiten pruebas de mutaciones ni suite general: únicamente cambia CSS
acotado y el acceso a la conversación se verificó de nuevo por su dependencia.

Build QA/PWA aprobado: Vite 7,33 s, 2412 módulos, diez precaches.
No hay tsc configurado: el build no acredita tipado completo. Pendiente prueba
física Android/iPhone. Sin pedidos, notificaciones ni llamadas QA reales.

## Tiempos

Intervalos medidos: análisis 154 s (incluye recuperación del contexto y lecturas),
implementación 2 s, preparación 20 s, ejecución y ajuste del arnés 42 s,
build/verificación 23 s (Vite CPU/pared informa 7,33 s, incluido; no sumar otra vez).
Documentación/publicación se registran al verificar el SHA.
Main y producción intactos. Handoff ajeno no incluido.
