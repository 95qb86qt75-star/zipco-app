# Organización del frontend

Cada capacidad tiene una carpeta: `requests`, `quotes`, `businesses`, `catalog`,
`checkout`, `search`, `profile`, `registration`, `services`, `favorites`, `home`
y `onboarding`. `src/app/shell` compone la aplicación; `src/app/shared` contiene
navegación, ubicación y avisos que comparten varias capacidades.

- **Pantalla:** su archivo de entrada compone el controlador y la vista.
- **Controlador:** conserva carga, sesión, permisos, envíos, recuperación y estado
  de interacción. Los transportes y contratos conservan su significado.
- **Vista:** organiza secciones; las tarjetas y los paneles tienen su propio
  archivo. Una lista selecciona y ordena, sin contener el diseño completo de sus
  tarjetas.
- **Tarjeta:** una composición canónica por variante visual o flujo relacionado.
  Cabecera, detalle y estados locales pertenecen a esa unidad. Las piezas con la
  misma estructura y significado pueden compartirse.
- **Estilos:** viven junto al propietario. Los manifiestos CSS mantienen el orden
  de aplicación; no contienen otra versión del diseño.

No existe un recorrido ejecutable alternativo en `src/app/screens`. No se
mantienen copias antiguas ni componentes de demostración como sustitutos de una
pantalla conectada a la API. Las vistas de prueba importan los componentes reales.

## Dónde editar

- Solicitudes: [mapa de tarjetas](requests/cards/README.md).
- Cotizaciones: `quotes/customer`, `quotes/business`, `quotes/cards`.
- Catálogo: `catalog/cards/CatalogProductCard.tsx`.
- Búsqueda: `search/cards/SearchResultCard.tsx` y
  `businesses/search/cards/BusinessResultCard.tsx`.
- Favoritos: `favorites/cards/FavoriteCard.tsx`.
- Compra de productos: `checkout/product/cards` y `checkout/product/components`.
- Compra de servicios: `checkout/service/components/ServiceOrderSummary.tsx`.
- Perfil: `profile/personal-details`, `profile/business-details`, `profile/cards`.
- Configuración del negocio: `profile/business-config`, subdividida en catálogo,
  horarios, ubicación, clasificación y atención.
- Registro: `registration/steps`; la secuencia vive en su controlador.

## Entregar un diseño a Claude

1. Identificar rol, modalidad y estado exactos, con una captura.
2. Entregar la composición canónica y su CSS; agregar los detalles y piezas
   visuales que realmente intervienen, completos y tomados del repo actual.
3. Separar las dependencias de solo lectura: contratos, controlador, recuperación,
   imágenes y ventanas compartidas, especialmente Condiciones aceptadas.
4. Pedir los archivos completos modificados y una lista de cada clic, estado,
   animación, tamaño adaptable y error que se conserva.
5. Sustituir la implementación del propietario; no pegar un encabezado nuevo sobre
   un cuerpo anterior ni añadir otra variante como alternativa silenciosa.
6. Comparar todos los estados afectados al mismo ancho. Comprobar la integración
   real; una maqueta con controladores o ventanas reemplazados no la acredita.

La separación facilita localizar un diseño. No sustituye la comparación visual,
las pruebas de interacción ni la comprobación física en los teléfonos.

## Tamaño orientativo

Procurar hasta 400 líneas por archivo editable; revisar su división al superar
500. Separar responsabilidades completas, preservando una sola implementación y
el flujo de cada tarjeta. Una excepción justificada es preferible a fragmentar
artificialmente el código. No reducir líneas mediante compresión o minificación.
La revisión es gradual al trabajar en cada unidad, no una reescritura automática
de todos los archivos existentes.
