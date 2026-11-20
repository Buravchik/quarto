"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

export function ExPrimaryButton({
  children,
  className = "",
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  return (
    <button type="button" className={`ex-btn ex-btn--primary ${className}`.trim()} {...rest}>
      {children}
    </button>
  );
}

export function ExSecondaryButton({
  children,
  className = "",
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  return (
    <button type="button" className={`ex-btn ex-btn--secondary ${className}`.trim()} {...rest}>
      {children}
    </button>
  );
}

export function ExSurface({
  children,
  emphasized = false,
  className = "",
}: {
  children: ReactNode;
  emphasized?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`ex-surface ${emphasized ? "ex-surface--emphasized" : ""} ${className}`.trim()}
    >
      {children}
    </div>
  );
}
