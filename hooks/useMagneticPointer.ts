"use client";

import { useEffect, useRef } from "react";

import { MAGNETIC_POINTER, MEDIA_QUERIES } from "@/lib/constants";

export type MagneticPointerOptions = {
  disabled?: boolean;
  radius?: number;
  maxOffset?: number;
  labelStrength?: number;
};

type MagneticEntry = {
  target: HTMLElement;
  label: HTMLElement | null;
  radius: number;
  maxOffset: number;
  labelStrength: number;
  bounds: DOMRect;
  boundsDirty: boolean;
  x: number;
  y: number;
  attracted: boolean;
};

const entries = new Set<MagneticEntry>();
let animationFrame = 0;
let listening = false;
let finePointerQuery: MediaQueryList | null = null;
let reducedMotionQuery: MediaQueryList | null = null;

const renderEntries = () => {
  animationFrame = 0;
  entries.forEach((entry) => {
    const duration = entry.attracted ? "140ms" : "420ms";
    entry.target.style.transitionDuration = duration;
    entry.target.style.transform = `translate3d(${entry.x.toFixed(2)}px, ${entry.y.toFixed(2)}px, 0)`;
    if (entry.label) {
      entry.label.style.transitionDuration = duration;
      entry.label.style.transform = `translate3d(${(entry.x * entry.labelStrength).toFixed(2)}px, ${(entry.y * entry.labelStrength).toFixed(2)}px, 0)`;
    }
  });
};

const requestRender = () => {
  if (!animationFrame) animationFrame = window.requestAnimationFrame(renderEntries);
};

const resetEntry = (entry: MagneticEntry) => {
  entry.x = 0;
  entry.y = 0;
  entry.attracted = false;
};

const resetAll = () => {
  entries.forEach(resetEntry);
  requestRender();
};

const markBoundsDirty = () => {
  entries.forEach((entry) => {
    entry.boundsDirty = true;
  });
};

const handlePointerMove = (event: PointerEvent) => {
  if (
    event.pointerType === "touch" ||
    !finePointerQuery?.matches ||
    reducedMotionQuery?.matches
  ) {
    resetAll();
    return;
  }

  entries.forEach((entry) => {
    if (entry.boundsDirty) {
      entry.bounds = entry.target.getBoundingClientRect();
      entry.boundsDirty = false;
    }

    const outsideX = Math.max(
      entry.bounds.left - event.clientX,
      0,
      event.clientX - entry.bounds.right,
    );
    const outsideY = Math.max(
      entry.bounds.top - event.clientY,
      0,
      event.clientY - entry.bounds.bottom,
    );
    const outsideDistance = Math.hypot(outsideX, outsideY);

    if (outsideDistance > entry.radius) {
      resetEntry(entry);
      return;
    }

    const centerX = entry.bounds.left + entry.bounds.width / 2;
    const centerY = entry.bounds.top + entry.bounds.height / 2;
    const strength = 1 - outsideDistance / entry.radius;
    const requestedX = (event.clientX - centerX) * 0.12 * strength;
    const requestedY = (event.clientY - centerY) * 0.12 * strength;
    const requestedDistance = Math.hypot(requestedX, requestedY);
    const distanceScale =
      requestedDistance > entry.maxOffset
        ? entry.maxOffset / requestedDistance
        : 1;

    entry.x = requestedX * distanceScale;
    entry.y = requestedY * distanceScale;
    entry.attracted = true;
  });

  requestRender();
};

const startListening = () => {
  if (listening) return;
  finePointerQuery = window.matchMedia(MEDIA_QUERIES.finePointer);
  reducedMotionQuery = window.matchMedia(MEDIA_QUERIES.reducedMotion);
  window.addEventListener("pointermove", handlePointerMove, { passive: true });
  window.addEventListener("resize", markBoundsDirty, { passive: true });
  window.addEventListener("scroll", markBoundsDirty, { passive: true });
  finePointerQuery.addEventListener("change", resetAll);
  reducedMotionQuery.addEventListener("change", resetAll);
  listening = true;
};

const stopListening = () => {
  if (!listening || entries.size > 0) return;
  window.removeEventListener("pointermove", handlePointerMove);
  window.removeEventListener("resize", markBoundsDirty);
  window.removeEventListener("scroll", markBoundsDirty);
  finePointerQuery?.removeEventListener("change", resetAll);
  reducedMotionQuery?.removeEventListener("change", resetAll);
  finePointerQuery = null;
  reducedMotionQuery = null;
  listening = false;
  if (animationFrame) {
    window.cancelAnimationFrame(animationFrame);
    animationFrame = 0;
  }
};

const registerEntry = (entry: MagneticEntry) => {
  entries.add(entry);
  startListening();
  return () => {
    entries.delete(entry);
    entry.target.style.removeProperty("transform");
    entry.target.style.removeProperty("transition-duration");
    entry.label?.style.removeProperty("transform");
    entry.label?.style.removeProperty("transition-duration");
    stopListening();
  };
};

/** One listener set and one RAF serve every magnetic control on the page. */
export const useMagneticPointer = <
  T extends HTMLElement = HTMLElement,
  L extends HTMLElement = HTMLElement,
>(options: MagneticPointerOptions = {}) => {
  const targetRef = useRef<T>(null);
  const labelRef = useRef<L>(null);
  const {
    disabled = false,
    radius = MAGNETIC_POINTER.radius,
    maxOffset = MAGNETIC_POINTER.maxOffset,
    labelStrength = MAGNETIC_POINTER.labelStrength,
  } = options;

  useEffect(() => {
    const target = targetRef.current;
    if (!target || disabled) return;
    return registerEntry({
      target,
      label: labelRef.current,
      radius,
      maxOffset,
      labelStrength,
      bounds: target.getBoundingClientRect(),
      boundsDirty: false,
      x: 0,
      y: 0,
      attracted: false,
    });
  }, [disabled, labelStrength, maxOffset, radius]);

  return { targetRef, labelRef };
};
