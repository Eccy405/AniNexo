# 🗺️ Plan de Implementación Incremental: Nexus Engine (V3)

Este plan divide el desarrollo del **Nexus Engine** en **Sprints incrementales**. Cada sprint producirá un incremento completamente funcional, que compilará y se ejecutará sin errores antes de avanzar al siguiente.

---

## 🏃 Sprints de Desarrollo

```mermaid
gantt
    title Plan de Sprints - Nexus Engine
    dateFormat  YYYY-MM-DD
    section Desarrollo
    Sprint 1: Cimientos y Grilla Curvada    :active, s1, 2026-06-19, 3d
    Sprint 2: Dinámica y Cámara             : s2, after s1, 3d
    Sprint 3: Streaming y Texture Atlas     : s3, after s2, 3d
    Sprint 4: Shaders, Red e Interacciones  : s4, after s3, 3d
```

---

## 🏁 Detalle de los Sprints

### 🏃 SPRINT 1: Cimientos del Motor y Grilla Cilíndrica Base
**Objetivo:** Crear la infraestructura de directorios, el bus de comunicación interno y renderizar la grilla básica de hexágonos curvada en 3D sin texturas.
* **Módulos a Desarrollar:**
  * `core/EventBus.ts`: Bus de eventos tipado pura en TypeScript.
  * `core/HiveEngine.ts`: Orquestador principal (singleton/clase configurable).
  * `rendering/Shaders.ts`: Shaders básicos (Vertex & Fragment) para la fase inicial.
  * `rendering/HiveCanvas.tsx`: Setup del Canvas Three.js con luces y neblina.
  * `rendering/HoneycombMesh.tsx`: Renderizado con `InstancedMesh` curvando los nodos en un cilindro virtual.
  * `index.ts`: Exportaciones del motor.
* **Criterios de Aceptación:**
  * El proyecto cliente compila sin errores.
  * Al insertar `<HiveCanvas />` en la página principal, se dibuja un panal curvado en 3D con colores sólidos/holográficos básicos.

---

### 🏃 SPRINT 2: Cinemática, Animación y Control del Scroll
**Objetivo:** Inyectar vida en la colmena mediante la máquina de estados, el control amortiguado de la cámara y las oscilaciones sinusoidales de los hexágonos.
* **Módulos a Desarrollar:**
  * `core/CameraController.ts`: Damping del scroll e inclinaciones dinámicas (drift).
  * `core/AnimationController.ts`: Manejador de la máquina de estados por instancia.
  * `hooks/useHiveAnimation.ts`: Hook de oscilación trigonométrica de escala/rotación.
  * `hooks/useHiveCamera.ts`: Integración de R3F `useFrame` para actualizar la cámara.
  * `hooks/useScrollProgress.ts`: Lógica amortiguada para enlazar el scroll general con la línea de tiempo.
* **Criterios de Aceptación:**
  * Al hacer scroll, la cámara se desplaza suavemente sin saltos.
  * Los hexágonos oscilan sutilmente con pequeñas rotaciones aleatorias independientes.

---

### 🏃 SPRINT 3: Streaming de Datos y Texture Atlas
**Objetivo:** Implementar la carga asíncrona de pósteres de anime en una textura unificada en GPU y reciclar los nodos fuera del visor de la cámara.
* **Módulos a Desarrollar:**
  * `rendering/TextureAtlasGenerator.ts`: Lienzo de empaquetado dinámico 2D en GPU con caché LRU en memoria.
  * `core/VisibilityManager.ts`: Frustum culling personalizado que recicla los hexágonos distantes moviéndolos al frente y cambiando sus UVs.
* **Criterios de Aceptación:**
  * Las imágenes de los posters se renderizan sobre la superficie frontal de los hexágonos correspondientes.
  * Menos de 10 draw calls para el renderizado del panal en la consola del navegador.
  * Al desplazarse largas distancias, los animes se reciclan imperceptiblemente.

---

### 🏃 SPRINT 4: Shaders Premium, Red Neuronal y Ficha de Detalles
**Objetivo:** Finalizar la identidad visual del motor con shaders de cristal refractivo, la red de filamentos de energía con pulsos IA, el sistema de partículas en 3 capas y la tarjeta glassmorphism con su conector dinámico 3D.
* **Módulos a Desarrollar:**
  * `rendering/NeuralNetLines.tsx`: Filamentos holográficos dinámicos.
  * `rendering/LayeredParticles.tsx`: 3 capas de partículas independientes.
  * `core/InteractionManager.ts` y `hooks/usePointerInteraction.ts`: Raycasting.
  * `ui/HoverCard.tsx`: Tarjeta flotante glassmorphism.
  * `ui/HoverConnector.tsx`: Enlace 3D físico entre el nodo y la UI flotante.
* **Criterios de Aceptación:**
  * Hover activo destaca el nodo y genera la onda de energía sobre los vecinos.
  * La tarjeta flotante aparece en la posición correcta conectada por una línea de luz.
  * El pulso de IA periódico recorre la red con un bloom y destellos coordinados.
  * Soporte completo para `prefers-reduced-motion` y fallback 2D en ausencia de WebGL.

---

## 📈 Historial de Progreso

| Sprint | Estado | Notas y Modificaciones |
| :--- | :---: | :--- |
| **Sprint 1** | ✅ Completado | `EventBus`, `HiveEngine`, `Shaders`, `HiveCanvas`, `HoneycombMesh`, 4 hooks scaffoldeados, `index.ts`. Grilla cilíndrica biselada con Fresnel. `tsc --noEmit` → exit 0. |
| **Sprint 2** | ✅ Completado | `AnimationController` (state machine IDLE/VISIBLE/HOVER/RECYCLE + blendAlpha), `CameraController` (damping exponencial + micro-drift cinematic), `TimelineController` (reloj global + AI pulse periódico). Hooks `useHiveAnimation`, `useHiveCamera`, `useScrollProgress` implementados con lógica real. |
| **Sprint 3** | ✅ Completado | `VisibilityManager` (reciclaje de filas activas basado en Y), `TextureAtlasGenerator` (empaquetado dinámico 8x8 con LRU cache en canvas de GPU), integración de datos de API `/api/anime/discovery/home` con fallbacks seguros. Atributos de instancia `aUvOffset` and `aUvScale` actualizados dinámicamente. |
| **Sprint 4** | ✅ Completado | Shaders con glow pulsante reactivos a `AI_PULSE_START`, red neuronal tridimensional (`NeuralNetLines`), partículas en capas independientes (`LayeredParticles`), `prefers-reduced-motion`, raycaster optimizado para InstancedMesh y tarjetas flotantes HTML fluidas (`HoverCard`, `HoverConnector`). |
