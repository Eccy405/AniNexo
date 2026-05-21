# Fase Actual: Consolidación de Identidad y Comunidad

## Objetivos de esta Fase
- [x] Finalizar sistema de Onboarding (ADN Nexo).
- [x] Implementar Verificación por Email (Códigos de 6 dígitos).
- [x] Integrar Google OAuth (Passport.js).
- [x] Optimizar carga de Avatares (Compresión Client-side).
- [/] Separación de Buscadores (Anime vs Usuarios).

## Tareas en Progreso
- **Buscador de Comunidad:** Crear el input de búsqueda específico en `dashboard/community/page.tsx`.
- **Configuración de Producción:** Preparar el .env con credenciales reales.

## Notas Técnicas
- El puerto 3001 es propenso a bloqueos; usar scripts de limpieza si es necesario.
- El `isVerified` es el flag crítico para el acceso a funciones sociales.
