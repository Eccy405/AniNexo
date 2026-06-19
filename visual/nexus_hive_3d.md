# ⬢ NEXUS ENGINE - Especificaciones Técnicas y Visuales (V3)

> **Última actualización:** Sprints 1, 2 y 3 completados. Sprint 4 en progreso.
>
> **Estado de compilación:** `tsc --noEmit` → exit 0 sin errores.


## 🎨 Principios Visuales y Paleta
* **Temática:** Interfaz holográfica futurista viva controlada por una IA.
* **Paleta de Luces y Neblina:**
  * Fondo: Vacío absoluto (`#020202`).
  * Colores de Energía: Cian Eléctrico (`#00E5FF`), Azul de Fusión (`#0055FF`), Púrpura de Datos (`#9B51E0`), y destellos de Blanco Puro.
  * Neblina lineal para control de horizonte y fundido suave de los nodos en profundidad.

---

## ⚙️ Arquitectura por Responsabilidades

El motor se organiza en una arquitectura modular altamente desacoplada donde cada archivo tiene una única responsabilidad:

```
client/src/components/nexus-engine/

├── core/                        # Lógica pura (TypeScript pura)
│   ├── HiveEngine.ts            # Núcleo de inicialización y orquestación
│   ├── CameraController.ts      # Manejo de posición, damping, zoom e inclinación
│   ├── AnimationController.ts   # Manejo del estado cinemático y oscilaciones
│   ├── VisibilityManager.ts     # Frustum culling personalizado y reciclaje de instancias
│   ├── InteractionManager.ts    # Raycasting 3D y colisiones del cursor
│   ├── EventBus.ts              # Bus de comunicación pub/sub desacoplada
│   └── TimelineController.ts    # Línea temporal unificada y secuencias cinemáticas
│
├── rendering/                   # Renderizado WebGL (React Three Fiber)
│   ├── HiveCanvas.tsx           # Setup del Canvas, luces, niebla y efectos de postprocesado
│   ├── HoneycombMesh.tsx        # InstancedMesh de los hexágonos
│   ├── NeuralNetLines.tsx       # Red de filamentos con shaders de pulso
│   ├── LayeredParticles.tsx     # Campo de partículas en 3 niveles de paralaje
│   ├── TextureAtlasGenerator.ts # Generador de textura unificada en GPU
│   └── Shaders.ts               # Definición de materiales y shaders GLSL personalizados
│
├── ui/                          # Interfaces de usuario 2D superpuestas
│   ├── HoverCard.tsx            # Ficha flotante con glassmorphism
│   ├── HoverConnector.tsx       # Renderizado de la línea holográfica 3D que conecta el nodo con la UI
│   └── NexusTitle.tsx           # Título animado y cabecera de la sección
│
├── hooks/                       # Hooks de conexión a R3F
│   ├── useHiveAnimation.ts      # Hook para actualizar oscilaciones de los nodos
│   ├── useHiveCamera.ts         # Hook para controlar movimientos suaves de cámara
│   ├── usePointerInteraction.ts # Hook para rastrear las coordenadas del puntero
│   └── useScrollProgress.ts     # Hook de conversión de scroll a línea temporal
│
└── index.ts                     # Punto de entrada y exportación del motor
```

---

## ⚡ Patrones y Sistemas Clave del Motor

### 1. Máquina de Estados por Nodo (State Machine)
Cada hexágono del panal está regido por una máquina de estados estricta. Las transiciones de escala, glow, opacidad y rotación se calculan matemáticamente a partir de estos estados en lugar de booleanos dispersos:

```
    ┌───────┐      visible      ┌─────────┐      hover      ┌─────────┐
    │ IDLE  │ ────────────────> │ VISIBLE │ ──────────────> │  HOVER  │
    └───────┘                   └─────────┘                 └────┬────┘
        ▲                            │                           │
        │ recycle                    │ recycle                   │ select
        │                            ▼                           ▼
    ┌─────────┐                 ┌─────────┐                 ┌──────────┐
    │ RECYCLE │ <────────────── │EXPANDED │ <────────────── │ SELECTED │
    └─────────┘                 └─────────┘    expand       └──────────┘
```

* **IDLE:** Fuera del visor, sin recursos asignados.
* **VISIBLE:** Renderizado en pantalla, oscila lentamente.
* **HOVER:** El puntero está encima; se desplaza en Z hacia adelante, aumenta la iluminación y abre la tarjeta.
* **SELECTED:** Click sobre el nodo; la cámara se centra y hace zoom sobre él.
* **EXPANDED:** Muestra información en pantalla completa.
* **RECYCLE:** Fade-out programado para recolocarse en el buffer.

### 2. Event Bus Desacoplado
Toda comunicación entre módulos es asíncrona a través del `EventBus.ts`.
* *Ejemplo de flujo:* `RaycastHover` ➔ EventBus: `NODE_HOVER_IN` ➔ `HoneycombMesh` destaca el nodo, `NeuralNetLines` activa el pulso en las conexiones vecinas, `LayeredParticles` acelera las partículas locales, y `HoverCard` se activa. No existen dependencias directas entre las clases.

### 3. Timeline Cinematográfica Centralizada
El estado de la escena y el scroll de página modifican el progreso ($0.0 \rightarrow 1.0$) de la línea de tiempo en `TimelineController.ts`. El motor lee esta línea de tiempo para interpolar la posición de la cámara, los niveles de brillo generales y la escala de aparición de los nodos, garantizando transiciones suaves y fluidas.

### 4. Streaming y LRU Cache de Posters
* **Data Streaming:** El motor mantiene una cuadrícula virtual infinita. A medida que la cámara avanza, `VisibilityManager` gestiona un buffer dinámico cargando nuevos datos de animes en cola (*prefetch*) y desactivando/reciclando los nodos lejanos (*recycle*).
* **LRU Cache:** Implementa un caché de texturas en disco/memoria RAM local. Las imágenes cargadas en el Texture Atlas se mantienen allí. Si un nodo reutiliza un póster previamente renderizado, se lee instantáneamente del atlas sin realizar una nueva petición HTTP.

### 5. Custom Shaders (Shaders.ts)
* **Fresnel & Cristal:** El shader calcula el vector normal de la extrusión hexagonal y mezcla los coeficientes de transparencia y refracción simulando cristal templado.
* **Energy Pulse:** Modula la intensidad luminosa de los bordes hexagonales basándose en ondas de ruido Perlin para evitar que el panal se vea estático.

### 6. Accesibilidad e Inclusión
* **Modo Reducido (`prefers-reduced-motion`):** Desactiva las oscilaciones de los nodos de forma global y utiliza transiciones instantáneas en lugar de interpolaciones de cámara.
* **WebGL Fallback:** Si el navegador no soporta WebGL, el motor dibuja un layout 2D responsivo alternativo sin interrumpir la navegación.
