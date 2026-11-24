# Deuda de validación frontend 2A

Registrada el 2026-10-15. Pendiente antes de incorporar testers externos.

- El proyecto no tiene scripts `typecheck` ni `lint`.
- No tiene configuración de TypeScript o ESLint ni esas herramientas instaladas localmente.
- `npm.cmd run build` ejecuta Vite: transforma y empaqueta TS/TSX, pero no sustituye una comprobación semántica de tipos.
- Las pruebas locales con mocks no sustituyen la integración con Backend QA, push real y los dos celulares.

En un bloque separado deberá acordarse la incorporación de herramientas,
configuración y scripts de tipos/lint, ejecutar sus comprobaciones y distinguir
la deuda previa de los problemas del cambio 2A. No se instalaron herramientas
ni se configuró ese sistema en el bloque de correcciones de los cuatro hallazgos.
