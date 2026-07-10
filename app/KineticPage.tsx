"use client";

import dynamic from "next/dynamic";

import { MotionProvider } from "@/components/providers/MotionProvider";
import { SmoothScrollProvider } from "@/components/providers/SmoothScrollProvider";
import { CTASection } from "@/components/sections/CTASection";
import { FirstSipSection } from "@/components/sections/FirstSipSection";
import { HeroSection } from "@/components/sections/HeroSection";
import { MomentsSection } from "@/components/sections/MomentsSection";
import { ScienceSection } from "@/components/sections/ScienceSection";
import { SpinSection } from "@/components/sections/SpinSection";
import { Navigation } from "@/components/ui/Navigation";
import { Footer } from "@/components/ui/Footer";

const ExperienceCanvas = dynamic(
  () => import("@/components/experience/ExperienceCanvas").then((module) => module.ExperienceCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="canvas-loading" aria-hidden="true">
        <span />
      </div>
    ),
  },
);

export function KineticPage() {
  return (
    <SmoothScrollProvider>
      <Navigation />
      <ExperienceCanvas />
      <MotionProvider>
        <main id="main-content" tabIndex={-1}>
          <HeroSection />
          <SpinSection />
          <ScienceSection />
          <FirstSipSection />
          <MomentsSection />
          <CTASection />
        </main>
      </MotionProvider>
      <Footer />
      <noscript>
        <p className="noscript-note">
          This experience is fully readable without animation. Enable JavaScript to see the kinetic product scene.
        </p>
      </noscript>
    </SmoothScrollProvider>
  );
}
