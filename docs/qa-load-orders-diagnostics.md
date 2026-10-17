# Diagnóstico temporal de loadOrders — QA

Solo frontend. No cambia peticiones, recargas, acciones, permisos ni contratos.
Desactivado por defecto. No está publicado: requiere otra autorización para publicar QA.

## Activación local explícita

En PowerShell, dentro de Frontend QA:

```powershell
$env:ZIPCO_QA_LOAD_DIAGNOSTICS = '1'
npm.cmd run build -- --mode qa --outDir node_modules/.cache/load-orders-diagnostics-qa
Remove-Item Env:ZIPCO_QA_LOAD_DIAGNOSTICS
```

También puede usarse `npm.cmd run dev -- --mode qa` con esa bandera para revisión local.
No modificar archivos `.env` ni configuración de proveedores para esta validación.
El modo `production` siempre lo excluye, aunque la bandera sea `1`.
En Vercel exige además entorno `preview` y rama `qa`; no basta con la bandera.
La versión procede del SHA público del build. Localmente incluye el sufijo `-local`,
porque los cambios sin commit no corresponden a una versión publicada.

## Recogida desde Android, después de una futura publicación QA autorizada

1. Abrir Solicitudes en la cuenta de prueba habitual.
2. Abrir «Diagnóstico temporal QA — Solicitudes».
3. Pulsar «Limpiar diagnóstico», y después «Actualizar Solicitudes».
   Se ejecuta `loadOrders(true)`: no repite START_WORK ni otra acción.
4. Si aparece el fallo, pulsar «Copiar diagnóstico» y compartir solo ese texto.
   Si el portapapeles no está disponible, seleccionar el texto del cuadro y copiarlo manualmente.
5. `[]` indica que no hay fallos registrados; no demuestra que el problema esté resuelto.

Solo conserva las últimas 20 lecturas fallidas en memoria. Una recarga completa
descarta el historial. No usa localStorage, sessionStorage, consola, telemetría ni envío externo.
El portapapeles recibe el informe únicamente al pulsar Copiar.
Los fallos posteriores al desmontaje pueden terminar de registrarse mientras viva la aplicación;
no incluyen identidad, identificadores ni información del pedido.

Cada registro contiene únicamente operación, método, ruta fija sin identificadores,
HTTP, código público reconocido o null y versión frontend. Un error de red tiene
HTTP null; un JSON ilegible conserva el HTTP recibido. No almacena cuerpos,
cabeceras, mensajes arbitrarios ni excepciones. Los códigos desconocidos se omiten.
Un fallo auxiliar al consultar el nombre del negocio también se registra aunque
el comportamiento existente permita completar la carga con un nombre de respaldo.

La reconciliación específica de coordinación no se instrumenta: el alcance es
exclusivamente las lecturas de loadOrders y su consulta auxiliar de nombre.
No se han eliminado ni consolidado sus recargas simultáneas. No hay evidencia
de que esas recargas sean la causa del fallo real de Android.

## Retirada

Una vez identificada y verificada la causa, retirar el panel y su import/uso,
el observador y sus puntos de integración, la bandera/versión de Vite y sus
declaraciones de tipos, así como las pruebas específicas del diagnóstico.
Verificar después pruebas, build y ausencia de las marcas temporales en los bundles.
No mantenerlo activo como herramienta permanente ni publicar producción desde este bloque.
