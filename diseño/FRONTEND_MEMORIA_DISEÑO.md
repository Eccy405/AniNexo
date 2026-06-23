# Memoria de diseño frontend - AniNexo

Fecha de trabajo: 18/06/2026

Objetivo: mejorar el diseño visual del proyecto actual sin aislarlo en otra rama, dejando esta carpeta como memoria para replicar los cambios en el proyecto original de casa.

## Enfoque aplicado

Se trabajó sobre el proyecto normal, no en una carpeta aislada. Los cambios visuales se hicieron directamente en los archivos del frontend y esta carpeta documenta qué se tocó y cómo replicarlo.

La dirección visual aplicada fue:

- Tema oscuro premium con acentos cyan, violeta y rosa.
- Fondos con gradientes radiales para evitar el negro plano.
- Tarjetas con glassmorphism, bordes sutiles y sombras suaves.
- Botones redondeados con degradados y glow.
- Inputs con foco cyan.
- Navbar más compacta, con fondo glass y estados activos más claros.
- Landing más moderna con hero, stats, features, preview band y footer.
- Dashboard más cinematográfico con hero carousel grande y filas de anime más pulidas.
- Feed de comunidad con tarjetas más limpias y composer más agradable.
- Login/register con mejor jerarquía visual y estilo premium.
- Fondo interactivo global tipo Particle Network / Plexus usando Canvas.
- Dirección de animación AniNexo: movimientos suaves, entradas con fade/translate/scale sutil, hovers de micro-movimiento y transiciones con easing consistente.

## Dirección de animación aplicada

La interfaz ahora sigue una filosofía de movimiento propia de AniNexo:

- Nada aparece de forma brusca.
- Los bloques importantes usan entrada con fade, translate y blur sutil.
- Los hovers evitan saltos grandes y usan desplazamientos pequeños.
- Botones, tarjetas e inputs comparten duración y curvas de easing.
- El scroll usa aparición progresiva mediante `RevealOnScroll`.
- El fondo de partículas se mantiene vivo sin competir con el contenido.
- `prefers-reduced-motion` reduce o elimina animaciones según el sistema.

Archivos clave de esta dirección:

- `client/src/styles/variables.css`
- `client/src/components/motion/RevealOnScroll.tsx`
- `client/src/components/ui/Button/Button.module.css`
- `client/src/components/ui/Card/Card.module.css`
- `client/src/components/ui/Input/Input.module.css`
- `client/src/app/page.tsx`
- `client/src/app/(auth)/login/page.tsx`
- `client/src/app/(auth)/register/page.tsx`
- `client/src/components/discovery/HeroCarousel.tsx`
- `client/src/components/discovery/AnimeCard.tsx`
- `client/src/components/anime/AnimeCarousel.module.css`
- `client/src/components/feed/CreatePost.tsx`
- `client/src/components/feed/PostItem.tsx`
- `client/src/components/layout/TopNavbar.tsx`

## Fondo interactivo implementado

Se agregó un componente reutilizable:

- `client/src/components/background/InteractiveParticleBackground.tsx`

Características:

- No usa videos, gifs ni librerías externas.
- Usa Canvas para dibujar partículas y conexiones.
- Detecta automáticamente perfil de rendimiento según pantalla, touch, hardwareConcurrency y deviceMemory.
- Respeta `prefers-reduced-motion`.
- Pausa la animación cuando la pestaña no es visible.
- Permite modo completo, reducido y estático.
- En modo estático dibuja una vez y no ejecuta `requestAnimationFrame`.
- El cursor influye ligeramente en partículas cercanas, sin explosiones ni efectos llamativos.
- El Canvas se renderiza encima del contenido con `pointer-events: none` para que sea visible incluso sobre secciones con fondo opaco.
- Usa colores oficiales del tema: blanco, cyan principal y azul secundario.

## Archivos principales de diseño tocados

### Sistema visual base

- `client/src/styles/variables.css`
- `client/src/app/globals.css`
- `client/src/components/ui/Button/Button.module.css`
- `client/src/components/ui/Card/Card.module.css`
- `client/src/components/ui/Card/Card.tsx`
- `client/src/components/ui/Input/Input.module.css`

### Fondo global

- `client/src/components/background/InteractiveParticleBackground.tsx`
- `client/src/app/layout.tsx`
- `client/src/store/uiStore.ts`

### Landing pública

- `client/src/app/page.tsx`

### Dashboard general

- `client/src/app/dashboard/layout.tsx`
- `client/src/app/dashboard/page.tsx`
- `client/src/components/layout/TopNavbar.tsx`
- `client/src/components/discovery/HeroCarousel.tsx`
- `client/src/components/discovery/AnimeCard.tsx`
- `client/src/components/discovery/AnimeRow.tsx`
- `client/src/components/anime/AnimeCarousel.tsx`

### Comunidad / feed

- `client/src/components/feed/FeedList.tsx`
- `client/src/components/feed/PostItem.tsx`
- `client/src/components/feed/CreatePost.tsx`

### Autenticación

- `client/src/app/(auth)/login/page.tsx`
- `client/src/app/(auth)/register/page.tsx`
- `client/src/app/auth-callback/page.tsx`
- `client/src/app/auth-callback/AuthCallbackClient.tsx`
- `client/src/app/auth-callback/AuthCallbackLoading.tsx`

### Configuración

- `client/src/app/dashboard/settings/page.tsx`

### Ajustes técnicos necesarios para que el build pase

- `client/src/components/chat/FloatingChat/ChatWindow.tsx`
- `client/src/app/dashboard/admin/page.tsx`

## Validación realizada

Comando ejecutado correctamente:

```bash
cd client
npm run build
```

Resultado:

- Build compiló correctamente.
- TypeScript pasó.
- Generación estática de páginas pasó.
- Advertencia pendiente: `metadataBase` no está definida en `layout.tsx`, por eso Next usa `http://localhost:3000` para OG/Twitter images.

## Nota sobre lint

Se ejecutó lint y el proyecto sigue teniendo errores preexistentes en varios archivos que no forman parte del trabajo de diseño. El build sí queda validado y funcional.

## Importante para replicar en casa

No copiar cambios de backend si solo se quiere replicar diseño.

Evitar tocar como parte de diseño:

- `server/package.json`
- `server/package-lock.json`
- `client/src/app/dashboard/community/page.tsx`
- Carpetas/archivos no relacionados que ya estaban modificados o sin trackear antes de este trabajo.
