# Retiro: bloquear envío con campos vacíos — coordinación QA

2026-10-25. Clasificación: frontend + backend. Diagnóstico solicitado tras
comprobar que se puede enviar retiro sin completar sus campos. Se interpreta
«los campos» como Mensaje para el cliente y Horario o dirección, ambos existentes.
No se modificó la aplicación ni backend: falta acordar/publicar la validación.

## Contrato actual

- Frontend `src/app/screens/requests/availability-design/AvailabilityDesign.tsx:172`:
  mensaje inicia vacío con placeholder. Línea 174: horario/dirección opcional.
  Línea 186: confirmar sustituye mensaje vacío por DEFAULT_PICKUP_MESSAGE y
  envía horario/dirección recortado aunque quede vacío.
- `src/app/screens/requests/availabilityChoice.ts:6` transforma estos valores a
  customerMessage/scheduleOrAddress de fulfillment.
- Backend, solo lectura: `C:/dev/zipco-backend-qa/src/request-process/availability.dto.ts:41`
  y línea 48 declaran ambos campos opcionales.
  `availability-plan.ts:217` aplica mensaje por defecto; línea 221 convierte
  horario/dirección vacío en null. Es el contrato S2 publicado, no un fallo de
  teclado o dispositivo. No se ejecutó un pedido real para reproducirlo.

## Payload y respuesta actuales

Confirmar disponibilidad usa POST `/request-processes/:id/actions/confirm-availability`:
`{ expectedVersion, proposalId, fulfillment: { path: 'LOCAL_PICKUP',
customerMessage: 'Acércate al local a pagar y retirar.', scheduleOrAddress: '',
allowCustomerWhatsapp: false } }`, con Idempotency-Key.

Alternativas y finales usan el mismo fulfillment en las acciones existentes
`propose-alternative` y `propose-final`, además de la revisión comercial.
Si permite WhatsApp, se conserva el consentimiento propio explícito del negocio.

El recibo confirmado contiene orderId, orderStatus y requestProcess; la lectura
proyecta availability con mensaje efectivo y scheduleOrAddress nullable. Se
describe el contrato leído; no es una respuesta nueva obtenida de QA.

## Pedido para backend

Exigir para nuevas decisiones LOCAL_PICKUP los dos campos, con trim y rechazo
de cadenas vacías o solo espacios. No aceptar el placeholder como texto que el
negocio escribió: frontend retirará el reemplazo automático al enviar.
Conservar límites actuales: mensaje hasta 120 caracteres Unicode y
horario/dirección hasta 80. Aplicar igual a confirmar disponibilidad, alternativa
y propuesta final. Validar antes de persistir o avanzar versión, sin crear ni
enviar una propuesta parcial. Documentar código/status y respuesta de error
identificable para poder asociarla al campo en frontend.

No se necesitan campos nuevos: customerMessage y scheduleOrAddress ya existen.
Backend decide si el cambio requiere revisión/versionado de contrato. Conservar
lecturas y acuerdos de retiro anteriores con horario null; no invalidarlos ni
reescribirlos. Definir tratamiento de reintentos y recibos de operaciones ya
confirmadas y compatibilidad de apps que aún omiten estos campos. WhatsApp sin
retiro y la contrapropuesta que hereda un plan inmutable conservan su semántica.

## Frontend después del contrato publicado

Marcar ambos campos obligatorios, quitar «opcional» y el envío automático del
mensaje por defecto. Mostrar errores por campo al intentar confirmar con vacío;
no invocar onChoose, subir foto ni enviar POST hasta corregirlos. Mantener los
datos escritos al corregir. Cubrir retiro directo y alternativa/final; preservar
la revisión comercial y la elección al final restaurada en da09d1d.

Pendiente coordinación backend, validación/publicación QA y después frontend.
Rama qa, HEAD da09d1d, Vercel QA último verificado READY. No pruebas/build nuevos
por ser diagnóstico documental. Sin commit/push, cambios de Railway, main o
producción en este trabajo.
