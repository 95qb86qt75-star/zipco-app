# Cerrar solicitud: acceso lateral único

2026-11-15, America/Santiago. Clasificación: solo frontend, interacción local.

Decisión expresa del usuario: Cerrar solicitud debe estar al costado mediante
swipe, no como botón dentro del detalle. Sustituye esa parte del diseño CliV12.

## Archivos y alcance

- `CloseRequest.tsx`: retira el disparador del detalle; conserva la hoja real,
  el evento lateral, permisos, bloqueos de reserva y recuperación. Devuelve el
  foco a la cabecera visible al cerrar.
- `business-progress.css`: elimina estilos huérfanos del botón retirado.
- `BusinessAgendaRow.tsx`: permite revelar la misma acción con Flecha izquierda
  sobre la tarjeta plegada enfocada; Escape repliega y devuelve el foco.

No cambia API, campos, payloads, estados ni contrato E207. Railway no necesario.
No se elimina el diálogo: hacerlo rompería el acceso lateral.

## Validación

Build QA/PWA aprobado (Vite17,16s), advertencia de bundle preexistente. Sin tsc
independiente. Se reutiliza RequestsScreen real con HTTP simulado para retiro,
WhatsApp y reserva de fecha pasada bloqueada a320/390/430. Se comprueba ausencia
del botón interior, swipe y apertura real, Escape/retorno de foco, teclado y
Revisar reserva. Ningún comando de cierre ni pedido real modificado.

Las dos primeras ejecuciones pasaron los casos táctiles pero no activaron el
botón con Enter sintético CDP. Se comprobó por separado a390 con Flecha izquierda
y Espacio nativos: foco en la acción, apertura, Escape y Revisar reserva aprobados.
No se cambió el producto para adaptar esos eventos del arnés.
Evidencia ignorada: node_modules/.cache/business-closure/side-only-*.png;
arnés closure-side-only.mjs. Verificación física Android/iPhone pendiente.

## Tiempos y publicación

Aplicación medida6s; preparación44s. Análisis previo sin cronómetro exclusivo.
Ejecución incluye diagnóstico/repetición del teclado; build en paralelo, no
sumar su duración dos veces. Cierre de ejecución/documentación/publicación
registrado después de verificar resultados. Rama qa; main y producción intactos.

Resultados: táctil320/390/430 aprobado; repetición dirigida teclado390 aprobada,
cero excepciones JS y cero comandos enviados. Sin repetir suites API porque no
se modificaron las acciones ni sus contratos.

Publicado en qa:7ed6f54edabb259c29544a52dbe1e35b97087028. Vercel success
verificado para el SHA exacto:
https://vercel.com/zipco-s-projects/zipco-app/Hx3tkgiUT76txMYdMbeXmqLSqWkR
Main8295ab8 sin cambios; producción intacta. Confirmación física pendiente.
El cierre documental se guarda localmente sin nuevo push/despliegue.

Ventana de ejecución hasta preparar publicación: aproximadamente9min30s,
incluye dos esperas de timeout, revisión del fixture y documentación solapada;
no equivale a tiempo de app ni a suma exclusiva de fases. Documentación sin
cronómetro exclusivo. Publicación/verificación alrededor de40s incluida espera.
