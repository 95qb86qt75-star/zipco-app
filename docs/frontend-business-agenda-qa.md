# Mi Negocio · agenda de En curso

2026-11-14, America/Santiago. Clasificación: solo frontend, presentación y
navegación local con lecturas existentes. Entrega de ocho archivos de Claude,
integrada sobre qa 1f10241. No redefine fechas, estados ni reservas.

## Alcance y fuentes

Exclusivamente Mi Negocio → Pedidos → En curso (`statusView === active`).
Los cuatro archivos nuevos son businessAgenda.ts, BusinessAgendaRow.tsx,
BusinessAgendaToolbar.tsx y business-agenda.css. Se integran los cambios de
BusinessOrdersTab, RequestResults, RequestsScreenView y su controlador.
Las tarjetas reales, ventanas, slider y sus acciones se conservan.

Se completa el resolver que Claude dejó sin conectar mediante
screen/application/useAgreedScheduleResolver.ts. Lee el acuerdo normalizado
con GET /request-processes/{id}/agreement y las cabeceras ya existentes.
scheduledFor es el horario acordado; subjectSnapshot.needNow === true es
la única señal de Lo antes posible. Ausencia/fallo/horario desconocido queda
en Horario por comprobar. No usa fechas originales ni proposalSummary como
sustitutos, tampoco interpreta textos de instrucciones. Sin endpoints nuevos.

application/sharedAgreementRead.ts comparte las lecturas entre agenda y
useAgreement de las tarjetas: identidad por sesión/proceso/acuerdo, reutilización
de condiciones inmutables durante 60 s, máximo de 128 resultados retenidos,
fallos no cacheados y reintentos explícitos que fuerzan lectura. Cada consumidor
puede cancelar sin cancelar a los demás; el último cancela el transporte.
La agenda prepara hasta cuatro lecturas concurrentes; las tarjetas conservan
su carga existente. Cambiar sesión/acuerdo impide reutilizar datos anteriores.

## Presentación y límites

Grupos Lo antes posible, Hoy, Mañana, Próximos días, Fecha pasada · pendientes,
y Horario por comprobar. Días calculados en America/Santiago, sin cerrar pedidos
por el reloj. Una hora anterior del día actual permanece en Hoy. Filtros Fecha y
Tipo con contadores cruzados; orden Por atender/Recientes/Antiguas.
El orden de agenda se guarda aparte del orden de las otras categorías.

Modalidad: WHATSAPP; LOCAL_PICKUP con elección explícita NONE o REQUEST_RESERVATION.
Una elección ausente no se inventa: queda solo en Todos. localPickupInformation
conserva su categoría por participante, sin reclasificarse para entrar en agenda.

El bloque horario se integra junto a la tarjeta real plegada y pasa a banda con
el detalle abierto o ancho <360 px. Ajuste mínimo de filtros a <=350 px para
conservar legibilidad. Se preservan claves clientKey y nodos al cambiar orden.
No hay animaciones nuevas permanentes. Las pausas/reduced motion y los controles
de notificaciones siguen reales. El evento dirigido limpia filtros y abre la tarjeta.

## Verificación proporcional

- 81 pruebas aprobadas en seis archivos: agrupación/filtros y horario Santiago,
  lectura compartida/cancelación/sesión/reintento, ciclo del acuerdo, agrupación
  de estados, selección de categorías y navegación desde notificaciones.
- Los mocks manuales de React en dos pruebas de pantalla necesitan mockear el
  nuevo hook. La primera ejecución falló por esa dependencia y por un fixture
  nuevo que asumía .records sobre un normalizador que devuelve un array.
  Corregidos los arneses; no se debilitó código de la app para hacerlos pasar.
- Navegador con RequestsScreen y tarjetas reales, HTTP/cuentas sintéticos:
  320/390/430 px, seis grupos, filtros combinados, vacío y limpiar, teclado/Esc
  y foco, orden sin remontar ni plegar tarjeta, ventana real de condiciones,
  evento dirigido, control cliente sin agenda, ausencia de desborde horizontal,
  reduced motion y una sola lectura exitosa compartida para agenda/tarjeta.
  Cero POST y cero excepciones JavaScript. Casos repetidos tras el ajuste CSS
  angosto y para añadir assertions de lectura única y reduced motion.
- Reutilizado arnés aprobado bajo node_modules/.cache; los fallos de preparación
  fueron helper de respuesta fuera de alcance, codificación de literales y
  serialización CDP de un nodo DOM. Corregidos solo en el arnés.
- Build QA/PWA aprobado, 2418 módulos y diez precaches. Vite 6,03 s en la ejecución
  completa aprobada. Primer intento: Vite 8,55 s aprobado, etapa PWA bloqueada
  por EPERM al directorio temporal; repetido con acceso autorizado. Sin cambios
  de configuración. Aviso de chunk grande preexistente; no es medición de fluidez.
- No hay tsc configurado en este proyecto; build no se presenta como tsc.

Pendiente: Android/iPhone reales, lector de pantalla físico y comportamiento
con datos reales QA. No se ejecutaron pedidos, pushes ni confirmaciones reales.
No se repite la regresión completa de backend: no se cambió contrato/comportamiento.

## Tiempos y publicación

Análisis inicial sin cronómetro aislado: no se inventa duración. Primer punto
UTC registrado 07:02:16. Implementación/preparación/ejecución estuvieron
intercaladas hasta 07:11:44; no se atribuye todo ese intervalo a escribir código.
Vitest: ejecuciones reportadas 4,34 s + 0,55 s + 3,42 s, última aprobada;
no sumar casos repetidos como pruebas distintas. Preparación/reparación del
arnés sin medición exclusiva recuperable. Estos tiempos son de desarrollo,
no rendimiento de la app. Build separado: 8,55 s Vite del intento incompleto
y 6,03 s Vite del aprobado; el comando completo aprobado tardó 9,27 s.
Documentación y publicación se completan al cierre con su evidencia.

Railway innecesario y sin cambios. main 8295ab8 conservado. El handoff ajeno
docs/design-handoffs/claude-cliente-coordinacion-whatsapp-c5f3c85 se excluye.
