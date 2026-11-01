# Estado actual y memoria de continuidad — frontend QA

Actualizado: 2026-11-01, America/Santiago.
Workspace C:/dev/zipco-app-qa, rama qa. Entrada de lectura junto con AGENTS.md.
Este documento consolida avances e identifica evidencias; no cambia contratos
ni convierte pruebas sintéticas en aprobación física.

## Decisiones vigentes

- Disponible de retiro local CliU19 integrado sobre el diseño aprobado WhatsApp:
  nueve variantes, reservas reales y salida/recuperación para LOCAL_PICKUP.
  [Informe, pruebas y medición](frontend-available-pickup-cliu19-qa.md): 97 unitarias,
  17 escenarios sintéticos y build QA/PWA aprobados. Publicado QA `1fd8295`,
  [Vercel success](https://vercel.com/zipco-s-projects/zipco-app/4U1jD3FrtRfMvT1F74jgeeQJr364);
  pendiente revisión física. No se alteraron contratos ni backend.

- Disponible del cliente, camino WhatsApp CliU18: diseño completo integrado con
  componentes reales, plegado accesible, recuperación visible y salida de 900 ms
  conectada después del holograma. Retiro y otras confirmaciones conservados.
  [Informe y tiempos](frontend-available-whatsapp-cliu18-qa.md): 109 unitarias,
  12 escenarios sintéticos y build QA/PWA aprobados. Publicado QA `dcd1deb`,
  [Vercel success](https://vercel.com/zipco-s-projects/zipco-app/A6t58hs9pqY54TT6PuwrtsxRoY1e);
  el usuario aprobó visualmente WhatsApp («quedó espectacular»). No equivale a
  comprobar todos los escenarios funcionales físicos; CliU19 aún requiere revisión.

- Retiro local del cliente CliU17 integrado: cabecera, carril sin cortes y detalle
  completo con pestañas «Cómo retirar» / «Contacto y opciones». Una sola composición,
  componentes de reserva y condiciones reales, controladores sin cambios. Ver
  [alcance, pruebas y límites](frontend-pickup-cliu17-qa.md). 107 unitarias distintas,
  18 escenarios sintéticos y build QA/PWA aprobados. Publicado en QA `604cb93`,
  [Vercel success](https://vercel.com/zipco-s-projects/zipco-app/ErqUFn3f6hTUkqBhCqMpNfyETKkq);
  el usuario confirma que el diseño quedó igual al aprobado. Esta confirmación
  visual no acredita todos los escenarios funcionales reales de reservas/recepción.
  Este bloque sustituye el rediseño de retiro pendiente mencionado en los antecedentes.
  El usuario solicita repetir este método en futuros rediseños; quedó incorporado
  a la política de trabajo y a la regla de entrega/integración visual.

- En cada modificación visual de una tarjeta, consultar la
  [regla de entrega a Claude](frontend-card-visual-handoff-policy.md). Entregar en
  el chat rutas y líneas verificadas, archivos editables/referencia explícitos y
  explicación de qué representa, significado de sus partes, motivo de sus botones,
  instrucciones del participante, estados posteriores y objetivo del rediseño.
  Es una regla documental vigente, no solo un acuerdo del historial.

- Guía de tamaño acordada: procurar hasta 400 líneas por archivo editable y
  revisar responsabilidades al superar 500, con excepciones justificadas. Aplicar
  gradualmente, sin fragmentar flujos coherentes, duplicar diseños ni comprimir
  código. Este cierre es documental: no se movió código ni se desplegó.

- Reorganización global de frontend autorizada el 2026-10-31: 12 capacidades en
  `src/app/features`, vistas y controladores separados, tarjetas y estilos con
  propietarios identificables y sin copias ejecutables en `src/app/screens`.
  Consultar el [mapa de fuentes](../src/app/features/README.md), el
  [mapa de tarjetas](../src/app/features/requests/cards/README.md) y el
  [informe de validación](frontend-feature-organization-2026-10-31.md).
  1.743 unitarias y 35 recorridos de navegador sintéticos aprobados; build QA/PWA
  aprobado. Código publicado en `6f239cad792e593a46576a5b07827e017d7909fc`, rama
  `qa`; GitHub informa [Vercel success](https://vercel.com/zipco-s-projects/zipco-app/4wyL3yhQ73mfEpRMtV8RaLnncfjf).
  No se reintentó la lectura de assets con credenciales ya rechazadas; falta esa
  comprobación autenticada y la revisión física en ambos celulares.
  La reorganización conserva contratos, permisos, recuperación y las ventanas
   reales. Ese bloque no incluía el detalle completo, integrado después en CliU17.

- Usuario confirma coordinación cliente correcta, pero señala detalle antiguo en
  retiro local. [Comparación con el paquete de Claude](frontend-pickup-full-design-handoff-diagnosis-qa.md):
  la entrega no traía cuerpo completo de retiro y pedía conservar el existente.
  Ajustes locales de contraste/toques y tres casos aprobados no equivalen al rediseño
  integral pendiente. Ese diagnóstico precede a la reorganización; incluye ajustes
  locales de contraste y toques ahora incorporados y comprobados en el bloque.

- La [vista aislada inicial](frontend-customer-course-design-preview-qa.md) queda
  como antecedente: el contrato backend ya está publicado y se integró en 2c29b27.
  La corrección de [mezcla CliU15](frontend-cliu15-mixed-design-diagnosis-qa.md)
  comparte ahora el retiro y el detalle entre app y vista local. Esta última sigue
  siendo una simulación sin pedidos reales; no sustituye las pruebas de la app.

- Aplicar [política de trabajo](frontend-qa-working-policy.md): alcance acotado,
  pruebas por dependencias/riesgo, reutilización y medición separada.
- El [diagnóstico de tiempos](frontend-qa-development-time-diagnosis-2026-10-30.md)
  está aceptado como orientación; no es una medición del rendimiento de ZIPCO.
- El [bloque de estabilización](frontend-qa-tools-stabilization-proposal.md)
  fue aprobado como piloto acotado y ejecutado. [Resultados y límites](frontend-qa-tools-pilot-2026-10-30.md).
- El cierre documental 14823df guardó la memoria sin push ni despliegue.
  El siguiente pedido del usuario autoriza el ajuste frontend de scroll al abrir
  Detalle del cliente y su publicación QA. La aprobación del piloto llegó
  después, con alcance separado y sin push/despliegue.
- No tocar C:/dev/zipco-app, main o producción. Mantener las reglas de AGENTS.md.

## Versión publicada frente a memoria local

Publicado QA **1fd8295052e64fcaf23acc600f0e362a42cc62ef**: Disponible de retiro
CliU19 completo, FREE/PREPAYMENT y contratos anteriores, recuperación y salida
compartidas, confirmación de cierre oscura. 97 unitarias, 17 escenarios únicos y
build QA/PWA aprobados; Vercel success. Railway/main/producción sin modificaciones.
El cierre documental posterior queda local, sin otro push.

Publicado QA **dcd1deb0a25b91d532221881b9d6a0af3fff3faa**: Disponible WhatsApp
del cliente, CliU18 completo y conexión de salida/recuperación. 109 unitarias,
12 escenarios sintéticos y build QA/PWA aprobados; Vercel success. API/contratos,
retiro, Railway y producción sin modificaciones. Main conserva `8295ab8`.
Cierre documental posterior local, sin otro push/despliegue.

Publicado QA **604cb939110d0916d4bece610cf20e0c7670fb02**: detalle completo CliU17
de retiro del cliente, pestañas con reserva/condiciones reales y opciones separadas.
107 unitarias distintas, 18 escenarios únicos y build QA/PWA aprobados; Vercel
success. Sin cambios de contrato/backend; diseño confirmado por el usuario,
pendientes flujos funcionales físicos completos y assets autenticados.
El cierre documental posterior queda local, sin otro push/despliegue.

Publicado QA **6f239ca**: reorganización global en doce capacidades y composiciones
canónicas. Mapa vigente en `src/app/features/README.md`. 1.743 unitarias, 35 recorridos
distintos y build QA/PWA aprobados; Vercel success. Se conserva el cuerpo de retiro
vigente, con los ajustes locales previos de contraste y toques. Pendiente revisión
física; no se reabre el diagnóstico del clic externo. El cierre documental posterior
queda local y no genera otro despliegue.

Publicado QA b5f37dd: corrección de mezcla visual observada en 2c29b27. Se elimina la tarjeta antigua
anidada en ownPending y el fallback visual de productos READY sin resumen v2.
Compatibilidad de acciones conservada. Seis escenarios únicos y build QA/PWA aprobados;
GitHub Vercel success. Pendiente revisión física, sin verificación autenticada de assets; ver
[diagnóstico y corrección](frontend-cliu15-mixed-design-diagnosis-qa.md).

Publicado QA 2c29b27: [CliU15 y recepción/finalización v2](frontend-customer-receipt-finalization-cliu15-qa.md),
backend QA 5d09106. Panel y carril en WhatsApp/retiro, recepción abierta y cierre
separados, agrupación de ambos roles, idempotencia y recuperación. Trece escenarios
locales aprobados, build QA/PWA y GitHub Vercel success. Pendiente verificación de
assets autenticados y prueba física. Main conserva 8295ab8; Railway no se modificó.

QA b230cf4: ajuste acotado de [carga de miniatura del cliente](frontend-customer-coordination-thumbnail-loading-qa.md):
el usuario confirma foto visible en el detalle pero no en el círculo. Primera
miniatura de la consulta pasa a eager; resto conserva lazy. 16 unitarias y cinco
escenarios y build QA/PWA aprobados. Push correcto; GitHub comunica Vercel success.
No se atribuye todavía una causa Safari confirmada. Pendiente comprobar la
miniatura en el iPhone y los assets servidos cuando exista acceso Vercel válido.

Commit QA 5e5cd01: [variante B inicial del cliente de Claude](frontend-customer-initial-coordination-variant-b-qa.md).
Tres archivos de diseño adaptados; ventana original de Condiciones aceptadas
preservada y comparada en navegador. 23 unitarias y nueve recorridos focalizados
aprobados y build QA/PWA correcto. Push realizado; GitHub informa Vercel success.
La API Vercel devolvió 403 y el alias exige SSO: SHA/artefactos servidos todavía
no comprobados. No confundir éxito de estado con verificación del alias.
Se conserva el flujo de negocio y la consulta posterior; sin backend.

Entrega anterior para Claude: [prompt reducido del cliente antes del primer acceso WhatsApp](PROMPT_CLAUDE_CLIENTE_INICIAR_COORDINACION.md).
Sus rutas y líneas corresponden a aquella versión. Para una entrega nueva usar el
mapa de fuentes vigente y calcular las líneas del código actual, sin adjuntar copias
históricas de la carpeta de traspaso.
El usuario obtiene dos TSX reales y un CSS global solo de referencia de las
rutas indicadas; Claude devuelve los TSX modificados y un CSS nuevo aislado.
Incluye líneas, lógica, clics y animaciones sin JSON ni carpetas de contexto.
Sustituye para este trabajo al paquete amplio anterior, que queda histórico.
Ese bloque solo preparó el prompt. Después el usuario entregó los tres archivos
de la variante B y autorizó su integración; ver el informe enlazado arriba.

Entrega anterior c5f3c85: [tarjeta fusionada de coordinación del negocio](frontend-business-coordination-fused-card-qa.md).
Conserva el diseño original de Condiciones aceptadas y los pasos inferiores,
sin duplicar identidad/importe/acciones. 21 unitarias y siete recorridos
focalizados aprobados. Build QA/PWA y publicación READY verificados. Pendiente
comprobación física del usuario. No requiere Railway.

Entrega anterior 29641b4: [tarjeta compacta del cliente tras Devolver](frontend-customer-declined-compact-card-qa.md).
Solo presentación; conserva permisos y acciones. 27 unitarias y 10 recorridos
focalizados aprobados. Build QA/PWA y publicación READY comprobados. Falta
prueba física del usuario en iPhone. No requiere Railway.

Última versión con artefactos comprobados por lectura (anterior al push 5e5cd01):

- Frontend c5f3c85dbbaa8b26821b07a908726c6d36d1b2b9, rama qa.
- Vercel dpl_2tsHANn2VRMzhyyXYjyYoon1Sz5e, READY.
- Alias https://zipco-app-git-qa-zipco-s-projects.vercel.app.
- JS /assets/index-BIgUK92l.js; CSS /assets/index-BlCqjNmb.css.
- El piloto no publicó una app; sus herramientas se incorporaron después en
  la entrega funcional autorizada 29641b4. Este cierre documental no publica.

Antecedente anterior al ajuste de Detalle:

- Frontend e367ab6809a203462350beb8f60c60ba66d55f85, rama qa.
- Vercel dpl_9kccSSNGodiPZ1MfwhENtZLuAKFC, READY.
- Alias https://zipco-app-git-qa-zipco-s-projects.vercel.app.
- Bundle /assets/index-CVNPCsaH.js y CSS /assets/index-C0YMgPD1.css comprobados
  por lectura autenticada en la entrega; no se vuelve a consultar por este cierre.
- Backend de acceso compartido: Railway QA dd00391, confirmado por el usuario
  y contrato local. Esta memoria no ejecuta una nueva verificación autenticada.

14823df es exclusivamente documental y no representa otra versión de la app.
Se incorpora como antecedente del siguiente ajuste funcional, sin publicación
documental separada. El SHA de la nueva entrega se identifica por el commit que
introduce [el informe del scroll de Detalle](frontend-customer-coordination-detail-reveal-scroll-qa.md);
su cierre comprueba la publicación QA y entrega el SHA exacto.

## Flujo WhatsApp acordado y aplicado

1. Cliente solicita; negocio confirma disponibilidad y elige el camino.
2. Cliente ve Disponible y decide Sí, continuar con la compra, con su permiso
   propio de contacto. Confirmar disponibilidad no es aceptar por el cliente.
3. Compra aceptada sin primer acceso: tarjeta existente «Ya puedes coordinar
   por WhatsApp» con Iniciar coordinación.
4. Cliente o negocio usa OPEN_WHATSAPP autorizado. Se conserva el holograma
   transitorio de redirección y el destino devuelto por backend.
5. El primer acceso autorizado de cualquiera permite a ambos declarar el
   primer Sí. La consulta «¿Coordinación lista por WhatsApp?» pertenece a la
   tarjeta asociada, no a un holograma flotante ambiguo.
6. Primer Sí pasa a En curso y genera ronda PENDING. La contraparte responde
   Sí/No real; Sí mantiene En curso y No devuelve a Por coordinar.
7. Falta abre Devolver/Cancelar. Cancelar no guarda ni avisa. Devolver antes
   del primer Sí registra la negativa, conserva Por coordinar y avisa al otro;
   la consulta queda cerrada tras recargar, con acceso para coordinar después.

Conservar allowedActions, consentimientos, teléfonos válidos, identidad del
acuerdo, versiones, idempotencia y recuperación. Ni GET, regreso a la app,
marcador local o abrir WhatsApp acreditan mensajes, pago o coordinación.
No inferir una ronda ni confirmationId. Un acceso histórico válido no se
resetea para obtener un diseño nuevo.

Contratos backend de referencia, bajo C:/dev/zipco-backend-qa/docs/testing/:
whatsapp-coordination-confirmation-contract-qa.md,
whatsapp-coordination-initial-decline-contract-qa.md y
whatsapp-shared-access-contract-qa.md. Frontend no los modifica en este cierre.

## Entregas recientes y evidencias

| Código | Alcance y resultado | Evidencia |
| --- | --- | --- |
| 612d059 | Pulso del tercer paso WhatsApp y acabado de Condiciones aceptadas; animación pausada al ocultar/cubrir y con movimiento reducido. | [Informe](frontend-customer-whatsapp-step-pulse-qa.md). |
| 4542d7f | Secuencia antes/después del primer acceso, permisos compartidos, controlador estable para no cortar la redirección. Publicado QA. 1.715 unitarias y 38 escenarios aprobados al cierre; no son cifras de la versión e367ab6. | [Informe](frontend-whatsapp-shared-access-sequence-qa.md). |
| 12c3b97 | Una regla CSS permite toques en el detalle expandido; cerrado conserva inert y disabled. QA READY. Cinco recorridos táctiles del cliente y build aprobados. | [Informe](frontend-coordination-detail-touch-fix-qa.md). |
| Sin commit adicional | Comprobación del negocio en 12c3b97: Condiciones abre/cierra, Anular abre y cancela, Iniciar conserva redirección. Tres estados: consulta, negativa y antes del primer acceso; todo simulado. No se confirmó una anulación real ni una prueba física en Android. | Resultado adicional comunicado al usuario; 2:41 y sin build/despliegue nuevo. |
| e367ab6 | Secuencia fotografiada del cliente: tarjeta original visible/bloqueada y estado compacto; aceptación positiva; Ver enfoca cabecera completa dentro de la lista. Holograma conservado. 35 unitarias focalizadas, 13 recorridos y build aprobados. QA READY. | [Informe](frontend-acceptance-transition-presentation-qa.md). |
| Commit de esta actualización | Al abrir Detalle explícitamente, acomoda suavemente la tarjeta del cliente si el contenido sale de vista. Tres casos táctiles y build aprobados; prueba física posterior pendiente. | [Informe](frontend-customer-coordination-detail-reveal-scroll-qa.md). |

Las fuentes de los diseños del cliente siguen siendo CustomerCoordinationCard.tsx,
CustomerCoordinationDetail.tsx, coordination-v2.css y AvailabilityWaitingCard.tsx.
El flujo se decide en ProcessOrderCard.tsx/WhatsappCoordinationPanel.tsx y sus
hooks. Al pedir rutas para Claude, entregar esos archivos reales y líneas de
la revisión vigente, no solo documentos de diseño o copias de Downloads.

## Confirmaciones y pendientes físicos

- El usuario validó en negocio confirmar disponibilidad, pasar a Esperando
  respuesta y mostrar el aviso inferior Ver con desaparición a los segundos.
  La misma ronda incluye capturas del iPhone en 12c3b97; no se inventa un SHA
  de negocio sin captura independiente.
- El usuario informó un intento exitoso de clic en notificación del sistema
  con iPhone en segundo plano: abrió la tarjeta correspondiente de disponibilidad.
  Es éxito puntual, sin correlación diagnóstica nueva ni estabilidad demostrada.
- Capturas del iPhone en 12c3b97 documentaron guardado como bloque alto vacío,
  holograma correcto, aviso negativo incorrecto y cabecera recortada tras Ver.
  Las correcciones están en e367ab6; su prueba física posterior sigue pendiente.
- La prueba manual del flujo completo continúa. No hay aprobación global de
  todas las pantallas ni de un pase a producción.
- El usuario confirmó posteriormente Iniciar coordinación del cliente, el
  holograma, la salida a WhatsApp y el regreso a la consulta dentro de la tarjeta.
  Después señaló falta de scroll automático al abrir Detalle en Devolver/Cancelar.
  Ese ajuste se documenta en la nueva entrega; no se declara probado físicamente.

## Incidente del clic externo iPhone: pausado, no resuelto

El usuario priorizó pantallas y pidió detener el diagnóstico. No pedir nuevas
pruebas de ese incidente ni enviar avisos artificiales/repetir confirmaciones
para retomarlo sin una indicación posterior.

- El aviso interno funcionó en los casos documentados.
- Con app cerrada, e2a0617b/655efcc v11 acreditó tarjeta y categoría correctas.
- Con app en segundo plano hubo fallos documentados. Ausencia de click-received
  en registros limitados/truncados no demuestra que el handler no se ejecutara.
- No atribuir ACK mismatch a la causa sin correlación, ni culpar a iOS/backend
  por hipótesis. No elegir el último pedido como destino alternativo.
- El éxito puntual más reciente no levanta la pausa ni cierra el incidente.
- Pausa de diagnóstico no implica que un flag se haya desactivado. No cambiar
  worker, payload, flags, suscripciones, Railway o arquitectura nativa por inferencia.

Referencias:
[éxito con app cerrada](frontend-iphone-warm-resume-e2a0617b-qa.md),
[evidencia fbf93e11](frontend-iphone-fbf93e11-entry-correction-qa.md),
[retención f9775db](frontend-f9775db-local-click-evidence-retention-qa.md),
[observación QA v11](frontend-qa-push-observation-v11-qa.md).
Las evidencias saneadas existentes se conservan en docs/evidence; no se copian
fotos de perfil, teléfonos, tokens ni payloads privados a esta memoria.

## Trabajos anteriores conservados en sus informes

Estas referencias preservan el recorrido acumulado. Sus fechas, contratos,
activaciones y límites se leen en cada informe; esta tabla no declara que
todos sus pendientes antiguos sigan abiertos ni que estén resueltos.

| Tema | Referencias |
| --- | --- |
| Fuera de hora y consulta al cliente | [Contrato frontend](frontend-late-initial-response-qa.md), [UI negocio](frontend-late-initial-business-ui-qa.md), [recuperación de propuestas](frontend-late-proposal-pending-recovery-qa.md). |
| Reloj sobre navegación inferior | [Corrección](frontend-late-clock-bottom-nav-qa.md). |
| Propuestas y detalles sin repetición | [Chat](frontend-proposal-chat-qa.md), [espera negocio](frontend-proposal-waiting-business-ui-qa.md), [cliente](frontend-customer-proposal-card-ui-qa.md). |
| Imagen, descripción y precio unitario del producto | [Integración](frontend-order-product-preview-qa.md). |
| Tarjetas desapareciendo ante fallos de lectura | [Recuperación](frontend-orders-transient-read-recovery-qa.md). |
| Horario informativo y compatibilidad de reservas | [Informe](frontend-service-hours-informational-policy-qa.md). |
| Mantener categoría al eliminar | [Corrección cliente](frontend-customer-closure-keep-category-qa.md). |
| Disponibilidad y alternativas | [S2](frontend-availability-continuation-s2-qa.md), [negociación](frontend-alternative-negotiation-qa.md). |
| Reservas de retiro | [V2](frontend-pickup-reservations-v2-qa.md), [V3](frontend-pickup-reservations-v3-qa.md). |
| Diseño de espera y transición suave | [Disponibilidad negocio](frontend-availability-waiting-business-design-d-qa.md), [plegado](frontend-coordination-fold-whatsapp-return-qa.md). |
| Coordinación bilateral y negativa guardada | [Bilateral](frontend-whatsapp-bilateral-coordination-qa.md), [consulta en tarjeta](frontend-coordination-in-card-qa.md). |
| Diseño final del cliente | [Rediseño](frontend-coordination-redesign-v2-qa.md), [ajuste Claude](frontend-claude-coordination-exact-qa.md), [final4](frontend-coordination-final4-qa.md). |

Historial más antiguo: [catálogo UI](frontend-ui-design-catalog.md),
[registro visual](frontend-visual-review-log.md),
[traspaso del 17 de octubre](frontend-qa-handoff-2026-10-17.md) y
[cierre del 19 de octubre](frontend-qa-documentation-closure.md).
Conservar sus notas históricas, sin reutilizar recetas de flags/despliegue
como instrucciones vigentes.

## Diez notas históricas incorporadas al respaldo local

Estaban sin commit al comenzar este cierre. Se conservan sus textos y sus
versiones de referencia; guardar una propuesta antigua no autoriza ejecutarla.
Las expresiones «actual», «pendiente» o «sin commit» son del momento descrito.

1. [Diagnóstico inicial de disponibilidad](diagnostico-nuevo-flujo-disponibilidad-contrato-pendiente.md).
2. [Regreso WhatsApp del cliente](frontend-customer-whatsapp-return-diagnosis-qa.md).
3. [Prompt de confirmación del cliente](frontend-customer-whatsapp-return-prompt-diagnosis-qa.md).
4. [Evidencia a1f6da08](frontend-iphone-system-click-a1f6da08-handoff-qa.md).
5. [Traspaso P3](frontend-p3-backend-handoff-qa.md).
6. [Excepción de retiro fuera de horario](frontend-pickup-outside-hours-exception-diagnostic-qa.md).
7. [Campos de retiro](frontend-required-pickup-fields-handoff-qa.md).
8. [Diagnóstico de notificación de disponibilidad](frontend-whatsapp-availability-notification-click-diagnostic-qa.md).
9. [Mapa de flujo para Claude, revisión histórica](mapa-flujo-pedidos-cliente-negocio-para-claude.md).
10. [Prompt histórico de reservas](prompt-backend-reservas-retiro-analisis-qa.md).

## Próximo trabajo autorizado y lo que requiere decisión

El respaldo documental 14823df quedó guardado localmente y pasa a incluirse
en el siguiente ajuste funcional de Detalle. Aplicar la política de validación/
medición a los ajustes autorizados.
El piloto ya autorizado estabilizó únicamente los dos escenarios indicados y
el verificador QA de lectura. Reutilizarlos según dependencias; cualquier
ampliación requiere definir alcance. No hay push ni publicación de herramientas.
Las pruebas físicas pendientes requieren al usuario y sus teléfonos.
