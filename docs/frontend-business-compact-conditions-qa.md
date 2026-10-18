# UI-BUSINESS-CONDITIONS-01 — Condiciones compactas del negocio

Fecha: 2026-10-17. Clasificación: solo frontend. Rama qa.

## Identificación y referencia

- Nombre estable: **Solicitudes negocio — condiciones aceptadas integradas**.
- Componente: `ProcessOrderCard`.
- Código: `src/app/screens/requests/ProcessOrderCard.tsx`.
- Commit del diseño:
  `308de1a1fae3ca00a172b05b24b2e968e4ab2a51`,
  `style: compact business accepted conditions like customer cards`.
- Prueba: `src/app/screens/requests/processCardVisualFlow.test.ts`.
- Referencia de código: presentación compacta del cliente existente en
  `73f5bfd181dcd6b22d4034ec3554509f6a6abc1e`.
- Referencias visuales: dos imágenes aportadas por Bastián en este turno; negocio
  Android con condiciones en una segunda tarjeta y recorte del bloque compacto
  cliente. Capturas conservadas en la conversación; archivos de imagen no
  incorporados al repositorio.
- Estado: implementado y probado; publicación QA para revisión móvil autorizada
  por la instrucción vigente de continuar los ajustes visuales. No constituye
  aprobación final del diseño.

## Modificaciones realizadas

1. Negocio adopta el bloque integrado de condiciones del cliente: barra con icono,
   “Condiciones aceptadas”, control de expansión y “Precio total” desde el acuerdo.
2. El detalle se despliega inmediatamente debajo de la barra, en el mismo bloque
   y antes de coordinación. Se elimina la segunda tarjeta, el título repetido y
   el panel de total repetido; productos, descripción, cantidad, unidad/subtotal,
   fecha/hora, nota e imagen mantienen sus datos del acuerdo aceptado.
3. “Abrir acuerdo” queda al final del detalle compacto y conserva participante
   negocio y categoría de retorno. La foto mantiene el CTA, visor, animación y
   glow existentes; en negocio dice “El cliente agregó una foto de referencia”.
4. Acciones de coordinación después del bloque integrado, accesibles con las
   condiciones cerradas y conservando su instancia al expandir/contraer. No
   cambian manejadores, permisos, confirmaciones, estados ni comportamiento.

Se reutiliza la presentación compacta existente; no se retiran datos del acuerdo
ni se alteran Historial, tarjetas de pedidos antiguos o la creación de pedidos.
Cliente conserva el diseño que se usó como referencia. No se modifican paletas
de selección, contratos, campos/endpoints, peticiones de carga, instrumentación
temporal, credenciales, backend ni datos de pedidos.

## Comprobaciones

- `npm.cmd test`: **843 pruebas en 78 archivos correctas**.
- Build QA con diagnóstico temporal activo correcto, salida ignorada en
  `node_modules/.cache/business-compact-conditions-qa-build`. Advertencia habitual
  de bundle superior a 500 kB.
- Pruebas de estructura y presentación en Coordinación pendiente, Coordinando,
  En curso y Listos; un único encabezado y rótulo del total, detalle antes de
  acciones, acciones accesibles al cerrar, acuerdo inmutable, foto por
  participante, ausencia de respaldo con datos antiguos y retorno del acuerdo.
- Sin llamadas reales de acciones de pedidos para comprobar la presentación.
  No se atribuyen medidas de altura ni comprobaciones de celulares a estas
  pruebas locales; la validación visual de la nueva versión queda pendiente.

## Publicación prevista y pendientes

Destino exclusivo: Vercel Preview del proyecto zipco-app, equipo
zipco-s-projects, rama qa. Backend QA comprobado mediante la configuración pública
del Preview; sin modificarla. Acceso habitual:
`https://zipco-app-git-qa-zipco-s-projects.vercel.app`.

Se conserva el diagnóstico temporal con override solo de este despliegue:
`ZIPCO_QA_LOAD_DIAGNOSTICS=1 npm run build -- --mode qa`.
Sin ajustes globales, backend, Railway QA, main ni producción.

Siete documentos con avances locales anteriores se preservan fuera de estos
commits. Esta ficha registra nombre + commit del cambio visual sin incluirlos
automáticamente. Pendiente revisión por Bastián en Android/iPhone, modos claro
y oscuro, expansión/cierre, foto y vuelta del acuerdo. Despliegue exitoso no
equivale a aprobación del diseño.
