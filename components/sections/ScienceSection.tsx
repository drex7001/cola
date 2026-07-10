const METRICS = [
  {
    id: "sugar",
    value: "0g",
    label: "SUGAR",
    ariaLabel: "Zero grams of sugar",
    countTo: "0",
    suffix: "g",
  },
  {
    id: "calories",
    value: "0",
    label: "CALORIES",
    ariaLabel: "Zero calories",
    countTo: "0",
    suffix: "",
  },
  {
    id: "flavor",
    value: "FULL",
    label: "FLAVOR",
    ariaLabel: "Full flavor",
    countTo: undefined,
    suffix: undefined,
  },
] as const;

export function ScienceSection() {
  return (
    <section
      id="science"
      className="story-section science-section"
      aria-labelledby="science-title"
      data-chapter="science"
    >
      <div className="section-shell science-section__layout">
        <p className="chapter-label" data-reveal>
          02 — THE IMPOSSIBLE PART
        </p>

        <div className="science-section__question-card" data-science-card>
          <h2 id="science-title" className="display-title science-section__question">
            HOW DO YOU FIT ALL THE TASTE INTO{" "}
            <span className="science-section__nothing">
              NOTHING
              <span className="science-section__underline" aria-hidden="true" data-underline />
            </span>
            ?
          </h2>
        </div>

        <ul className="science-section__metrics" aria-label="Product facts" data-stagger>
          {METRICS.map((metric) => (
            <li
              key={metric.id}
              className="metric-chip"
              aria-label={metric.ariaLabel}
              data-metric={metric.id}
            >
              <span
                className="metric-chip__value"
                aria-hidden="true"
                {...(metric.countTo === undefined
                  ? {}
                  : {
                      "data-count-to": metric.countTo,
                      "data-count-suffix": metric.suffix,
                    })}
              >
                {metric.value}
              </span>
              <span className="metric-chip__label" aria-hidden="true">
                {metric.label}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
