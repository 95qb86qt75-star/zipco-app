# UI-TODAY-TIME-PROMPT-01 — Hora para hoy con indicación visible

Fecha: 2026-10-19. Clasificación: solo frontend, presentación del campo horario.

## Problema y causa revisada

Bastián mostró en iPhone cliente el campo «Hora para hoy» vacío después de elegir Hoy. Al pulsarlo se abre el selector nativo y, tras elegir, aparece la hora. `selectOrderMoment('today')` limpia la selección de hora intencionalmente; OrderMomentSelector presentaba ese valor vacío únicamente mediante un input nativo sin indicación propia de selección pendiente. La captura acredita el estado visual en iPhone, no un error de backend ni la pérdida de una hora ya confirmada.

## Ajuste

`src/app/screens/OrderMomentSelector.tsx` muestra «Seleccionar hora» y un icono de reloj mientras el valor está vacío. La indicación no intercepta los toques y se oculta al enfocar el control para mantener visible la edición nativa. Al elegir una hora, se muestra el valor real del input. Se establece nombre accesible «Hora para hoy», se conserva required y se limita el ancho al contenedor para evitar que el control nativo sobresalga en pantallas pequeñas.

No se introduce una hora predeterminada ni se transforma la hora del selector. Se conserva `onTimeChange(event.target.value)` y el selector nativo. El componente compartido aplica el ajuste a productos y servicios; Ahora y Programar mantienen sus controles actuales. No se modifica el popup de selección del sistema operativo.

Contrato sin cambios: entrega existente mediante `needNow`, `deliveryDate` y `deliveryTime`; POST `/orders` existente. No se cambia ni ejecuta esa petición en este trabajo, ni se altera el cálculo de fecha de Santiago, validaciones horarias, servidor, estados, permisos o datos. No se modifican notificaciones. Backend/Railway QA no requiere trabajo.

## Validación y entrega

**42 pruebas existentes aprobadas en tres archivos**: OrderMomentSelector, orderMoment y orderCreationIntent. Verifican modos, hora requerida, resolución de fecha, validaciones y conservación de intención de creación. No se crean pruebas que solo reflejen las clases de este ajuste visual reversible. Build QA aprobado, con advertencia habitual de tamaño de bundle; revisión física de Safari/iPhone pendiente.

Guardar código y documentación en Git, publicar solo rama `qa` / Preview desde Git real y SHA exacto. Mantener Backend QA y el comando por despliegue, sin ajustes globales:

`ZIPCO_QA_LOAD_DIAGNOSTICS=1 ZIPCO_QA_NOTIFICATION_TRACE=0 npm run build -- --mode qa`

Registrar después SHA de código, resultado del despliegue y URL en un commit documental de cierre, según la regla vigente. No dejar esa nota solo local. Sin cambios en `main` ni producción.

## Comprobación en iPhone y Android

1. Abrir el acceso QA habitual con la versión nueva. Entrar al resumen de un pedido de producto, seleccionar Hoy sin enviar el pedido.
2. Verificar «Seleccionar hora» y reloj dentro del campo, sin desbordamiento lateral. Tocar el campo y verificar que se abre el selector nativo.
3. Elegir una hora: debe verse la selección real, y el resumen de entrega existente debe usarla. Cambiar de modo y volver a Hoy: debe reaparecer la indicación de selección pendiente.
4. Comprobar también servicio y modo oscuro. No crear pedidos para verificar la presentación. La conformidad de Bastián se registra cuando la comunique; publicar no equivale a aprobación física.
