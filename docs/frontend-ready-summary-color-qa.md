# Corrección del color del resumen Listos — QA

Fecha: 2026-10-17. Seguimiento: UI-READY-SELECTION-01. Clasificación: solo frontend.
Rama `qa`, base `566250d2752e4393411b88125ce0c8974cf0cbd6`.

## Causa y modificaciones

1. Bastián informó que «1 pedido listo para recibir» seguía del mismo color al
   pulsarlo. Causa confirmada en código: el ajuste anterior estaba en un bloque
   JSX desactivado con `false &&`. El mapa visible de `customerAttentionCards`
   conservaba un estilo fijo y no representaba la selección.
2. El mapa visible ahora utiliza `ReadyOrdersSummary`. El resumen activo se
   identifica por participante cliente, tipo de solicitud, filtro ready y categoría
   Listos. Seleccionado: verde teal oscuro y texto blanco. Sin selección: ámbar
   claro. Conserva el manejador de selección y no ejecuta acciones del pedido.
   El texto de ese componente indica que el negocio lo marcó como listo, sin
   asegurar finalización ni entrega del push.
3. Se añade una prueba de integración del componente real RequestsScreen:
   encuentra el resumen en la rama visible, lo pulsa, comprueba selección/color
   y categoría Listos; al cambiar de categoría pierde el resaltado y al volver
   a pulsarlo lo recupera. No realiza peticiones ni acciones del pedido.

Archivos del bloque:

- `src/app/screens/RequestsScreen.tsx`
- `src/app/screens/RequestsScreen.readySelection.test.ts` (nuevo)
- `docs/frontend-ready-summary-color-qa.md` (este informe)

Pruebas: `npm.cmd test`, **838 pruebas en 78 archivos, todas correctas**.
Build QA con diagnóstico temporal activo correcto, salida ignorada en
`node_modules/.cache/ready-summary-color-qa-build`. Advertencia habitual de bundle
superior a 500 kB. Sin cambios en `dist/index.html` ni configuración global.

Publicación autorizada por la instrucción vigente de continuar las correcciones
visuales en Frontend QA. Destino exclusivo Preview `zipco-app`, equipo
`zipco-s-projects`, rama `qa` y acceso habitual
`https://zipco-app-git-qa-zipco-s-projects.vercel.app`.
Se conserva el override por despliegue
`ZIPCO_QA_LOAD_DIAGNOSTICS=1 npm run build -- --mode qa` y Backend QA.
Los cinco documentos con cambios locales previos se preservan fuera del commit.

No se modifican campos/endpoints, contratos, permisos, estados, confirmaciones,
recargas ni datos de pedidos. Sin cambios en backend, Railway QA, `main` ni
producción. No se ejecutan acciones sobre pedidos para comprobar el color.
La comprobación visual Android/iPhone tras la publicación queda pendiente con
Bastián; este ajuste no constituye aprobación final del diseño.
