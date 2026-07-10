import { Marquee } from "@/components/ui/Marquee";

const MOMENTS = [
  {
    id: "game-night",
    modifier: "game",
    number: "01",
    title: "GAME NIGHT",
    copy: "One more round became four.",
  },
  {
    id: "post-gym",
    modifier: "gym",
    number: "02",
    title: "POST-GYM",
    copy: "The workout ended. The momentum did not.",
  },
  {
    id: "the-desk",
    modifier: "desk",
    number: "03",
    title: "THE DESK",
    copy: "The idea arrived after midnight.",
  },
  {
    id: "the-table",
    modifier: "table",
    number: "04",
    title: "THE TABLE",
    copy: "Nobody planned to stay this long.",
  },
] as const;

export function MomentsSection() {
  return (
    <section
      id="moments"
      className="story-section moments-section"
      aria-labelledby="moments-title"
      data-chapter="moments"
    >
      <div className="section-shell moments-section__header">
        <p className="chapter-label" data-reveal>
          04 — WHERE ZERO LIVES
        </p>
        <h2 id="moments-title" className="display-title moments-section__title" data-reveal>
          WHERE ZERO LIVES
        </h2>
      </div>

      <div
        className="moments-section__viewport"
        role="region"
        aria-label="Four moments where ZERO lives"
      >
        <ol className="moments-section__track" data-moments-track>
          {MOMENTS.map((moment) => (
            <li
              key={moment.id}
              className={`moment-card moment-card--${moment.modifier}`}
              aria-labelledby={`${moment.id}-title`}
              data-moment-card
            >
              <div className="moment-card__art" aria-hidden="true" data-moment-art>
                <span className="moment-card__shape moment-card__shape--one" />
                <span className="moment-card__shape moment-card__shape--two" />
              </div>
              <div className="moment-card__content">
                <p className="moment-card__eyebrow">MOMENT {moment.number}</p>
                <h3 id={`${moment.id}-title`} className="moment-card__title">
                  {moment.title}
                </h3>
                <p className="moment-card__copy">{moment.copy}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <Marquee reverse>
        ZERO SUGAR ★ FULL FLAVOR ★ ZERO SUGAR ★ FULL FLAVOR ★
      </Marquee>
    </section>
  );
}
