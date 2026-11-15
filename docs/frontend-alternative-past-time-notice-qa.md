# Aviso breve de horario pasado en Proponer alternativa

2026-11-15, America/Santiago. Clasificación: solo frontend/presentación.

`forms/proposal/AlternativeChangeEditor.tsx`: al editar Disponibilidad y elegir
fecha/hora completa ya pasada, muestra «Esa fecha y hora ya pasaron. Elige un
horario futuro.» durante4s. Se quita inmediatamente al corregir, limpiar o elegir
Lo antes posible; vuelve a mostrarse con otra selección pasada. No aparece solo
por abrir un horario original viejo sin editar. Texto inline role=status/polite,
sin modal, bucles ni interceptar toques.

Reutiliza santiagoDraftTime y comparación local ya utilizada por Guardar. No cambia
validaciones de dominio, horarios de atención ni autoridad del servidor. No
envía ni guarda automáticamente, ni habilita Guardar al ocultarse el aviso.
Es el editor compartido de alternativas, finales y contrapropuestas.

## Comprobación

38 pruebas existentes de editor y alternativeDraft aprobadas. La primera corrida
detectó stubs antiguos que no cubrían useRef/useEffect ya presentes en el editor;
se actualizó solo AlternativeChangeEditor.test.ts (y lazy initializer del stub).
No se cambió el producto para satisfacer esos mocks.

Navegador con React/ChangeEditor/CSS reales a320/390/430: reloj sintético15nov2026
12:00Chile, zona del dispositivo Tokio. Hoy03:00 muestra aviso y Guardar bloqueado;
desaparece después4s pero Guardar sigue bloqueado.03:01 lo repite; corregir a17nov
lo quita inmediatamente y guarda solo el borrador correcto mediante onApply.
Sin desborde ni excepciones JS. No backend ni pedidos reales. Evidencia ignorada:
node_modules/.cache/business-closure/past-time-notice.png;
arnés past-time-notice-browser.mjs. Android/iPhone nativos pendientes.

Build QA/PWA8,81s aprobado, advertencia previa de bundle. Sin tsc independiente.
No se necesita Railway, ni cambia ningún campo, endpoint, permiso o contrato.
Main/producción intactos. Commit/rama/publicación registrados al cierre.

## Tiempos

Análisis/implementación/preparación sin cronómetros exclusivos; no se inventa su
reparto. Ejecución unitaria inicial/final y navegador dirigido registrados arriba.
Build y navegador paralelos: no sumar dos veces su intervalo. Documentación y
publicación/verificación registrados al cierre, incluidas esperas externas.

Ventana medida hasta push/verificación inicial229s, ejecución/comprobación desde
inicio de navegador85s (incluye documentación solapada), build8,81s aparte.
Publicación/verificación45s incluida espera Vercel; no sumar intervalos solapados.
Publicado en rama qa como889bf6c89fb0e77e3d715e4e0d12dda770f26d9d. Vercel success
del SHA exacto verificado:
https://vercel.com/zipco-s-projects/zipco-app/82euqve99MgVBByrBCxkCqUhLfUp
Main8295ab8 intacto. Cierre documental local sin push ni despliegue adicional.
