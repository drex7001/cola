export function FirstSipSection() {
  return (
    <section
      id="sip"
      className="story-section first-sip-section"
      aria-labelledby="sip-title"
      data-chapter="sip"
    >
      <div className="first-sip-section__wipe" aria-hidden="true" data-sip-wipe />

      <div className="section-shell first-sip-section__content">
        <p className="chapter-label" data-reveal>
          03 — THE FIRST SIP
        </p>
        <h2
          id="sip-title"
          className="display-title first-sip-section__title"
          data-sip-title
        >
          AHH.
        </h2>
        <p className="first-sip-section__copy" data-sip-copy>
          THAT IS THE POINT.
        </p>
      </div>
    </section>
  );
}
