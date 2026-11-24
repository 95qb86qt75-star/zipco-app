# Diagnóstico temporal de loadOrders — QA

Nota de lectura 2026-10-19: las etapas de acceso y bloqueo siguientes se conservan
como historial. Más abajo se documenta el despliegue desde Git y la confirmación
móvil del panel. El [cierre QA-DOC-CLOSURE-01](frontend-qa-documentation-closure.md)
registra el estado reciente y respalda estas notas en Git. El fallo original
de carga no se declara resuelto.

Solo frontend. No cambia peticiones, recargas, acciones, permisos ni contratos.
Desactivado por defecto. El commit `6f42aedac7352ad99dd61cb2d4901c0ad6e9b26a`
está publicado en `origin/qa`; Vercel confirmó el despliegue automático normal,
que no activa el diagnóstico. El Preview temporal habilitado está autorizado,
pero sus dos intentos quedaron bloqueados por Vercel antes del build.
No existe todavía un despliegue habilitado y comprobado para Android.

## Acceso a Vercel — seguimiento 2026-10-17

- Integración oficial: disponible, sin instalación/conexión confirmada.
- Comprobación inicial de CLI: no se encontró ejecutable ni sesión en las ubicaciones locales habituales.
  No hay credenciales de Vercel disponibles en el entorno de ejecución comprobado.
- Chrome y Edge están disponibles. No se ha comprobado una cuenta autenticada
  en el navegador ni se han inspeccionado cookies o sesiones personales.
- El plugin `vercel-plugin` mencionado por Bastián no prueba autenticación.
- Bastián autorizó instalar únicamente la CLI oficial de Vercel. Se instaló
  `vercel` **64.5.0**, desde npm, en
  `C:\Users\Basti\AppData\Local\Temp\zipco-vercel-cli`, sin dependencias nuevas
  en ZIPCO ni otros plugins. La instalación finalizó correctamente.
- Bastián completó `vercel login` mediante el flujo oficial por navegador.
  La CLI confirmó el login con salida 0 y se verificó acceso autenticado al
  equipo `zipco-s-projects`, proyecto `zipco-app`, framework Vite.
  La URL/código de autorización y las credenciales no se muestran ni se
  incorporan a documentación o código.
- Configuración temporal por despliegue preparada fuera del código exportado;
  no se han modificado ajustes globales, alias ni producción.
- Se preservan los dos documentos locales de traspaso fuera del commit.

## Resultado del intento Preview — 2026-10-17

- Código exportado desde el commit autorizado: 306 archivos comprobados
  byte por byte contra los blobs de Git. No se subieron los cambios locales
  de los documentos de traspaso ni esta actualización documental.
- Configuración por despliegue, fuera del código exportado:
  `buildCommand: npm run build -- --mode qa`, bandera temporal
  `ZIPCO_QA_LOAD_DIAGNOSTICS=1`, destino explícito Preview y metadata de
  rama `qa` y SHA `6f42aedac7352ad99dd61cb2d4901c0ad6e9b26a`.
- Primer intento: `dpl_8i291aCqdUD1RYwiEnaQ9p4kxSvY`, estado `BLOCKED`.
  Faltaba metadata del autor por tratarse de una exportación sin `.git`.
- Se contrastó con el despliegue Git exitoso del mismo SHA y se verificó
  la metadata del autor contra el commit local exacto. Se realizó un único
  reintento con esos datos reales, sin cambiar identidad ni permisos.
- Segundo intento: `dpl_8Tdv3A8EcuQgd3CkGZ9MoL58RdSY`, estado `BLOCKED`.
  Vercel confirmó destino Preview, rama y SHA correctos y el comando QA,
  pero devolvió `TEAM_ACCESS_REQUIRED`, indicando que el autor del commit
  no tiene permiso para crear despliegues en el proyecto. No ejecutó el build.
- URL del intento bloqueado (no es una aplicación QA utilizable):
  `https://zipco-g0zarnzmh-zipco-s-projects.vercel.app`.
- Sin más reintentos ni cambios de permisos, miembros, facturación o ajustes
  globales. No se reasignó ningún alias. La presencia del panel y su SHA
  compilado siguen pendientes; la metadata de despliegue no sustituye esa prueba.
- Acción pendiente de Bastián: abrir el intento bloqueado en el panel de
  Vercel y revisar su aviso de acceso; compartir una captura saneada si
  necesita orientación. No compartir credenciales ni códigos de autorización.
- El despliegue automático normal del commit continúa confirmado como READY;
  no activa el diagnóstico. No se afirmó comprobación funcional en Android.
- Se inspeccionó el alias habitual
  `https://zipco-app-git-qa-zipco-s-projects.vercel.app`: sigue apuntando a
  `dpl_64ZSRR9oAbg2div16Zy9XiUTHtmw`, despliegue automático normal en READY.
  Por tanto, ese acceso directo no muestra el diagnóstico temporal.

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

### Preflight de la vía Git real con alias intactos

Bastián autorizó un intento desde el despliegue Git exitoso, conservando el
SHA exacto y sin cambiar alias. Se verificaron `source: git`, referencia `qa`,
SHA autorizado, estado READY y destino Preview del original. Se preparó una
petición de redeploy con `withLatestCommit: false` y el comando temporal
`ZIPCO_QA_LOAD_DIAGNOSTICS=1 npm run build -- --mode qa`.

**La petición todavía no se ha enviado:** Vercel asigna automáticamente un
alias por rama y no se encontró un control documentado para impedir su
reasignación en Preview. `autoAssignCustomDomains` solo cubre dominios
personalizados. Se pidió resolver esa restricción antes del POST; no se
consumió el intento autorizado, no hubo otro rechazo de acceso ni se cambió
ningún alias o configuración global. No hay una nueva URL Android habilitada.

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
Si llega a activarse el Preview temporal, volver después al build QA normal,
sin la bandera, y comprobar la retirada del panel. Cualquier restauración de
alias se limitará al alias QA y requerirá verificar su destino. No eliminar
ni modificar despliegues de producción para retirar este diagnóstico.

## Resultado posterior — Preview desde Git real autorizado

Esta entrada conserva el historial anterior y registra el resultado más reciente.
Bastián autorizó un único intento desde el Git real del despliegue exitoso y,
solo para ese intento, la eventual actualización automática del alias QA habitual.

### Comprobaciones anteriores al envío

- Equipo `zipco-s-projects`, proyecto `zipco-app`, referencia `qa`, entorno Preview.
- Alias QA anterior: `zipco-app-git-qa-zipco-s-projects.vercel.app`.
- Destino anterior: `dpl_64ZSRR9oAbg2div16Zy9XiUTHtmw`;
  URL propia `https://zipco-liildp3wy-zipco-s-projects.vercel.app`;
  SHA `6f42aedac7352ad99dd61cb2d4901c0ad6e9b26a`; estado READY.
- Recuperación prevista, comprobada contra la ayuda de la CLI y no ejecutada:
  `vercel alias set zipco-liildp3wy-zipco-s-projects.vercel.app zipco-app-git-qa-zipco-s-projects.vercel.app --scope zipco-s-projects`.
  Es una referencia de recuperación, no una reversión automática ni autorización
  para modificar otros alias.
- Se comprobó únicamente la configuración pública `VITE_API_URL`: el valor
  aplicable a Preview usa HTTPS y un host QA, distinto del respaldo de producción.
  Se comprobaron tanto las opciones de la rama como el valor por defecto Preview.
  No se solicitaron descifrados masivos ni se registraron valores de otras variables.
- Fuente fijada mediante `deploymentId` del despliegue Git exitoso y
  `withLatestCommit: false`. No se enviaron archivos locales, autores ni metadata
  artificial; no se tomó automáticamente un commit posterior.
- Los dos documentos locales anteriores conservaron sus hashes y quedaron fuera
  del código publicado. No se borraron ni descartaron avances.

### Envío y resultado

- Se realizó **un solo POST** de creación/redeploy desde la fuente anterior.
- Ajuste exclusivo del despliegue:
  `ZIPCO_QA_LOAD_DIAGNOSTICS=1 npm run build -- --mode qa`.
- La CLI 64.5.0 recibió la creación, pero terminó con un error local `spawn EPERM`.
  No se repitió el POST ni se aplicaron otros cambios para forzarlo. Solo se
  hicieron consultas posteriores de lectura al despliegue ya creado.
- Vercel confirmó después estado **READY**, sin bloqueo de acceso ni error de build.
- Nuevo despliegue: `dpl_8tbJNr7RzmVwNM2bb33BXfS7kqxR`.
- URL propia: `https://zipco-rerurnauz-zipco-s-projects.vercel.app`.
- `gitSource` coincide con el repositorio real del original, tipo GitHub,
  referencia `qa`, SHA `6f42aedac7352ad99dd61cb2d4901c0ad6e9b26a`.
  La API etiqueta la vía de solicitud como `source: cli`; el código procede
  del `gitSource` heredado, no de la carpeta local exportada.
- Destino Preview (`target: null`), build `qa` completado; bundle principal
  `dist/assets/index-U67VMRQp.js`, 805.25 kB según logs de Vercel.
- El alias QA se actualizó automáticamente a ese despliegue. Se verificó su
  destino con la CLI. Es el único alias asignado al nuevo despliegue.
- El comando global del proyecto continúa sin override (`buildCommand: null`)
  y el framework continúa siendo Vite. No se modificaron ajustes globales,
  permisos, conexiones, membresías, plan, visibilidad, backend o producción.
- El despliegue anterior permanece READY; no se ejecutó recuperación.

### Panel y diagnóstico real: comprobaciones separadas

- **Despliegue y build:** confirmados exitosos por Vercel.
- **Activación:** confirmados comando de opt-in, modo QA, referencia y entorno
  compatibles con las protecciones del código. La comprobación visual del
  panel en una sesión autenticada de Android sigue pendiente.
- La lectura HTTP pública del bundle devolvió 302 por la protección de Vercel.
  No se generaron tokens de bypass ni se cambiaron protecciones para leerlo.
- Se entregó la URL y se pidió a Bastián confirmar el panel desde Solicitudes,
  sin ejecutar START_WORK ni otras acciones de pedidos.
- **Fallo real:** todavía no identificado ni resuelto por esta publicación.
  Hace falta recoger un registro saneado al actualizar Solicitudes normalmente.
- Cuando se identifique y corrija el fallo, proponer una actualización nueva que
  retire el diagnóstico conservando los avances. No volver automáticamente al
  despliegue anterior ni publicar producción.

## Acceso desde el celular — origen del Preview y CORS

Bastián mostró el mensaje «No se pudo conectar con el backend QA» al intentar
ingresar desde la URL propia del Preview. Se revisó `qaAuthApi.ts`: ese mensaje
se genera cuando `fetch` falla; un HTTP 401 legible genera otro texto, «La clave
QA fue rechazada». No se solicitó ni comprobó la clave del usuario.

Se hicieron únicamente dos solicitudes OPTIONS a `/qa/auth/session` de Backend
QA, sin clave, JWT, cuerpo ni creación de sesión:

- Origen `https://zipco-rerurnauz-zipco-s-projects.vercel.app`: HTTP 204,
  sin `Access-Control-Allow-Origin`; el origen no queda autorizado por CORS.
- Origen `https://zipco-app-git-qa-zipco-s-projects.vercel.app`: HTTP 204,
  con autorización del origen, método POST y cabecera QA.

Se volvió a comprobar el alias habitual: apunta a
`dpl_8tbJNr7RzmVwNM2bb33BXfS7kqxR`, el Preview con diagnóstico, estado READY.
La indicación es usar ese alias habitual para conservar el origen autorizado,
sin cambiar claves ni ampliar CORS. La URL propia no debe usarse para esta
prueba de ingreso mientras no tenga autorización de origen; no se modificó
backend para agregarla.

Esta comprobación identifica el bloqueo de origen de la URL propia. No prueba
la validez de una clave, no confirma todavía el panel visible en el celular y
no identifica ni resuelve el error original de carga de pedidos. No se ejecutó
POST de login, START_WORK ni cambios de datos.

## Comprobación móvil comunicada por Bastián — 2026-10-17

Esta entrada actualiza las comprobaciones pendientes anteriores sin borrar
ni reescribir su historial.

- Bastián confirmó que el acceso QA habitual muestra «Diagnóstico temporal
  QA — Solicitudes» en **Android e iPhone, vista del negocio**.
- Referencia de la publicación: commit
  `6f42aedac7352ad99dd61cb2d4901c0ad6e9b26a`, Preview
  `dpl_8tbJNr7RzmVwNM2bb33BXfS7kqxR`, alias
  `https://zipco-app-git-qa-zipco-s-projects.vercel.app`.
- Tras pulsar «Actualizar Solicitudes», el contador permaneció en **(0)**
  y el informe mostró **`[]`**, sin registros de fallo.
- Evidencia: confirmación directa de Bastián para ambos celulares y dos
  capturas adjuntas en el chat que muestran el panel en Android, plegado y
  desplegado. No se copiaron imágenes ni datos personales al repositorio.
- **Panel visible:** confirmado por Bastián en ambos dispositivos. No implica
  que el agente haya realizado una comprobación móvil independiente.
- **Error original:** no reproducido en esta actualización. La ausencia de
  registros solo describe esta observación; no demuestra que esté corregido.
- **Causa y solución del error original de loadOrders:** todavía pendientes.
  El bloqueo CORS de la URL propia del Preview es un hallazgo separado.
- No se repitió START_WORK ni se ejecutaron acciones de pedidos, según la
  confirmación de Bastián. No se modificaron datos para provocar el fallo.
- Próximo diagnóstico: si el aviso reaparece durante una actualización normal,
  recoger únicamente el informe saneado. No repetir START_WORK para reproducirlo.

Esta actualización es exclusivamente documental. No cambia código, backend,
configuración, alias, commits ni despliegues y no retira todavía el diagnóstico.
