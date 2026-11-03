# Negocio · coordinación inicial · B·Vidrio

## Revisión tras capturas del usuario — 2026-11-03

Solo frontend. El usuario comparó la referencia del pie con c08404a: Retirar
permiso seguía como botón ancho y Anular debajo. La entrega había advertido esa
desviación; en la primera integración se mantuvo sin aprovechar la interfaz
render ya existente. Se corrige la composición completa del pie ahora.

- InitialCoordinationCardView.tsx: usa AvailabilityPostActions con su render
  existente para colocar los controles reales de contacto junto a Anular,
  seguido del aviso legal y Ocultar. Los diálogos continúan en el componente
  original; los nodos se usan sin reconstruir callbacks. Reserva/instrucciones,
  cancelar y avisos se conservan si existen. Ningún archivo protegido cambia.
- coordination-flow.css: dos enlaces con apariencia plana en una fila,
  tamaños adaptables y zonas táctiles de 44 px. Errores/autorización ocupan ancho
  completo. Se eliminan las reglas ya sin uso de zipco-bi-opts.
- El destello estaba limitado por reglas compartidas a tres iteraciones y con
  z-index negativo. Se coloca sobre el fondo del botón, bajo sus etiquetas,
  con pointer-events:none e iteración infinita. Respeta las pausas y movimiento
  reducido. Entrada del botón una vez; halo continuo, sin opacidad inicial cero.
- Margen inferior: se reprodujo distancia cero entre fila y borde. El ajuste
  previo overflow:clip evitaba el scroll interno de foco, pero permitió colapsar
  el margen. display:flow-root lo contiene sin recuperar el scroll interno.

Validación: 31 unitarias de AvailabilityPostActionsView y BusinessCoordinationCard;
cuatro casos en check-business-glass-footer: layouts 320/390/430 con posiciones
de enlaces, apariencia sin caja, margen, destello y diálogos reales; error real
del controlador de permisos con HTTP sintético, recuperación visible y un solo
POST sin reintentos automáticos. Una regresión reutilizada controls negocio
390 comprueba plegado, miniatura, ventanas, foco y scrollTop cero. Aprobadas.
El primer intento del nuevo test asumía textarea en Anular: esa ventana muestra
motivos y solo necesita texto en Otro. Se corrigió el selector, no producción.
El control negativo inicial detectó margen cero antes de la corrección.

Build QA/PWA aprobado, 15,38 s internos, advertencia habitual de chunks grandes.
No se repiten escenarios no afectados. Captura real del repo a 390 inspeccionada;
Chrome local no acredita coincidencia final en teléfonos. Pendiente iPhone/Android.
Mismos datos, endpoints, permisos, recuperación y confirmaciones; sin Railway.
Main y producción intactos. Publicación de esta revisión pendiente en Vercel QA.
Tiempos de revisión: business-glass-parity-timing.json; lectura inicial sin timer.

2026-11-03, America/Santiago. Clasificación: solo frontend, presentación y
navegación local. Tres archivos completos entregados por el usuario desde Claude.

## Composición y alcance

- InitialCoordinationCardView.tsx: BusinessInitialCard contiene el diseño
  completo, cerrado/abierto. Rama limitada a business && !embedded, pedido de
  producto y availability.path WHATSAPP. No se extiende silenciosamente a
  servicios ni retiro. BusinessAskDetail preservado literalmente; los demás
  consumidores conservan la composición original.
- CoordinationCardShell.tsx: variante explícita business-initial, cabecera con
  modalidad, estado, miniatura real, cliente, ACORDADO, total desconocido y
  toggle. customer-initial, header predeterminado y placeholder conservados.
- coordination-flow.css: original conservado y bloque .zipco-bi agregado.
  Manito, ondas, vidrio, chips, botón, fila de siguiente acción, transiciones y
  movimiento reducido. Sin reglas globales nuevas que rediseñen otras tarjetas.

La fila cerrada solo abre el detalle; no autoriza ni inicia WhatsApp. Puede
indicar Autorizar contacto, Iniciar coordinación, Preparando WhatsApp, espera
del cliente u Operación por resolver. En abierto permanecen los callbacks
unlock/go, condiciones reales, permisos, anulación y recuperación. Las ventanas
de ConditionsSheet, AgreementSheet, AnnulSheet y revocación no se rediseñan.
No se usa una réplica de AvailabilityPostActions.

## Adaptaciones de integración

1. Alcance explícito de producto WHATSAPP, más estrecho que business&&!embedded
   de la entrega, para conservar otras modalidades y consumidores.
2. inert nativo por ref en el detalle plegado: no se usa inert="" que React 19
   no aplica como verdadero. Se verifica interacción y foco reales.
3. Pausa de los nuevos acentos con coordination-motion idle, además de las
   compuertas de lista/reposo entregadas. El pop del botón usa un keyframe propio
   sin opacidad inicial cero: el contenido sigue visible con animación pausada.
4. Ocultar tarjeta conserva área de toque mínima de 44 px.
5. Inspección visual detectó desplazamiento interno de 50 px al devolver el
   foco desde los diálogos: overflow:hidden permitía desplazar la tarjeta.
   Se usa overflow:clip solo en .zipco-co-dk.zipco-bi para recortar adornos sin
   convertirla en caja desplazable. Tras corregir, scrollTop permanece en cero
   a los tres anchos. No se cambia el controlador compartido de foco.

No se cambia la cantidad: el badge real de ProductPreviewControl se conserva.
Retirar permiso sigue como botón del componente real, sin reconstruirlo como
enlace. Los tiempos de autorización y hologramas permanecen en su controlador.

## Validación según dependencias

- Parseo/resolución TSX sin errores. 80 unitarias: BusinessCoordinationCard y
  processCardVisualFlow. Se justifican por la composición y cabecera compartidas.
- Siete escenarios de check-business-initial-glass, con runner existente:
  tres layouts 320/390/430, producto, condiciones, anulación cancelada,
  revocación cancelada, foco al plegar e inert; autorización con un solo POST,
  carga real y navegación WhatsApp simulada; permiso de contraparte ausente;
  envío fallido con aviso en tarjeta plegada y sin reintento automático;
  movimiento pausado/reducido y botón visible.
- Dos regresiones reutilizadas: customer-initial controls a 393, con firma
  visual de la ventana original de condiciones; coordinación controls del
  negocio a 393 para el detalle de consulta compartido. Ambas aprobadas.
- Primer caso autorizar falló por selector del test: durante el envío el
  controlador existente reemplaza el botón por la operación pendiente. Se
  corrigió la expectativa sin cambiar producción y se repitió solo autorizar.
- Caso adicional de foco reveló scrollTop 50; después del ajuste CSS se repitieron
  solo los tres layouts afectados. No se cuentan intentos como casos nuevos.
- Fixture: bandera business-initial optativa para consentimientos sintéticos;
  escenarios predeterminados y herramientas compartidas conservados.
- Build QA/PWA final aprobado. Advertencia existente de chunks grandes.
  No hay tsc configurado en el repo: no se declara typecheck completo.

Chrome local, HTTP y navegación externos simulados/restringidos al fixture.
No se crean pedidos ni se envían confirmaciones, mensajes o pushes reales.
Pendiente comprobación física en iPhone/Android. No se atribuyen las pruebas
de navegador a Safari físico. No se repiten baterías no afectadas.

## Contrato y publicación

Mismos campos de pedido/acuerdo, consentimiento y allowedActions; mismas
lecturas y endpoints AUTHORIZE_CONTACT, OPEN_WHATSAPP, ANNUL_COORDINATION y
revocación. Sin campos, headers, endpoints, persistencia ni transiciones nuevos.
Railway no necesario. Main y producción intactos. Rama qa, solo Vercel QA:
`c08404a3d29b38c4ca024488eeef74991f0d6bc2`,
[Vercel success](https://vercel.com/zipco-s-projects/zipco-app/CMBikJhBbepv8sC1uD3Nmt5rWK83)
verificado por el check del commit. Cierre documental local sin otro push.
Directorio ajeno sin seguimiento
docs/design-handoffs/claude-cliente-coordinacion-whatsapp-c5f3c85 conservado.

Tiempos en node_modules/.cache/business-glass-timing.json. Lectura inicial no
medida. El intervalo implementation incluye redacción del escenario nuevo;
no se dispone de timer separado de esa parte de preparación. Se distinguen
reparación del test, corrección de foco, repeticiones, build, documentación y
publicación. Unitarias y navegadores corrieron parcialmente en paralelo; los
tiempos no se suman dos veces ni miden rendimiento de la app.

| Intervalo medido | Tiempo de pared |
| --- | ---: |
| analysis | 64.0 s |
| implementation | 90.8 s |
| test-preparation | 2.9 s |
| test-execution | 81.9 s |
| test-fixture-repair | 3.1 s |
| test-execution-retry | 200.7 s |
| implementation-focus-fix | 2.9 s |
| test-execution-focus-fix | 64.5 s |
| build | 81.6 s |
| documentation | 50.1 s |
| publication | 144.8 s |

Build/PWA interno: 11,14 s. Intervalo exterior build incluye espera/lectura
y preparación del texto documental; no hay timer separado de esos subpasos.
Publicación incluye espera del push y observación del check Vercel. Corte
anterior al commit documental final. No se dispone de un total íntegro que
incluya la lectura inicial no medida.
