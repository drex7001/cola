import { FlavorSelector } from "@/components/ui/FlavorSelector";
import { MagneticButton } from "@/components/ui/MagneticButton";

export function CTASection() {
  return (
    <section
      id="get-zero"
      className="story-section cta-section"
      aria-labelledby="cta-title"
      data-chapter="cta"
    >
      <div className="section-shell cta-section__layout" data-cta-content>
        <div className="cta-section__content">
          <p className="chapter-label" data-reveal>
            05 — YOUR MOVE
          </p>
          <h2 id="cta-title" className="display-title cta-section__title" data-stagger>
            <span className="cta-section__title-line" data-reveal>
              YOURS IS
            </span>
            <span className="cta-section__title-line" data-reveal>
              WAITING.
            </span>
          </h2>

          <div className="cta-section__actions">
            {/* Replace these placeholder hashes with production retail and store-locator URLs. */}
            <MagneticButton className="cta-section__button cta-section__button--primary" href="#">
              BUY A 6-PACK
            </MagneticButton>
            <MagneticButton
              className="cta-section__button cta-section__button--secondary"
              href="#"
            >
              FIND IT NEAR ME
            </MagneticButton>
          </div>
        </div>

        <div className="cta-section__controls">
          <FlavorSelector />
        </div>
      </div>
    </section>
  );
}
