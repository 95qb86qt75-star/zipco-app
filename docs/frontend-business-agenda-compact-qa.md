# Agenda de negocio compacta · CliV11

2026-11-14, America/Santiago. Clasificación: solo frontend, presentación.
Alcance de aplicación limitado a BusinessAgendaRow.tsx y business-agenda.css.
Base QA 9eceb2a; preservados filtros, resolver, lectura compartida, controladores,
tarjetas reales y los otros seis archivos de la entrega anterior.

## Entrega e integración

Los pares adjuntos (1)/(2) son idénticos por SHA256. Se aplicaron los (2),
basados en el CSS vigente, incluido el ajuste <=350 px. La tarjeta plegada
desde 360 px usa lateral de 46 px, padding/cabecera compactos y nombre que puede
partirse; abierta y <360 px conservan banda superior y todo el ancho.

useRedundantStatusMark observa texto/hijos del DOM, sin estado React ni
observación de atributos: oculta en plegado solo el estado repetido de retiro
o el EN CURSO de WhatsApp. Se conserva un estado distinto y el detalle abierto.
La marca solo cambia cuando cambia el resultado; el observador se desconecta
al desmontar. No hay animaciones nuevas ni cambios de acciones.

Única adaptación respecto a la entrega: min-height de Ver detalle en WhatsApp
36 → 44 px, para conservar el área táctil; añade ocho px frente a su maqueta.
No se afirma que toda la cabecera de retiro sea interactiva: se mantienen sus
controles reales. Ni se promete una altura fija con nombres/productos variables.

## Pruebas por riesgo

Reutilizado el arnés de diagnóstico con RequestsScreen, ProcessOrderCard,
BusinessProgressCardView, miniatura/visor reales y CSS global vigente. HTTP,
cuentas, acuerdos y productos son sintéticos; ninguna petición real a QA.

320/360/390/430 px: retiro y WhatsApp plegados/desplegados, ancho completo
al abrir, miniatura real con cantidad sin plegar, nombre sin desborde desde
360, cero desborde horizontal y botón WhatsApp >=44. Estado diferente vuelve
a mostrarse; en reposo se observaron cero mutaciones durante un segundo tras
el cambio de texto (sin ciclo de realimentación del observador). Reduced motion
con panel de orden, cero POST y cero excepciones JavaScript.

Mediciones reales del arnés (no son mediciones físicas de Android/Safari):

| Ancho | Columna lateral plegada | Tarjeta | Alto retiro | Alto WhatsApp |
| --- | --- | --- | --- | --- |
| 320 | Banda superior | 288 | 201,7 | 228,3 |
| 360 | 46 | 282 | 151,0 | 193,5 |
| 390 | 46 | 312 | 151,0 | 170,7 |
| 430 | 46 | 352 | 125,0 | 163,0 |

A 320 persiste el truncado de nombre en retiro ya indicado por Claude y
aceptado en su entrega; no se rediseña la cabecera protegida en este bloque.
Capturas 360/390/430 y measurements.json copiadas a
docs/design-handoffs/agenda-compacta-20261114/ (artefactos locales sin commit).

Preparación del arnés: primer script quedó truncado al encontrar una escritura
de captura en vez de la escritura final del informe; corregido solo en .cache.
Después la espera exigía seis marcas redundantes: son cinco, porque una tarjeta
tiene error de acuerdo y debe conservar el aviso. Otro arranque Chrome agotó
10 s antes de DevToolsActivePort; se reutilizó el margen de 30 s del piloto.
No se cambió la app para satisfacer esos errores de arnés. Una ejecución completa
aprobada con el CSS entregado y otra tras el ajuste táctil de 44 px, con motivo.

Build QA/PWA aprobado: Vite 9,93 s, 2418 módulos, diez precaches. Sin tsc
configurado; no se presenta build como comprobación de tipos independiente.
No se repiten pruebas de agrupación/API ya aprobadas: no cambian esas dependencias.
Pendientes celulares, lector de pantalla y WebViews antiguos sin :has().

## Fases y límites

Primer reloj UTC 18:32:18; comparación/análisis hasta 18:33:07 (49 s,
incluye copia de 2,69 s). Preparación y ejecución del navegador intercaladas
18:33:07–18:37:44; no se inventa un reparto exclusivo entre corregir el arnés
y esperar sus procesos. CSS final y repetición focalizada desde 18:37:44;
build y navegador se solaparon y ambos constan aprobados a 18:38:29. Los 9,93 s
de Vite están dentro de ese intervalo, no se suman otra vez. Documentación
desde 18:38:29; publicación/verificación se registran al cierre. No son tiempos
de rendimiento de la app ni hay perfilado CPU/GPU del teléfono.

Campos/endpoints: ninguno nuevo o modificado; siguen las lecturas de acuerdo
de la agenda anterior. Railway innecesario. Rama qa, main 8295ab8 y producción
intactos. Handoffs locales ajenos se conservan fuera del commit.

Publicación: e1731c5e06514399fdae122a28738eddac79b68e en origin/qa.
Push confirmado 18:39:58 UTC; Vercel success verificado 18:40:38 UTC
(40 s desde push confirmado, incluye espera externa). Documentación/preparación
desde 18:38:29 hasta 18:39:31: 62 s; commit/push terminó 18:39:58. No sumar los
tiempos superpuestos del navegador y build como si fueran secuenciales.
https://vercel.com/zipco-s-projects/zipco-app/9LExchhqqWC1JurwNrz5e27MvBYe
Cierre documental local sin otro push; no se inspeccionó el bundle protegido
independientemente ni se probó el teléfono físico.
