# UI-CATEGORY-TYPE-02 — Categorías de 11,5 px y contadores de 12,5 px

Fecha: 2026-10-18. Clasificación: solo frontend QA.

Bastián comprobó en celular que los tamaños 13/14 px eran demasiado grandes
y solicitó reducirlos. Esta revisión sustituye esas medidas como propuesta
actual; no elimina la referencia histórica UI-CATEGORY-TYPE-01.

- Nombre: reducción compartida de texto y contador de categorías de Solicitudes.
- Commit de código: `7f1620da92a14ac5ea256e5ba2e3cbedd82356b4`.
- Rama: `qa`.
- Archivo: `src/styles/index.css`.
- `.zipco-status-tab`: letra **11,5 px**.
- `.zipco-status-tab-count`: letra del número **12,5 px**.
- Aplica a cliente y negocio mediante `RequestStatusTab.tsx`, incluyendo las
  categorías que se incorporen mediante ese componente compartido.
- Se conservan colores, filtros, área táctil, distribución adaptable y datos.
- Sin campos/endpoints nuevos ni modificación de backend o acciones de pedidos.
- Validación: 26 pruebas existentes aprobadas en tres archivos, build QA
  aprobado y revisión de espacios del diff aprobada. El build conserva la
  advertencia de bundle superior a 500 kB.
- Documentos locales anteriores preservados fuera de estos commits.
- Publicación exclusivamente en Preview QA desde Git real y SHA exacto,
  manteniendo el diagnóstico temporal anterior por override de despliegue.
- Sin cambios de configuración global, protección, Railway QA, `main` o producción.

Para revisar: actualizar el acceso QA habitual y comprobar Solicitudes en
cliente y negocio, tamaños menores, textos largos y distribución con/sin Listos.
La conformidad de Bastián en los celulares sigue pendiente; esta solicitud
no se interpreta como aprobación final de todos los diseños.

El resultado del despliegue se añadirá tras comprobarlo.

## Publicación comprobada

- SHA fuente publicado: `4153f1a0ceb5bca378b2c0d50c19c220a8e18b3d`
  (código `7f1620da92a14ac5ea256e5ba2e3cbedd82356b4` más informe).
- Preview `dpl_4o3kZzKSf2VPVBpvG67aCrdDKLem`, **READY**.
- URL propia: <https://zipco-7ao21y422-zipco-s-projects.vercel.app>.
- Alias habitual confirmado en ese despliegue:
  <https://zipco-app-git-qa-zipco-s-projects.vercel.app>.
- API autenticada: origen GitHub, rama qa, SHA exacto y entorno Preview comprobados.
- Logs confirman modo QA, build y despliegue completados.
- Se mantuvo el diagnóstico temporal con override exclusivo de este despliegue:
  `ZIPCO_QA_LOAD_DIAGNOSTICS=1 npm run build -- --mode qa`.
- Configuración pública Backend QA verificada, sin cambios. Build global y rama
  de producción intactos; sin cambios de protección, otros alias o Railway QA.
- Los trece documentos pendientes previos conservaron sus hashes; no se
  incluyeron en estos dos commits. Staging vacío y HEAD sincronizado con origin/qa.
- Revisión visual de Bastián en ambos celulares pendiente; actualizar el acceso QA.
- Este registro posterior al despliegue queda local hasta un futuro commit documental.
- `main`, producción, backend y datos de pedidos: sin modificaciones.
