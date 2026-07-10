"use client";

import {
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type MouseEventHandler,
  type ReactNode,
} from "react";

import { useMagneticPointer } from "@/hooks/useMagneticPointer";

type SharedMagneticButtonProps = {
  children: ReactNode;
  className?: string;
  labelClassName?: string;
};

type MagneticAnchorProps = SharedMagneticButtonProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "children" | "className" | "href"> & {
    as?: "a";
    href: string;
  };

type MagneticNativeButtonProps = SharedMagneticButtonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "className"> & {
    as: "button";
    href?: never;
  };

export type MagneticButtonProps = MagneticAnchorProps | MagneticNativeButtonProps;

function joinClassNames(...names: Array<string | undefined>) {
  return names.filter(Boolean).join(" ");
}

export function MagneticButton(props: MagneticButtonProps) {
  const { targetRef: shellRef, labelRef } = useMagneticPointer<
    HTMLSpanElement,
    HTMLSpanElement
  >();

  const shellClassName = "magnetic-button-shell";
  const shellStyle = {
    display: "inline-block",
    transitionProperty: "transform",
    transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
    willChange: "transform",
  } as const;
  const labelStyle = {
    display: "inline-block",
    transitionProperty: "transform",
    transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
    willChange: "transform",
  } as const;

  if (props.as === "button") {
    const {
      as: _as,
      children,
      className,
      labelClassName,
      type = "button",
      ...buttonProps
    } = props;
    void _as;

    return (
      <span ref={shellRef} className={shellClassName} style={shellStyle} data-magnetic>
        <button
          {...buttonProps}
          className={joinClassNames("magnetic-button", className)}
          type={type}
        >
          <span
            ref={labelRef}
            className={joinClassNames("magnetic-button__label", labelClassName)}
            style={labelStyle}
          >
            {children}
          </span>
        </button>
      </span>
    );
  }

  const {
    as: _as,
    children,
    className,
    href,
    labelClassName,
    onClick,
    ...anchorProps
  } = props;
  void _as;

  const handleClick: MouseEventHandler<HTMLAnchorElement> = (event) => {
    // A lone hash is a deliberate non-navigating placeholder until a production URL is supplied.
    if (href === "#") {
      event.preventDefault();
    }

    onClick?.(event);
  };

  return (
    <span ref={shellRef} className={shellClassName} style={shellStyle} data-magnetic>
      <a
        {...anchorProps}
        className={joinClassNames("magnetic-button", className)}
        href={href}
        onClick={handleClick}
      >
        <span
          ref={labelRef}
          className={joinClassNames("magnetic-button__label", labelClassName)}
          style={labelStyle}
        >
          {children}
        </span>
      </a>
    </span>
  );
}
