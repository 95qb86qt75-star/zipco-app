# Revisar propuesta del negocio: condiciones sin duplicación

Clasificación: solo frontend. En `src/app/screens/requests/ProposalNegotiation.tsx` se deja de renderizar el resumen `AvailabilityPlanSummary` debajo de la conversación cuando business=true.

Las condiciones de retiro, mensaje, horario/dirección y reserva permanecen dentro de «Ver detalle de la propuesta» en ProposalChat. La vista del cliente y los campos de revisión de una propuesta final conservan su presentación. No cambian datos, permisos, estados, acciones ni notificaciones.

Campos y endpoints utilizados: los mismos `read.process.availability` y `proposal.availability` de GET `/request-processes/:id/proposals`, con la negociación actual. No se agregan campos ni endpoints.

Validación puntual en navegador con componentes reales y HTTP sintético: conversación del negocio sin resumen repetido; detalle con Retiro en el local y reserva; resumen del cliente conservado. Build QA/PWA aprobado, con el aviso conocido de bundle mayor de 500 kB. No se crean pruebas unitarias que solo repitan esta condición de presentación ni se reejecuta la batería funcional completa.

Publicación por rama qa → GitHub/Vercel QA. Pendiente comprobación visual del usuario en el celular. Railway QA no es necesario. Main y producción intactos; documentos locales ajenos conservados fuera del commit.
