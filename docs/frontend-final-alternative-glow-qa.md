# Proponer alternativa final con el diseño compartido aprobado

Fecha: 2026-11-13. Clasificación frontend, selección de presentación.

El usuario observó el formulario antiguo al abrir Proponer alternativa final.
La condición glowAlternative de PendingAlternativeActions.tsx admitía alternativa
inicial (canPrepareAlternative) y contrapropuesta cliente, pero excluía al negocio
en AWAITING_BUSINESS_COUNTER_RESPONSE. Los componentes y CSS nuevos ya existían.

Cambio único de código: reconocer la variante negocio con PROPOSE_FINAL permitido
dentro de esa selección visual, conservando sourceOverride y onConfirm requeridos.
Reutiliza AlternativeChangeEditor, AlternativeReviewPanel y CSS actuales, sin
copias. No cambia validación de borrador, obligatoriedad de mensaje/cambio, carga,
payload, idempotencia, permisos, oferta, horario o envío. No agrega obligación de
cambiar fecha. No modifica ProposalNegotiation ni los archivos que Claude está
rediseñando en paralelo. El acceso de renovación idéntica E205 mantiene su revisión.

Pruebas: arnés Chromium existente con HTTP simulado, tres anchos 320/390/430;
abre Proponer alternativa final con filas Glow y sin aviso de fecha obligatoria,
edita precio, conserva mensaje, revisa sin POST y en 390 confirma un único POST
actions/propose-final con total correcto y estado final esperado. Capturas reales
del formulario y revisión; ningún pedido QA ni aviso artificial.
Script local ignorado: node_modules/.cache/prepare-final-glow-test.mjs y
final-glow-browser.mjs. No suites generales por un selector visual local; no
cambian reglas ni las condiciones previas de alternativa inicial/cliente.

Build QA/PWA aprobado: Vite 17,63 s, 2412 módulos, diez precaches. Build y navegador
corrieron parcialmente en paralelo. No se afirma tsc (no configurado) ni prueba
física. Pendiente comprobar el formulario final en Android/iPhone.

Rutas/campos existentes de propuestas, sin modificación. No despliegue Railway,
contrato, flags, migraciones ni producción. Main conserva 8295ab8c.
Análisis/implementación inicial/preparación medidos como intervalo conjunto de
43 s; no se inventa desglose ausente. Verificación posterior incluye espera de
navegador/build (tiempo total instrumentado hasta captura 98 s). Publicación y
documentación se registran al cierre; no mide rendimiento de la app.

Publicación Vercel QA pendiente de verificar al escribir este informe.
