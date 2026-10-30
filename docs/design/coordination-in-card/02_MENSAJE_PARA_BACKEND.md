> Documento histórico de la revisión previa a c3da34e. La dependencia descrita fue resuelta por backend; no reenviar este pedido como pendiente. La integración vigente está en 13, 14 y docs/frontend-coordination-in-card-qa.md.

# Mensaje para backend — consulta compacta de coordinación QA

El diseño nuevo mantiene el contrato bilateral ya publicado y quiere que la consulta quede dentro de la tarjeta, sin holograma flotante. La auditoría frontend está en `C:/dev/zipco-app-qa/docs/design/coordination-in-card/01_AUDITORIA_Y_TRASPASO_BACKEND_QA.md` y responde las siete preguntas con archivo/línea.

**No falta RESPOND false:** el endpoint actual respond-whatsapp-coordination con `{expectedVersion,confirmationId,coordinationAccepted:false}` devuelve COORDINATING, deja la ronda DECLINED y programa aviso al otro participante. No crear un duplicado ni cambiar el nombre del booleano a decision. RESPOND true mantiene IN_PROGRESS.

El punto nuevo del paquete que necesita coordinación es **Falta antes de la primera declaración**, cuando el participante solo tiene CONFIRM_WHATSAPP_COORDINATION. El maestro pide Falta → confirmación dentro de la tarjeta → Devolver, que se guarde, quede Por coordinar, avise al otro participante y cierre la consulta. El documento 14 también dice conservar el anterior «No, aún no», que hoy solo cierra el recordatorio sin POST/aviso. Esas dos descripciones no equivalen.

En ese momento el pedido ya está en COORDINATING y no hay una ronda PENDING con confirmationId a la que responder. No usaremos RESPOND con un ID inventado ni ANNUL_COORDINATION, que anularía el pedido y lo enviaría a Historial.

Definir el contrato necesario para una negativa inicial persistida/notificada si esa es la regla acordada: roles, autorización, acción y campos reales, resumen y allowedActions, estado visible para ambos, cierre/supresión de la consulta y cómo se permite una coordinación posterior. Conservar el acuerdo aceptado, consentimientos, permisos de contacto, reservas/plazos y el comportamiento bilateral actual. No introducir una marcha atrás desde READY, recepción o cierre.

El diseño solo consumirá esa acción cuando esté publicada y permitida. Hasta entonces, Falta inicial no se habilitará como una respuesta guardada; el Falta de la contraparte sí está soportado. Si la regla final conserva «No, aún no» local sin aviso, indicarlo expresamente para ajustar el texto y la confirmación del diseño en lugar de agregar una API innecesaria.

Para cualquier ampliación acordada, seguir AGENTS.md del backend: acuerdo → contrato → implementación → pruebas → Railway QA → entrega a frontend. Incluir idempotencia, concurrencia, versiones, errores, reintento exacto y estado después de fallar el proveedor. No generar pedidos/pushes artificiales ni repetir confirmaciones reales para esta revisión. El diagnóstico del clic externo iPhone continúa pausado.

Frontend dejó corregidas las especificaciones 12, 13 y 14 dentro de `docs/design/coordination-in-card/`, pero no implementó ni publicó una UI parcial ante esta dependencia, según AGENTS.md del workspace frontend. Main y producción intactos.