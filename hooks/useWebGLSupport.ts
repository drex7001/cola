"use client";

import { useEffect, useState } from "react";

export const detectWebGLSupport = (): boolean => {
  if (typeof document === "undefined") return false;

  try {
    const canvas = document.createElement("canvas");
    const attributes: WebGLContextAttributes = {
      alpha: true,
      failIfMajorPerformanceCaveat: true,
    };
    const context =
      canvas.getContext("webgl2", attributes) ??
      canvas.getContext("webgl", attributes) ??
      canvas.getContext("experimental-webgl", attributes);

    if (!context) return false;

    if ("getExtension" in context) {
      context.getExtension("WEBGL_lose_context")?.loseContext();
    }
    return true;
  } catch {
    return false;
  }
};

/** `null` means the client-only capability check has not completed yet. */
export const useWebGLSupport = (): boolean | null => {
  const [supported, setSupported] = useState<boolean | null>(null);

  useEffect(() => {
    // Run after the first paint so the semantic page is never held up by
    // capability probing and Strict Mode can cancel the replayed effect.
    const frame = window.requestAnimationFrame(() => {
      setSupported(detectWebGLSupport());
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  return supported;
};
