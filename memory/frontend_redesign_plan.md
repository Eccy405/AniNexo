# Plan de Rediseño Frontend - AniNexo (Aprobado)

## Contexto
El usuario solicitó reformar el frontend de AniNexo porque no le gusta el estado actual. Se instalaron skills de Vercel Labs (react-best-practices, web-design-guidelines, react-view-transitions, composition-patterns) para guiar el rediseño. El plan fue aprobado el 21/06/2026.

## Requerimientos del Usuario
- **Rediseño visual completo:** Nuevo look, más pulido y profesional
- **Mantener colores:** Dark #090909, cian #00E5FF, glassmorphism, neón
- **CSS Modules:** Unificar todo a CSS Modules (reemplazar styled-jsx)
- **View Transitions:** Reemplazar framer-motion por View Transitions nativas de React 19
- **Configurar dependencias:** clsx, CVA, etc. (ya instaladas pero sin usar)
- **Alcance:** Todos los componentes UI + layouts + config

## Fases de Ejecución

### Fase 1: Configuración Base
- [ ] Habilitar `experimental: { viewTransition: true }` en next.config.ts
- [ ] Verificar que framer-motion se pueda remover

### Fase 2: Componentes UI
- [ ] **Skeleton:** Fix import roto + crear CSS module + fix presets
- [ ] **ErrorBoundary:** CSS module + ARIA + fix imports
- [ ] **Button:** forwardRef + aria-label para icon-button
- [ ] **Card:** Fix aria-pressed + keyboard activation + focus ring
- [ ] **Input:** Ajustes menores (aria-required)

### Fase 3: Sidebar (CSS Module + ARIA)
- [ ] Migrar de styled-jsx a CSS Module con tokens
- [ ] ARIA completo (role=navigation, aria-current, aria-expanded)
- [ ] Keyboard nav y focus management
- [ ] Indicador visual de ruta activa (barra lateral cian)

### Fase 4: TopNavbar (CSS Module + ARIA + View Transitions)
- [ ] Migrar de styled-jsx a CSS Module
- [ ] Reemplazar framer-motion AnimatePresence por ViewTransition
- [ ] ARIA completo (role=navigation, aria-expanded, aria-controls, etc.)
- [ ] Keyboard nav (Escape, arrows, focus trap)
- [ ] Nuevo look: glassmorphism más sutil

### Fase 5: Dashboard Layout
- [ ] Integrar Sidebar en el layout
- [ ] Migrar a CSS Module
- [ ] Layout: TopNavbar + Sidebar + Content

### Fase 6: Dependencias
- [ ] Configurar clsx para className concatenation
- [ ] Evaluar CVA, tailwind-merge, @radix-ui/react-slot

## Estética Final
- **Fondo:** #090909 (sin cambios)
- **Acentos:** #00E5FF (cian), #7C4DFF (púrpura), #00FF95 (verde)
- **Glass:** glassmorphism más sutil, blur 15-20px
- **Bordes:** rgba(255,255,255,0.08) -> hover rgba(255,255,255,0.15)
- **Sombras:** glow cian en interacciones activas
- **Transiciones:** suaves, 200-300ms cubic-bezier
- **Tipografía:** Geist Sans (ya cargado en layout)

## Skills Aplicadas
- `react-best-practices`: 70 reglas de optimización (waterfalls, bundle size, SSR, re-renders)
- `web-design-guidelines`: 100+ reglas (accesibilidad, foco, forms, animaciones)
- `react-view-transitions`: View Transition API, shared elements, directional animations
- `composition-patterns`: Compound components, state lifting, evitar prop drilling
