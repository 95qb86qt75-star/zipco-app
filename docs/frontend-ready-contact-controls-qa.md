# Listos: retirar controles de consentimiento — QA

2026-10-25. Clasificación: solo frontend. El usuario solicita quitar en Listos,
para cliente y negocio, «Retirar mi permiso de contacto» y el texto «Autorizo
compartir el teléfono de mi perfil con la otra parte…».

Archivo funcional: `src/app/screens/requests/AvailabilityPostActions.tsx`.
El bloque de controles y mensajes de consentimiento se oculta cuando el estado
real del proceso es READY. Las etapas anteriores conservan el bloque. El acceso
a WhatsApp y las acciones de pedido de las tarjetas siguen sus permisos actuales.
No se revoca ni concede ningún permiso al ocultarlo.

Campos utilizados: `requestProcess.state` y los permisos existentes de lectura.
No se agregan/modifican campos, endpoints o payloads. Railway no es necesario.
No se modifica backend ni el contrato de START_WORK del diagnóstico anterior.

Validación: 1339 pruebas en 112 archivos y build QA/PWA aprobados. Comprobación
local de ocho renderizados, ambos actores, READY/IN_PROGRESS y permiso propio
presente/ausente: bloque oculto en READY y conservado en IN_PROGRESS. Sin datos
reales ni mutaciones. Sin nuevas pruebas permanentes para este cambio visual.

Base `4f4b9e6`, rama qa. Commit y publicación por integración GitHub pendientes
al preparar el documento; comprobar Vercel READY y alias habitual antes de
informar al usuario. Revisión Android/iPhone pendiente después de publicar.
Se conservan cuatro documentos locales previos fuera de este commit.
Main y producción intactos; no se cambia identidad Git ni se reescribe historial.
