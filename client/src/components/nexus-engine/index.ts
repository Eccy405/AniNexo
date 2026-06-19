// ─── Core ─────────────────────────────────────────────────────────────
export { eventBus }                   from './core/EventBus';
export type { HiveEvents }            from './core/EventBus';
export { HiveEngine }                 from './core/HiveEngine';
export type { HiveConfig }            from './core/HiveEngine';
export { AnimationController }        from './core/AnimationController';
export type { NodeState, NodeAnimData } from './core/AnimationController';
export { CameraController }           from './core/CameraController';
export { TimelineController }         from './core/TimelineController';
export { VisibilityManager }          from './core/VisibilityManager';
export type { AnimeNode }             from './core/VisibilityManager';

// ─── Rendering ────────────────────────────────────────────────────────
export { HiveCanvas }           from './rendering/HiveCanvas';
export { HoneycombMesh }        from './rendering/HoneycombMesh';
export { HexPosterFaces }       from './rendering/HexPosterFaces';
export { HoneycombShader, PosterShader } from './rendering/Shaders';
export { TextureAtlasGenerator } from './rendering/TextureAtlasGenerator';
export { NeuralNetLines }       from './rendering/NeuralNetLines';
export { LayeredParticles }     from './rendering/LayeredParticles';

// ─── UI ───────────────────────────────────────────────────────────────
export { NexusTitle }     from './ui/NexusTitle';
export { HoverCard }      from './ui/HoverCard';
export { HoverConnector } from './ui/HoverConnector';

// ─── Hooks ────────────────────────────────────────────────────────────
export { useHiveAnimation }      from './hooks/useHiveAnimation';
export { useHiveCamera }         from './hooks/useHiveCamera';
export { useScrollProgress }     from './hooks/useScrollProgress';
export { usePointerInteraction } from './hooks/usePointerInteraction';
export type { HoveredNodeInfo }  from './hooks/usePointerInteraction';
