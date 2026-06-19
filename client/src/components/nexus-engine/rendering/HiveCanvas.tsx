'use client';

import React, { Suspense, useMemo, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { HoneycombMesh }   from './HoneycombMesh';
import { HexPosterFaces }  from './HexPosterFaces';
import { HiveEngine }      from '../core/HiveEngine';
import { TimelineController } from '../core/TimelineController';
import { useHiveCamera }      from '../hooks/useHiveCamera';
import { useScrollProgress }  from '../hooks/useScrollProgress';
import { AnimeNode, VisibilityManager } from '../core/VisibilityManager';
import { AnimationController } from '../core/AnimationController';
import { NeuralNetLines }  from './NeuralNetLines';
import { LayeredParticles } from './LayeredParticles';
import { HoverCard }       from '../ui/HoverCard';
import { HoverConnector }  from '../ui/HoverConnector';
import { HoveredNodeInfo } from '../hooks/usePointerInteraction';

// High-quality anime fallbacks using secure CDN posters
const FALLBACK_CATALOG: AnimeNode[] = [
  { id: 1, title: 'Frieren: Beyond Journey\'s End', coverImage: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=400&q=80', score: 95, status: 'FINISHED', genres: ['Adventure', 'Drama', 'Fantasy'] },
  { id: 2, title: 'Demon Slayer: Kimetsu no Yaiba', coverImage: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&q=80', score: 87, status: 'FINISHED', genres: ['Action', 'Fantasy'] },
  { id: 3, title: 'Attack on Titan', coverImage: 'https://images.unsplash.com/photo-1560942485-b2a11cc13456?w=400&q=80', score: 92, status: 'FINISHED', genres: ['Action', 'Drama', 'Sci-Fi'] },
  { id: 4, title: 'Jujutsu Kaisen', coverImage: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=400&q=80', score: 89, status: 'RELEASING', genres: ['Action', 'Fantasy'] },
  { id: 5, title: 'Chainsaw Man', coverImage: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=400&q=80', score: 86, status: 'FINISHED', genres: ['Action', 'Comedy'] },
  { id: 6, title: 'Cyberpunk: Edgerunners', coverImage: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=400&q=80', score: 90, status: 'FINISHED', genres: ['Action', 'Sci-Fi'] }
];

interface HiveCanvasProps {
  engine?: HiveEngine;
  sectionRef?: React.RefObject<HTMLDivElement | null>;
}

// ── Inner R3F scene ─────────────────────────────────────────────────
function HiveScene({
  engine,
  timeline,
  scrollProgress,
  catalog,
  visibilityManager,
  animCtrl,
  onHoverNode,
  reducedMotion,
}: {
  engine: HiveEngine;
  timeline: TimelineController;
  scrollProgress: React.MutableRefObject<number>;
  catalog: AnimeNode[];
  visibilityManager: VisibilityManager;
  animCtrl: AnimationController;
  onHoverNode: (info: HoveredNodeInfo | null) => void;
  reducedMotion: boolean;
}) {
  const { cameraController, applyToCamera } = useHiveCamera();

  useFrame((_, delta) => {
    timeline.tick(delta);
    cameraController.setScrollProgress(scrollProgress.current);
    applyToCamera(delta);
  });

  return (
    <>
      <ambientLight intensity={0.25} color="#1a0533" />
      <pointLight position={[8, 8, 6]}   intensity={80} color="#00E5FF" />
      <pointLight position={[-8, -6, 4]} intensity={50} color="#9B51E0" />
      <directionalLight position={[0, 0, 8]} intensity={0.4} color="#0055FF" />
      <fog attach="fog" args={['#020202', 7, 22]} />

      <NeuralNetLines engine={engine} />
      {!reducedMotion && <LayeredParticles />}

      <Suspense fallback={null}>
        {/* Poster faces first (lower renderOrder = drawn earlier) */}
        <HexPosterFaces
          engine={engine}
          catalog={catalog}
          visibilityManager={visibilityManager}
          animCtrl={animCtrl}
        />
        {/* Crystal shell on top (Fresnel glow, transparent) */}
        <HoneycombMesh
          engine={engine}
          catalog={catalog}
          visibilityManager={visibilityManager}
          animCtrl={animCtrl}
          onHoverNode={onHoverNode}
        />
      </Suspense>
    </>
  );
}

// ── Public Canvas Wrapper ───────────────────────────────────────────
export const HiveCanvas: React.FC<HiveCanvasProps> = ({ engine, sectionRef }) => {
  const activeEngine = useMemo(() => engine ?? new HiveEngine(), [engine]);
  const timeline     = useMemo(() => new TimelineController(), []);
  const internalRef  = useRef<HTMLDivElement | null>(null);
  const ref          = sectionRef ?? internalRef;
  const scrollProgress = useScrollProgress(ref);

  const [catalog, setCatalog]   = useState<AnimeNode[]>([]);
  const [hoveredNode, setHoveredNode] = useState<HoveredNodeInfo | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Instantiated once inside canvas container
  const config = activeEngine.getConfig();
  const animCtrl = useMemo(() => new AnimationController(config.nodeCount), [config.nodeCount]);
  const visibilityManager = useMemo(() => new VisibilityManager(config.nodeCount, animCtrl), [config.nodeCount, animCtrl]);

  // Check prefers-reduced-motion media query on mount
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(media.matches);
    const listener = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, []);

  // Fetch anime catalog from dedicated /nexus endpoint (cached in server, fast)
  useEffect(() => {
    let active = true;

    async function loadNexusCatalog() {
      setIsLoading(true);
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        const res = await fetch(`${apiBase}/anime/discovery/nexus`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();

        if (json?.success && Array.isArray(json.data) && json.data.length > 0) {
          if (active) {
            visibilityManager.setCatalog(json.data as AnimeNode[]);
            setCatalog(json.data as AnimeNode[]);
            setIsLoading(false);
            return;
          }
        }
        throw new Error('Empty or invalid response');
      } catch (err) {
        console.warn('[HiveCanvas] /nexus fetch failed, using fallback catalog.', err);
        if (active) {
          visibilityManager.setCatalog(FALLBACK_CATALOG);
          setCatalog(FALLBACK_CATALOG);
          setIsLoading(false);
        }
      }
    }

    loadNexusCatalog();
    return () => { active = false; };
  }, [visibilityManager]);

  return (
    <div
      ref={internalRef}
      className="relative w-full overflow-hidden rounded-2xl border border-white/5"
      style={{ height: '600px', background: '#020202' }}
    >
      {/* Status bar */}
      <div className="absolute top-5 left-6 z-10 pointer-events-none select-none flex items-center gap-3">
        <span className="font-mono text-[10px] tracking-[0.3em] text-[#00E5FF] uppercase opacity-60">
          ⬡ Nexus Artificial Core · Active
        </span>
        {!isLoading && catalog.length > 0 && (
          <span className="font-mono text-[9px] tracking-[0.2em] text-[#9B51E0] uppercase opacity-40">
            {catalog.length} titles indexed
          </span>
        )}
      </div>

      {/* Loading overlay — shown while fetching anime catalog */}
      {isLoading && (
        <div
          style={{
            position: 'absolute', inset: 0, zIndex: 20,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            background: 'radial-gradient(ellipse at center, rgba(0,229,255,0.04) 0%, #020202 70%)',
            pointerEvents: 'none',
          }}
        >
          {/* Hexagon spinner */}
          <svg width="56" height="56" viewBox="0 0 56 56" style={{ animation: 'spin 1.5s linear infinite' }}>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <polygon
              points="28,4 50,16 50,40 28,52 6,40 6,16"
              fill="none" stroke="#00E5FF" strokeWidth="1.5"
              strokeDasharray="120" strokeDashoffset="0"
              style={{ opacity: 0.5 }}
            />
            <polygon
              points="28,12 44,21 44,35 28,44 12,35 12,21"
              fill="none" stroke="#9B51E0" strokeWidth="1"
              strokeDasharray="80" strokeDashoffset="0"
              style={{ opacity: 0.35 }}
            />
          </svg>
          <p style={{
            marginTop: '14px',
            fontFamily: 'monospace',
            fontSize: '10px',
            letterSpacing: '0.25em',
            color: '#00E5FF',
            opacity: 0.5,
            textTransform: 'uppercase',
          }}>
            Indexing catalog…
          </p>
        </div>
      )}

      <Canvas
        camera={{ position: [0, 0, 9], fov: 55, near: 0.1, far: 50 }}
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 1.5]}
        style={{ background: '#020202' }}
      >
        <HiveScene
          engine={activeEngine}
          timeline={timeline}
          scrollProgress={scrollProgress}
          catalog={catalog}
          visibilityManager={visibilityManager}
          animCtrl={animCtrl}
          onHoverNode={setHoveredNode}
          reducedMotion={reducedMotion}
        />
      </Canvas>

      {/* HTML interactive overlay cards */}
      {hoveredNode && (
        <>
          <HoverCard
            anime={hoveredNode.anime}
            x={hoveredNode.clientX}
            y={hoveredNode.clientY}
          />
          <HoverConnector
            x={hoveredNode.clientX}
            y={hoveredNode.clientY}
          />
        </>
      )}
    </div>
  );
};
