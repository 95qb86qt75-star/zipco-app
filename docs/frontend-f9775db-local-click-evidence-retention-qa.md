# Evidencia del intento f9775db: conservación local acotada

2026-10-29. Clasificación: **solo frontend/worker QA**, diagnóstico local y texto del panel. Se mantiene el contrato remoto E168 y se lee el traspaso E183 de `C:/dev/zipco-backend-qa/docs/testing/qa-push-observation-contract-qa.md` (respaldo backend a2e4fad). No se implementa otra corrección de navegación ni la alternativa nativa.

## Evidencia preservada y conclusión permitida

Adjunto íntegro en [evidence/iphone-system-f9775db-truncated-then-internal.json](evidence/iphone-system-f9775db-truncated-then-internal.json), SHA-256 `44c8c24eb05e4a8e91daf3ac719b9e69ea6a43f78a410994872fcfde43572274`, coincidente con E183. Las dos capturas aportadas permanecen en el chat: catálogo con aviso interno y tarjeta marcada «Abierta desde la notificación» después de tocar ese aviso.

Frontend, controlador y activo: f9775db/v11 coincidentes, app instalada y origen QA esperado. El usuario tocó primero el banner del sistema con ZIPCO en segundo plano y quedó en el catálogo; después tocó el aviso interno y abrió la tarjeta. La etiqueta de la tarjeta acredita ese segundo camino, no el éxito del clic del sistema.

El JSON conserva exactamente cincuenta filas app y cincuenta worker, con predominio de app-cache-start/read y worker-target-request/sent. No conserva las etapas de presentación/clic/foco del intento. El código anterior priorizaba las cincuenta filas más recientes por fuente y solo reducía lecturas repetidas dentro de la memoria de una instancia. Tras suficientes consultas o reinicios, esas lecturas podían desplazar la evidencia del intento aunque siguiera dentro de la hora de TTL.

No se concluye que notificationclick no se ejecutó. Tampoco se atribuye el fallo a los ACK mismatch: también existen en el éxito físico anterior e2a0617b (655efcc, app cerrada), cuya evidencia sigue preservada. El panel remoto sin datos consultables no acredita que el backend no recibiera eventos ni que su flag estuviera apagado. No se abrió una sesión nueva para recuperar hechos pasados ni se consultó una sesión autenticada real desde este workspace.

## Corrección de conservación local

Mismo caché diagnóstico v2, TTL de una hora y máximo cincuenta filas por fuente (app/worker). La nueva política local `causal-first-v1` limita a **diez filas** el contexto repetitivo: consultas de caché/destino, probes, reanudaciones/rutas, ACK recibidos/mismatch, montaje e ignorados/suprimidos. Así quedan hasta cuarenta filas para etapas de acción cuando el contexto está lleno; si hay menos contexto, las etapas de acción pueden ocupar el resto hasta cincuenta.

Se priorizan las etapas ya existentes de push/presentación, entrada/clic, normalización/lanzamiento, mensajes/guardado del destino, ACK consumido, foco real y aviso interno. No se unen ni se deduplican los clics físicos: se conservan sus filas y UUID existentes, incluso al repetirse un clic. La clasificación de prioridad no afirma una relación causal probada entre filas.

La misma selección se aplica a memoria, combinación con caché y poda persistida. Funciona entre distintas instancias del worker y al volver a leer tras un reinicio; no depende solo del intervalo de diez segundos de la reducción anterior. La caducidad sigue eliminando evidencia antigua y una secuencia de muchas acciones reales todavía puede llenar la cuota. Ninguna etapa perdida se reconstruye o se inventa.

La copia añade únicamente metadatos locales `localRetention`: nombre de política, máximos, TTL, `controllerPolicyConfirmed` y `missingStagesAreInconclusive`. El worker devuelve su política en el mensaje diagnóstico local existente; si el controlador antiguo no la informa, controllerPolicyConfirmed=false. No se asegura que un worker viejo haya aplicado esta conservación. El panel explica límites, diferencia entre clic interno/sistema y que una etapa ausente no es prueba de que no ocurrió.

Para correlacionar se conserva el UUID aleatorio existente del banner (`bannerCode` es su prefijo). El clic del aviso interno tiene su propia correlación; no se reutiliza como si fuera el clic externo. Un UUID de presentación no crea retrospectivamente una identidad de clic remoto ni prueba que todos los registros de la app pertenezcan al banner. Las etapas sin UUID permanecen sin atribución inventada.

## Alcance, archivos y contrato

Archivos funcionales: `src/app/notifications/qaNotificationClickTraceStore.js`, `qaNotificationClickTrace.ts`, `QaNotificationClickTracePanel.tsx`. Pruebas: `qaNotificationClickTraceStore.test.ts`, `qaNotificationClickTrace.test.ts`. Esta ficha y el JSON son documentación/evidencia. Los documentos locales ajenos quedan fuera del commit.

No cambia `public/push-sw.js`, el payload del aviso, Notification.data, tag, URL del pedido, parámetros de navegación, reportes remotos, autenticación, permisos, suscripciones, pedidos ni estados. No se añaden etapas o campos a `/qa/push-observations/events` ni a las sesiones del servidor. Los metadatos nuevos solo pertenecen al intercambio diagnóstico página/worker y a la copia local; no se envían al backend. Revisión v11 conservada, identificando la entrega por SHA.

Siguen excluidos recibos/JWT, contactos, IDs de pedido/proceso, title/body/tag, URL y errores crudos. El cambio no hace llamadas de red, no genera pushes ni altera reintentos comerciales. No necesita Railway ni cambios de contrato remoto. Cualquier ampliación futura de payload, diagnóstico backend o navegación nativa debe coordinarse primero.

## Validación y publicación

- **1.629 pruebas aprobadas en 126 archivos**, suite completa con `--maxWorkers=2`.
- Casos nuevos: 160 consultas entre ochenta instancias por fuente tras registrar etapas correlacionadas; relectura desde otra instancia; conservación de UUID; caché y exportación sin payload privado; límite conjunto de cincuenta/diez; vencimiento sin extender TTL; memoria con almacenamiento indisponible. Se mantiene la prueba de no deduplicar clics repetidos y la regresión de navegación/ACK existentes.
- Build QA/PWA aprobado. Advertencia histórica de bundle mayor de 500 kB; no se afirma lint/tsc independiente ni reproducción física del clic. No se generan avisos/pedidos ni se repiten confirmaciones para validar.
- Entrega mediante commit de esta ficha en rama `qa` y push solo a `origin qa`, despliegue automático GitHub → Vercel QA. Se verifican Ready, SHA y módulo auxiliar de worker publicado antes del informe final. No desplegar producción.
- `main` conserva `8295ab8c6024ab20851ebd371308d2f299b4668f`; producción, Railway y pedidos intactos.

Pendiente: actualizar app/worker QA y conservar pronto, con el siguiente aviso legítimo, código/hora del banner y recorrido después del clic del sistema, antes de tocar el aviso interno si se necesita distinguir ambos intentos. Se puede copiar otra vez tras el clic interno, manteniendo el orden declarado. No abrir otra sesión remota para recuperar el pasado, crear pedidos, repetir disponibilidad, enviar pushes artificiales, reinstalar o borrar evidencia. El fallo del sistema en segundo plano permanece sin causa confirmada y sin resolución física acreditada.
