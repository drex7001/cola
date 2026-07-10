'use client';

import {
  Component,
  type ReactNode,
  useCallback,
  useEffect,
  useState,
} from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';

import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useResponsiveTier } from '@/hooks/useResponsiveTier';
import { useWebGLSupport } from '@/hooks/useWebGLSupport';
import { ExperienceScene } from './ExperienceScene';
import { WebGLFallback } from './WebGLFallback';

const DPR_BY_TIER = {
  mobile: 1,
  tablet: 1.25,
  desktop: 1.5,
} as const;

type CanvasBoundaryProps = {
  children: ReactNode;
  onFailure: () => void;
};

type CanvasBoundaryState = {
  failed: boolean;
};

class CanvasBoundary extends Component<CanvasBoundaryProps, CanvasBoundaryState> {
  state: CanvasBoundaryState = { failed: false };

  static getDerivedStateFromError(): CanvasBoundaryState {
    return { failed: true };
  }

  componentDidCatch() {
    this.props.onFailure();
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function usePageVisibility() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const updateVisibility = () => setVisible(document.visibilityState !== 'hidden');
    updateVisibility();
    document.addEventListener('visibilitychange', updateVisibility);
    return () => document.removeEventListener('visibilitychange', updateVisibility);
  }, []);

  return visible;
}

export function ExperienceCanvas() {
  const webGLSupported = useWebGLSupport();
  const tier = useResponsiveTier();
  const reducedMotion = useReducedMotion();
  const pageVisible = usePageVisibility();
  const [ready, setReady] = useState(false);
  const [contextLost, setContextLost] = useState(false);
  const [renderFailed, setRenderFailed] = useState(false);

  const markReady = useCallback(() => setReady(true), []);
  const handleContextLost = useCallback(() => {
    setReady(false);
    setContextLost(true);
  }, []);
  const handleContextRestored = useCallback(() => {
    setContextLost(false);
    setReady(true);
  }, []);
  const handleRenderFailure = useCallback(() => {
    setReady(false);
    setRenderFailed(true);
  }, []);

  if (webGLSupported === null) {
    return (
      <div className="canvas-loading" aria-hidden="true">
        <span />
      </div>
    );
  }

  if (!webGLSupported || renderFailed) return <WebGLFallback />;

  const showFallback = contextLost;

  return (
    <>
      {!ready && !showFallback ? (
        <div className="canvas-loading" aria-hidden="true">
          <span />
        </div>
      ) : null}

      <CanvasBoundary onFailure={handleRenderFailure}>
        <Canvas
          className={`experience-canvas ${ready && !showFallback ? 'is-ready' : ''}`.trim()}
          style={{ pointerEvents: 'none' }}
          aria-hidden="true"
          frameloop={pageVisible ? 'always' : 'never'}
          dpr={DPR_BY_TIER[tier]}
          camera={{
            position: [0, 0.1, 7.2],
            fov: tier === 'mobile' ? 38 : tier === 'tablet' ? 34 : 32,
            near: 0.1,
            far: 50,
          }}
          gl={{
            alpha: true,
            antialias: tier !== 'mobile',
            depth: true,
            stencil: false,
            powerPreference: tier === 'desktop' ? 'high-performance' : 'default',
            toneMapping: THREE.ACESFilmicToneMapping,
          }}
          onCreated={({ gl }) => {
            gl.outputColorSpace = THREE.SRGBColorSpace;
            gl.toneMappingExposure = 0.9;
            gl.setClearColor('#050505', 0);
          }}
        >
          <ExperienceScene
            tier={tier}
            reducedMotion={reducedMotion}
            onContextLost={handleContextLost}
            onContextRestored={handleContextRestored}
            onReady={markReady}
          />
        </Canvas>
      </CanvasBoundary>

      {showFallback ? <WebGLFallback className="is-context-lost" /> : null}
    </>
  );
}
