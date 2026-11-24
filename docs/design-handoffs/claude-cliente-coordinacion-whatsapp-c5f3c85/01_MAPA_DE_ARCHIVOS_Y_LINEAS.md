# Mapa del código real y líneas

Base publicada: c5f3c85dbbaa8b26821b07a908726c6d36d1b2b9. Copias completas; no contienen números insertados.

## Lectura prioritaria

1. BusinessCoordinationCard.tsx: vista de las capturas, cliente business=false y embedded=false.
2. CoordinationCardShell.tsx: cabecera compartida y placeholder de carga.
3. src/styles/index.css: estilos base, pasos, botones, hojas, plegado y animaciones.
4. 02_ESTADOS_CLICS_Y_ANIMACIONES.md: recorrido y límites.
5. Resto de contexto solo cuando sea necesario para entender acciones/variantes.

| Ruta original | Líneas completas | Copia en ZIP | Uso |
|---|---|---|---|
| src/app/screens/requests/BusinessCoordinationCard.tsx | 1–297 | codigo_actual/src/app/screens/requests/BusinessCoordinationCard.tsx | Presentación compartida: modificar solo cliente inicial |
| src/app/screens/requests/CoordinationCardShell.tsx | 1–46 | codigo_actual/src/app/screens/requests/CoordinationCardShell.tsx | Presentación compartida: modificar solo cliente inicial |
| src/styles/index.css | 1–2627 | codigo_actual/src/styles/index.css | CSS global completo: referencia; aislar cambios en CSS nuevo |
| src/app/screens/requests/ProcessOrderCard.tsx | 1–249 | contexto_solo_lectura/src/app/screens/requests/ProcessOrderCard.tsx | Contexto real: conservar lógica y otras tarjetas |
| src/app/screens/requests/CoordinationSheets.tsx | 1–149 | contexto_solo_lectura/src/app/screens/requests/CoordinationSheets.tsx | Contexto real: conservar lógica y otras tarjetas |
| src/app/screens/requests/ProductPreviewControl.tsx | 1–66 | contexto_solo_lectura/src/app/screens/requests/ProductPreviewControl.tsx | Contexto real: conservar lógica y otras tarjetas |
| src/app/screens/requests/productPreview.ts | 1–32 | contexto_solo_lectura/src/app/screens/requests/productPreview.ts | Contexto real: conservar lógica y otras tarjetas |
| src/app/screens/requests/product-preview.css | 1–34 | contexto_solo_lectura/src/app/screens/requests/product-preview.css | Contexto real: conservar lógica y otras tarjetas |
| src/app/screens/requests/WhatsAppMark.tsx | 1–10 | contexto_solo_lectura/src/app/screens/requests/WhatsAppMark.tsx | Contexto real: conservar lógica y otras tarjetas |
| src/app/screens/requests/coordinationSparks.ts | 1–9 | contexto_solo_lectura/src/app/screens/requests/coordinationSparks.ts | Contexto real: conservar lógica y otras tarjetas |
| src/app/screens/requests/useCoordinationMotion.ts | 1–24 | contexto_solo_lectura/src/app/screens/requests/useCoordinationMotion.ts | Contexto real: conservar lógica y otras tarjetas |
| src/app/screens/requests/AvailabilityPostActions.tsx | 1–47 | contexto_solo_lectura/src/app/screens/requests/AvailabilityPostActions.tsx | Contexto real: conservar lógica y otras tarjetas |
| src/app/screens/requests/useAvailability.ts | 1–80 | contexto_solo_lectura/src/app/screens/requests/useAvailability.ts | Contexto real: conservar lógica y otras tarjetas |
| src/app/screens/requests/availabilityApi.ts | 1–52 | contexto_solo_lectura/src/app/screens/requests/availabilityApi.ts | Contexto real: conservar lógica y otras tarjetas |
| src/app/screens/requests/availabilityContract.ts | 1–40 | contexto_solo_lectura/src/app/screens/requests/availabilityContract.ts | Contexto real: conservar lógica y otras tarjetas |
| src/app/screens/requests/useCoordination.ts | 1–236 | contexto_solo_lectura/src/app/screens/requests/useCoordination.ts | Contexto real: conservar lógica y otras tarjetas |
| src/app/screens/requests/coordinationApi.ts | 1–169 | contexto_solo_lectura/src/app/screens/requests/coordinationApi.ts | Contexto real: conservar lógica y otras tarjetas |
| src/app/screens/requests/coordinationIntent.ts | 1–112 | contexto_solo_lectura/src/app/screens/requests/coordinationIntent.ts | Contexto real: conservar lógica y otras tarjetas |
| src/app/screens/requests/coordinationSession.ts | 1–40 | contexto_solo_lectura/src/app/screens/requests/coordinationSession.ts | Contexto real: conservar lógica y otras tarjetas |
| src/app/screens/requests/coordinationFeedback.ts | 1–19 | contexto_solo_lectura/src/app/screens/requests/coordinationFeedback.ts | Contexto real: conservar lógica y otras tarjetas |
| src/app/screens/requests/useStartWorkPrompt.ts | 1–36 | contexto_solo_lectura/src/app/screens/requests/useStartWorkPrompt.ts | Contexto real: conservar lógica y otras tarjetas |
| src/app/screens/requests/whatsappReturn.ts | 1–92 | contexto_solo_lectura/src/app/screens/requests/whatsappReturn.ts | Contexto real: conservar lógica y otras tarjetas |
| src/app/screens/requests/ActionHologram.tsx | 1–139 | contexto_solo_lectura/src/app/screens/requests/ActionHologram.tsx | Contexto real: conservar lógica y otras tarjetas |
| src/app/screens/requests/WhatsappCoordinationPanel.tsx | 1–54 | contexto_solo_lectura/src/app/screens/requests/WhatsappCoordinationPanel.tsx | Contexto real: conservar lógica y otras tarjetas |
| src/app/screens/requests/AvailabilityWaitingCard.tsx | 1–126 | contexto_solo_lectura/src/app/screens/requests/AvailabilityWaitingCard.tsx | Contexto real: conservar lógica y otras tarjetas |
| src/app/screens/requests/availability-waiting.css | 1–95 | contexto_solo_lectura/src/app/screens/requests/availability-waiting.css | Contexto real: conservar lógica y otras tarjetas |
| src/app/screens/requests/CustomerCoordinationCard.tsx | 1–64 | contexto_solo_lectura/src/app/screens/requests/CustomerCoordinationCard.tsx | Contexto real: conservar lógica y otras tarjetas |
| src/app/screens/requests/CustomerCoordinationDetail.tsx | 1–47 | contexto_solo_lectura/src/app/screens/requests/CustomerCoordinationDetail.tsx | Contexto real: conservar lógica y otras tarjetas |
| src/app/screens/requests/customerCoordinationDisclosure.ts | 1–7 | contexto_solo_lectura/src/app/screens/requests/customerCoordinationDisclosure.ts | Contexto real: conservar lógica y otras tarjetas |
| src/app/screens/requests/BusinessPendingCoordinationDetail.tsx | 1–47 | contexto_solo_lectura/src/app/screens/requests/BusinessPendingCoordinationDetail.tsx | Contexto real: conservar lógica y otras tarjetas |
| src/app/screens/requests/businessCoordinationDisclosure.ts | 1–6 | contexto_solo_lectura/src/app/screens/requests/businessCoordinationDisclosure.ts | Contexto real: conservar lógica y otras tarjetas |
| src/app/screens/requests/coordination-v2.css | 1–101 | contexto_solo_lectura/src/app/screens/requests/coordination-v2.css | Contexto real: conservar lógica y otras tarjetas |
| src/app/screens/requests/AgreementSheet.tsx | 1–151 | contexto_solo_lectura/src/app/screens/requests/AgreementSheet.tsx | Contexto real: conservar lógica y otras tarjetas |
| src/app/screens/requests/AcceptedConditions.tsx | 1–63 | contexto_solo_lectura/src/app/screens/requests/AcceptedConditions.tsx | Contexto real: conservar lógica y otras tarjetas |
| src/app/screens/requests/useAgreement.ts | 1–50 | contexto_solo_lectura/src/app/screens/requests/useAgreement.ts | Contexto real: conservar lógica y otras tarjetas |
| src/app/screens/requests/agreement.ts | 1–78 | contexto_solo_lectura/src/app/screens/requests/agreement.ts | Contexto real: conservar lógica y otras tarjetas |
| src/app/screens/requests/requestProcess.ts | 1–246 | contexto_solo_lectura/src/app/screens/requests/requestProcess.ts | Contexto real: conservar lógica y otras tarjetas |
| src/app/screens/requests/requestProcessErrors.ts | 1–79 | contexto_solo_lectura/src/app/screens/requests/requestProcessErrors.ts | Contexto real: conservar lógica y otras tarjetas |
| src/app/screens/requests/types.ts | 1–146 | contexto_solo_lectura/src/app/screens/requests/types.ts | Contexto real: conservar lógica y otras tarjetas |
| src/app/screens/requests/StatusChangeFlow.tsx | 1–59 | contexto_solo_lectura/src/app/screens/requests/StatusChangeFlow.tsx | Contexto real: conservar lógica y otras tarjetas |
| src/app/screens/requests/statusChangePresentation.ts | 1–94 | contexto_solo_lectura/src/app/screens/requests/statusChangePresentation.ts | Contexto real: conservar lógica y otras tarjetas |
| src/app/screens/requests/statusOverlay.ts | 1–15 | contexto_solo_lectura/src/app/screens/requests/statusOverlay.ts | Contexto real: conservar lógica y otras tarjetas |
| src/app/screens/requests/statusToast.ts | 1–16 | contexto_solo_lectura/src/app/screens/requests/statusToast.ts | Contexto real: conservar lógica y otras tarjetas |
| src/app/screens/requests/StatusToast.tsx | 1–25 | contexto_solo_lectura/src/app/screens/requests/StatusToast.tsx | Contexto real: conservar lógica y otras tarjetas |
| src/app/screens/requests/status-toast.css | 1–36 | contexto_solo_lectura/src/app/screens/requests/status-toast.css | Contexto real: conservar lógica y otras tarjetas |
| src/app/screens/requests/status-change.css | 1–26 | contexto_solo_lectura/src/app/screens/requests/status-change.css | Contexto real: conservar lógica y otras tarjetas |
| src/styles/fonts.css | 1–1 | contexto_solo_lectura/src/styles/fonts.css | Dependencia de presentación/configuración: referencia |
| src/styles/theme.css | 1–227 | contexto_solo_lectura/src/styles/theme.css | Dependencia de presentación/configuración: referencia |
| src/styles/tailwind.css | 1–5 | contexto_solo_lectura/src/styles/tailwind.css | Dependencia de presentación/configuración: referencia |
| src/app/components/figma/ImageWithFallback.tsx | 1–28 | contexto_solo_lectura/src/app/components/figma/ImageWithFallback.tsx | Dependencia de presentación/configuración: referencia |
| package.json | 1–94 | contexto_solo_lectura/package.json | Dependencia de presentación/configuración: referencia |

## Puntos de entrada

### src/app/screens/requests/BusinessCoordinationCard.tsx

- export default function: línea(s) 41.
- const folded=: línea(s) 62.
- const operation =: línea(s) 58.
- const unlock =: línea(s) 108.
- const go =: línea(s) 137.
- const annul =: línea(s) 142.
- const dialogs=: línea(s) 148.
- if(!business&&embedded): línea(s) 181.
- const waLabel: línea(s) 195.
- <CoordinationCardHeader: línea(s) 202.
- className="zipco-co-strip2": línea(s) 170, 205.
- <section className="zipco-co-co2": línea(s) 211.
- className="zipco-co-colrow": línea(s) 283.

### src/app/screens/requests/CoordinationCardShell.tsx

- export function CoordinationCardHeader: línea(s) 5.
- export default function CoordinationCardShell: línea(s) 26.

### src/app/screens/requests/ProcessOrderCard.tsx

- const wrapCoordination: línea(s) 119.
- if (process &&: línea(s) 124, 134, 150.
- <BusinessCoordinationCard: línea(s) 143.
- export default function ProcessOrderCard: línea(s) 239.

### src/app/screens/requests/AvailabilityPostActions.tsx

- const showContactControls: línea(s) 16.
- const submit=: línea(s) 20.
- Retirar mi permiso: línea(s) 33.
- <Dialog.Title: línea(s) 39.

### src/app/screens/requests/CoordinationSheets.tsx

- export function ConditionsSheet: línea(s) 33.
- export function AnnulSheet: línea(s) 113.

### src/app/screens/requests/useCoordination.ts

- const update =: línea(s) 67.
- const run =: línea(s) 107.
- if (response.navigation: línea(s) 181.
- waitForWhatsappPreview(controller.signal): línea(s) 185.
- window.location.assign: línea(s) 196.

### src/styles/index.css

- .zipco-co-dk: línea(s) 2097, 2098, 2115, 2155, 2211, 2212, 2213, 2214, 2215, 2216, 2217, 2218 (más coincidencias en el archivo completo).
- .zipco-co-fb: línea(s) 2330, 2331, 2332, 2336, 2343.
- .zipco-co-colrow: línea(s) 2253, 2254, 2255, 2256, 2257, 2258, 2260, 2261, 2262, 2263, 2264, 2265 (más coincidencias en el archivo completo).
- .zipco-co-co2-orb: línea(s) 2123, 2124.
- .zipco-co-strip2: línea(s) 2116, 2117, 2118, 2119, 2120, 2218, 2219, 2220, 2510.
- prefers-reduced-motion: línea(s) 55, 113, 352, 410, 1087, 1159, 1276, 1386, 1461, 1514, 1531, 1554 (más coincidencias en el archivo completo).

