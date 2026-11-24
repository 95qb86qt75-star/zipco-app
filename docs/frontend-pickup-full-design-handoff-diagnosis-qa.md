# Retiro cliente: comparación con la entrega CliU15 — 2026-10-31

Clasificación: solo frontend. El usuario confirma que revisó cliente; coordinación
quedó bien, pero debajo del carril Aceptaste/Preparando/Pendiente el retiro conserva
presentación anterior. No cambiar negocio ni la coordinación ya validada por inferencia.

## Evidencia de entrega y código

La entrega INSTRUCCIONES_CODEX (1).md de Downloads declara en línea 108:
«Tarjeta Retiro en el local (me falta su archivo)». La línea 110 pide conservar
«su lógica ni su contenido expandido» y el JSX de línea 126 contiene un comentario
«contenido expandido EXISTENTE, sin cambios», no una implementación nueva de ese cuerpo.
Por tanto, no se recibió código completo del detalle de retiro que reemplazara el
existente, aunque la referencia visual lo mostrara. Debió advertirse esta diferencia
antes de declarar equivalencia completa entre diseño e integración.

En el repo, CustomerPickupCard.tsx:17 recibe children dentro del detalle.
CustomerReceiptFlowCard.tsx:62 inyecta CustomerReceiptDetails y AvailabilityPostActions.
Este último conserva mensaje/horario, permisos, reserva y acciones con su JSX anterior.
ReadyPanel y StatusRail nuevos no reemplazan ese contenido expandido.

La revisión de captura detectó dos defectos adicionales: controles oscuros con poco
contraste sobre fondo claro y pointer-events heredado de DetailReveal que bloqueaba
toques en el detalle de retiro. Se corrigieron localmente solo los estilos scoped de
coordination-v2.css. Tres casos de retiro cliente (preparando, listo y recibido)
verifican contraste calculado y apertura/cierre de ConditionsSheet por coordenadas.
No hay mutaciones durante esos casos; los datos son simulados. No declarar estos
arreglos parciales como reemplazo del diseño expandido completo.

## Acuerdo propuesto para próximas entregas visuales

- Entregar fuentes actuales completas, nunca solo un componente cabecera o réplicas.
- Separar el controlador/contrato de las vistas, conservando permisos y recuperación.
- Un diseño completo debe incluir el cuerpo expandido, opciones y todos sus estados.
  No admitir placeholders de contenido existente como implementación visual final.
- Claude devuelve archivos completos, CSS propio acotado y un inventario de partes
  sustituidas/conservadas con razón, clics, tiempos de animación y movimiento reducido.
- Codex conecta callbacks reales y retira de esta variante el JSX/clases anteriores.
  Los componentes compartidos que usan otros recorridos no se borran a ciegas.
- Comparar misma variante/estado/ancho: cerrado, detalle, listo, recibido, guardando,
  error y opciones. Verificar aspecto además de que los botones funcionen.
- Local y QA deben usar la misma vista real, sin detalle de muestra ni segunda réplica.

## Estado del bloque

Última app publicada sigue b5f37dd. Estos cambios parciales de estilos/pruebas quedan
locales, sin build, commit de app, push ni despliegue. Railway, main y producción
intactos. Falta una entrega visual completa del cuerpo del retiro; no inventarla.
El usuario pidió aclarar la forma de entregar código para evitar repetir la mezcla.

Medición UTC: inicio 22:32:41; análisis hasta 22:36:00, con lectura de contrato y
tres comprobaciones sin cambios de app. Ajuste CSS y ampliación de pruebas hasta
22:37:08; primer hit test falló, reveló pointer-events heredado y motivó corrección.
Segunda ejecución aprobó tres casos antes de 22:38:47. Subfases intercaladas sin
timers individuales completos; navegador registra timing.json. Documentación
posterior. Sin build/publicación porque no se presenta un rediseño integral terminado.
