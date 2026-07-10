import type { ReactNode } from "react";

type MarqueeProps = {
  children: ReactNode;
  className?: string;
  reverse?: boolean;
};

function joinClassNames(...names: Array<string | false | undefined>) {
  return names.filter(Boolean).join(" ");
}

export function Marquee({ children, className, reverse = false }: MarqueeProps) {
  return (
    <div
      className={joinClassNames("marquee", reverse && "marquee--reverse", className)}
      data-marquee-direction={reverse ? "reverse" : "forward"}
    >
      <div className="marquee__track">
        <span className="marquee__group">{children}</span>
        <span className="marquee__group" aria-hidden="true">
          {children}
        </span>
      </div>
    </div>
  );
}
