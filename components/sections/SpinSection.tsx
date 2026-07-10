export function SpinSection() {
  return (
    <section
      id="can"
      className="story-section spin-section"
      aria-labelledby="can-title"
      data-chapter="can"
    >
      <div className="section-shell spin-section__layout">
        <div className="spin-section__product-space" aria-hidden="true" />

        <div className="spin-section__copy">
          <p className="chapter-label" data-reveal>
            01 — THE CAN
          </p>
          <p className="new-look-badge">NEW LOOK</p>

          <h2 id="can-title" className="display-title spin-section__title" data-stagger>
            <span className="spin-section__title-line" data-reveal>
              EVERY ANGLE.
            </span>
            <span className="spin-section__title-line" data-reveal>
              ZERO REGRET.
            </span>
          </h2>
        </div>
      </div>
    </section>
  );
}
