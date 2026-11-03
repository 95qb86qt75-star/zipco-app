# Negocio · coordinación inicial · B·Vidrio

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
Railway no necesario. Main y producción intactos. Rama qa, solo Vercel QA,
pendiente verificación de publicación. Directorio ajeno sin seguimiento
docs/design-handoffs/claude-cliente-coordinacion-whatsapp-c5f3c85 conservado.

Tiempos en node_modules/.cache/business-glass-timing.json. Lectura inicial no
medida. El intervalo implementation incluye redacción del escenario nuevo;
no se dispone de timer separado de esa parte de preparación. Se distinguen
reparación del test, corrección de foco, repeticiones, build, documentación y
publicación. Unitarias y navegadores corrieron parcialmente en paralelo; los
tiempos no se suman dos veces ni miden rendimiento de la app.
