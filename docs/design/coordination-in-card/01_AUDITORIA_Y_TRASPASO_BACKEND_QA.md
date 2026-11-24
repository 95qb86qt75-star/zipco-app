# Auditoría previa a la UI codex_final2

Clasificación: solo frontend. Contrato definitivo ya implementado/publicado por backend en Railway QA c3da34e. No se requiere otra API, migración, flag ni despliegue Railway. Los adjuntos se usan como referencia visual; no autorizan cambios de reglas ni duplicar implementaciones existentes.

## Cinco respuestas con evidencia

1. Negativas: request-coordination.service.ts:296 exige COORDINATING para DECLINE inicial; :338 asigna COORDINATING para RESPOND false. Se conserva la diferencia entre seguir y volver a esa categoría. La negativa inicial activa y la ronda DECLINED se presentan cerradas; las acciones posteriores siguen dependiendo de allowedActions. Notificación a la otra parte: :499 elige context.other.id y :515 distingue initial-declined/coordination-declined. Es un envío best-effort, no un recibo de lectura del otro teléfono.
2. Positivas: request-coordination.service.ts:304 valida la primera declaración y :322 la pasa a IN_PROGRESS. RESPOND true no cambia ese estado; :333 impide autorrespuesta. :515 selecciona coordination-confirmed/coordination-accepted para el otro participante.
3. Las listas actualizadas son la fuente; no hay un nuevo endpoint de contadores. En frontend requestStatusGrouping.ts:49 reduce las listas reales; RequestsScreen.tsx:178 calcula los totales. COORDINATING pertenece a Coordinación/Por coordinar; IN_PROGRESS a En curso. Los snapshots de animación no alimentan los totales.
4. request-coordination.service.ts:228 recupera la clave idempotente; :248 valida expectedVersion y :415 incrementa version. coordination-context.ts:71 y :75 usan bloqueo de escritura para proceso/pedido. Frontend conserva coordinationIntent, operation.pending/retry/update y el body/UUID exactos; no reintenta automáticamente.
5. request-coordination.service.ts:333 compara initiatedBy con BUSINESS/CUSTOMER y restringe RESPOND a la contraparte. Ambos roles pueden iniciar con el permiso y capacidad correspondientes; no se añade un rol ni un campo por el nuevo diseño.

Las rutas backend anteriores se resuelven bajo C:/dev/zipco-backend-qa/src/request-process/. Se auditaron sin escribir en ese repositorio. El estado de despliegue c3da34e fue entregado y verificado por backend en esta conversación; esta auditoría estática no constituye una nueva prueba física autenticada.

## Ajustes a las referencias

> Referencia vigente: paquete codex_final2. Implementar sobre el repositorio, sin sobrescribir sus componentes con adjuntos.
> Correcciones de contrato: coordinationAccepted (no decision); conteos calculados en frontend desde listas reales. Falta inicial sigue Por coordinar; RESPOND false vuelve allí; RESPOND true ya estaba y permanece En curso. Ningún contador se altera por reproducir una captura.
> Un envío incierto no puede decir «No se guardó»: conserva la recuperación y el reintento exacto. «Ya coordinamos» abre el detalle; solo una acción autorizada y confirmada cambia la negativa persistida. No se reabre por un marcador local.
> No existe una fecha de autorización en coordination: el paso muestra Confirmada, sin reutilizar acceptedAt/updatedAt. Fotos y detalle usan productPreview ya publicado, nunca customerImage. La tarjeta de disponibilidad normal ya existe y conserva sus correcciones v2.
> Los hologramas de resultado existentes se conservan; no se restaura el antiguo diálogo flotante de pregunta de coordinación. La consulta sigue dentro de su tarjeta. El aviso espera a que termine el holograma y se encola.
> La copia adjunta BusinessCoordinationCard carece del soporte embedded del HEAD actual; se conserva y modifica el archivo del repositorio.

Los documentos 00/12/13/14/15 de esta carpeta reemplazan los anteriores. Git conserva la evidencia histórica; el mensaje viejo de ampliación pendiente y las especificaciones reemplazadas dejan de ser documentos activos.

La implementación/pruebas/publicación se registran en docs/frontend-coordination-redesign-v2-qa.md. Main, producción y diagnóstico pausado del clic externo iPhone quedan fuera de este trabajo.
