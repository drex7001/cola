import { ScrollHint } from "@/components/ui/ScrollHint";

export function HeroSection() {
  return (
    <section
      id="hero"
      className="story-section hero-section"
      aria-labelledby="hero-title"
      aria-describedby="hero-copy"
      data-chapter="hero"
    >
      <div className="section-shell hero-section__content">
        <p className="chapter-label" data-reveal>
          00 — THE DROP
        </p>

        <h1 id="hero-title" className="display-title hero-section__title" data-stagger>
          <span className="hero-section__title-line" data-reveal>
            REAL TASTE.
          </span>
          <span className="hero-section__title-line" data-reveal>
            ZERO SUGAR.
          </span>
        </h1>

        <p id="hero-copy" className="hero-section__copy" data-reveal>
          The black can that gives up nothing.
        </p>

        <p className="hero-section__corner-mark" aria-hidden="true">
          ZERO
        </p>

        <ScrollHint />
      </div>
    </section>
  );
}
