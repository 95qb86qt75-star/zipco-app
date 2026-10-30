# Cliente: mostrar el detalle de coordinación al abrir — QA

Fecha: 2026-10-30. Base de aplicación e367ab6; base Git documental 14823df.
Clasificación: **solo frontend**, navegación local de la tarjeta del cliente.

## Solicitud y cambio

En el iPhone, Detalle expandía el contenido por debajo de la barra inferior y
exigía un desplazamiento manual para empezar a leerlo. La captura muestra la
confirmación Falta → Devolver/Cancelar; ese estado debe conservarse.

Al abrir explícitamente Detalle (o el acceso equivalente de la tarjeta cerrada),
se espera al final del desplegado y, si el contenido queda fuera de vista, se
acomoda la tarjeta dentro de la lista mediante el posicionamiento ya existente
de Ver. Se mantiene visible la cabecera del pedido y el inicio del detalle.
Un detalle más largo que el espacio disponible conserva el scroll normal.

- Movimiento normal: desplazamiento suave, una sola vez al terminar la transición.
- Movimiento reducido: posicionamiento inmediato tras renderizar, sin animación.
- Cerrar o abrir contenido que ya cabe: sin scroll adicional.
- Aperturas programáticas/no solicitadas: no inician este nuevo desplazamiento.
- Sin mover el contenedor exterior, cambiar foco, categoría, estado, consentimiento
  o permisos; sin enviar acciones. Devolver/Cancelar y los botones conservan lógica.

## Archivos y dependencias

- src/app/screens/requests/AvailabilityWaitingCard.tsx: callback opcional de
  final de apertura en DetailReveal; los consumidores sin callback conservan
  comportamiento, incluida disponibilidad/negocio.
- src/app/screens/requests/CustomerCoordinationCard.tsx: registra la apertura
  explícita y reutiliza scrollToRequestOrder si el detalle se sale de la lista.
- scripts/check-coordination-detail-taps.mjs: opción --reveal-only con tres
  casos focalizados. No se refactoriza la infraestructura de pruebas propuesta.
- Este informe y la actualización de frontend-qa-current-state.md.

Sin nuevos campos/endpoints/payloads, cambios de servidor o reglas de negocio.
El bloque de estabilización de herramientas sigue pendiente de aprobación.

## Validación proporcional

- Tres escenarios en navegador, 393 px normal, 320 px con movimiento reducido
  y 393 px con suficiente altura para que todo quepa.
- Toques por coordenadas sin scrollIntoView ejecutado por el test para preparar
  el botón Detalle: el desplazamiento comprobado lo produce la aplicación.
- Verificados apertura desde Devolver/Cancelar y consulta normal, una sola
  llamada al scroll de la lista, cabecera visible, inicio del detalle dentro
  del viewport, window.scrollY=0, cierre sin nueva llamada y cero POST.
- No se repiten las cinco pruebas táctiles anteriores ni las baterías de
  disponibilidad: el helper de scroll y los contratos no cambiaron.
- Build QA/PWA aprobado: 2.313 módulos, precaché generado; build completo
  medido en 9,455 s. Advertencia de bundle grande ya conocida.

Componentes/hooks reales, HTTP simulado; no acciones ni notificaciones reales.
Pendiente comprobar en iPhone la apertura durante el flujo manual del usuario.

## Publicación y memoria

Publicación únicamente Vercel QA; el cierre entrega el SHA exacto que incorpora
este informe y comprueba Ready/alias/artefacto. La memoria local 14823df viaja
como antecedente de este ajuste funcional, sin despliegue documental separado.
Railway, main, C:/dev/zipco-app y producción intactos.

El usuario confirmó antes de este ajuste: Iniciar coordinación → holograma de
redirección → WhatsApp → regreso a la consulta dentro de la tarjeta. No equivale
a una validación completa de Sí/Falta, de ambos roles o del clic externo pausado.

## Medición

Inicio 22:47:57 UTC; análisis terminado 22:50:31; implementación inicial terminada
22:51:12; preparación de casos terminada 22:52:13. Ejecución de los tres casos:
8,950 s. Build completo: 22:53:18.849–22:53:28.304 UTC, 9,455 s.
Se registran documentación/cierre y publicación por separado al terminar.
