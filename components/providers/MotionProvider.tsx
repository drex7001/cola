"use client";

import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { type PropsWithChildren, useRef } from "react";

import { MEDIA_QUERIES, SECTION_IDS } from "@/lib/constants";
import {
  MOTION_DURATION,
  MOTION_EASE,
  MOTION_SCRUB,
  MOTION_STAGGER,
} from "@/lib/motionTokens";
import {
  sceneState,
  setScrollProgress,
  triggerBubbleBurst,
} from "@/lib/sceneStore";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

type MotionConditions = {
  desktop: boolean;
  tablet: boolean;
  mobile: boolean;
  reduceMotion: boolean;
};

const SELECTORS = {
  reveal: "[data-reveal]",
  stagger: "[data-stagger]",
  count: "[data-count-to]",
  underline: "[data-underline]",
  scienceCard: "[data-science-card]",
  sipWipe: "[data-sip-wipe]",
  sipTitle: "[data-sip-title]",
  sipCopy: "[data-sip-copy]",
  momentsTrack: "[data-moments-track]",
  momentCard: "[data-moment-card]",
  momentArt: "[data-moment-art]",
  ctaContent: "[data-cta-content]",
} as const;

const queryAll = <T extends Element>(root: ParentNode, selector: string) =>
  Array.from(root.querySelectorAll<T>(selector));

const setMetricValue = (element: HTMLElement, value: number) => {
  const decimals = Number(element.dataset.countDecimals ?? 0);
  const prefix = element.dataset.countPrefix ?? "";
  const suffix = element.dataset.countSuffix ?? "";
  element.textContent = `${prefix}${value.toFixed(decimals)}${suffix}`;
};

const resetTransientSceneState = () => {
  Object.assign(sceneState, {
    distortion: 0,
    wipeProgress: 0,
    cameraWhip: 0,
    bloomIntensity: 0,
    momentsProgress: 0,
  });
};

/**
 * A single update trigger maps ScrollTrigger-measured section anchors to the
 * shared 0..5 coordinate. Using trigger starts instead of DOM rectangles keeps
 * the anchors correct while the moments chapter is pinned.
 */
const createSceneProgressTrigger = (
  sections: HTMLElement[],
  reducedMotion: boolean,
) => {
  const chapterTriggers = sections.map((section, index) =>
    ScrollTrigger.create({
      id: `scene-anchor-${SECTION_IDS[index]}`,
      trigger: section,
      start: "top top",
      end: "+=1",
      invalidateOnRefresh: true,
    }),
  );
  let chapterAnchors = chapterTriggers.map((trigger) => trigger.start);

  const readAnchors = () => {
    chapterAnchors = chapterTriggers.map((trigger) => trigger.start);
  };

  const updateProgress = (scrollPosition: number) => {
    if (chapterAnchors.length !== SECTION_IDS.length) return;

    let chapterIndex = 0;
    for (let index = 1; index < chapterAnchors.length; index += 1) {
      if (scrollPosition >= chapterAnchors[index]) chapterIndex = index;
      else break;
    }

    if (reducedMotion || chapterIndex === chapterAnchors.length - 1) {
      setScrollProgress(chapterIndex);
      return;
    }

    const start = chapterAnchors[chapterIndex];
    const end = chapterAnchors[chapterIndex + 1];
    const localProgress =
      end > start
        ? Math.min(1, Math.max(0, (scrollPosition - start) / (end - start)))
        : 0;
    setScrollProgress(chapterIndex + localProgress);
  };

  readAnchors();
  updateProgress(window.scrollY);

  const progressTrigger = ScrollTrigger.create({
    id: "scene-progress",
    trigger: document.documentElement,
    start: 0,
    end: () => ScrollTrigger.maxScroll(window),
    refreshPriority: -100,
    invalidateOnRefresh: true,
    onRefresh: (self) => {
      readAnchors();
      updateProgress(self.scroll());
    },
    onUpdate: (self) => updateProgress(self.scroll()),
  });

  return {
    kill: () => {
      progressTrigger.kill();
      chapterTriggers.forEach((trigger) => trigger.kill());
    },
  };
};

const createMetricTweens = (scienceSection: HTMLElement) => {
  const metrics = queryAll<HTMLElement>(scienceSection, SELECTORS.count);
  const tweens = metrics.flatMap((metric) => {
    const targetValue = Number(metric.dataset.countTo);
    if (!Number.isFinite(targetValue)) return [];

    const startValue = Number(metric.dataset.countFrom ?? 0);
    const counter = { value: Number.isFinite(startValue) ? startValue : 0 };
    setMetricValue(metric, counter.value);

    return [
      gsap.to(counter, {
        value: targetValue,
        duration: MOTION_DURATION.long,
        ease: MOTION_EASE.standard,
        paused: true,
        onUpdate: () => setMetricValue(metric, counter.value),
        onComplete: () => setMetricValue(metric, targetValue),
      }),
    ];
  });

  const trigger = ScrollTrigger.create({
    id: "science-metrics",
    trigger: scienceSection,
    start: "top 68%",
    once: true,
    onEnter: () => tweens.forEach((tween) => tween.play()),
  });

  return () => {
    trigger.kill();
    tweens.forEach((tween) => tween.kill());
  };
};

export function MotionProvider({ children }: PropsWithChildren) {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const root = scope.current;
      if (!root) return;

      const sections = SECTION_IDS.map((id) =>
        root.querySelector<HTMLElement>(`#${id}`),
      ).filter((section): section is HTMLElement => section !== null);

      if (sections.length !== SECTION_IDS.length) return;

      const [hero, spin, science, sip, moments, cta] = sections;
      const matchMedia = gsap.matchMedia();
      let refreshFrame = 0;

      matchMedia.add(
        {
          desktop: MEDIA_QUERIES.desktop,
          tablet: MEDIA_QUERIES.tablet,
          mobile: MEDIA_QUERIES.mobile,
          reduceMotion: MEDIA_QUERIES.reducedMotion,
        },
        (context) => {
          const conditions = context.conditions as MotionConditions;
          const reducedMotion = conditions.reduceMotion;
          root.dataset.motion = reducedMotion ? "reduced" : "full";

          const allRevealTargets = queryAll<HTMLElement>(root, SELECTORS.reveal);
          const staggerContainers = queryAll<HTMLElement>(root, SELECTORS.stagger);
          const staggerTargets = staggerContainers.flatMap((container) =>
            Array.from(container.children).filter(
              (child): child is HTMLElement => child instanceof HTMLElement,
            ),
          );
          const underline = science.querySelector<HTMLElement>(SELECTORS.underline);
          const scienceCard = science.querySelector<HTMLElement>(SELECTORS.scienceCard);
          const sipWipe = sip.querySelector<HTMLElement>(SELECTORS.sipWipe);
          const sipTitle = sip.querySelector<HTMLElement>(SELECTORS.sipTitle);
          const sipCopy = sip.querySelector<HTMLElement>(SELECTORS.sipCopy);
          const momentsTrack = moments.querySelector<HTMLElement>(
            SELECTORS.momentsTrack,
          );
          const momentCards = queryAll<HTMLElement>(moments, SELECTORS.momentCard);
          const momentArt = queryAll<HTMLElement>(moments, SELECTORS.momentArt);
          const ctaContent = cta.querySelector<HTMLElement>(SELECTORS.ctaContent);
          const scrollHint = hero.querySelector<HTMLElement>(".scroll-hint");
          const scrollHintIcon = scrollHint?.querySelector<HTMLElement>(
            ".scroll-hint__icon",
          );
          const spinBadge = spin.querySelector<HTMLElement>(".new-look-badge");

          if (reducedMotion) {
            gsap.set([...allRevealTargets, ...staggerTargets], {
              autoAlpha: 1,
              x: 0,
              y: 0,
              yPercent: 0,
              scale: 1,
              clearProps: "transform,opacity,visibility",
            });
            if (underline) gsap.set(underline, { scaleX: 1 });
            if (sipWipe) {
              gsap.set(sipWipe, {
                autoAlpha: 0,
                clipPath: "circle(0% at 54% 50%)",
              });
            }
            if (momentsTrack) gsap.set(momentsTrack, { clearProps: "transform" });
            gsap.set(queryAll<HTMLElement>(root, ".marquee__track"), {
              animationPlayState: "paused",
              clearProps: "transform",
            });
            queryAll<HTMLElement>(science, SELECTORS.count).forEach((metric) => {
              const target = Number(metric.dataset.countTo);
              if (Number.isFinite(target)) setMetricValue(metric, target);
            });
            resetTransientSceneState();

            const sceneProgressTrigger = createSceneProgressTrigger(sections, true);
            refreshFrame = window.requestAnimationFrame(() => ScrollTrigger.refresh());

            return () => {
              sceneProgressTrigger.kill();
              window.cancelAnimationFrame(refreshFrame);
              resetTransientSceneState();
              delete root.dataset.motion;
            };
          }

          const heroReveals = queryAll<HTMLElement>(hero, SELECTORS.reveal);
          const heroTimeline = gsap.timeline({
            id: "heroTimeline",
            defaults: { ease: MOTION_EASE.standard },
          });
          heroTimeline
            .from(heroReveals, {
              autoAlpha: 0,
              yPercent: 105,
              duration: MOTION_DURATION.reveal,
              stagger: MOTION_STAGGER.text,
            })
            .from(
              scrollHint,
              { autoAlpha: 0, y: 14, duration: MOTION_DURATION.settle },
              "-=0.35",
            );

          if (scrollHint) {
            gsap.to(scrollHintIcon ?? scrollHint, {
              y: 6,
              duration: 0.9,
              ease: "sine.inOut",
              repeat: -1,
              yoyo: true,
            });
            gsap.to(scrollHint, {
              autoAlpha: 0,
              y: -10,
              ease: MOTION_EASE.inOut,
              scrollTrigger: {
                trigger: hero,
                start: "top top",
                end: "35% top",
                scrub: MOTION_SCRUB.responsive,
              },
            });
          }

          const spinTimeline = gsap.timeline({
            id: "spinTimeline",
            defaults: { ease: MOTION_EASE.standard },
            scrollTrigger: {
              trigger: spin,
              start: "top 72%",
              end: "70% 45%",
              scrub: MOTION_SCRUB.standard,
            },
          });
          spinTimeline
            .from(queryAll<HTMLElement>(spin, SELECTORS.reveal), {
              autoAlpha: 0,
              y: 70,
              duration: 0.8,
              stagger: MOTION_STAGGER.text,
            })
            .from(
              spinBadge,
              {
                autoAlpha: 0,
                scale: 0.62,
                rotation: -10,
                duration: 0.55,
                ease: MOTION_EASE.accent,
              },
              0.22,
            );

          const scienceTimeline = gsap.timeline({
            id: "scienceTimeline",
            defaults: { ease: MOTION_EASE.inOut },
            scrollTrigger: {
              trigger: science,
              start: "top 68%",
              end: "75% 28%",
              scrub: MOTION_SCRUB.cinematic,
            },
          });
          scienceTimeline
            .from(
              science.querySelector<HTMLElement>(".chapter-label"),
              {
                autoAlpha: 0,
                y: 20,
                duration: 0.24,
              },
              0,
            )
            .from(scienceCard, {
              autoAlpha: 0,
              y: 64,
              scale: 0.96,
              duration: 0.46,
            })
            .from(
              queryAll<HTMLElement>(science, ".metric-chip"),
              {
                autoAlpha: 0,
                y: 32,
                duration: 0.3,
                stagger: MOTION_STAGGER.cards,
              },
              0.18,
            )
            .fromTo(
              underline,
              { scaleX: 0 },
              {
                scaleX: 1,
                transformOrigin: "left center",
                duration: 0.32,
                ease: MOTION_EASE.standard,
              },
              0.33,
            )
            .fromTo(
              sceneState,
              { distortion: 0 },
              {
                distortion: conditions.mobile ? 0.07 : 0.16,
                duration: 1,
                ease: MOTION_EASE.inOut,
              },
              0,
            );

          const disposeMetricTweens = createMetricTweens(science);
          let hasBurstForward = false;
          let hasBurstBackward = false;
          const scienceBurstTrigger = ScrollTrigger.create({
            id: "science-burst",
            trigger: science,
            start: "center center",
            onEnter: () => {
              if (hasBurstForward) return;
              hasBurstForward = true;
              triggerBubbleBurst("forward");
            },
            onLeaveBack: () => {
              if (hasBurstBackward) return;
              hasBurstBackward = true;
              triggerBubbleBurst("backward");
            },
          });

          const bloomPeak = conditions.desktop
            ? 1.2
            : conditions.tablet
              ? 0.45
              : 0;

          const sipTimeline = gsap.timeline({
            id: "sipTimeline",
            defaults: { ease: MOTION_EASE.inOut },
            scrollTrigger: {
              trigger: sip,
              start: "top top",
              end: "bottom top",
              scrub: MOTION_SCRUB.standard,
            },
          });
          sipTimeline
            .from(
              sip.querySelector<HTMLElement>(".chapter-label"),
              { autoAlpha: 0, y: 18, duration: 0.16 },
              0.04,
            )
            .fromTo(
              sipWipe,
              {
                autoAlpha: 1,
                clipPath: "circle(0% at 54% 50%)",
              },
              {
                autoAlpha: 1,
                clipPath: "circle(150% at 54% 50%)",
                duration: 0.3,
              },
              0.08,
            )
            .fromTo(
              sipTitle,
              { autoAlpha: 0, scale: 0.72 },
              {
                autoAlpha: 1,
                scale: 1,
                duration: 0.22,
                ease: MOTION_EASE.accent,
              },
              0.33,
            )
            .fromTo(
              sipCopy,
              { autoAlpha: 0, y: 18 },
              { autoAlpha: 1, y: 0, duration: 0.18 },
              0.43,
            )
            .to(
              sceneState,
              { cameraWhip: 1, wipeProgress: 1, duration: 0.15 },
              0.27,
            )
            .fromTo(
              sceneState,
              { bloomIntensity: 0 },
              {
                bloomIntensity: bloomPeak,
                duration: 0.12,
                ease: MOTION_EASE.standard,
              },
              0.29,
            )
            .to(sceneState, { cameraWhip: 0, duration: 0.2 }, 0.44)
            .to(
              sceneState,
              {
                bloomIntensity: 0,
                duration: 0.2,
                ease: MOTION_EASE.settle,
              },
              0.47,
            )
            .to(
              sipWipe,
              {
                autoAlpha: 0,
                clipPath: "circle(0% at 54% 50%)",
                duration: 0.24,
              },
              0.73,
            )
            .to(
              sceneState,
              { distortion: 0, wipeProgress: 0, duration: 0.25 },
              0.72,
            );

          let momentsTimeline: gsap.core.Timeline | null = null;
          if (momentsTrack && (conditions.desktop || conditions.tablet)) {
            const horizontalDistance = () =>
              Math.max(0, momentsTrack.scrollWidth - window.innerWidth);
            const pinDistance = () => {
              const distance = horizontalDistance();
              return conditions.desktop
                ? Math.max(window.innerWidth * 1.4, distance)
                : Math.max(window.innerWidth * 0.75, distance * 0.7);
            };

            momentsTimeline = gsap.timeline({
              id: "momentsTimeline",
              defaults: { ease: MOTION_EASE.linear },
              scrollTrigger: {
                trigger: moments,
                start: "top top",
                end: () => `+=${pinDistance()}`,
                pin: true,
                pinSpacing: true,
                scrub: MOTION_SCRUB.cinematic,
                anticipatePin: 1,
                invalidateOnRefresh: true,
              },
            });
            momentsTimeline
              .to(momentsTrack, { x: () => -horizontalDistance(), duration: 1 }, 0)
              .fromTo(
                momentArt,
                { xPercent: -3, scale: 1.06 },
                { xPercent: 4, scale: 1.01, duration: 1, stagger: 0.03 },
                0,
              )
              .fromTo(
                sceneState,
                { momentsProgress: 0 },
                { momentsProgress: 1, duration: 1 },
                0,
              );
          } else {
            sceneState.momentsProgress = 0;
            momentsTimeline = gsap.timeline({
              id: "momentsTimeline",
              scrollTrigger: {
                trigger: moments,
                start: "top 78%",
                once: true,
              },
            });
            momentsTimeline
              .from(queryAll<HTMLElement>(moments, SELECTORS.reveal), {
                autoAlpha: 0,
                y: 20,
                duration: MOTION_DURATION.settle,
                stagger: MOTION_STAGGER.text,
                ease: MOTION_EASE.standard,
              })
              .from(
                momentCards,
                {
                  autoAlpha: 0,
                  y: 36,
                  duration: MOTION_DURATION.reveal,
                  stagger: MOTION_STAGGER.cards,
                  ease: MOTION_EASE.standard,
                },
                "-=0.25",
              );
          }

          const marquees = queryAll<HTMLElement>(
            moments,
            "[data-marquee-direction]",
          );
          marquees.forEach((marquee) => {
            const track = marquee.querySelector<HTMLElement>(".marquee__track");
            if (!track) return;

            const reverse = marquee.dataset.marqueeDirection === "reverse";
            gsap.fromTo(
              track,
              { xPercent: reverse ? -50 : 0 },
              {
                xPercent: reverse ? 0 : -50,
                duration: conditions.mobile ? 34 : 19,
                ease: MOTION_EASE.linear,
                repeat: -1,
              },
            );
          });

          const ctaTimeline = gsap.timeline({
            id: "ctaTimeline",
            defaults: { ease: MOTION_EASE.standard },
            scrollTrigger: {
              trigger: cta,
              start: "top 72%",
              end: "65% 40%",
              scrub: MOTION_SCRUB.responsive,
            },
          });
          ctaTimeline.from(ctaContent, {
            autoAlpha: 0,
            y: 52,
            duration: 0.8,
          });

          const sceneProgressTrigger = createSceneProgressTrigger(sections, false);
          ScrollTrigger.sort();
          refreshFrame = window.requestAnimationFrame(() => ScrollTrigger.refresh());

          // These references intentionally keep the six narrative timelines
          // explicit and discoverable in GSAP DevTools and future maintenance.
          void heroTimeline;
          void spinTimeline;
          void scienceTimeline;
          void sipTimeline;
          void momentsTimeline;
          void ctaTimeline;

          return () => {
            disposeMetricTweens();
            scienceBurstTrigger.kill();
            sceneProgressTrigger.kill();
            window.cancelAnimationFrame(refreshFrame);
            resetTransientSceneState();
            delete root.dataset.motion;
          };
        },
      );

      return () => {
        window.cancelAnimationFrame(refreshFrame);
        matchMedia.revert();
        resetTransientSceneState();
      };
    },
    { scope },
  );

  return (
    <div ref={scope} data-motion-root style={{ display: "contents" }}>
      {children}
    </div>
  );
}
