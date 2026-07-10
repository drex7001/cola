import { SCENE_PROGRESS_MAX, SCENE_PROGRESS_MIN } from "@/lib/constants";

export type Vector3Tuple = [number, number, number];

export type CameraState = {
  position: Vector3Tuple;
  target: Vector3Tuple;
  canPosition: Vector3Tuple;
  canRotation: Vector3Tuple;
  canScale: number;
  bubbleIntensity: number;
  bubbleSpeed: number;
  lightIntensity: number;
  bloomIntensity: number;
};

export type CameraStateName =
  | "hero"
  | "spin"
  | "science"
  | "firstSip"
  | "moments"
  | "cta";

export const CAMERA_STATE_ORDER: readonly CameraStateName[] = [
  "hero",
  "spin",
  "science",
  "firstSip",
  "moments",
  "cta",
];

export const CAMERA_STATES: Record<CameraStateName, CameraState> = {
  hero: {
    position: [0, 0.1, 7.2],
    target: [0, 0, 0],
    canPosition: [0, 0, 0],
    canRotation: [0.05, -0.2, -0.04],
    canScale: 0.82,
    bubbleIntensity: 0.05,
    bubbleSpeed: 0.1,
    lightIntensity: 0.75,
    bloomIntensity: 0,
  },
  spin: {
    position: [3.8, 0.4, 5.1],
    target: [-0.7, 0, 0],
    canPosition: [-1.55, 0, 0],
    canRotation: [0.05, Math.PI, -0.04],
    canScale: 1,
    bubbleIntensity: 0.08,
    bubbleSpeed: 0.15,
    lightIntensity: 1,
    bloomIntensity: 0,
  },
  science: {
    position: [0.1, 0, 1.4],
    target: [0, 0, -1],
    canPosition: [-2.8, 0, -1],
    canRotation: [0, Math.PI * 1.2, 0],
    canScale: 1.1,
    bubbleIntensity: 1,
    bubbleSpeed: 1,
    lightIntensity: 0.65,
    bloomIntensity: 0.1,
  },
  firstSip: {
    position: [0.7, 0.15, 5.7],
    target: [0, 0, 0],
    canPosition: [0.6, -0.1, 0],
    canRotation: [0.02, Math.PI * 1.5, -0.05],
    canScale: 1.25,
    bubbleIntensity: 1.3,
    bubbleSpeed: 1.8,
    lightIntensity: 1.6,
    bloomIntensity: 1.2,
  },
  moments: {
    position: [0, 0.4, 8],
    target: [0, 0, 0],
    canPosition: [0, 1.55, 0],
    canRotation: [0.04, Math.PI * 2, 0.08],
    canScale: 0.28,
    bubbleIntensity: 0.12,
    bubbleSpeed: 0.2,
    lightIntensity: 0.7,
    bloomIntensity: 0,
  },
  cta: {
    position: [0, -0.05, 7.1],
    target: [0, 0, 0],
    canPosition: [0, 0, 0],
    canRotation: [0.04, Math.PI * 2 - 0.12, -0.04],
    canScale: 0.86,
    bubbleIntensity: 0.08,
    bubbleSpeed: 0.12,
    lightIntensity: 1,
    bloomIntensity: 0.05,
  },
};

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const lerp = (from: number, to: number, progress: number) =>
  from + (to - from) * progress;

/** A zero-slope interpolation curve that keeps adjacent chapters settling smoothly. */
export const smoothInterpolationProgress = (progress: number) => {
  const value = clamp01(progress);
  return value * value * (3 - 2 * value);
};

export const createCameraState = (
  source: CameraState = CAMERA_STATES.hero,
): CameraState => ({
  position: [...source.position],
  target: [...source.target],
  canPosition: [...source.canPosition],
  canRotation: [...source.canRotation],
  canScale: source.canScale,
  bubbleIntensity: source.bubbleIntensity,
  bubbleSpeed: source.bubbleSpeed,
  lightIntensity: source.lightIntensity,
  bloomIntensity: source.bloomIntensity,
});

const interpolateTuple = (
  from: Vector3Tuple,
  to: Vector3Tuple,
  progress: number,
  target: Vector3Tuple,
) => {
  target[0] = lerp(from[0], to[0], progress);
  target[1] = lerp(from[1], to[1], progress);
  target[2] = lerp(from[2], to[2], progress);
};

/**
 * Interpolates two states into `target`. Supplying a persistent target avoids
 * allocations inside a React Three Fiber frame loop.
 */
export const interpolateBetweenCameraStates = (
  from: CameraState,
  to: CameraState,
  progress: number,
  target: CameraState = createCameraState(from),
) => {
  const easedProgress = smoothInterpolationProgress(progress);

  interpolateTuple(from.position, to.position, easedProgress, target.position);
  interpolateTuple(from.target, to.target, easedProgress, target.target);
  interpolateTuple(
    from.canPosition,
    to.canPosition,
    easedProgress,
    target.canPosition,
  );
  interpolateTuple(
    from.canRotation,
    to.canRotation,
    easedProgress,
    target.canRotation,
  );

  target.canScale = lerp(from.canScale, to.canScale, easedProgress);
  target.bubbleIntensity = lerp(
    from.bubbleIntensity,
    to.bubbleIntensity,
    easedProgress,
  );
  target.bubbleSpeed = lerp(from.bubbleSpeed, to.bubbleSpeed, easedProgress);
  target.lightIntensity = lerp(
    from.lightIntensity,
    to.lightIntensity,
    easedProgress,
  );
  target.bloomIntensity = lerp(
    from.bloomIntensity,
    to.bloomIntensity,
    easedProgress,
  );

  return target;
};

/**
 * Samples the six-state camera journey using the shared 0..5 chapter scale.
 * Pass a reusable target from frame-based consumers to keep the sample
 * allocation-free.
 */
export const getCameraStateAtProgress = (
  chapterProgress: number,
  target?: CameraState,
) => {
  const safeProgress = Number.isFinite(chapterProgress)
    ? Math.min(
        SCENE_PROGRESS_MAX,
        Math.max(SCENE_PROGRESS_MIN, chapterProgress),
      )
    : SCENE_PROGRESS_MIN;
  const fromIndex = Math.min(
    CAMERA_STATE_ORDER.length - 1,
    Math.floor(safeProgress),
  );
  const toIndex = Math.min(CAMERA_STATE_ORDER.length - 1, fromIndex + 1);
  const from = CAMERA_STATES[CAMERA_STATE_ORDER[fromIndex]];
  const to = CAMERA_STATES[CAMERA_STATE_ORDER[toIndex]];

  return interpolateBetweenCameraStates(
    from,
    to,
    safeProgress - fromIndex,
    target ?? createCameraState(from),
  );
};

/** Backwards-friendly alias for consumers that name the chapter sampler by action. */
export const interpolateCameraState = getCameraStateAtProgress;
