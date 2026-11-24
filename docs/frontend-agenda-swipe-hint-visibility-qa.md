# Ayuda de swipe: no consumirla sin verla

2026-11-14. Clasificación: solo frontend, presentación/interacción local.
Base publicada 39eabf7; backend de cierre cc17287 conservado, sin cambios de contrato.

## Diagnóstico reproducido

El montaje de AgendaSwipeHint y el proveedor real ya estaban conectados. Un rows=0
inicial se actualiza por useSyncExternalStore; no se encontró un montaje faltante.
La prueba inicial de ayuda recién abierta no cubría desplazamiento fuera de vista.

Se reprodujo un fallo concreto con RequestsScreen real y HTTP sintético: ayuda
fuera de pantalla (top1776/bottom1830, viewport844), clave v1 ausente. Tocar una
tarjeta situada más abajo marcó v1=1 cuando la ayuda seguía fuera de vista
(top-150/bottom-96). Ninguna excepción JS ni comando de cierre enviado.
Esto demuestra que el código podía consumirla sin verla, no que se haya leído
el almacenamiento del teléfono del usuario ni que falle su dispositivo.

Además, el observador comprobaba isIntersecting pero no intersectionRatio>=0.6,
y se desconectaba al primer cruce; el plazo continuaba fuera de pantalla y con
animación pausada por scroll o diálogo. Reducir movimiento no ocultaba la ayuda.

## Corrección acotada

- screen/components/BusinessAgendaRow.tsx: conserva observación, exige visibilidad
  mínima de60%, acumula solo cinco segundos de exposición con documento visible,
  sin desplazamiento marcado ni diálogo. Un toque fuera de vista no marca visto.
  Conserva retirada al primer toque cuando sí es visible, recogiendo el espacio
  después de levantar el dedo. Conserva presupuesto al cambiar número de filas.
- screen/components/business-agenda.css: pausa solo su adorno cuando la ayuda está
  fuera de vista/pausada. Sin cambiar diseño, swipe, tarjetas ni acciones de cierre.
- La marca pasa a zipco:agenda-swipe-hint:v2: permite mostrar una vez la ayuda
  corregida a quienes v1 pudo consumir sin exposición. No borra almacenamiento
  ajeno ni vuelve a mostrarla tras completar v2. No hay que borrar v1 en el teléfono.

No campos/endpoints nuevos, ni proveedor simulado. Capacidad deshabilitada o ninguna
fila elegible siguen ocultando el aviso; permisos, contadores y contratos intactos.

## Validación por riesgo

Escenario existente de agenda con componentes reales, Chromium390px y HTTP simulado:
1. v1=1 pero v2 ausente: reaparece la ayuda corregida.
2. Más de6s fuera de vista y toque en tarjeta inferior: v2 permanece ausente.
3. Lista al inicio: ayuda visible top588/bottom642, ancho358.
4. Scroll marcado durante5,8s y diálogo durante5,8s no consumen el presupuesto.
5. Tras exposición suficiente se retira y guarda v2=1; recargar no la repite.
6. Movimiento reducido: sigue visible, cero animaciones; toque visible la retira.
Sin excepciones ni pedidos reales. Captura y scripts ignorados en .cache:
business-swipe-hint-offscreen.mjs, business-swipe-hint-visibility.mjs y
business-closure/hint-visible-v2.png. No se añade depuración en pantalla.

Se corrigió la preparación del caso visible: al mover la ayuda inmediatamente
después de desplegar la tarjeta real, el desplazamiento/ajuste del escenario la
dejaba en top-33 y pausada, correctamente. Se separó el escenario fuera de vista
del escenario con lista al inicio; no se relajó la condición productiva para pasar.
Un comando de preparación quedó esperando y se interrumpió; se regeneró el script.

Build Vite QA10,84s y PWA aprobados, advertencia de bundle existente. No repetir
suite de cierre: solo cambian ayuda local y su pausa; el recorrido de cierre ya
estaba aprobado y no se modificó. iPhone/Android físicos pendientes.

## Tiempos y publicación

Análisis hasta corrección:2min02s medidos. La redacción/aplicación y preparación del
escenario se intercalaron; registrar los intervalos observados sin sumarlos como
fases exclusivas. Hubo reparación/repetición de fixture y build en paralelo con
la validación de visibilidad. No atribuir esos tiempos a rendimiento de la app.
Documentación y publicación se registran separadamente al cierre.

Intervalos observados adicionales: preparación2min40s; ventana de verificación y
reparación de fixture4min59s, con build superpuesto (no sumar dos veces). Aplicación
del cierre documental/preparación Git8s registrados; redacción sin timer exclusivo.
Publicación/verificación40s desde el push hasta observar success.

Rama qa; publicado 0dd6a6fbdfe0a423845fd2838e27f765960e43f1. Vercel success del
SHA exacto verificado por estado GitHub:
https://vercel.com/zipco-s-projects/zipco-app/Ci1x6NzK98s533YSYq4JUpxgygbg
Railway no necesario. El cierre documental se guarda localmente sin otro push.
Main/producción intactos. No se publican mocks ni capturas del arnés.
