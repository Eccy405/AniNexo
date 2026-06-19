# Fase Actual: Consolidación de Identidad y Comunidad

## Objetivos de esta Fase
- [x] Finalizar sistema de Onboarding (ADN Nexo).
- [x] Implementar Verificación por Email (Códigos de 6 dígitos).
- [x] Integrar Google OAuth (Passport.js).
- [x] Optimizar carga de Avatares (Compresión Client-side).
- [x] Separación de Buscadores (Anime vs Usuarios).
- [x] Sistema de reacciones múltiples con persistencia.
- [x] Menú contextual de posts (privacidad, edición, eliminado).
- [x] Botones de Grupos y Colección en vista de anime.

## Tareas en Progreso
- **Configuración de Producción:** Preparar el .env con credenciales reales.

## Notas Técnicas
- El puerto 3001 es propenso a bloqueos; usar scripts de limpieza si es necesario.
- El `isVerified` es el flag crítico para el acceso a funciones sociales.
- Los grupos creados aparecen en `/api/groups/anime/:animeId` y en comunidad.
- La colección de anime se guarda en `usercollection` y se muestra en perfiles.
