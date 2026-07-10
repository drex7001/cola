"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { type PropsWithChildren, useEffect, useRef } from "react";

import { useReducedMotion } from "@/hooks/useReducedMotion";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export function SmoothScrollProvider({ children }: PropsWithChildren) {
  const reducedMotion = useReducedMotion();
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    if (reducedMotion) {
      document.documentElement.dataset.smoothScroll = "disabled";
      ScrollTrigger.refresh();
      return () => {
        delete document.documentElement.dataset.smoothScroll;
      };
    }

    const lenis = new Lenis({
      autoRaf: false,
      lerp: 0.085,
      smoothWheel: true,
      syncTouch: false,
      wheelMultiplier: 0.9,
      anchors: true,
    });
    lenisRef.current = lenis;
    document.documentElement.dataset.smoothScroll = "enabled";

    const updateScrollTriggers = () => ScrollTrigger.update();
    const tick = (time: number) => lenis.raf(time * 1000);
    const refresh = () => ScrollTrigger.refresh();
    let cancelled = false;
    let refreshFrame = window.requestAnimationFrame(refresh);

    lenis.on("scroll", updateScrollTriggers);
    // Lenis expects the ticker's elapsed time, including frames after a stall.
    // Restore GSAP's defaults on cleanup so the provider owns this global tweak.
    gsap.ticker.lagSmoothing(0);
    gsap.ticker.add(tick);
    window.addEventListener("load", refresh, { once: true });

    // Font metrics affect sticky chapter heights and the horizontal pin length.
    void document.fonts.ready.then(() => {
      if (cancelled) return;
      window.cancelAnimationFrame(refreshFrame);
      refreshFrame = window.requestAnimationFrame(refresh);
    });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(refreshFrame);
      window.removeEventListener("load", refresh);
      gsap.ticker.remove(tick);
      gsap.ticker.lagSmoothing(500, 33);
      lenis.off("scroll", updateScrollTriggers);
      lenis.destroy();
      lenisRef.current = null;
      delete document.documentElement.dataset.smoothScroll;
    };
  }, [reducedMotion]);

  return children;
}
