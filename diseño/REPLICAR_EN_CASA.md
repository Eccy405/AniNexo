# Guía para replicar el diseño en casa

## Paso 1: abrir el proyecto original de casa

Ir al proyecto original de AniNexo en casa.

Confirmar que el frontend está en:

```bash
client/
```

## Paso 2: aplicar sistema visual base

Revisar y aplicar estos archivos primero, porque afectan a todo el proyecto:

1. `client/src/styles/variables.css`
2. `client/src/app/globals.css`
3. `client/src/components/ui/Button/Button.module.css`
4. `client/src/components/ui/Card/Card.module.css`
5. `client/src/components/ui/Card/Card.tsx`
6. `client/src/components/ui/Input/Input.module.css`

Estos archivos definen:

- colores base
- sombras
- radios
- gradientes
- botones
- tarjetas
- inputs
- foco visual
- scrollbars

## Paso 3: aplicar fondo interactivo global

Aplicar:

1. `client/src/components/background/InteractiveParticleBackground.tsx`
2. `client/src/app/layout.tsx`
3. `client/src/store/uiStore.ts`

Este bloque agrega:

- Canvas fijo en todo el sitio.
- Partículas y líneas tipo Plexus.
- Perfiles automáticos de rendimiento.
- Modo completo, reducido y estático.
- Respeto automático por `prefers-reduced-motion`.
- Pausa cuando la pestaña no está visible.

## Paso 4: aplicar dirección de animación AniNexo

Aplicar:

1. `client/src/styles/variables.css`
2. `client/src/components/motion/RevealOnScroll.tsx`
3. `client/src/components/ui/Button/Button.module.css`
4. `client/src/components/ui/Card/Card.module.css`
5. `client/src/components/ui/Input/Input.module.css`
6. `client/src/app/page.tsx`
7. `client/src/app/(auth)/login/page.tsx`
8. `client/src/app/(auth)/register/page.tsx`
9. `client/src/components/discovery/HeroCarousel.tsx`
10. `client/src/components/discovery/AnimeCard.tsx`
11. `client/src/components/anime/AnimeCarousel.module.css`
12. `client/src/components/feed/CreatePost.tsx`
13. `client/src/components/feed/PostItem.tsx`
14. `client/src/components/layout/TopNavbar.tsx`

Esto define:

- easing consistente
- duración base compartida
- entradas suaves
- hovers de micro-movimiento
- tarjetas vivas
- botones con reposo/hover/pressed/disabled
- aparición progresiva al hacer scroll
- reducción automática de movimiento si el sistema lo pide

## Paso 5: aplicar landing pública

Aplicar:

- `client/src/app/page.tsx`

Esto cambia la página inicial con:

- navbar fija glass
- hero con fondo/gradientes
- badges
- CTA principal/secundario
- sección de stats
- sección de features
- preview band hacia dashboard
- footer premium

## Paso 5: aplicar dashboard

Aplicar:

1. `client/src/app/dashboard/layout.tsx`
2. `client/src/app/dashboard/page.tsx`
3. `client/src/components/layout/TopNavbar.tsx`
4. `client/src/components/discovery/HeroCarousel.tsx`
5. `client/src/components/discovery/AnimeCard.tsx`
6. `client/src/components/discovery/AnimeRow.tsx`
7. `client/src/components/anime/AnimeCarousel.tsx`

Estos archivos mejoran:

- navbar superior
- fondo del dashboard
- hero carousel
- filas de animes
- tarjetas de anime
- scroll horizontal
- estados hover

## Paso 6: aplicar comunidad/feed

Aplicar:

1. `client/src/components/feed/FeedList.tsx`
2. `client/src/components/feed/PostItem.tsx`
3. `client/src/components/feed/CreatePost.tsx`

Esto mejora:

- compositor de posts
- posts individuales
- botones de acción
- avatares
- badges de anime
- preview de imagen
- estados vacíos/loading

## Paso 7: aplicar autenticación

Aplicar:

1. `client/src/app/(auth)/login/page.tsx`
2. `client/src/app/(auth)/register/page.tsx`
3. `client/src/app/auth-callback/page.tsx`
4. `client/src/app/auth-callback/AuthCallbackClient.tsx`
5. `client/src/app/auth-callback/AuthCallbackLoading.tsx`

Esto mejora:

- login split-screen
- register con wizard
- tarjetas de formulario
- inputs
- botones
- loading de auth callback
- suspense boundary necesario para Next

## Paso 8: aplicar configuración de fondo

Aplicar:

- `client/src/app/dashboard/settings/page.tsx`

Esta página agrega la opción visible:

- Fondo interactivo
- Completo
- Reducido
- Estático

La preferencia se guarda en:

```text
localStorage
```

Clave usada:

```text
aninexo:backgroundMode
```

## Paso 9: aplicar ajustes técnicos

Aplicar solo si el build falla:

1. `client/src/components/chat/FloatingChat/ChatWindow.tsx`
2. `client/src/app/dashboard/admin/page.tsx`

Estos cambios no son visuales, pero fueron necesarios para que TypeScript/build pasaran.

## Paso 10: validar

Ejecutar desde `client/`:

```bash
npm run build
```

Debe terminar correctamente.

Si aparece la advertencia de `metadataBase`, no bloquea el proyecto. Se puede resolver después definiendo `metadataBase` en `client/src/app/layout.tsx`.
