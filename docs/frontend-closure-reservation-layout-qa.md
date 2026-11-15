# Cierre con reserva pendiente: agrupar explicación y acceso

2026-11-15. Clasificación: solo frontend, presentación y accesibilidad local.
Base QA1a9152d. Usuario aporta captura de Cerrar solicitud desde Fecha pasada.

## Causa y ajuste

La fecha pasada solo determina la agrupación/color de agenda; no añade otro cierre.
La solicitud de la captura tiene bloqueo de reserva: el servidor no permite declarar
entrega hasta regularizarla. La opción gris, el aviso ámbar y Revisar reserva eran
tres piezas separadas entre las opciones principales. No se observó un solapamiento
técnico en la comparación inicial; la captura confirmó el problema de jerarquía.

- CloseRequest.tsx: agrupa opción de entrega bloqueada, explicación y acceso real
  en un bloque identificado; aria-describedby asocia la explicación a la opción.
- business-progress.css: contenedor común y botón ámbar integrado de mínimo44px.
  No se concretó conserva tarjeta independiente y Volver permanece al final.

El cambio se aplica a reserva bloqueada, no indiscriminadamente a Fecha pasada.
No cambia textos del servidor, causas, permisos, motivos, payloads, endpoints,
controladores ni categorías. No permite declarar pago/entrega por deducción.
Sin bloqueo, la presentación y acciones anteriores se conservan.

## Validación reutilizada

RequestsScreen/componentes reales y HTTP sintético, escenario derivado de la
comparación vigente/pasada con PREPAYMENT pendiente:
- 320/390/430: explicación y Revisar reserva dentro del grupo, sin desborde;
  opción No se concretó fuera del grupo, sin solapamientos y acceso de44px mínimo.
- Entrega permanece disabled; revisar abre el panel real existente de reserva.
- No se concretó exige motivo, como antes; caso sin bloqueo mantiene entrega activa.
- Apertura por swipe y detalle, Escape y cero excepciones JS.
- Ningún comando de cierre enviado ni pedido real modificado.

Capturas/medidas ignoradas: node_modules/.cache/business-closure/
closure-reservation-grouped-*.png y closure-reservation-layout.json.
Arnés closure-reservation-layout.mjs. No se publican mocks ni capturas.
Build Vite QA8,15s y PWA aprobados; advertencia de bundle previa. Sin cambios de
dominio/API no se repite su suite. Revisión física Android/iPhone pendiente.

## Tiempos y publicación

Análisis/aplicación35s; preparación54s; ejecución/comprobación61s. Build en paralelo
con la prueba visual: no sumar dos veces su tiempo. Documentación/publicación al cierre.
Rama qa. SHA/Vercel pendientes de registrar. Railway no necesario; main8295ab8 y
producción intactos. No cambia el contrato E207 ya publicado por backend.
