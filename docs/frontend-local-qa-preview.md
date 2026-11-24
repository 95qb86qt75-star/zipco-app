# DEV-LOCAL-QA-01 — Vista local de diseños desde celulares

Fecha: 2026-10-19. Rama: `qa`.

**Estado vigente: CANCELADO por ahora por decisión de Bastián (2026-10-19).** El servidor local está detenido y la herramienta se retira mediante un nuevo commit. Las instrucciones de arranque que siguen se conservan únicamente como historial; ya no aplican. Backend no habilitará la excepción CORS. La revisión de diseños continúa en Vercel QA.

Código asociado: **`fad7383`**; SHA completo: `fad73835c6f86b5a400b7ebb8d0660a3e75b0cd1`. Commit local, sin push ni despliegue. Esta documentación se registra por separado para poder referenciar el SHA exacto del código.

## Alcance y estado

Preparación frontend local terminada. El acceso integrado requiere coordinación frontend + backend por CORS. No se modificaron autenticación, endpoints, permisos, datos, backend ni proveedores.

El servidor se comprobó en `http://192.168.50.168:5173/`: HTML y JavaScript respondieron HTTP 200 desde el computador. Falta comprobar la apertura desde cada celular y habilitar el origen en Backend QA antes de poder iniciar sesión. No se declara terminado el acceso a los pedidos.

Se dejó iniciado durante la preparación. Mientras siga activo se puede abrir directamente la URL; no iniciar otra copia en el mismo puerto. El doble clic permite volver a iniciarlo cuando se haya detenido.

## Abrirlo sin instalar aplicaciones

1. Conectar computador y celulares al mismo Wi-Fi de confianza.
2. En el computador, abrir `C:\dev\zipco-app-qa` y hacer doble clic en **Abrir ZIPCO local.cmd**. No necesita instalar herramientas: Node, npm y las dependencias ya existen en este computador.
3. Mantener abierta la ventana. Esperar a que muestre **ABRIR EN COMPUTADOR Y CELULARES**.
4. En Chrome de Android o Safari de iPhone, escribir la dirección mostrada. Actualmente es **http://192.168.50.168:5173/**. Es HTTP, no HTTPS. Puede guardarse como favorito «ZIPCO local»; no sustituir el acceso directo QA habitual.
5. Después de guardar un cambio de diseño, esperar **LISTO** en el computador y actualizar la página del celular. Hay reconstrucción automática, pero la actualización del navegador es manual. No hace falta desplegar Vercel.
6. Para detenerlo, pulsar Ctrl+C en esa ventana o cerrarla. Si se apaga o duerme el computador, la vista deja de estar disponible.

Alternativa desde PowerShell:

```powershell
cd C:\dev\zipco-app-qa
npm.cmd run vista:local
```

La IP puede cambiar al reconectar el Wi-Fi. Usar siempre la que indique la ventana. Si hay varias interfaces, puede seleccionarse una dirección privada que realmente pertenezca al computador con `ZIPCO_LOCAL_PREVIEW_HOST`; el programa rechaza direcciones públicas o ajenas.

Si el celular no abre la página, registrar el error mostrado y comprobar primero la misma red. No se modificó el firewall. El perfil Wi-Fi de Windows observado es Público, por lo que podría bloquear conexiones entrantes; todavía no se ha demostrado un bloqueo desde el teléfono. No desactivar el firewall ni abrir redes públicas indiscriminadamente.

## Backend QA exclusivamente

- El comando fija `VITE_API_URL=https://zipco-backend-qa.up.railway.app` para su proceso y como definición del build. Sustituye valores heredados sin escribir archivos `.env` ni configuración global.
- Usa un build local en modo `qa`, con el acceso QA existente. No convierte Dev Auth en QA Auth ni cambia sus condiciones de seguridad. Dev Auth se desactiva y su clave se fija vacía; no se inserta ninguna clave QA en el build.
- La URL de producción continúa como literal de respaldo en el módulo existente, pero el valor configurado que se compila es la URL QA fija, no vacía. Ese respaldo no se selecciona en este comando.
- El diagnóstico temporal de loadOrders se desactiva únicamente en esta vista para revisar diseños. El despliegue QA existente conserva su configuración.
- El servidor escucha solo en la IP privada seleccionada, puerto 5173. No escucha en todas las interfaces. El comando rechaza su ejecución en Vercel/CI.
- Los archivos generados quedan en `node_modules/.cache/zipco-local-qa-build`, nunca en el `dist` existente. No se añadieron dependencias ni se cambiaron los comandos de producción.
- No hay proxy al backend, suplantación de origen ni cambios de autenticación.

Una vez autorizado el origen por backend, se utilizará la clave QA habitual directamente en la página, sin enviarla al chat. La sesión local es independiente de Vercel porque tiene otro origen. La vista utiliza datos reales de QA: las acciones de pedidos tendrían efectos en QA; no es una maqueta estática.

## Bloqueo confirmado y mensaje para Backend QA

Contrato actual: `POST /qa/auth/session`, acceso QA existente. La comprobación realizada fue exclusivamente `OPTIONS /qa/auth/session`, sin cuerpo ni credenciales. Para el origen local devolvió HTTP 204 **sin** `Access-Control-Allow-Origin`. El origen loopback `http://127.0.0.1:5173` tampoco fue permitido.

Archivos backend consultados solo en lectura: `src/config/cors-origins.ts` y `src/main.ts`, en `C:\dev\zipco-backend-qa`. El validador actual exige HTTPS salvo loopback en desarrollo; agregar simplemente una IP HTTP a la lista no resuelve esa restricción. Se necesita acordar una excepción estrictamente QA o una alternativa HTTPS aprobada. No se requiere inventar campos ni nuevos endpoints.

Mensaje para copiar al chat backend:

> Preparamos una vista frontend local para revisar diseños en los celulares, fijada exclusivamente a Backend QA. Origen solicitado: `http://192.168.50.168:5173`. El preflight OPTIONS a `/qa/auth/session` respondió 204 sin Access-Control-Allow-Origin. El validador actual exige HTTPS excepto loopback en desarrollo. Por favor, propón y coordina la autorización de este origen exacto solo en QA, o una alternativa HTTPS si no se aprueba HTTP local. Conserva los orígenes existentes; sin comodines, cambios de producción ni debilitamiento de autenticación. Las cabeceras utilizadas son Authorization, Content-Type y X-QA-Auth-Key; se mantienen las rutas y métodos existentes. Confirma el contrato y la publicación QA necesaria, y verifica el preflight antes de que probemos el login desde los teléfonos. No se cambió backend desde frontend ni se enviaron credenciales.

## Límites

La revisión local permite ver diseños sin desplegar cada ajuste. El HTTP de una IP LAN no es el entorno HTTPS seguro necesario para validar service workers y Web Push. Las pruebas de instalación PWA, notificaciones y segundo plano se mantienen en Vercel QA. La arquitectura nueva de notificaciones sigue pausada.

Referencia: [MDN — Uso de Service Workers y contexto seguro](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers).

## Archivos y validación

- `package.json`: comando independiente `vista:local`.
- `Abrir ZIPCO local.cmd`: acceso por doble clic.
- `scripts/local-qa-preview-config.mjs`: backend fijo, selección de IP privada y comprobación CORS sin credenciales.
- `scripts/local-qa-preview.mjs`: build, servidor local y reconstrucción al guardar.
- `src/test/localQaPreview.test.ts`: 12 pruebas de configuración y comprobación CORS.
- Este documento: instrucciones, alcance y coordinación pendiente.

Validación realizada: **899 pruebas aprobadas en 82 archivos**, incluidas las 12 nuevas y las pruebas existentes de acceso QA. Build QA local aprobado; advertencia existente por tamaño de bundle. HTML y asset JavaScript HTTP 200, panel QA incluido, Dev Access y panel de diagnóstico temporal excluidos. Socket comprobado exclusivamente en `192.168.50.168:5173`. La reconstrucción se comprueba disparando un cambio de fecha de un archivo existente, sin modificar sus bytes.

Vercel QA: sin nuevo despliegue ni cambios de alias o configuración. Railway QA: sin modificaciones; coordinación de CORS pendiente. `main` y producción no se modificaron. No se ejecutaron acciones de pedidos. Los documentos pendientes anteriores se conservan fuera del commit de esta preparación.

## Retirada autorizada — 2026-10-19

- Clasificación: solo frontend. No se cambian campos, endpoints, autenticación, permisos ni datos. No corresponde habilitar CORS ni publicar backend.
- Decisión: cancelar por ahora `DEV-LOCAL-QA-01` y continuar las revisiones mediante publicaciones en **Vercel QA**. Cada cambio terminado debe validarse, guardarse con commit y publicarse en Preview QA para comprobarlo en celulares.
- Servidor local detenido y puerto 5173 comprobado sin escucha. Se retiran exclusivamente el script `vista:local` de `package.json`, `Abrir ZIPCO local.cmd`, ambos módulos `scripts/local-qa-preview*.mjs` y `src/test/localQaPreview.test.ts`.
- Se conserva este documento para registrar la decisión y los commits originales `fad7383` y `2faa481`. No se utiliza reset, rebase ni eliminación de commits; la retirada queda en un commit nuevo.
- Los avances anteriores y sus documentos pendientes permanecen intactos y fuera del commit de retirada.
- Validación de retirada: **887 pruebas aprobadas en 81 archivos** y build en modo `qa` aprobado. Se retiran las 12 pruebas que pertenecían exclusivamente a la herramienta cancelada. El diff de `package.json`, `src` y `scripts` contra `b01b731` queda vacío: se conservan los avances anteriores.
- Publicación solicitada: Preview del equipo `zipco-s-projects`, proyecto `zipco-app`, rama `qa`, alias habitual `https://zipco-app-git-qa-zipco-s-projects.vercel.app`. Fuente Git del nuevo commit de retirada; sin subir documentos locales pendientes. Se conserva por despliegue el comando `ZIPCO_QA_LOAD_DIAGNOSTICS=1 npm run build -- --mode qa`, sin cambiar la configuración global. El SHA efectivo y el resultado READY deben comprobarse en Vercel antes de informar la publicación como terminada.
- Sin cambios en `main`, producción, Railway QA, configuración global, permisos ni acciones de pedidos.
