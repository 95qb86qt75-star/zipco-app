# Regla vigente: rediseño visual de tarjetas y entrega a Claude

Acuerdo del usuario: 2026-10-31, America/Santiago. Aplicar cada vez que se
prepare una modificación visual de una tarjeta, de cliente o negocio y en
cualquier modalidad o estado. Consultar este documento al retomar ese trabajo;
el historial del chat no sustituye esta regla.

## Preparación obligatoria

1. Identificar pantalla, rol, modalidad y estado exactos. Distinguir tarjeta
   cerrada, detalle abierto y ventanas asociadas.
2. Leer el código vigente del repo y verificar sus rutas y líneas actuales. No
   copiar números de un informe anterior ni usar como fuente una entrega antigua.
3. Localizar la composición completa: cabecera, cuerpo expandido, estilos,
   animaciones y dependencias compartidas. No entregar únicamente la cabecera.
4. Presentar las rutas y líneas como lista copiable: nombre del archivo, carpeta,
   rango de líneas y función de ese bloque. Distinguir código editable de referencia.
5. Entregar los prompts aquí en el chat, listos para copiar a Claude; no sustituir
   esa entrega por un documento o un ZIP, salvo que el usuario lo solicite.

Los [mapas de fuentes](../src/app/features/README.md) y
[tarjetas](../src/app/features/requests/cards/README.md) ayudan a localizar los
propietarios; sus líneas deben comprobarse en los archivos reales.

## Bloque 1: permisos de edición explícitos

Completar con nombres y rutas concretos, sin categorías ambiguas:

```text
ARCHIVOS QUE PUEDES MODIFICAR Y DEVOLVER COMPLETOS:
- [Nombre, ruta y finalidad de cada archivo autorizado.]

ARCHIVOS SOLO DE REFERENCIA: NO MODIFICAR NI DEVOLVER:
- [Nombre, ruta y finalidad de cada dependencia de solo lectura.]

Conserva los componentes, props, callbacks, permisos y acciones existentes.
Modifica únicamente la tarjeta, el rol y el estado indicados.
Devuelve completos solo los archivos autorizados que hayas modificado.

Si necesitas modificar un archivo de referencia, explica cuál y por qué antes
de escribir ese cambio. No lo sustituyas por una imitación ni omitas controles
para hacer encajar el diseño.
```

Señalar los selectores o variantes que delimitan el alcance cuando haya CSS o
componentes compartidos. Conservar la ventana real de Condiciones aceptadas,
salvo que el usuario autorice expresamente rediseñar esa ventana. No modificar
otras tarjetas mediante reglas globales. No añadir versiones antiguas/nuevas
como recorridos alternativos.

## Bloque 2: explicación funcional de la tarjeta

Entregar estas secciones con sus títulos, adaptadas al código y contrato reales:

```text
QUÉ REPRESENTA ESTA TARJETA
[Pantalla, participante, modalidad, estado actual y decisiones ya tomadas.]

QUÉ SIGNIFICA CADA PARTE
[Identificación del pedido, producto, importe, etiquetas, progreso y mensajes.
Explicar el significado real: acordado no equivale a pagado, por ejemplo.]

POR QUÉ EXISTEN ESTOS BOTONES
[Para cada botón: finalidad, qué abre o ejecuta, permisos, cuándo está bloqueado,
si solo navega/despliega o guarda, confirmación previa y efecto de cancelar.
Conservar errores, recuperación e idempotencia del recorrido existente.]

INSTRUCCIONES DEL NEGOCIO O CLIENTE
[Usar el participante que corresponda. Explicar qué datos entrega, cómo se
muestran y qué campos son texto libre. No inventar mensajes, horarios o direcciones.
Si no aplica, decirlo expresamente y explicar por qué.]

ESTADOS POSTERIORES
[Qué estados y acciones pueden seguir según el servidor. Qué parte de la tarjeta
cambia y qué ocurre con el detalle, los avisos y las categorías, cuando corresponda.
Distinguir estados locales de interacción de transiciones confirmadas del pedido.]

OBJETIVO DEL REDISEÑO
[Qué debe comprender el usuario y qué jerarquía o problema visual se busca mejorar.
Especificar los controles, ventanas y recorridos que deben conservarse.]
```

Completar también las animaciones y transiciones que existen, su disparador,
apertura/cierre, foco, accesibilidad, controles táctiles, tamaños adaptables y
movimiento reducido. No describir un comportamiento deseado como si ya existiera.
Si la fuente no confirma una acción o efecto, indicar la incertidumbre.

## Entrega esperada y límites

- Código completo de los archivos autorizados modificados, basado en las versiones
  actuales, con explicación de qué cambió en cada uno.
- Descripción de los clics, estados, animaciones y recuperación conservados.
- Qué se comprobó realmente y qué falta probar en el repo y en celulares. Un
  prototipo con componentes reemplazados no acredita integración real.
- No cambiar contratos, endpoints, persistencia, permisos ni estados de negocio
  por una decisión visual. Si aparece esa necesidad, seguir la coordinación con
  backend de AGENTS.md.
- Aplicar la guía orientativa de 400–500 líneas sin comprimir código ni fragmentar
  artificialmente un flujo coherente.

Esta regla define el formato y la preparación. No exige una nueva aprobación ni
otra ronda con Claude cuando el usuario ya entregó código aprobado y autorizó su
integración. Tampoco autoriza por sí sola publicaciones o cambios de backend.
