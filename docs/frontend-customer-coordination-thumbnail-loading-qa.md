# Cliente: miniatura vacía en consulta de coordinación — QA

Fecha local: 2026-10-31. Clasificación: solo frontend, presentación/carga de la
imagen existente. Base publicada 5e5cd01, memoria local f2a2ede.

## Evidencia y límite del diagnóstico

El iPhone muestra el círculo vacío en ¿Coordinación lista por WhatsApp?, versión
QA 5e5cd01. El usuario confirmó que tocarlo abre el detalle y allí SÍ aparece
la foto; al cerrar, la miniatura sigue vacía. La captura y respuesta acreditan
que la foto existe y el problema visible afecta a la miniatura. No permiten
afirmar todavía la causa exacta del pintado/carga en Safari.

En el código, la miniatura utiliza loading=lazy y la imagen ampliada eager.
No encontramos una modificación de datos/API que explique por sí sola el
círculo vacío. Se aplica una mitigación acotada: solicitar carga inmediata de
la primera miniatura visible en CustomerCoordinationCard. No afirmar que se
reprodujo el fallo exacto del iPhone ni que quedó resuelto físicamente.

## Cambios

- ProductPreviewControl.tsx: prop visual opcional thumbnailLoading, lazy por
  defecto. Se transmite a ProductImage solo para la primera línea; las líneas
  ocultas/restantes conservan lazy y la imagen ampliada sigue eager.
- CustomerCoordinationCard.tsx: solicita eager en su miniatura visible.
- scripts/qa/fixtures/coordination.tsx: escenario directo de presentación con
  imagen SVG local, imagen rota y ausente; no modifica normalización de URLs.
- scripts/check-coordination-thumbnail.mjs: usa el runner/navegador existentes
  para foto a 320/393, fallback roto/ausente, detalle y foco sin acciones.

No se cambia URL, foto, asociación al pedido/propuesta, contrato, campos,
headers, endpoint, selección de producto ni políticas de backend. No se
precargan por defecto todas las fotos de listas/galerías. Se conserva el
fallback, precio unitario, descripción, cierre y ventana de Condiciones.
Railway no fue necesario. Main y producción intactos.

## Validación

16 unitarias de productPreview aprobadas. Cuatro escenarios nuevos de navegador
aprobados: foto 320/393, foto rota y ausente. Verificados imagen decodificada y
visible con medidas, primera línea eager, restantes y consumidor por defecto
lazy, apertura del producto correcto, foco al cerrar, tarjeta aún plegada y
cero acciones. La imagen es sintética local para aislar presentación/carga;
no representa una prueba de Cloudinary ni del Safari físico.

Una regresión de controles de consulta del cliente aprobada: detalle, condiciones,
opciones y navegación WhatsApp con transporte simulado. No se repiten otros
recorridos ajenos a este cambio de carga.

El primer intento del fixture tenía una llave JSX faltante. Se corrigió y se
ejecutaron solo los casos nuevos aún no aprobados. No se modificó la app para
sortear el fallo del fixture, ni se repitieron las unitarias ya aprobadas.

## Tiempos y publicación

Inicio 05:33:18 UTC. Diagnóstico/lectura y respuestas del usuario hasta 05:37
aproximadamente. Implementación terminada 05:38:08. Preparación y ejecución de
pruebas intercaladas hasta 05:40:42; preparación incluye el arreglo del fixture.
Ejecutores guardan tiempos separados de servidor, navegador y casos en qa-pilot.
Documentación/cierre posterior. Build QA/PWA y publicación se miden al finalizar.

Publicar únicamente qa/Vercel QA. La API Vercel dio 403 en el bloque anterior;
si el acceso no cambió, no repetir consultas por rutina ni afirmar validación
del alias sin ella. Consultar estado GitHub del nuevo SHA y distinguirlo de
verificar los assets servidos. Pendiente recargar el iPhone, comprobar el nuevo
QA y confirmar si la miniatura ya se ve sin tocarla ni abrir la foto grande.

## Cierre

- Aplicación b230cf47f3faff00f86f340c3b59650eb38286f6, rama qa; push correcto.
- Build QA/PWA aprobado, 05:41:46.650–05:41:58.902 UTC: 12,252 s.
- GitHub comunica Vercel success para ese SHA, comprobado antes de 05:42:39:
  https://vercel.com/zipco-s-projects/zipco-app/F6f9MXs59Y1R54xCnAdgHy736TXT.
- No se repitió la lectura Vercel con el acceso conocido como no autorizado.
  Sin comprobación nueva del SHA/assets servidos por el alias; no afirmar READY
  autenticado. El usuario debe comprobar QA b230cf4 en el iPhone.
- Caso físico todavía pendiente. Esto es una mitigación de carga localizada,
  no una causa Safari acreditada ni una resolución confirmada por el teléfono.
- Cierre documental local posterior a 05:42:39, sin otro push por documentación.
  Ningún cambio de Railway, main, producción o datos del pedido.
