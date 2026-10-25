# Restaurar identificador QA en publicación automática

Fecha: 2026-10-24. Clasificación: **solo frontend QA, configuración de compilación**.

## Causa

Tras la publicación automática de `64fac1b`, Bastián mostró capturas de cliente y negocio sin el identificador QA. No era un problema de espacio en el encabezado: `RequestsScreen.tsx:658-659` condiciona ese marcador a `QA_LOAD_DIAGNOSTICS`.

`qaLoadDiagnosticsEnabled` exige modo `qa` y `ZIPCO_QA_LOAD_DIAGNOSTICS=1`. Las publicaciones anteriores utilizaban esos parámetros explícitamente. El comando genérico `npm run build` hacía `vite build` en modo producción, por lo que la nueva publicación automática excluyó el marcador y el diagnóstico. La revisión separada de diseño sí tenía su propia habilitación de Preview, pero no restauraba ese modo de compilación.

El cambio de las tarjetas reales queda en pausa por el «espera» del usuario. Este trabajo corrige únicamente la compilación y la identificación de versión; no conecta el flujo nuevo ni afirma que el diseño real ya se haya sustituido.

## Cambios

- `package.json`: build delega en `scripts/build-app.mjs`.
- `scripts/build-plan.mjs`: selecciona automáticamente modo qa exclusivamente con VERCEL=1, VERCEL_ENV=preview y rama qa. Respeta modos explícitos, argumentos de salida, otras ramas, builds locales y producción.
- `scripts/build-app.mjs`: ejecuta Vite con esos argumentos y activa el diagnóstico para ese contexto QA. No imprime ni cambia credenciales, URL de API, configuración global de Vercel o permisos de la aplicación.
- `src/test/buildPlan.test.ts`: 11 casos para límites de rama, ambiente, modos explícitos y argumentos.

No se modificaron `qaAuthConfig`, autenticación, roles, endpoints, campos, estados ni datos. Se reutiliza el modo QA ya existente y aprobado; Railway QA no requiere cambios.

## Validación

- 1.307 pruebas / 110 archivos aprobados.
- Build automático QA simulado con contexto Preview de rama qa: Vite selecciona qa sin pasar --mode; PWA y assets aprobados. Bundle incluye SHA de prueba real del frontend.
- Build automático de producción simulado, incluso con opt-in de diagnóstico heredado: Vite conserva producción; no incluye la versión QA ni la vista de diseño.
- Advertencia preexistente por tamaño de bundle. Salidas de validación en node_modules/.cache, sin modificar dist rastreado.
- git diff --check aprobado.

La publicación se realiza exclusivamente en qa y Vercel Preview. Verificar el estado del commit antes de entregar la versión al usuario. No se modifica main, producción, Railway ni proveedores.
