# Categorías: distinguir carga y cero confirmado

Identificador: UI-CATEGORY-COUNT-LOADING-01. 2026-10-23. Solo frontend QA.

## Alcance y diagnóstico

Al entrar a Mi Negocio se observaron resúmenes con campanita y categorías en 0,
sin pedidos individuales visibles. El frontend inicializa las listas vacías y
presentaba esos ceros mientras la lectura aún estaba pendiente. Los resúmenes
incluyen pedidos y cotizaciones, mientras las categorías muestran el tipo activo.
Seleccionar un resumen cambia tipo/categoría, sin volver a descargar las listas.
No se pudo reproducir ni confirmar la causa exacta del episodio en el celular;
este cambio corrige la presentación comprobada de cantidades pendientes.

## Archivos y comportamiento

- RequestsScreen.tsx pasa el estado de carga/error del tipo seleccionado.
- RequestStatusTab.tsx muestra … durante carga y — si falla la lectura;
  conserva el número real, incluido 0, tras lectura correcta. Incluye aria-busy
  y descripción accesible. Sin bucles de animación ni bloqueo de navegación.
- RequestsScreen.readySelection.test.ts comprueba entrada mediante Mi Negocio,
  carga pendiente, actualización de cantidades sin tocar campanitas y errores.
- RequestStatusTab.test.ts verifica la presentación y conserva pruebas previas.
- Este documento y el catálogo de diseño UI.

No modifica datos, permisos, transiciones, notificaciones ni transporte. Utiliza
status/requestProcess y los indicadores de lectura ya existentes; conserva GET
/orders/my-orders?processContract=alternatives-v1 y
/orders/business/:id?processContract=alternatives-v1, además de las lecturas de
cotizaciones existentes. Sin campos ni endpoints nuevos. Sin acciones reales.

## Validación y publicación

Suite: 1.221 pruebas / 104 archivos aprobados. Build QA/PWA aprobado; aviso
existente de bundle mayor de 500 kB. No hay tsc independiente configurado.
Código respaldado en GitHub QA: 9ff4c138058166d9910db67765bf9cb14c83164c.
Vercel QA READY: dpl_49MsUN5iwuGkbLtg67kn8QDzGb7F. SHA, rama qa y alias
https://zipco-app-git-qa-zipco-s-projects.vercel.app comprobados por API.
Este cierre documental también se respalda y publica con código idéntico.
Pendiente verificar Android/iPhone con red lenta: ver … al entrar, números
automáticos al terminar y 0 solamente para categorías vacías confirmadas.
Si la discrepancia persiste con la lectura terminada, requiere reproducir ese
episodio; no se declara resuelta una causa que no se ha confirmado.
Reintentos fiables de notificaciones siguen pendientes del cierre general.
Railway QA no necesario. Main y producción sin modificaciones.
