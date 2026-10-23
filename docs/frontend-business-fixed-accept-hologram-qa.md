# UI-BUSINESS-FIXED-ACCEPT-Q-01 — Pedido aceptado en Mi Negocio

2026-10-22. Solo frontend QA. Corrección del caso informado por el usuario
después de la versión 5881cab.

Antes: el holograma Q de aceptación estaba conectado a propuestas del cliente;
el negocio conservaba Cierre exitoso para contrapropuestas. Aceptar pedido
original recorría useRequests/createFixedOrderAcceptance y mostraba solo toast.

Después: aceptar el pedido original en Mi Negocio muestra el mismo Q verde,
documento con check, título **Pedido aceptado** y descripción «El pedido pasó a
Por coordinar. Revisa la autorización de contacto para continuar por WhatsApp».
El aviso pequeño de éxito se reemplaza, evitando duplicarlo. El host raíz y su
duración/deduplicación existentes se reutilizan. No autoriza ni abre WhatsApp.

Se dispara desde el resultado verificado de acceptFixedOrder, incluso si falla
la recarga posterior. Mantiene el flujo de recuperación e idempotencia existente,
clave de feedback por proceso/versión y comprobación de la sesión capturada.
No aparece por clic, respuesta inválida, error de red sin confirmación ni después
de cambiar cuenta/sesión. No se cambiaron categorías, permisos o transiciones.
Los recorridos de propuestas/contrapropuestas y pedidos legacy se conservan.

Archivos: `src/app/screens/requests/useRequests.ts` y
`useRequestsContract.test.ts`; este registro y el catálogo de diseño.
Contrato sin cambios: POST `/request-processes/:id/actions/accept-fixed-order`
con `{ expectedVersion, proposalId }`, JWT e Idempotency-Key existentes.
Recibo validado con orderId/orderStatus/requestProcess, COORDINATION_PENDING,
versión/propuesta exacta y agreementPublicId. Lecturas existentes de listas con
processContract=alternatives-v1. Sin nuevos campos ni persistencia.

Validación: **1.210 pruebas / 104 archivos aprobados**, incluidos cinco casos
nuevos del callback real de useRequests con HTTP simulado: éxito, aceptación
confirmada con lectura fallida, POST fallido, recibo inválido y sesión cambiada.
Build QA/PWA aprobado; aviso preexistente de bundle mayor de 500 kB.
No se repitieron los 59 recorridos de negociación de la entrega anterior ni se
declara validación física de este arreglo. Sin acciones sobre pedidos reales.

Pendiente: Android/iPhone, Mi Negocio → Pendientes → Revisar y responder →
Aceptar pedido; comprobar Q, paso a Por coordinar y contadores. Un paso por vez.
Reintentos fiables de notificaciones siguen pendientes del cierre general.

Rama qa; publicación exacta se registra al cierre. Railway no necesario.
Backend, main y producción sin cambios.
