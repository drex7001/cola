const NAV_ITEMS = [
  { href: "#hero", label: "Story" },
  { href: "#moments", label: "Moments" },
  { href: "#get-zero", label: "Get Zero" },
] as const;

export function Navigation() {
  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>

      <header className="site-header" data-navigation>
        <div className="site-header__inner">
          <a
            className="campaign-mark"
            href="#hero"
            aria-label="ZERO — back to the opening"
          >
            ZERO
          </a>

          <nav className="site-navigation" aria-label="Primary navigation">
            <ul className="site-navigation__list">
              {NAV_ITEMS.map((item) => (
                <li key={item.href}>
                  <a className="site-navigation__link" href={item.href}>
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>
    </>
  );
}
