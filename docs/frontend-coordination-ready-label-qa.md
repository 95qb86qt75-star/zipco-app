# Por coordinar: texto de disponibilidad para WhatsApp

2026-10-29. Clasificación: **solo frontend QA**, cambio de texto.

La tarjeta plegada de cliente y negocio muestra **«Ya puedes coordinar por WhatsApp»** en lugar de «Iniciar coordinación por WhatsApp», cuando está lista para ese paso. Al tocarla se abre el mismo detalle. El botón interior conserva la acción «Iniciar coordinación por WhatsApp» para iniciar efectivamente la coordinación; se conservan permisos, consentimiento de ambas partes y allowedActions.

Archivos modificados: `src/app/screens/requests/BusinessCoordinationCard.tsx` (componente compartido para ambos roles) y `CoordinationCardShell.tsx` (cabecera mientras se verifican condiciones). Los textos de autorización pendiente, preparación y error se conservan.

No cambia ningún campo, endpoint, payload, estado o regla de backend. Railway no es necesario ni se modifica. Sin acciones o pedidos reales para validar.

Validación: **20 pruebas existentes de BusinessCoordinationCard aprobadas**, incluyendo roles y permisos independientes; build QA/PWA verificado antes de publicar. No se añaden pruebas para duplicar un literal ni se repite la suite general por este ajuste de texto. Advertencia habitual del tamaño del bundle; no se afirma lint/tsc independiente o prueba física.

Entrega mediante commit de esta ficha en rama `qa` y git push origin qa, despliegue automático Vercel QA. SHA y Ready se confirman en la respuesta final. `main` conserva `8295ab8c6024ab20851ebd371308d2f299b4668f`; producción intacta y documentos locales ajenos excluidos. El diagnóstico del clic externo continúa pausado.
